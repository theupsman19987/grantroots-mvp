/**
 * One-time grant enrichment backfill.
 *
 * Re-processes every federal grant already in the database, extracting
 * richer data from the raw_json that was stored during the original sync:
 *   - Full agency name (raw_json.agency from search2 response)
 *   - Categories via CFDA number prefix mapping
 *   - Award amounts (awardFloor / awardCeiling)
 *   - Eligibility strings
 *   - Informative description stubs (or full text if GRANTS_GOV_API_KEY set)
 *
 * Run once after deploying the expanded sync:
 *   npm run backfill
 *
 * Optional: set GRANTS_GOV_API_KEY in .env.local to fetch full descriptions
 * from the Grants.gov detail API during backfill.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

import { getGrantsForEnrichment, getGrantCounts, updateGrantEnrichment } from './db.js';
import { enrichGrant } from './detail.js';
import { logger } from './logger.js';

const BATCH_SIZE   = 50;   // DB rows processed per log line
const API_DELAY_MS = 200;  // Delay between API calls when GRANTS_GOV_API_KEY is set

async function runBackfill() {
  const hasApiKey = !!process.env.GRANTS_GOV_API_KEY;
  logger.info('=== Grant enrichment backfill started ===');
  logger.info(hasApiKey
    ? 'Mode: Grants.gov detail API (full descriptions enabled)'
    : 'Mode: raw_json re-processing (no API key — stubs generated)');
  logger.info('Tip: set GRANTS_GOV_API_KEY in .env.local to unlock full synopses.\n');

  // — Before counts ────────────────────────────────────────────────────────
  const before = await getGrantCounts();
  logger.info(`DB before backfill:`);
  logger.info(`  Total: ${before.total}`);
  for (const [status, count] of Object.entries(before.byStatus)) {
    logger.info(`  ${status}: ${count}`);
  }

  // Count enrichment coverage before
  const withDesc    = await countWhere("description IS NOT NULL AND description != ''");
  const withCats    = await countWhere("array_length(categories, 1) > 0");
  const withAgency  = await countWhere("provider_name NOT IN ('Federal agency', '') AND provider_name IS NOT NULL");
  logger.info(`\nCoverage before:`);
  logger.info(`  Has description:  ${withDesc} / ${before.total}`);
  logger.info(`  Has categories:   ${withCats} / ${before.total}`);
  logger.info(`  Has agency name:  ${withAgency} / ${before.total}`);

  // — Load grants ──────────────────────────────────────────────────────────
  logger.info(`\nLoading grants from DB...`);
  const rows = await getGrantsForEnrichment();
  logger.info(`Loaded ${rows.length} federal grants to process.\n`);

  // — Process ──────────────────────────────────────────────────────────────
  let enriched = 0;
  let skipped  = 0; // raw_json missing or nothing to update
  let failed   = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      if (!row.raw_json) {
        skipped++;
        continue;
      }

      const fields = await enrichGrant(row);

      if (!fields) {
        skipped++;
        continue;
      }

      const updated = await updateGrantEnrichment(row.id, fields);
      if (updated) {
        enriched++;
      } else {
        skipped++;
      }
    } catch (err) {
      failed++;
      logger.error(`  [${i + 1}/${rows.length}] Failed ${row.external_id}: ${err.message}`);
    }

    // Progress log every BATCH_SIZE rows
    if ((i + 1) % BATCH_SIZE === 0) {
      logger.info(`  Progress: ${i + 1}/${rows.length} processed (enriched: ${enriched}, skipped: ${skipped}, failed: ${failed})`);
    }

    // Polite delay when using the Grants.gov API to avoid rate limits
    if (hasApiKey && i < rows.length - 1) {
      await sleep(API_DELAY_MS);
    }
  }

  // — After counts ─────────────────────────────────────────────────────────
  const after = await getGrantCounts();

  const withDescAfter   = await countWhere("description IS NOT NULL AND description != ''");
  const withCatsAfter   = await countWhere("array_length(categories, 1) > 0");
  const withAgencyAfter = await countWhere("provider_name NOT IN ('Federal agency', '') AND provider_name IS NOT NULL");

  logger.info(`\n=== Backfill complete ===`);
  logger.info(`Results:`);
  logger.info(`  Processed: ${rows.length}`);
  logger.info(`  Enriched:  ${enriched}`);
  logger.info(`  Skipped:   ${skipped}  (no raw_json or nothing to update)`);
  logger.info(`  Failed:    ${failed}`);
  logger.info(`\nDB after backfill:`);
  logger.info(`  Total: ${after.total}  (was ${before.total})`);
  for (const [status, count] of Object.entries(after.byStatus)) {
    logger.info(`  ${status}: ${count}`);
  }
  logger.info(`\nCoverage after:`);
  logger.info(`  Has description: ${withDescAfter} / ${after.total}  (was ${withDesc})`);
  logger.info(`  Has categories:  ${withCatsAfter} / ${after.total}  (was ${withCats})`);
  logger.info(`  Has agency name: ${withAgencyAfter} / ${after.total}  (was ${withAgency})`);

  if (!hasApiKey) {
    logger.info('\n  To get full descriptions, add GRANTS_GOV_API_KEY to .env.local and re-run.');
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

import pg from 'pg';
const { Pool } = pg;

let _pool;
function getPool() {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

async function countWhere(condition) {
  const res = await getPool().query(`SELECT COUNT(*) FROM grants WHERE ${condition}`);
  return Number(res.rows[0].count);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Entry point ──────────────────────────────────────────────────────────────

runBackfill()
  .then(() => { getPool().end(); process.exit(0); })
  .catch(err => { logger.error(err); process.exit(1); });
