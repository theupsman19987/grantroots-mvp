/**
 * Grant normalizer
 * Maps raw Grants.gov or Candid objects into the unified Grant schema.
 * The unified shape matches the DB table defined in db/schema.sql.
 */

import { cfdaToCategories } from './cfda.js';

// — Applicant type extraction ——————————————————————————————————————————————
// Maps Grants.gov eligibility strings to our canonical ApplicantType values.
// Grants.gov search2 returns g.eligibilities as an array of specific strings.
const ELIGIBILITY_TYPE_RULES = [
  { keywords: ['unrestricted'],                                          type: null   }, // signals "all types"
  { keywords: ['501(c)(3)', '501c3', 'nonprofit', 'non-profit'],        type: 'nonprofit'   },
  { keywords: ['individual'],                                            type: 'individual'  },
  { keywords: ['for profit', 'for-profit', 'small business'],           type: 'for-profit'  },
  { keywords: ['state government', 'county government', 'city or township',
               'special district', 'public housing', 'local government',
               'municipality', 'public agency'],                         type: 'government'  },
  { keywords: ['institution of higher education', 'school district',
               'independent school', 'educational', 'university',
               'college', 'state controlled institution'],               type: 'education'   },
  { keywords: ['faith', 'religious', 'church'],                         type: 'faith-based' },
  { keywords: ['native american', 'tribal', 'alaska native',
               'indian tribe', 'federally recognized'],                  type: 'tribal'      },
];

const ALL_TYPES = ['nonprofit', 'individual', 'for-profit', 'government', 'education', 'faith-based', 'tribal'];

export function extractApplicantTypes(eligibilities) {
  if (!Array.isArray(eligibilities) || eligibilities.length === 0) return [];
  const types = new Set();
  for (const e of eligibilities) {
    const s = String(e).toLowerCase();
    for (const rule of ELIGIBILITY_TYPE_RULES) {
      if (rule.type === null && rule.keywords.some(k => s.includes(k))) return ALL_TYPES;
      if (rule.type && rule.keywords.some(k => s.includes(k))) types.add(rule.type);
    }
  }
  return [...types];
}

// — Category mapping ——————————————————————————————————————————————————————
// Exported so detail.js and backfill.js can reuse it without duplication.
export const GOV_CATEGORY_MAP = {
  HL: 'Health', ED: 'Education', HU: 'Housing', IS: 'Social services',
  NR: 'Natural resources', AG: 'Agriculture', ACA: 'Arts & culture',
  CP: 'Community development', DPR: 'Disaster relief', OT: 'Other',
  BC: 'Business & commerce', CD: 'Community development', CJJ: 'Justice',
  FN: 'Food & nutrition', O: 'Other', RD: 'Rural development',
  ST: 'Science & tech', T: 'Transportation', WC: 'Workforce',
};

