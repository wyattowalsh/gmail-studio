import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DEFAULT_CONFIG, buildSignatureData } = require('./Config.js');
const { getTemplateRegistry } = require('./Schema.js');

const rootDirectory = process.cwd();
const outputPath = path.join(rootDirectory, 'template-previews.html');
const checkMode = process.argv.includes('--check');

const templateRegistry = getTemplateRegistry();

const previewScenarios = [
  {
    id: 'personal-note',
    label: 'Personal Note',
    description: 'Polished one-to-one message with greeting, CTA, compact signature, and footer details.',
    payload: {
      body_html:
        '<p>I finally put together a cleaner way to send thoughtful emails straight from Sheets.</p><p>This version keeps the message personal, readable, and low-friction.</p><ul><li>simple</li><li>calm</li><li>easy to scan</li><li>pleasant to send</li></ul><p>If it feels easy to read, the template is doing its job.</p>',
      cta_text: 'Open the link',
      cta_url: 'https://example.com',
      first_name: 'Alex',
      footer_address: 'Los Angeles, CA',
      footer_company: 'Northline Studio',
      footer_note: 'Sent with care from a clean, repeatable workflow.',
      headline: 'a cleaner way to send thoughtful email',
      include_signature: true,
      preview_text: 'polished one-to-one note',
      signature_mode: 'compact',
      subject: 'a cleaner way to send thoughtful email',
    },
  },
  {
    id: 'quiet-no-cta',
    label: 'Quiet No-CTA',
    description: 'A softer note without CTA or footer copy. Good for checking plain one-to-one readability.',
    payload: {
      body_html:
        '<p>Wanted to send this over while it was still fresh.</p><p>No ask, no funnel, just a clear note that can stand on its own.</p><p>If you have thoughts, reply whenever is convenient.</p>',
      cta_text: '',
      cta_url: '',
      first_name: 'Jordan',
      footer_address: '',
      footer_company: '',
      footer_note: '',
      headline: 'passing this along',
      include_signature: true,
      preview_text: 'plain note without a CTA',
      signature_mode: 'compact',
      subject: 'passing this along',
    },
  },
  {
    id: 'full-signature',
    label: 'Full Signature',
    description: 'Longer note with CTA, footer, and the richer signature mode for comparison.',
    payload: {
      body_html:
        '<p>I put together a tighter HTML email setup so the messages feel considered without going full newsletter mode.</p><p>This version shows the richer signature option and a little more structure.</p>',
      cta_text: 'Take a look',
      cta_url: 'https://example.com/demo',
      first_name: 'Taylor',
      footer_address: 'Remote, Worldwide',
      footer_company: 'Northline Studio',
      footer_note: 'Built for clean personal sends, not blast campaigns.',
      headline: 'a cleaner way to send thoughtful emails',
      include_signature: true,
      preview_text: 'signature comparison preview',
      signature_mode: 'full',
      subject: 'a cleaner way to send thoughtful emails',
    },
  },
  {
    id: 'broadcast-update',
    label: 'Broadcast Update',
    description: 'A campaign-style update to show how the broadcast template separates itself from the personal set.',
    payload: {
      body_html:
        '<p>Quick dispatch:</p><p>We shipped the new compose flow, rebuilt the preview system, and cleaned up the queue actions.</p><p>Next up is template polish and draft-first sending improvements.</p>',
      cta_text: 'Read the update',
      cta_url: 'https://example.com/changelog',
      first_name: '',
      footer_address: 'Los Angeles, CA',
      footer_company: 'Gmail Studio',
      footer_note: 'For product updates, release notes, and launch follow-ups.',
      headline: 'studio dispatch: what shipped this week',
      include_signature: false,
      preview_text: 'launches, updates, and changelog-style sends',
      signature_mode: 'compact',
      subject: 'studio dispatch: what shipped this week',
    },
  },
];

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDirectory, relativePath), 'utf8');
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function compileAppsScriptTemplate(source) {
  const matcher = /<\?(=|!=)?([\s\S]*?)\?>/g;

  let cursor = 0;
  let code = 'let __out = "";\n';
  let match;

  while ((match = matcher.exec(source)) !== null) {
    const [token, marker, rawContent] = match;
    const text = source.slice(cursor, match.index);

    if (text) {
      code += `__out += ${JSON.stringify(text)};\n`;
    }

    const content = rawContent.trim();
    if (marker === '=' || marker === '!=') {
      code += `__out += String((${content}) ?? "");\n`;
    } else if (content) {
      code += `${content}\n`;
    }

    cursor = match.index + token.length;
  }

  const tail = source.slice(cursor);
  if (tail) {
    code += `__out += ${JSON.stringify(tail)};\n`;
  }

  code += 'return __out;';
  return new Function('data', 'include', `with (data) {\n${code}\n}`);
}

function renderTemplate(templateName, data) {
  const source = readFile(`${templateName}.html`);
  const renderer = compileAppsScriptTemplate(source);

  return renderer(data, (includeName) => renderTemplate(includeName, data));
}

function buildScenarioPayload(scenario) {
  const basePayload = {
    body_html: '<p>hello.</p>',
    cta_text: 'Take a look',
    cta_url: 'https://example.com',
    first_name: 'Alex',
    footer_address: '',
    footer_company: '',
    footer_note: '',
    from_alias: '',
    headline: 'sample headline',
    include_signature: true,
    preview_text: 'sample preview text',
    reply_to: DEFAULT_CONFIG.reply_to,
    sender_name: DEFAULT_CONFIG.sender_name,
    signature_mode: DEFAULT_CONFIG.signature_mode,
    subject: 'sample subject line',
  };

  const payload = Object.assign({}, basePayload, scenario.payload);
  return Object.assign({}, payload, buildSignatureData(Object.assign({}, DEFAULT_CONFIG, payload)));
}

