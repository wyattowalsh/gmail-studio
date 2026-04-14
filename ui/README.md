# Gmail Studio Sidebar UI

This directory contains the React + TypeScript sidebar for Gmail Studio. It builds into a single-file Apps Script sidebar HTML bundle and is copied to the project root as `Sidebar.html`.

See also: [`../README.md`](../README.md)

## What the UI talks to

The sidebar calls Apps Script functions through `google.script.run` wrappers in `src/lib/google-script.ts`.

Current backend methods used by the UI:

- `createComposeDraft`
- `sendComposeDraft`
- `getPreviewHtml`
- `getDrivePickerConfig`
- `getTemplateCatalogForUi`
- `updateActiveCellWithFile`
- `getQuotaForecast`
- `sendUnsentBatch`
- `sendScheduledBatch`
- `createScheduledDraftBatch`
  When the sidebar is run outside Apps Script, the wrapper returns **mock data** so local development still works.

## Sidebar structure

- `src/app/sidebar-app.tsx` — top-level 300px warm-premium control shell and 3-tab layout
- `src/features/compose/compose-panel.tsx` — compose preview, draft/send actions, Drive Picker readiness, and attachment flow
- `src/features/compose/compose-panel.tsx` also surfaces ranked template guidance from the Apps Script registry
- `src/features/outbound/outbound-panel.tsx` — queue forecast and batch actions
- `src/features/analytics/analytics-panel.tsx` — summary + seven-day activity view backed by the Analytics sheet
- `src/lib/google-script.ts` — Apps Script bridge + local mocks
- `src/lib/types.ts` — shared UI-side contract types

## Build and dev commands

```bash
pnpm --dir ui install
pnpm --dir ui dev
pnpm --dir ui build
pnpm --dir ui lint
pnpm --dir ui preview
```

Template preview tooling lives at the repo root:

```bash
pnpm preview:templates
pnpm preview:templates:check
```

## Build output

- Vite input: `ui/Sidebar.html`
- Vite output: `ui/dist-sidebar/Sidebar.html`
- Root deployment artifact: `../Sidebar.html`

Root helper command:

```bash
pnpm build:ui
```

That command installs UI deps with `--frozen-lockfile`, builds the sidebar, and copies the generated HTML into the root Apps Script project.

## Notes and limitations

- The UI currently has **no standalone test command**.
- Root CI validates the repository with root lint + root Jest, plus a preview-gallery freshness check; the UI is built during deploy on `main`.
- The sidebar expects a narrow Apps Script sidebar layout and is intentionally sized around a **300px** width.
- Local mock mode now mirrors the warm-premium workbook language, so UI review outside Apps Script is closer to the shipped experience.