// Fallback: map the search keyword to a category when the API returns no fundingCategories
const KEYWORD_CATEGORY_MAP = {
  'nonprofit':              'Community development',
  'social services':        'Social services',
  'community development':  'Community development',
  'community health':       'Health',
  'community services':     'Community development',
  'health equity':          'Health',
  'education':              'Education',
  'youth':                  'Community development',
  'after school':           'Education',
  'early childhood':        'Education',
  'literacy':               'Education',
  'stem education':         'Education',
  'higher education':       'Education',
  'mental health':          'Health',
  'substance abuse':        'Health',
  'public health':          'Health',
  'maternal health':        'Health',
  'disability':             'Social services',
  'veterans health':        'Health',
  'housing':                'Housing',
  'affordable housing':     'Housing',
  'homeless':               'Housing',
  'workforce development':  'Workforce',
  'job training':           'Workforce',
  'small business':         'Business & commerce',
  'economic development':   'Business & commerce',
  'microenterprise':        'Business & commerce',
  'food security':          'Food & nutrition',
  'nutrition':              'Food & nutrition',
  'food bank':              'Food & nutrition',
  'environmental justice':  'Natural resources',
  'climate':                'Natural resources',
  'environment':            'Natural resources',
  'reentry':                'Justice',
  'criminal justice':       'Justice',
  'violence prevention':    'Justice',
  'domestic violence':      'Social services',
  'juvenile justice':       'Justice',
  'rural development':      'Rural development',
  'tribal':                 'Community development',
  'native american':        'Community development',
  'indigenous':             'Community development',
  'arts':                   'Arts & culture',
  'cultural preservation':  'Arts & culture',
  'humanities':             'Arts & culture',
  'civic engagement':       'Community development',
  'faith-based':            'Community development',
  'veterans':               'Social services',
  'seniors':                'Social services',
  'immigrant':              'Social services',
  'refugee':                'Social services',
  'disability services':    'Social services',
  'transportation':         'Transportation',
  'agriculture':            'Agriculture',
  'farming':                'Agriculture',
  'disaster':               'Disaster relief',
  'disaster relief':        'Disaster relief',
  'emergency management':   'Disaster relief',
  'infrastructure':         'Community development',
  'broadband':              'Science & tech',
  'clean energy':           'Natural resources',
  'water':                  'Natural resources',
  'early learning':         'Education',
  'childcare':              'Social services',
  'opioid':                 'Health',
  'cancer':                 'Health',
  'alzheimer':              'Health',
  'diabetes':               'Health',
  'obesity':                'Health',
  'rural health':           'Health',
  'telehealth':             'Health',
  'suicide prevention':     'Health',
  'gun violence':           'Justice',
  'human trafficking':      'Justice',
  'corrections':            'Justice',
  'workforce':              'Workforce',
  'apprenticeship':         'Workforce',
  'manufacturing':          'Business & commerce',
  'tourism':                'Business & commerce',
  'historic preservation':  'Arts & culture',
  'library':                'Education',
  'museum':                 'Arts & culture',
  'sport':                  'Community development',
  'recreation':             'Community development',
  'children':               'Social services',
  'family':                 'Social services',
  'poverty':                'Social services',
  'homelessness':           'Housing',
  'foreclosure':            'Housing',
  'community land':         'Housing',
};

