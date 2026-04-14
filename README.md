# Gmail Studio

Gmail Studio is a Google Apps Script email tool built around a spreadsheet contract plus a React sidebar. The spreadsheet stores compose inputs, queue state, config, and optional analytics; Apps Script handles validation, drafting/sending, scheduling, and template rendering; the `ui/` app bundles into `dist/gas/Sidebar.html` for Apps Script deployment.

The repository now uses a clean source/deploy split for Apps Script:

- `src/gas/` is the canonical source tree, grouped by responsibility.
- `dist/gas/` is the generated flat deploy surface that `clasp` pushes.
- `pnpm sync:gas` regenerates `dist/gas` from `src/gas`.
- `pnpm adopt:gas` copies a freshly pulled `dist/gas` deploy tree back into `src/gas`.

See also: [`ui/README.md`](./ui/README.md)

## Current architecture

- **Spreadsheet = control plane and queue**
  - `Start Here` is the command-center landing tab with workflow guidance, quick links, and live workbook status.
  - `Compose` sheet stores a single key/value payload for the active draft.
  - `Outbound` sheet is the queue for batch, scheduled, and sequence-driven delivery.
  - `Config` sheet provides defaults like template, sender, delivery mode, quota headroom, and batch size.
  - `Analytics` sheet stores open/click events.
- **Apps Script = backend**
  - validates payloads, renders templates, creates drafts or sends email, updates queue rows, and serves tracking endpoints.
- **React sidebar = operator UI**
  - three tabs: **Compose**, **Queue**, and **Analytics**.
  - uses `google.script.run` in Apps Script and mock responses in local preview mode.

## Repository layout

- `src/gas/entrypoints/` — thin Apps Script-facing wrappers that define the public GAS globals
- `src/gas/controllers/` — delivery, menu, analytics, automation, and preview implementations behind those wrappers
- `src/gas/workbook/` — workbook construction, presentation, and safeguard logic
- `src/gas/core/` — shared schema, validation, config, data, template, and integration helpers
- `src/gas/templates/` — HTML email and preview partials used by Apps Script
- `dist/gas/` — generated flat Apps Script deploy output for `clasp`
- `/` — repo-level scripts, docs, generated previews, and project config
- `ui/` — React sidebar source
- `__tests__/gas/` — Jest suites organized to mirror `src/gas`

## Spreadsheet contract

### Sheets created by `setupSheets()`

| Sheet       | Purpose                    | Notes                                                                                         |
| ----------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| `Start Here` | command center             | first tab; quick links, live status formulas, and workflow guidance                           |
| `Config`    | global defaults            | includes template default, delivery mode, signature mode, sender identity, and queue settings |
| `Compose`   | one active message payload | key/value format; `template_name`, `delivery_mode`, and `signature_mode` have validation      |
| `Outbound`  | queue and execution log    | row 1 = quota/status formula, row 2 = headers, data starts at row 3                           |
| `Analytics` | event log                  | columns: `Timestamp`, `Email`, `Event Type`, `Detail`                                         |

### `Outbound` columns

Defined in `Schema.js` and written by `Setup.js`:

`recipient`, `first_name`, `company`, `subject`, `subject_a`, `subject_b`, `headline`, `headline_a`, `headline_b`, `body_text`, `body_html`, `preview_text`, `cta_text`, `cta_url`, `template_name`, `include_signature`, `sender_name`, `reply_to`, `from_alias`, `delivery_mode`, `signature_mode`, `signature_name`, `signature_email`, `signature_website_label`, `signature_website_href`, `signature_linkedin_label`, `signature_linkedin_href`, `signature_github_label`, `signature_github_href`, `signature_note`, `footer_note`, `footer_company`, `footer_address`, `scheduled_time`, `attachment_ids`, `source_sheet`, `source_row`, `sequence_id`, `step_number`, `status`, `subject_variant`, `headline_variant`, `draft_id`, `drafted_at`, `sent_at`, `last_attempt_at`, `error`

### Queue statuses

`PENDING`, `SCHEDULED`, `DRAFTED`, `SENT`, `ERROR`, `DRY_RUN`

## Workbook presentation

- `setupSheets()` is the destructive initializer. It rebuilds the core workbook tabs and then applies the shared presentation layer.
- `restyleWorkbook()` is the safe makeover action. It preserves existing data, validations, formulas, and queue state while refreshing formatting, hidden/grouped columns, tab order, and the landing sheet.
- `refreshStartHereSheet()` only rebuilds the `Start Here` tab.
- `refreshOperatorSafeguards()` reapplies the workbook semantic anchors plus warning-only protections for the non-editable system regions.
- `refreshQueueViews()` recreates the optional `Outbound` slicers for `status`, `template_name`, and `delivery_mode`.
- `Outbound` now uses progressive disclosure: the high-signal sending columns stay visible by default, while advanced/system columns are hidden and grouped so the queue is easier to scan.
- `Start Here` is intentionally a command center, not an execution sheet. Menu actions remain the source of truth for sends, drafts, and scheduler controls.

