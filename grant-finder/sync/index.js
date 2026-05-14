/**
 * Grant Finder — Hybrid Sync Pipeline
 * Fetches from Grants.gov (free) + Candid (paid) and writes to a unified DB.
 * Run manually: npm run sync
 * Schedule via cron: 0 2 * * * node sync/index.js
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env.local when running directly (no-op inside Next.js where env is already loaded)
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  config({ path: resolve(__dirname, '../.env.local') });
} catch {
  // import.meta.url unavailable in bundled context — env already injected by Next.js
}

import { fetchFederalGrants } from './sources/grantsGov.js';
import { fetchFoundationGrants } from './sources/candid.js';
import { normalizeGrant } from './normalize.js';
import { enrichGrant } from './detail.js';
import {
  upsertGrants, markStaleGrants, getGrantsForEnrichment,
  updateGrantEnrichment, writeSyncLog, getSyncLog,
} from './db.js';
import { logger } from './logger.js';

// ── Keywords ──────────────────────────────────────────────────────────────────
// Each keyword drives one Grants.gov search2 call per status.
// Also used as category/eligibility fallback in normalize.js.
const KEYWORDS = [
  // Core community & social
  'nonprofit',
  'social services',
  'community development',
  'community health',
  'community services',

  // Education & youth
  'education',
  'youth',
  'after school',
  'early childhood',
  'early learning',
  'literacy',
  'stem education',
  'higher education',
  'library',
  'childcare',

  // Health
  'health equity',
  'mental health',
  'substance abuse',
  'public health',
  'maternal health',
  'disability',
  'veterans health',
  'telehealth',
  'rural health',
  'opioid',
  'suicide prevention',

  // Housing & economic opportunity
  'housing',
  'affordable housing',
  'homeless',
  'homelessness',
  'workforce development',
  'workforce',
  'job training',
  'apprenticeship',
  'small business',
  'economic development',
  'microenterprise',

  // Food & environment
  'food security',
  'nutrition',
  'food bank',
  'environmental justice',
  'climate',
  'environment',
  'clean energy',
  'water',

  // Justice & safety
  'reentry',
  'criminal justice',
  'violence prevention',
  'domestic violence',
  'juvenile justice',
  'gun violence',
  'human trafficking',
  'corrections',

  // Transportation & infrastructure
  'transportation',
  'infrastructure',
  'broadband',

  // Agriculture & rural
  'agriculture',
  'farming',
  'rural development',

  // Disaster & emergency
  'disaster',
  'disaster relief',
  'emergency management',

  // Tribal & indigenous
  'tribal',
  'native american',
  'indigenous',

  // Arts, culture & civic
  'arts',
  'cultural preservation',
  'humanities',
  'historic preservation',
  'museum',
  'civic engagement',
  'faith-based',

  // Specific populations
  'veterans',
  'seniors',
  'immigrant',
  'refugee',
  'disability services',
  'children',
  'family',
  'poverty',
];

// Statuses to fetch
// 'posted'     = currently open/active
// 'forecasted' = upcoming (application window not yet open)
// 'closed'     = recently closed (archived opportunities)
const STATUSES = ['posted', 'forecasted', 'closed'];

// ── Main sync ─────────────────────────────────────────────────────────────────

// Stop fetching new keywords after this many ms to leave time for enrichment + cleanup.
// Set below maxDuration in route.ts so the function never times out mid-flight.
const FETCH_BUDGET_MS = 480_000; // 8 minutes (route maxDuration = 600s)

async function runSync() {
  const startedAt = new Date();
  const fetchDeadline = Date.now() + FETCH_BUDGET_MS;
  logger.info('=== Grant sync started ===');
  logger.info(`Keywords: ${KEYWORDS.length}  ×  Statuses: ${STATUSES.join(', ')}`);

  const results = { gov: 0, candid: 0, upserted: 0, errors: [] };
  const stats = { inserts: 0, updates: 0, enriched: 0, enrichErrors: 0, expired: 0, missingFields: 0, budgetExhausted: false };
  let budgetExhausted = false;

  // — 1. Fetch from Grants.gov (bulk search) ─────────────────────────────
  logger.info('Fetching from Grants.gov...');

  outer: for (const status of STATUSES) {
    logger.info(`  Status: ${status}`);
    for (const keyword of KEYWORDS) {
      if (Date.now() > fetchDeadline) {
        logger.warn('  Fetch budget exhausted — skipping remaining keywords for this run');
        budgetExhausted = true;
        stats.budgetExhausted = true;
        break outer;
      }
      try {
        const raw = await fetchFederalGrants(keyword, { oppStatus: status });
        const normalized = raw.map(g => normalizeGrant(g, 'gov', keyword));

        // Quality check: flag grants with missing critical fields
        for (const g of normalized) {
          if (!g.categories?.length || !g.deadline || !g.description) {
            stats.missingFields++;
          }
        }

        const { count, inserts, updates } = await upsertGrants(normalized);
        results.gov += count;
        stats.inserts += inserts;
        stats.updates += updates;
        logger.info(`    [${status}] "${keyword}" → ${raw.length} fetched, ${inserts} new, ${updates} updated`);
      } catch (err) {
        logger.error(`    [${status}] "${keyword}" failed: ${err.message}`);
        results.errors.push({ source: 'gov', status, keyword, error: err.message });
      }
      await sleep(250);
    }
  }
  if (budgetExhausted) results.errors.push({ source: 'gov', error: 'fetch budget exhausted — partial sync' });

  // — 2. Detail enrichment pass ──────────────────────────────────────────
  // Re-processes raw_json to extract CFDA categories, agency names, amounts.
  // If GRANTS_GOV_API_KEY is set, also fetches full descriptions from the API.
  const hasApiKey = !!process.env.GRANTS_GOV_API_KEY;
  logger.info(`\nRunning detail enrichment (${hasApiKey ? 'API key active' : 'raw_json fallback'})...`);

  try {
    const rows = await getGrantsForEnrichment();
    let enriched = 0;
    let enrichErrors = 0;

    for (const row of rows) {
      try {
        const fields = await enrichGrant(row);
        if (fields) {
          await updateGrantEnrichment(row.id, fields);
          enriched++;
        }
      } catch (err) {
        enrichErrors++;
        // Don't abort the whole sync for individual enrichment failures
      }
      // Short delay only when hitting the API to respect rate limits
      if (hasApiKey) await sleep(150);
    }

    logger.info(`  Enriched ${enriched} grants (${enrichErrors} errors)`);
    results.enriched = enriched;
    results.enrichErrors = enrichErrors;
    stats.enriched = enriched;
    stats.enrichErrors = enrichErrors;
  } catch (err) {
    logger.error(`  Enrichment pass failed: ${err.message}`);
    results.errors.push({ source: 'enrichment', error: err.message });
  }

  // — 3. Fetch from Candid ────────────────────────────────────────────────
  if (process.env.CANDID_API_KEY) {
    logger.info('\nFetching from Candid...');
    try {
      const raw = await fetchFoundationGrants(KEYWORDS);
      const normalized = raw.map(g => normalizeGrant(g, 'candid'));
      const { count, inserts, updates } = await upsertGrants(normalized);
      results.candid += count;
      stats.inserts += inserts;
      stats.updates += updates;
      logger.info(`  [candid] → ${inserts} new, ${updates} updated`);
    } catch (err) {
      logger.error(`  [candid] failed: ${err.message}`);
      results.errors.push({ source: 'candid', error: err.message });
    }
  } else {
    logger.warn('  [candid] CANDID_API_KEY not set — skipping');
  }

  // — 4. Mark stale grants ───────────────────────────────────────────────
  const staleCount = await markStaleGrants();
  stats.expired = staleCount;
  logger.info(`\nMarked ${staleCount} stale grants as closed`);

  // — 5. Write sync log ──────────────────────────────────────────────────
  const duration = Math.round((Date.now() - startedAt) / 1000);
  await writeSyncLog({ ...results, duration, startedAt, stats });

  logger.info(`\n=== Sync complete in ${duration}s | gov: ${results.gov} | candid: ${results.candid} | errors: ${results.errors.length} ===`);
  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

if (process.argv[1].endsWith('index.js')) {
  runSync().catch(err => { logger.error(err); process.exit(1); });
}

export { runSync };