// Fallback eligibility strings — must contain words detected by parseEligibility() in useGrants.ts
const KEYWORD_ELIGIBILITY_MAP = {
  'nonprofit':             'nonprofit organizations, state government, local government',
  'social services':       'nonprofit organizations, state government, local government, public agency',
  'community development': 'nonprofit organizations, state government, local government, tribal nations',
  'community health':      'nonprofit organizations, state government, local government, public agency',
  'community services':    'nonprofit organizations, state government, local government',
  'health equity':         'nonprofit organizations, state government, local government, educational institutions',
  'education':             'nonprofit organizations, educational institutions, university, state government',
  'youth':                 'nonprofit organizations, state government, local government, educational institutions',
  'after school':          'nonprofit organizations, educational institutions, state government',
  'early childhood':       'nonprofit organizations, educational institutions, state government, local government',
  'literacy':              'nonprofit organizations, educational institutions, state government',
  'stem education':        'nonprofit organizations, educational institutions, university',
  'higher education':      'nonprofit organizations, educational institutions, university',
  'mental health':         'nonprofit organizations, state government, local government, educational institutions',
  'substance abuse':       'nonprofit organizations, state government, local government, public agency',
  'public health':         'nonprofit organizations, state government, local government, public agency',
  'maternal health':       'nonprofit organizations, state government, local government',
  'disability':            'nonprofit organizations, state government, local government, educational institutions',
  'veterans health':       'nonprofit organizations, state government, local government, public agency',
  'housing':               'nonprofit organizations, state government, local government',
  'affordable housing':    'nonprofit organizations, state government, local government',
  'homeless':              'nonprofit organizations, state government, local government, public agency',
  'workforce development': 'nonprofit organizations, state government, local government, educational institutions, business, for-profit organizations',
  'job training':          'nonprofit organizations, state government, local government, educational institutions, for-profit organizations',
  'small business':        'nonprofit organizations, state government, local government, business, for-profit organizations',
  'economic development':  'nonprofit organizations, state government, local government, business',
  'microenterprise':       'nonprofit organizations, state government, local government, individual, for-profit organizations',
  'food security':         'nonprofit organizations, state government, local government, tribal nations',
  'nutrition':             'nonprofit organizations, state government, local government, public agency',
  'food bank':             'nonprofit organizations, state government, local government',
  'environmental justice': 'nonprofit organizations, state government, local government, tribal nations',
  'climate':               'nonprofit organizations, state government, local government, educational institutions',
  'environment':           'nonprofit organizations, state government, local government, tribal nations',
  'reentry':               'nonprofit organizations, state government, local government, public agency',
  'criminal justice':      'nonprofit organizations, state government, local government, public agency',
  'violence prevention':   'nonprofit organizations, state government, local government, public agency',
  'domestic violence':     'nonprofit organizations, state government, local government',
  'juvenile justice':      'nonprofit organizations, state government, local government, public agency',
  'rural development':     'nonprofit organizations, state government, local government, for-profit organizations, business',
  'tribal':                'nonprofit organizations, tribal nations, state government',
  'native american':       'nonprofit organizations, tribal nations, state government',
  'indigenous':            'nonprofit organizations, tribal nations, state government',
  'arts':                  'nonprofit organizations, state government, local government, educational institutions, individual',
  'cultural preservation': 'nonprofit organizations, state government, local government, tribal nations',
  'humanities':            'nonprofit organizations, educational institutions, state government',
  'civic engagement':      'nonprofit organizations, state government, local government, educational institutions',
  'faith-based':           'nonprofit organizations, faith-based organizations, state government, local government',
  'veterans':              'nonprofit organizations, state government, local government, public agency',
  'seniors':               'nonprofit organizations, state government, local government',
  'immigrant':             'nonprofit organizations, state government, local government, public agency',
  'refugee':               'nonprofit organizations, state government, local government, public agency',
  'disability services':   'nonprofit organizations, state government, local government, educational institutions',
  'transportation':        'state government, local government, nonprofit organizations, for-profit organizations',
  'agriculture':           'state government, local government, nonprofit organizations, individual, for-profit organizations',
  'farming':               'state government, local government, nonprofit organizations, individual, for-profit organizations',
  'disaster':              'state government, local government, nonprofit organizations, tribal nations',
  'disaster relief':       'state government, local government, nonprofit organizations, tribal nations',
  'emergency management':  'state government, local government, nonprofit organizations, public agency',
  'infrastructure':        'state government, local government, nonprofit organizations, for-profit organizations',
  'broadband':             'state government, local government, nonprofit organizations, for-profit organizations',
  'clean energy':          'state government, local government, nonprofit organizations, for-profit organizations, educational institutions',
  'water':                 'state government, local government, nonprofit organizations, tribal nations',
};

/**
 * Normalize a raw grant from either source into a unified object.
 * @param {object} raw     Raw grant object from the API
 * @param {'gov'|'candid'} source
 * @param {string} [keyword]
 * @returns {object}       Unified grant object
 */
export function normalizeGrant(raw, source, keyword) {
  return source === 'gov'
    ? normalizeGov(raw, keyword)
    : normalizeCandid(raw);
}