## Send vs draft workflows

### Compose sheet

- **Create draft** → `createComposeDraft()`
  - validates the active compose payload
  - creates a Gmail draft with `GmailApp.createDraft`
  - does not require a web app deployment
- **Send compose row** → `sendComposeDraft()`
  - validates the active compose payload
  - checks `MailApp.getRemainingDailyQuota()` first
  - sends immediately
  - sends the rendered HTML message directly
  - advances a sequence only after a successful send

### Outbound queue

- **Send selected row** / **Create selected draft** operate on the active `Outbound` row.
- **Send scheduled batch** processes only due `SEND` rows.
- **Create scheduled drafts** processes only due `DRAFT` rows.
- **Send unsent batch** processes unsent `SEND` rows without schedule filtering.
- Batch processing uses a script lock, writes row updates back to `Outbound`, and records a checkpoint in script properties.
- `SEND` rows are quota-limited by `batch_max_size` and `batch_headroom`; `DRAFT` rows do not consume Gmail send quota.

## Sidebar architecture

The sidebar is a bundled React app compiled to a single HTML file.

- **Compose tab**
  - preview current compose HTML
  - create Gmail draft
  - send compose row
  - show Drive Picker readiness and attach Drive file IDs into the active sheet cell when Picker is available
- **Queue tab**
  - reads `getQuotaForecast()`
  - runs send/draft queue actions
  - uses optimistic UI for queue metrics and action feed
- **Analytics tab**
  - reads summary and seven-day trend data from the raw `Analytics` sheet
  - keeps the operator UI aligned with the workbook’s warm-premium control-plane design

The sidebar uses mock data when `google.script.run` is unavailable, so `pnpm --dir ui dev` and `pnpm --dir ui preview` work outside Apps Script.

Tracking is optional and disabled by default via `Config -> tracking_enabled = FALSE`, so normal sending and drafting do not require a web app deployment.

## Template lineup

- `TemplatePersonalNote` — default warm personal note
- `TemplateBrutalist` — sharper editorial personal note
- `TemplateMinimal` — quiet, low-friction personal option
- `TemplateClean` — polished personal option with more finish
- `EmailTemplate` — legacy compatibility fallback
- `TemplateNewsletter` — broadcast-only updates and announcements

## Best default template

For personal sends, the recommended default is `TemplatePersonalNote`.

Why:

- it reads like a real note, not a campaign
- it keeps the strongest readability for one-to-one sends
- it supports preview text, greeting, CTA, signature, and footer blocks cleanly
- it makes the draft-first flow feel intentional instead of templated

If you want more edge, switch to `TemplateBrutalist`. If you want something quieter, switch to `TemplateMinimal`.

## Ranked recommendations

For the current product goal, this is the recommended order:

1. `TemplatePersonalNote` — best overall for one-to-one personal notes
2. `TemplateBrutalist` — best if you want more style and punch
3. `TemplateMinimal` — best if you want the copy to lead with almost no visual noise
4. `TemplateClean` — best if you want something more polished and dressed-up
5. `EmailTemplate` — safest legacy fallback, not the recommended new default
6. `TemplateNewsletter` — use only for broadcast-style updates

## Signature modes

Gmail Studio now supports two signature modes:

- `compact` — default, best for personal emails
- `full` — richer contact block for more formal or branded sends

The active signature data comes from `Config` and can be overridden per payload in `Compose` or `Outbound`.

## Ready-to-paste first message

Use this in `Compose` for a first test:

- `recipient`: `yourfriend@example.com`
- `subject`: `Quick note from Gmail Studio`
- `headline`: `A cleaner way to send from Sheets`
- `body_text`:

```text
Hi,

I put together a calmer way to send polished emails directly from Sheets.

This first draft is just a check, but the workflow is designed to stay readable,
operator-friendly, and easy to review before anything goes live.

If the layout feels right, we can send from here with confidence.

Best,
Sam
```

- `cta_text`: `Review message`
- `cta_url`: `https://example.com`
- `template_name`: `TemplatePersonalNote`
- `signature_mode`: `compact`
- `delivery_mode`: `DRAFT`

Recommended first run:

1. Preview it in the sidebar
2. Create a Gmail draft
3. Review the draft in Gmail
4. Switch to `SEND` only after you like the look

