const SHEET_NAMES = Object.freeze({
  analytics: 'Analytics',
  compose: 'Compose',
  config: 'Config',
  outbound: 'Outbound',
  start: 'Start Here',
});

const TEMPLATE_REGISTRY = Object.freeze([
  {
    aliases: Object.freeze(['PersonalNote', 'template-personal-note']),
    default: true,
    description: 'Warm one-to-one note with the gentlest layout and the clearest reading rhythm.',
    family: 'personal',
    file: 'TemplatePersonalNote',
    id: 'TemplatePersonalNote',
    label: 'Personal Note',
    picker: true,
    rank: 1,
    status: 'active',
    useCase: 'Best default for thoughtful one-to-one outreach that should feel hand-written.',
  },
  {
    aliases: Object.freeze(['Brutalist']),
    default: false,
    description: 'High-contrast personal option with more editorial edge and deliberate spacing.',
    family: 'personal',
    file: 'TemplateBrutalist',
    id: 'TemplateBrutalist',
    label: 'Brutalist',
    picker: true,
    rank: 2,
    status: 'active',
    useCase: 'Use when you want the strongest visual frame without changing the message contract.',
  },
  {
    aliases: Object.freeze(['Minimal']),
    default: false,
    description: 'Quiet, stripped-back personal format that keeps the copy at center stage.',
    family: 'personal',
    file: 'TemplateMinimal',
    id: 'TemplateMinimal',
    label: 'Minimal',
    picker: true,
    rank: 3,
    status: 'active',
    useCase: 'Best when the message should stay low-friction and almost invisible.',
  },
  {
    aliases: Object.freeze(['Clean']),
    default: false,
    description: 'Sharper polished frame for personal sends that need a little more finish.',
    family: 'personal',
    file: 'TemplateClean',
    id: 'TemplateClean',
    label: 'Clean',
    picker: true,
    rank: 4,
    status: 'secondary',
    useCase: 'Polished fallback when you want a calmer frame with a finished look.',
  },
  {
    aliases: Object.freeze(['Newsletter', 'Campaign']),
    default: false,
    description: 'Broadcast layout for launches, updates, and announcements with a calmer finish.',
    family: 'broadcast',
    file: 'TemplateNewsletter',
    id: 'TemplateNewsletter',
    label: 'Newsletter',
    picker: true,
    rank: 6,
    status: 'broadcast',
    useCase: 'Use for recurring updates, launches, and any message that behaves like a broadcast.',
  },
  {
    aliases: Object.freeze(['Classic', 'LegacyClassic']),
    default: false,
    description: 'Legacy compatibility fallback for older rows and safer rendering.',
    family: 'personal',
    file: 'EmailTemplate',
    id: 'EmailTemplate',
    label: 'Classic',
    picker: false,
    rank: 5,
    status: 'legacy',
    useCase: 'Legacy compatibility fallback for older rows and safer rendering.',
  },
]);

const TEMPLATE_NAMES = Object.freeze(TEMPLATE_REGISTRY.map((template) => template.id));

const DELIVERY_MODES = Object.freeze(['SEND', 'DRAFT']);

const SIGNATURE_MODES = Object.freeze(['compact', 'full']);

const OUTBOUND_STATUSES = Object.freeze(['PENDING', 'SCHEDULED', 'DRAFTED', 'SENT', 'ERROR', 'DRY_RUN']);

const OUTBOUND_HEADER_ROW = 2;

const OUTBOUND_HEADERS = Object.freeze([
  'recipient',
  'first_name',
  'company',
  'subject',
  'subject_a',
  'subject_b',
  'headline',
  'headline_a',
  'headline_b',
  'body_text',
  'body_html',
  'preview_text',
  'cta_text',
  'cta_url',
  'template_name',
  'include_signature',
  'sender_name',
  'reply_to',
  'from_alias',
  'delivery_mode',
  'signature_mode',
  'signature_name',
  'signature_email',
  'signature_website_label',
  'signature_website_href',
  'signature_linkedin_label',
  'signature_linkedin_href',
  'signature_github_label',
  'signature_github_href',
  'signature_note',
  'footer_note',
  'footer_company',
  'footer_address',
  'scheduled_time',
  'attachment_ids',
  'source_sheet',
  'source_row',
  'sequence_id',
  'step_number',
  'status',
  'subject_variant',
  'headline_variant',
  'draft_id',
  'drafted_at',
  'sent_at',
  'last_attempt_at',
  'error',
]);

const ANALYTICS_HEADERS = Object.freeze(['Timestamp', 'Email', 'Event Type', 'Detail']);

function getTemplateRegistry() {
  return TEMPLATE_REGISTRY.slice();
}

function getTemplateNames() {
  return TEMPLATE_NAMES.slice();
}

function getSelectableTemplateNames() {
  return getTemplateCatalog()
    .filter((template) => template.picker)
    .map((template) => template.id);
}

function getTemplateCatalog() {
  return TEMPLATE_REGISTRY.slice().sort((left, right) => left.rank - right.rank);
}

function getDefaultTemplateId() {
  const defaultTemplate = TEMPLATE_REGISTRY.find((template) => template.default);
  return defaultTemplate ? defaultTemplate.id : TEMPLATE_REGISTRY[0].id;
}

function resolveTemplateDefinition(templateName) {
  const requestedName = String(templateName || '').trim();
  const normalizedName = requestedName.toLowerCase();

  const match = TEMPLATE_REGISTRY.find((template) => {
    if (template.id.toLowerCase() === normalizedName) {
      return true;
    }

    return template.aliases.some((alias) => alias.toLowerCase() === normalizedName);
  });

  return match || TEMPLATE_REGISTRY.find((template) => template.default) || TEMPLATE_REGISTRY[0];
}

function getDeliveryModes() {
  return DELIVERY_MODES.slice();
}

function getSignatureModes() {
  return SIGNATURE_MODES.slice();
}

function getOutboundStatuses() {
  return OUTBOUND_STATUSES.slice();
}

function getOutboundHeaders() {
  return OUTBOUND_HEADERS.slice();
}

function getAnalyticsHeaders() {
  return ANALYTICS_HEADERS.slice();
}

if (typeof module !== 'undefined') {
  module.exports = {
    ANALYTICS_HEADERS,
    DELIVERY_MODES,
    OUTBOUND_HEADERS,
    OUTBOUND_HEADER_ROW,
    OUTBOUND_STATUSES,
    SHEET_NAMES,
    SIGNATURE_MODES,
    TEMPLATE_NAMES,
    TEMPLATE_REGISTRY,
    getAnalyticsHeaders,
    getDefaultTemplateId,
    getDeliveryModes,
    getOutboundHeaders,
    getOutboundStatuses,
    getSelectableTemplateNames,
    getTemplateCatalog,
    getSignatureModes,
    getTemplateNames,
    getTemplateRegistry,
    resolveTemplateDefinition,
  };
}