function normalizeGov(g, keyword) {
  // 1. Categories from Grants.gov funding category codes
  const fromApi = (g.fundingCategories ?? []).map(c => GOV_CATEGORY_MAP[c] ?? null).filter(Boolean);

  // 2. Categories from CFDA number prefix (much more reliable than fundingCategories)
  const fromCfda = cfdaToCategories(g.cfdaList ?? []);

  // 3. Merge, deduplicate, fall back to keyword map
  const merged = [...new Set([...fromApi, ...fromCfda])];
  const categories = merged.length > 0
    ? merged
    : keyword && KEYWORD_CATEGORY_MAP[keyword]
      ? [KEYWORD_CATEGORY_MAP[keyword]]
      : [];

  // 4. Description — use synopsis if available, otherwise generate an informative stub
  const rawDesc = clean(g.synopsis ?? g.description ?? g.synopsisDesc);
  const description = rawDesc ?? generateDescriptionStub(g, categories);

  // 5. Applicant types — structured array from eligibility strings
  const eligibilityStrings = g.eligibilities ?? [];
  const applicantTypes = extractApplicantTypes(eligibilityStrings);

  // 6. Cost sharing — normalize "Yes"/"No" string or boolean
  let costSharing = null;
  if (g.costSharingOrMatchingRequirement != null) {
    const cs = String(g.costSharingOrMatchingRequirement).toLowerCase();
    costSharing = cs === 'yes' || cs === 'true' || cs === '1';
  }

  return {
    external_id:        String(g.id ?? g.oppNumber ?? ''),
    source:             'gov',
    title:              clean(g.oppTitle ?? g.title),
    provider_name:      clean(g.agency ?? g.agencyName ?? g.agencyCode ?? 'Federal agency'),
    provider_ein:       null,
    provider_url:       null,
    provider_email:     null,
    amount_min:         safeInt(g.awardFloor),
    amount_max:         safeInt(g.awardCeiling),
    amount_note:        g.estimatedTotalProgramFunding
                          ? `Total program: ${formatMoney(g.estimatedTotalProgramFunding)}`
                          : null,
    deadline:           parseDate(g.closeDate),
    open_date:          parseDate(g.openDate),
    categories,
    eligibility:        eligibilityStrings.join(', ') || (keyword ? KEYWORD_ELIGIBILITY_MAP[keyword] : null) || null,
    description,
    apply_url:          g.id ? `https://www.grants.gov/search-results-detail/${g.id}` : 'https://www.grants.gov',
    status:             mapGovStatus(g.oppStatus ?? g.status),
    raw_json:           g,
    // Enriched fields
    opportunity_number: clean(g.oppNumber ?? g.programNumber ?? g.opportunityNumber),
    applicant_types:    applicantTypes,
    contact_name:       clean(g.contactName ?? g.pocName),
    contact_phone:      clean(g.contactPhone ?? g.pocPhone),
    contact_email:      clean(g.contactEmail ?? g.pocEmail),
    expected_awards:    safeInt(g.expectedNumberOfAwards ?? g.numAwards),
    cost_sharing:       costSharing,
  };
}

function normalizeCandid(g) {
  return {
    external_id:     String(g.grant_id ?? g.id ?? ''),
    source:          'candid',
    title:           clean(g.grant_title ?? g.title ?? 'Foundation grant'),
    provider_name:   clean(g.funder_name ?? g.organization ?? 'Private foundation'),
    provider_ein:    g.funder_ein ?? null,
    provider_url:    g.funder_url ?? null,
    provider_email:  g.contact_email ?? null,
    amount_min:      safeInt(g.grant_amount_min ?? g.amount_min),
    amount_max:      safeInt(g.grant_amount ?? g.grant_amount_max ?? g.amount),
    amount_note:     g.amount_note ?? null,
    deadline:        parseDate(g.deadline ?? g.application_deadline),
    open_date:       parseDate(g.open_date),
    categories:      extractCandidCategories(g),
    eligibility:     clean(g.eligibility ?? g.eligible_organizations),
    description:     clean(g.description ?? g.purpose ?? g.summary),
    apply_url:       g.grant_url ?? g.url ?? 'https://candid.org',
    status:          'open',
    raw_json:        g,
  };
}

// — Helpers ——————————————————————————————————————————————————————————————

/**
 * Generate a human-readable description stub when no synopsis is available.
 * Uses every available field from the search2 API response.
 */