Useful workbook actions:

1. `Email Tools -> Restyle Workbook` to refresh the visual system without wiping data
2. `Email Tools -> Refresh Start Here` to rebuild the command-center tab only
3. `Email Tools -> Refresh Operator Safeguards` to restore workbook metadata and warning-only protections
4. `Email Tools -> Refresh Queue Views` to recreate the optional queue slicers
5. `Email Tools -> Rebuild Workbook (Destructive)` only when you intentionally want a full reset

## Commands

### Root

```bash
pnpm install
pnpm sync:gas
pnpm adopt:gas
pnpm test
pnpm test:ci
pnpm lint
pnpm preview:templates
pnpm preview:templates:check
pnpm build:ui
pnpm pull
pnpm push
```

Notes:

- `src/gas/` is the source of truth for Apps Script code. `dist/gas/` is generated deploy output.
- `src/gas/entrypoints/` is the only layer that should define public Apps Script global names such as `onOpen`, `doGet`, and `sendScheduledBatch`.
- `src/gas/controllers/` keeps implementation code out of the runtime-facing wrapper files while preserving the same deploy-time globals.
- `pnpm sync:gas` refreshes `dist/gas` from `src/gas`.
- `pnpm adopt:gas` is the reverse sync used after `clasp pull`.
- `pnpm build:ui` runs the UI install/build and then copies `ui/dist-sidebar/Sidebar.html` to `dist/gas/Sidebar.html` for Apps Script deploys.
- `pnpm preview:templates` regenerates the committed `template-previews.html` gallery.
- `pnpm preview:templates:check` fails if the committed gallery is stale.
- `pnpm pull` / `pnpm push` use `clasp`.

The preview gallery now renders multiple scenarios, including compact vs full signature modes, so template comparisons are not based on a single happy-path payload.

### UI

```bash
pnpm --dir ui install
pnpm --dir ui dev
pnpm --dir ui build
pnpm --dir ui lint
pnpm --dir ui preview
```

Notes:

- The UI has **no dedicated test script** today.
- Root Jest tests cover the Apps Script/backend code.

## CI and deploy

GitHub Actions live in `.github/workflows/deploy.yml`.

- **On pull requests to `main`**: install deps, run root lint, run root Jest (`test:ci`), and check template preview freshness
- **On pushes to `main`**: run the same checks, then:
  1. `pnpm run build:ui`
  2. write `CLASP_TOKEN` to `~/.clasprc.json`
  3. `pnpm run push`

So deployment is automatic only for successful pushes to `main`, and it pushes the Apps Script project through `clasp`.

## Key files

- `src/gas/entrypoints/EmailSender.js` — public GAS send/draft entrypoints
- `src/gas/controllers/EmailSenderController.js` — send, draft, quota, and queue processing logic
- `src/gas/controllers/MenuController.js` — sidebar/menu/scheduler behavior
- `src/gas/core/Schema.js` — canonical sheet names, template registry, headers, delivery modes, statuses
- `src/gas/workbook/Setup.js` — creates and formats the spreadsheet contract
- `src/gas/workbook/WorkbookSemantics.js` — semantic anchors, warning-only protections, and optional `Outbound` queue views
- `WorkbookStyle.js` — shared spreadsheet presentation helpers for setup, restyle, and `Start Here`
- `SheetData.js` — reads/writes Compose, Config, and Outbound data
- `Validation.js` — payload normalization, markdown conversion, A/B subject/headline selection
- `EmailSender.js` — send/draft execution, batch processing, quota handling
- `DriveIntegration.js` — Drive Picker readiness contract plus attachment-id insertion
- `SignatureCompact.html` / `SignatureFull.html` — compact and full signature partials
- `Automation.js` — auto-queues rows when a `studio_status` column is edited to `READY`
- `Sequences.js` — appends the next scheduled step after a successful send
- `Analytics.js` — tracking endpoint plus analytics summaries/trends
- `Menu.js` — spreadsheet menu, sidebar launcher, scheduler controls
- `Sidebar.html` — generated sidebar artifact used by Apps Script
- `generate-template-previews.mjs` — registry-driven preview gallery generator and freshness checker
- `ui/src/app/sidebar-app.tsx` — sidebar shell and tabs

## Adding a new template safely

1. Add the template definition to `Schema.js`.
2. Create the `.html` file.
3. Support the normalized render contract for active personal templates.
4. Run `pnpm preview:templates`.
5. Run `pnpm exec jest --runInBand` and `pnpm preview:templates:check`.
6. Update docs if the template changes the lineup or default recommendation.

## Related docs

- [`ui/README.md`](./ui/README.md)