function renderScenarioCards() {
  return previewScenarios
    .map((scenario) => {
      const scenarioPayload = buildScenarioPayload(scenario);
      const cards = templateRegistry
        .map((template) => {
          const html = renderTemplate(template.file, scenarioPayload);
          const statusLabel =
            template.status === 'active'
              ? 'Active'
              : template.status === 'secondary'
                ? 'Secondary'
                : template.status === 'broadcast'
                  ? 'Broadcast'
                  : 'Legacy';

          return `
            <article class="card">
              <div class="card-header">
                <div>
                  <div class="eyebrow eyebrow-${template.status}">${statusLabel}</div>
                  <h3>${template.label}</h3>
                  <p>${template.description}</p>
                </div>
                <div class="meta">${template.id}</div>
              </div>
              <div class="iframe-wrap">
                <iframe title="${template.id} ${scenario.id}" srcdoc="${escapeAttribute(html)}"></iframe>
              </div>
            </article>
          `;
        })
        .join('\n');

      return `
        <section class="scenario">
          <header class="scenario-header">
            <div>
              <div class="eyebrow">Scenario</div>
              <h2>${scenario.label}</h2>
              <p>${scenario.description}</p>
            </div>
          </header>
          <div class="grid">
            ${cards}
          </div>
        </section>
      `;
    })
    .join('\n');
}

function buildGalleryHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gmail Studio Template Previews</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, system-ui, sans-serif;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        padding: 32px;
        background:
          radial-gradient(circle at top left, rgba(200, 164, 126, 0.18), transparent 32%),
          radial-gradient(circle at top right, rgba(125, 145, 122, 0.16), transparent 28%),
          linear-gradient(180deg, #f6f1e8 0%, #f1ece3 100%);
        color: #18191b;
      }

      .shell { max-width: 1600px; margin: 0 auto; }

      .hero {
        margin-bottom: 24px;
        padding: 28px 28px 26px 28px;
        border: 1px solid #d8ccbc;
        background: linear-gradient(135deg, #fffdf8 0%, #fbf4ea 100%);
        box-shadow: 0 20px 48px rgba(46, 35, 22, 0.08);
      }

      .hero h1 {
        margin: 0 0 8px;
        font-size: 42px;
        line-height: 0.96;
        letter-spacing: -0.08em;
      }

      .hero p {
        margin: 0;
        max-width: 880px;
        font-size: 15px;
        line-height: 1.7;
        color: #4d4b46;
      }

      .hero code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.92em;
      }

      .scenario { margin-bottom: 28px; }

      .scenario-header {
        margin-bottom: 16px;
        padding: 18px 20px;
        border: 1px solid #d8ccbc;
        background: #fffdf9;
      }

      .scenario-header h2 {
        margin: 4px 0 6px;
        font-size: 28px;
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .scenario-header p {
        margin: 0;
        max-width: 760px;
        font-size: 14px;
        line-height: 1.6;
        color: #5b5952;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 20px;
      }

      .card {
        border: 1px solid #d8ccbc;
        background: #ffffff;
        box-shadow: 0 18px 32px rgba(29, 20, 11, 0.07);
        overflow: hidden;
        border-radius: 18px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 18px 16px 18px;
        border-bottom: 1px solid #e4dbcf;
        background: linear-gradient(180deg, #fffefb 0%, #fcf7f0 100%);
      }

      .card-header h3 {
        margin: 4px 0 6px;
        font-size: 22px;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .card-header p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: #5b5952;
      }

      .eyebrow {
        font-size: 11px;
        line-height: 1;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 800;
        color: #8e6d4f;
      }

      .eyebrow-secondary { color: #587168; }
      .eyebrow-broadcast { color: #a66a31; }
      .eyebrow-legacy { color: #7b756d; }

      .meta {
        white-space: nowrap;
        align-self: flex-start;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        color: #7d756b;
      }

      .iframe-wrap {
        padding: 14px;
        background: #f4eee5;
      }

      iframe {
        width: 100%;
        height: 720px;
        border: 1px solid #d8ccbc;
        background: #ffffff;
      }

      @media (max-width: 640px) {
        body { padding: 16px; }
        .hero { padding: 18px; }
        .hero h1 { font-size: 30px; }
        .scenario-header h2 { font-size: 22px; }
        iframe { height: 640px; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <h1>Warm Premium Template Previews</h1>
        <p>
          Registry-driven sample renderings of every Gmail Studio template across multiple real-world scenarios.
          Regenerate with <code>pnpm preview:templates</code>. Validate freshness with
          <code>pnpm preview:templates:check</code>.
        </p>
      </section>

      ${renderScenarioCards()}
    </main>
  </body>
</html>
`;
}

function main() {
  const output = buildGalleryHtml();

  if (checkMode) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    if (current !== output) {
      console.error('template-previews.html is stale. Run `pnpm preview:templates` to regenerate it.');
      process.exit(1);
    }
    console.log('template-previews.html is up to date.');
    return;
  }

  fs.writeFileSync(outputPath, output);
  console.log(`Generated ${path.relative(rootDirectory, outputPath)}`);
}

main();