function generateDescriptionStub(g, categories) {
  const agency   = clean(g.agency ?? g.agencyName ?? g.agencyCode) ?? 'A federal agency';
  const status   = mapGovStatus(g.oppStatus ?? g.status);
  const label    = status === 'forecasted' ? 'Forecasted federal grant' : 'Federal grant opportunity';
  const catStr   = categories.length ? categories.slice(0, 3).join(', ') : null;
  const cfda     = (g.cfdaList ?? []).slice(0, 3).join(', ');
  const maxAmt   = safeInt(g.awardCeiling);
  const amtStr   = maxAmt ? ` Up to ${formatMoney(maxAmt)} available.` : '';
  const docType  = g.docType ? ` Opportunity type: ${g.docType}.` : '';

  return [
    `${label} from ${agency}.`,
    catStr  ? `Focus area: ${catStr}.` : '',
    amtStr,
    docType,
    cfda    ? `CFDA: ${cfda}.` : '',
    'See the official listing for full eligibility requirements and application instructions.',
  ].filter(Boolean).join(' ');
}

const HTML_ENTITIES = [
  [/&amp;/gi,  '&'],
  [/&lt;/gi,   '<'],
  [/&gt;/gi,   '>'],
  [/&quot;/gi, '"'],
  [/&#39;/gi,  "'"],
  [/&apos;/gi, "'"],
  [/&ndash;/gi, '-'],
  [/&mdash;/gi, '--'],
  [/&nbsp;/gi, ' '],
  [/&rsquo;/gi, "'"],
  [/&lsquo;/gi, "'"],
  [/&rdquo;/gi, '"'],
  [/&ldquo;/gi, '"'],
  [/&acirc;/gi,  'a'],
  [/&ecirc;/gi,  'e'],
  [/&icirc;/gi,  'i'],
  [/&ocirc;/gi,  'o'],
  [/&ucirc;/gi,  'u'],
  [/&agrave;/gi, 'a'],
  [/&egrave;/gi, 'e'],
  [/&eacute;/gi, 'e'],
  [/&#(\d+);/g,  (_, n) => String.fromCharCode(Number(n))],
];

function decodeHtml(s) {
  return HTML_ENTITIES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), s);
}

function clean(val) {
  if (!val) return null;
  return decodeHtml(String(val).trim().replace(/\s+/g, ' ')) || null;
}

