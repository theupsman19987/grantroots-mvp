/**
 * Candid Grants API source fetcher
 * Requires a paid API key from developer.candid.org
 * Docs: https://developer.candid.org
 */

const BASE_URL = 'https://api.candid.org/grants/v1';

/**
 * Fetch foundation grant opportunities from Candid.
 * @param {string[]} keywords  Array of search terms
 * @param {object}   opts
 * @returns {Promise<Array>} raw grant objects from Candid
 */
export async function fetchFoundationGrants(keywords = [], opts = {}) {
  const apiKey = process.env.CANDID_API_KEY;
  if (!apiKey) throw new Error('CANDID_API_KEY environment variable not set');

  const { pageSize = 50 } = opts;
  const allGrants = [];
  const seen = new Set();

  for (const keyword of keywords) {
    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('page_size', pageSize);
    url.searchParams.set('grant_type', 'general_operating,project'); // most relevant for nonprofits

    const response = await fetch(url.toString(), {
      headers: {
        'Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Candid HTTP ${response.status} for keyword "${keyword}": ${await response.text()}`);
    }

    const data = await response.json();
    const grants = data?.data ?? data?.grants ?? data?.results ?? [];

    for (const grant of grants) {
      const id = grant.grant_id ?? grant.id ?? JSON.stringify(grant).slice(0, 40);
      if (!seen.has(id)) {
        seen.add(id);
        allGrants.push(grant);
      }
    }

    await sleep(300); // respect rate limits
  }

  return allGrants;
}

/**
 * Fetch a single funder profile from Candid.
 * Useful for enriching provider contact info.
 * @param {string} ein  The funder's EIN
 * @returns {Promise<object>}
 */
export async function fetchFunderProfile(ein) {
  const apiKey = process.env.CANDID_API_KEY;
  const url = `https://api.candid.org/essentials/v1/${ein}`;

  const response = await fetch(url, {
    headers: { 'Subscription-Key': apiKey },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data?.data ?? null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
