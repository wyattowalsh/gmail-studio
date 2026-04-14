const path = require('node:path');

const validationPath = path.resolve(process.cwd(), 'src/gas/core/Validation.js');
const configPath = path.resolve(process.cwd(), 'src/gas/core/Config.js');
const schemaPath = path.resolve(process.cwd(), 'src/gas/core/Schema.js');
const { normalizeAndValidatePayload, isValidEmail, isValidHttpUrl } = require(validationPath);
const { buildSignatureData } = require(configPath);
const { DELIVERY_MODES, SIGNATURE_MODES, getDefaultTemplateId, resolveTemplateDefinition } = require(schemaPath);

global.DELIVERY_MODES = DELIVERY_MODES;
global.SIGNATURE_MODES = SIGNATURE_MODES;
global.buildSignatureData = buildSignatureData;
global.getDefaultTemplateId = getDefaultTemplateId;
global.resolveTemplateDefinition = resolveTemplateDefinition;

describe('Validation', () => {
  test('isValidEmail', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  test('isValidHttpUrl', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('http://test.org')).toBe(true);
    expect(isValidHttpUrl('ftp://invalid')).toBe(false);
    expect(isValidHttpUrl('invalid')).toBe(false);
  });

  test('normalizeAndValidatePayload requires recipient and subject', () => {
    expect(() => normalizeAndValidatePayload({})).toThrow('Missing recipient.');
    expect(() => normalizeAndValidatePayload({ recipient: 'test@example.com' })).toThrow('Missing subject.');
  });

  test('normalizes template aliases and signature defaults', () => {
    const payload = normalizeAndValidatePayload({
      body_text: 'Hello world',
      recipient: 'test@example.com',
      subject: 'Hello',
      template_name: 'PersonalNote',
      headline: 'Yo',
    });

    expect(payload.template_name).toBe('TemplatePersonalNote');
    expect(payload.signature_mode).toBe('compact');
    expect(payload.signature_name).toBeTruthy();
    expect(payload.signature_email).toContain('@');
  });

  test('validates signature urls when provided', () => {
    expect(() =>
      normalizeAndValidatePayload({
        body_text: 'Hello world',
        headline: 'Yo',
        recipient: 'test@example.com',
        signature_website_href: 'notaurl',
        subject: 'Hello',
      })
    ).toThrow('Invalid signature_website_href: notaurl');
  });

  test('variant selection is deterministic for the same payload seed', () => {
    const payload = {
      recipient: 'test@example.com',
      source_row: 7,
      source_sheet: 'Outbound',
      subject: 'Subject Base',
      subject_a: 'Subject A',
      subject_b: 'Subject B',
      headline: 'Headline Base',
      headline_a: 'Headline A',
      headline_b: 'Headline B',
      body_text: 'Hello world',
    };

    const first = normalizeAndValidatePayload(payload);
    const second = normalizeAndValidatePayload(payload);

    expect(second.subject).toBe(first.subject);
    expect(second.subject_variant).toBe(first.subject_variant);
    expect(second.headline).toBe(first.headline);
    expect(second.headline_variant).toBe(first.headline_variant);
  });

  test('variant selection changes when the deterministic seed changes', () => {
    const basePayload = {
      recipient: 'test@example.com',
      source_sheet: 'Outbound',
      subject: 'Subject Base',
      subject_a: 'Subject A',
      subject_b: 'Subject B',
      headline: 'Headline Base',
      headline_a: 'Headline A',
      headline_b: 'Headline B',
      body_text: 'Hello world',
    };

    const normalizedA = normalizeAndValidatePayload({ ...basePayload, source_row: 1 });
    const normalizedB = normalizeAndValidatePayload({ ...basePayload, source_row: 2 });

    expect(['base', 'a', 'b']).toContain(normalizedA.subject_variant);
    expect(['base', 'a', 'b']).toContain(normalizedB.subject_variant);
    expect(['base', 'a', 'b']).toContain(normalizedA.headline_variant);
    expect(['base', 'a', 'b']).toContain(normalizedB.headline_variant);
    expect(
      normalizedA.subject_variant !== normalizedB.subject_variant ||
        normalizedA.headline_variant !== normalizedB.headline_variant
    ).toBe(true);
  });
});