function safeInt(val) {
  if (val == null) return null;
  const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

export function formatMoney(val) {
  const n = safeInt(val);
  if (!n) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function mapGovStatus(raw) {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('posted') || s.includes('open')) return 'open';
  if (s.includes('forecast')) return 'forecasted';
  if (s.includes('clos') || s.includes('archiv')) return 'closed';
  return 'open';
}

// Maps raw Candid / Foundation Center taxonomy strings to our standard category names.
// Keys are lowercase-trimmed to allow case-insensitive matching.
const CANDID_CATEGORY_MAP = {
  // Health
  'health':                     'Health',
  'health care':                'Health',
  'health services':            'Health',
  'health general and rehabilitative': 'Health',
  'mental health':              'Health',
  'mental health and crisis intervention': 'Health',
  'public health':              'Health',
  'health equity':              'Health',
  'medical research':           'Health',
  'diseases, disorders, medical disciplines': 'Health',
  'patient and family support': 'Health',
  'substance abuse':            'Health',
  'substance abuse dependency, prevention, and treatment': 'Health',
  // Education
  'education':                  'Education',
  'higher education':           'Education',
  'k-12 education':             'Education',
  'early childhood education':  'Education',
  'early childhood programs and services': 'Education',
  'youth development':          'Education',
  'youth development programs': 'Education',
  'educational services':       'Education',
  'vocational and technical education': 'Education',
  'library and archival sciences': 'Education',
  // Community development
  'community development':      'Community development',
  'community improvement, capacity building': 'Community development',
  'community improvement and capacity building': 'Community development',
  'community services':         'Community development',
  'civic participation':        'Community development',
  'civic engagement':           'Community development',
  'public affairs':             'Community development',
  'urban and community economic development': 'Community development',
  'neighborhood development and improvement': 'Community development',
  // Social services
  'social services':            'Social services',
  'human services':             'Social services',
  'children and youth services': 'Social services',
  'family services':            'Social services',
  'seniors':                    'Social services',
  'aging':                      'Social services',
  'disabled persons':           'Social services',
  'disabilities':               'Social services',
  'poverty':                    'Social services',
  'food, agriculture, and nutrition': 'Food & nutrition',
  'immigration and refugees':   'Social services',
  'veterans':                   'Social services',
  // Housing
  'housing':                    'Housing',
  'affordable housing':         'Housing',
  'housing and shelter':        'Housing',
  'homeless services':          'Housing',
  // Arts & culture
  'arts':                       'Arts & culture',
  'arts and culture':           'Arts & culture',
  'arts, culture, and humanities': 'Arts & culture',
  'performing arts':            'Arts & culture',
  'visual arts':                'Arts & culture',
  'humanities':                 'Arts & culture',
  'historic preservation':      'Arts & culture',
  'museums':                    'Arts & culture',
  'media and communications':   'Arts & culture',
  // Natural resources / environment
  'environment':                'Natural resources',
  'environmental':              'Natural resources',
  'natural resources':          'Natural resources',
  'natural resources conservation and protection': 'Natural resources',
  'environmental quality':      'Natural resources',
  'conservation':               'Natural resources',
  'clean energy':               'Natural resources',
  'climate change':             'Natural resources',
  'pollution abatement and control': 'Natural resources',
  'water resources':            'Natural resources',
  // Business & commerce
  'economic development':       'Business & commerce',
  'business':                   'Business & commerce',
  'entrepreneurship':           'Business & commerce',
  'economic empowerment':       'Business & commerce',
  'small business':             'Business & commerce',
  'microenterprise':            'Business & commerce',
  // Workforce
  'workforce':                  'Workforce',
  'employment':                 'Workforce',
  'job training':               'Workforce',
  'workforce development':      'Workforce',
  'labor rights, unions, free trade': 'Workforce',
  // Food & nutrition
  'food':                       'Food & nutrition',
  'nutrition':                  'Food & nutrition',
  'food security':              'Food & nutrition',
  'food banks':                 'Food & nutrition',
  'agriculture, food, and nutrition': 'Food & nutrition',
  // Science & tech
  'science':                    'Science & tech',
  'technology':                 'Science & tech',
  'science and technology':     'Science & tech',
  'science & technology':       'Science & tech',
  'stem':                       'Science & tech',
  'computer science':           'Science & tech',
  'information technology':     'Science & tech',
  // Agriculture
  'agriculture':                'Agriculture',
  'farming':                    'Agriculture',
  'food and agriculture':       'Agriculture',
  // Rural development
  'rural':                      'Rural development',
  'rural development':          'Rural development',
  'rural services':             'Rural development',
  // Justice
  'criminal justice':           'Justice',
  'public safety':              'Justice',
  'justice':                    'Justice',
  'civil rights':               'Justice',
  'civil rights, social action, and advocacy': 'Justice',
  'violence prevention':        'Justice',
  'juvenile delinquency prevention': 'Justice',
  'corrections':                'Justice',
  // Transportation
  'transportation':             'Transportation',
  // Disaster relief
  'disaster':                   'Disaster relief',
  'disaster relief':            'Disaster relief',
  'emergency management':       'Disaster relief',
  'disaster preparedness and relief services': 'Disaster relief',
};

function normalizeCandidCategory(raw) {
  const key = String(raw).toLowerCase().trim();
  return CANDID_CATEGORY_MAP[key] ?? null;
}

function extractCandidCategories(g) {
  const raw = [];
  if (g.subject_name) raw.push(g.subject_name);
  if (g.category)     raw.push(g.category);
  if (g.support_type) raw.push(g.support_type);

  const normalized = raw.map(normalizeCandidCategory).filter(Boolean);
  return [...new Set(normalized)].slice(0, 5);
}
