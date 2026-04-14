const fs = require('node:fs');
const path = require('node:path');

const configPath = path.resolve(process.cwd(), 'src/gas/core/Config.js');
const schemaPath = path.resolve(process.cwd(), 'src/gas/core/Schema.js');
const templatesDirectory = path.resolve(process.cwd(), 'src/gas/templates');
const { DEFAULT_CONFIG, buildSignatureData } = require(configPath);
const { getTemplateRegistry, getSelectableTemplateNames } = require(schemaPath);

const rootDirectory = templatesDirectory;

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDirectory, relativePath), 'utf8');
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

function buildPayload(overrides = {}) {
  const payload = Object.assign(
    {
      body_html: '<p>yo,</p><p>this is a rendering smoke test.</p>',
      cta_text: 'Take a look',
      cta_url: 'https://example.com',
      first_name: 'Alex',
      footer_address: 'Los Angeles, CA',
      footer_company: 'Homies Inc.',
      footer_note: 'Sent with care.',
      headline: 'made this for the homies',
      include_signature: true,
      preview_text: 'quick note from me',
      sender_name: DEFAULT_CONFIG.sender_name,
      signature_mode: 'compact',
      subject: 'quick note from me',
    },
    overrides
  );

  return Object.assign({}, payload, buildSignatureData(Object.assign({}, DEFAULT_CONFIG, payload)));
}

describe('Template system', () => {
  test('every registered template has a matching file', () => {
    getTemplateRegistry().forEach((template) => {
      expect(fs.existsSync(path.join(rootDirectory, `${template.file}.html`))).toBe(true);
    });
  });

  test('selectable templates stay in ranked picker order', () => {
    expect(getSelectableTemplateNames()).toEqual([
      'TemplatePersonalNote',
      'TemplateBrutalist',
      'TemplateMinimal',
      'TemplateClean',
      'TemplateNewsletter',
    ]);
  });

  test('every template renders a baseline payload without unresolved output', () => {
    const payload = buildPayload();

    getTemplateRegistry().forEach((template) => {
      const html = renderTemplate(template.file, payload);
      expect(html).toContain(payload.headline);
      expect(html).not.toContain('<?');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('null');
    });
  });

  test('personal templates render compact and full signature modes', () => {
    ['TemplatePersonalNote', 'TemplateBrutalist', 'TemplateMinimal', 'TemplateClean', 'EmailTemplate'].forEach(
      (name) => {
        const compactHtml = renderTemplate(name, buildPayload({ signature_mode: 'compact' }));
        const fullHtml = renderTemplate(name, buildPayload({ signature_mode: 'full' }));

        expect(compactHtml).toContain(DEFAULT_CONFIG.signature_name);
        expect(fullHtml).toContain(DEFAULT_CONFIG.signature_name);
        expect(fullHtml).toContain(DEFAULT_CONFIG.signature_linkedin_label);
      }
    );
  });

  test('newsletter stays broadcast-oriented and does not require a signature', () => {
    const html = renderTemplate(
      'TemplateNewsletter',
      buildPayload({
        include_signature: false,
        preview_text: 'dispatch incoming',
      })
    );

    expect(html).toContain('Studio dispatch');
    expect(html).not.toContain(DEFAULT_CONFIG.signature_name);
  });

  test('templates omit CTA cleanly when no CTA is provided', () => {
    const html = renderTemplate(
      'TemplatePersonalNote',
      buildPayload({
        cta_text: '',
        cta_url: '',
      })
    );

    expect(html).not.toContain('Take a look');
    expect(html).not.toContain('take a look here');
  });
});
