/**
 * Grant detail enrichment module.
 *
 * Grants.gov's fetchOpportunity endpoint requires a registered API key
 * (returns 403 without one). This module tries the authenticated endpoint
 * when GRANTS_GOV_API_KEY is set and falls back to re-processing the data
 * already stored in raw_json when it isn't.
 *
 * The raw_json fallback uses CFDA numbers + available fields to populate:
 *   - Full agency name (g.agency from search2)
 *   - Funding categories (CFDA prefix mapping)
 *   - Award amounts (awardFloor / awardCeiling)
 *   - Eligibility strings
 *   - Informative description stub
 *
 * To unlock full synopses and detailed eligibility, register for a free
 * Grants.gov API key at https://www.grants.gov/api/api-guide and add:
 *   GRANTS_GOV_API_KEY=your_key  in .env.local
 */

import { cfdaToCategories } from './cfda.js';
import { GOV_CATEGORY_MAP, formatMoney, extractApplicantTypes } from './normalize.js';
import { logger } from './logger.js';

const DETAIL_ENDPOINT = 'https://api.grants.gov/v1/api/fetchOpportunity';

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Enrich a single grant DB row using the Grants.gov detail API or raw_json fallback.
 *
 * @param {object} dbRow  Row from the grants table. Must include raw_json, external_id,
 *                        provider_name, amount_min, amount_max, amount_note, eligibility.
 * @returns {Promise<object|null>}  Fields to UPDATE, or null if nothing changed.
 */
export async function enrichGrant(dbRow) {
  const g = dbRow.raw_json ?? {};

  // Try authenticated detail API first
  const detail = await fetchDetail(dbRow.external_id);
  if (detail) {
    return buildFromDetail(detail, g, dbRow);
  }

  // Fall back to re-processing raw_json
  return buildFromRaw(g, dbRow);
}

// ── Grants.gov detail API ────────────────────────────────────────────────────

