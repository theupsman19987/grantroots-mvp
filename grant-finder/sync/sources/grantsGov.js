/**
 * Grants.gov source fetcher
 * Uses the public search2 endpoint — no API key required.
 * Docs: https://grants.gov/api/api-guide
 */

const BASE_URL = 'https://api.grants.gov/v1/api/search2';

// Funding category codes relevant to community/social impact work
const NONPROFIT_CATEGORIES = ['HL', 'ED', 'HU', 'IS', 'NR', 'DPR', 'ACA', 'CP', 'BC', 'CD', 'CJJ', 'FN', 'RD', 'ST', 'WC'];

/**
 * Fetch federal grant opportunities by keyword, paging through all results.
 * @param {string}  keyword
 * @param {object}  opts
 * @param {number}  [opts.pageSize=50]     Results per API request (max ~100)
 * @param {number}  [opts.maxResults=200]  Hard cap per keyword/status to prevent runaway fetches
 * @param {string}  [opts.oppStatus='posted']  'posted' | 'forecasted' | 'closed'
 * @returns {Promise<Array>}
 */
export async function fetchFederalGrants(keyword, opts = {}) {
  const { pageSize = 50, maxResults = 500, oppStatus = 'posted' } = opts;

  const allHits = [];
  let startRecordNum = 0;
  let totalRecords = null; // learned from first response

  while (allHits.length < maxResults) {
    const body = {
      keyword,
      oppStatuses: oppStatus,
      rows: Math.min(pageSize, maxResults - allHits.length),
      startRecordNum,
    };

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Grants.gov HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const page = data?.data?.oppHits ?? [];

    // Learn total on first page
    if (totalRecords === null) {
      totalRecords = data?.data?.totalRecords ?? page.length;
    }

    if (page.length === 0) break;

    // Keep all — category filter would exclude too many valid grants
    // (most Grants.gov records return no fundingCategories via search2)
    allHits.push(...page);
    startRecordNum += page.length;

    // Done if we've consumed all available records or got a short page
    if (startRecordNum >= totalRecords || page.length < pageSize) break;

    // Polite delay between pages
    await sleep(200);
  }

  return allHits;
}

/**
 * Fetch detail for a single opportunity by ID.
 * @param {string} oppId
 * @returns {Promise<object>}
 */
export async function fetchFederalGrantDetail(oppId) {
  const url = `https://api.grants.gov/v1/api/fetchOpportunity?oppId=${oppId}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

  if (!response.ok) {
    throw new Error(`Grants.gov detail fetch failed for ${oppId}: ${response.status}`);
  }

  const data = await response.json();
  return data?.data ?? null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
