const path = require('node:path');

const templateRendererPath = path.resolve(process.cwd(), 'src/gas/core/TemplateRenderer.js');

describe('TemplateRenderer', () => {
  let renderHtmlTemplate;
  let templates;

  beforeEach(() => {
    jest.resetModules();

    templates = {
      TemplatePersonalNote: {
        evaluate: jest.fn().mockReturnValue({ getContent: jest.fn().mockReturnValue('<div>personal</div>') }),
      },
      SignatureCompact: {
        evaluate: jest.fn().mockReturnValue({ getContent: jest.fn().mockReturnValue('<div>signature</div>') }),
      },
    };

    global.resolveTemplateDefinition = jest.fn((name) => ({
      file: name === 'alias' ? 'TemplatePersonalNote' : name,
      id: name,
    }));
    global.HtmlService = {
      createTemplateFromFile: jest.fn((filename) => {
        const template = templates[filename];
        if (!template) {
          throw new Error(`Missing template: ${filename}`);
        }
        return template;
      }),
    };

    renderHtmlTemplate = require(templateRendererPath).renderHtmlTemplate;
  });

  test('renders the resolved template file', () => {
    const html = renderHtmlTemplate('alias', { headline: 'Hello' });

    expect(global.resolveTemplateDefinition).toHaveBeenCalledWith('alias');
    expect(global.HtmlService.createTemplateFromFile).toHaveBeenCalledWith('TemplatePersonalNote');
    expect(html).toBe('<div>personal</div>');
  });

  test('include helper evaluates nested partials with the same data context', () => {
    const template = {
      evaluate: jest.fn().mockImplementation(function () {
        return {
          getContent: () => this.include('SignatureCompact'),
        };
      }),
    };

    templates.TemplatePersonalNote = template;
    const html = renderHtmlTemplate('TemplatePersonalNote', { signature_name: 'Wyatt Walsh' });

    expect(html).toBe('<div>signature</div>');
  });
});