async function fetchDetail(oppId) {
  const apiKey = process.env.GRANTS_GOV_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${DETAIL_ENDPOINT}?oppId=${oppId}`, {
      headers: { 'apiKey': apiKey, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      if (res.status === 403) {
        logger.warn(`[detail] API key rejected (403) for opp ${oppId} — falling back to raw_json`);
      }
      return null;
    }
    const data = await res.json();
    return data?.data ?? null;
  } catch (err) {
    logger.warn(`[detail] fetch failed for ${oppId}: ${err.message}`);
    return null;
  }
}

// ── Build enrichment from authenticated detail response ──────────────────────

function buildFromDetail(detail, raw, dbRow) {
  // The detail response wraps data in a synopsis or opportunity object
  const d = detail.synopsis ?? detail.opportunity ?? detail;

  const fromApi  = (d.fundingCategories ?? raw.fundingCategories ?? [])
    .map(c => GOV_CATEGORY_MAP[c] ?? null).filter(Boolean);
  const fromCfda = cfdaToCategories(d.cfdaList ?? raw.cfdaList ?? []);
  const categories = [...new Set([...fromApi, ...fromCfda])].filter(Boolean);

  const agencyFull = clean(d.agencyName ?? d.agency ?? raw.agency ?? raw.agencyName);
  const synopsis   = clean(d.synopsisDesc ?? d.synopsis ?? d.description);
  const description = synopsis ?? buildStub(agencyFull ?? dbRow.provider_name, categories, raw);

  const amountMin = safeInt(d.awardFloor  ?? raw.awardFloor)  ?? dbRow.amount_min;
  const amountMax = safeInt(d.awardCeiling ?? raw.awardCeiling) ?? dbRow.amount_max;
  const estTotal  = d.estimatedTotalProgramFunding ?? raw.estimatedTotalProgramFunding;
  const amountNote = estTotal ? `Total program: ${formatMoney(estTotal)}` : dbRow.amount_note;

  const eligibilities = d.eligibilities ?? raw.eligibilities ?? [];
  const rawElig = eligibilities.join(', ');
  const applicantTypes = extractApplicantTypes(eligibilities);

  const oppNumber = clean(d.oppNumber ?? d.opportunityNumber ?? raw.oppNumber);
  const contactName  = clean(d.contactName ?? d.pocName ?? raw.contactName);
  const contactPhone = clean(d.contactPhone ?? d.pocPhone ?? raw.contactPhone);
  const contactEmail = clean(d.contactEmail ?? d.pocEmail ?? raw.contactEmail);
  const expectedAwards = safeInt(d.expectedNumberOfAwards ?? raw.expectedNumberOfAwards);

  let costSharing = null;
  const cs = d.costSharingOrMatchingRequirement ?? raw.costSharingOrMatchingRequirement;
  if (cs != null) costSharing = String(cs).toLowerCase() === 'yes' || cs === true;

  return {
    provider_name:      agencyFull ?? dbRow.provider_name,
    description,
    amount_min:         amountMin,
    amount_max:         amountMax,
    amount_note:        amountNote,
    categories:         categories.length > 0 ? categories : dbRow.categories,
    eligibility:        rawElig || dbRow.eligibility,
    applicant_types:    applicantTypes.length > 0 ? applicantTypes : undefined,
    opportunity_number: oppNumber ?? undefined,
    contact_name:       contactName ?? undefined,
    contact_phone:      contactPhone ?? undefined,
    contact_email:      contactEmail ?? undefined,
    expected_awards:    expectedAwards ?? undefined,
    cost_sharing:       costSharing ?? undefined,
  };
}

// ── Build enrichment from raw_json (no API key required) ────────────────────

function buildFromRaw(g, dbRow) {
  const fromApi  = (g.fundingCategories ?? []).map(c => GOV_CATEGORY_MAP[c] ?? null).filter(Boolean);
  const fromCfda = cfdaToCategories(g.cfdaList ?? []);
  const categories = [...new Set([...fromApi, ...fromCfda])].filter(Boolean);

  const agencyFull = clean(g.agency ?? g.agencyName ?? g.agencyCode);
  const providerName = agencyFull ?? dbRow.provider_name;

  const existingDesc = dbRow.description;
  const description = (existingDesc && !isStub(existingDesc))
    ? existingDesc
    : (clean(g.synopsis ?? g.description) ?? buildStub(providerName, categories, g));

  const amountMin = safeInt(g.awardFloor)   ?? dbRow.amount_min;
  const amountMax = safeInt(g.awardCeiling) ?? dbRow.amount_max;
  const estTotal  = g.estimatedTotalProgramFunding;
  const amountNote = estTotal ? `Total program: ${formatMoney(estTotal)}` : dbRow.amount_note;

  const eligibilities = g.eligibilities ?? [];
  const rawElig = eligibilities.join(', ');
  const applicantTypes = extractApplicantTypes(eligibilities);

  const oppNumber = clean(g.oppNumber ?? g.opportunityNumber);
  const expectedAwards = safeInt(g.expectedNumberOfAwards ?? g.numAwards);

  let costSharing = null;
  const cs = g.costSharingOrMatchingRequirement;
  if (cs != null) costSharing = String(cs).toLowerCase() === 'yes' || cs === true;

  return {
    provider_name:      providerName,
    description,
    amount_min:         amountMin,
    amount_max:         amountMax,
    amount_note:        amountNote,
    categories:         categories.length > 0 ? categories : dbRow.categories,
    eligibility:        rawElig || dbRow.eligibility,
    applicant_types:    applicantTypes.length > 0 ? applicantTypes : undefined,
    opportunity_number: oppNumber ?? undefined,
    expected_awards:    expectedAwards ?? undefined,
    cost_sharing:       costSharing ?? undefined,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a structured stub description from available metadata */
function buildStub(agencyName, categories, g) {
  const agency  = agencyName ?? 'A federal agency';
  const status  = mapGovStatus(g.oppStatus ?? g.status ?? '');
  const label   = status === 'forecasted' ? 'Forecasted federal grant' : 'Federal grant opportunity';
  const catStr  = categories.length ? categories.slice(0, 3).join(', ') : null;
  const cfda    = (g.cfdaList ?? []).slice(0, 3).join(', ');
  const maxAmt  = safeInt(g.awardCeiling);
  const amtStr  = maxAmt ? ` Up to ${formatMoney(maxAmt)} available.` : '';
  const docType = g.docType ? ` Type: ${g.docType}.` : '';

  return [
    `${label} from ${agency}.`,
    catStr  ? `Focus area: ${catStr}.` : '',
    amtStr,
    docType,
    cfda    ? `CFDA: ${cfda}.` : '',
    'See the official listing for full eligibility and application details.',
  ].filter(Boolean).join(' ');
}

/** True if the description is our own generated stub (avoid overwriting real data) */
function isStub(desc) {
  return desc.includes('See the official listing') || desc.includes('Federal grant opportunity from');
}

function clean(val) {
  if (!val) return null;
  return String(val).trim().replace(/\s+/g, ' ') || null;
}

function safeInt(val) {
  if (val == null) return null;
  const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

function mapGovStatus(raw) {
  const s = String(raw).toLowerCase();
  if (s.includes('posted') || s.includes('open')) return 'open';
  if (s.includes('forecast')) return 'forecasted';
  return 'open';
}
