/**
 * Database adapter for grant sync pipeline.
 * Uses postgres (pg) — swap the pool for mysql2 or better-sqlite3 if needed.
 *
 * Install: npm install pg
 * Env var:  DATABASE_URL=postgresql://user:pass@host:5432/grantfinder
 */

import pg from 'pg';

const { Pool } = pg;

let _pool = null;

function pool() {
  if (!_pool) {
    // Prefer the direct (non-pooling) Supabase URL for cron/batch work — avoids PgBouncer's
    // auth circuit breaker which fires after repeated connection attempts over a long run.
    // POSTGRES_URL_NON_POOLING is set by Vercel's Supabase integration (port 5432 direct).
    const connString =
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL;
    if (!connString) throw new Error('No database connection string: set POSTGRES_URL_NON_POOLING or DATABASE_URL');
    const url = new URL(connString);
    _pool = new Pool({
      host:                     url.hostname,
      port:                     Number(url.port) || 5432,
      user:                     decodeURIComponent(url.username),
      password:                 decodeURIComponent(url.password),
      database:                 url.pathname.replace(/^\//, ''),
      max:                      3,
      idleTimeoutMillis:        30_000,
      connectionTimeoutMillis:  10_000,
      ssl:                      { rejectUnauthorized: false },
    });

    _pool.on('error', (err) => {
      console.error('[db] Pool client error:', err.message);
    });
  }
  return _pool;
}

/**
 * Upsert an array of normalized grants.
 * Matches on (source, external_id) — safe to re-run on every sync.
 * @param {object[]} grants
 * @returns {Promise<{count: number, inserts: number, updates: number}>}
 */
export async function upsertGrants(grants) {
  if (!grants.length) return { count: 0, inserts: 0, updates: 0 };

  let count = 0, inserts = 0, updates = 0;
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    for (const g of grants) {
      const res = await client.query(
        `INSERT INTO grants (
          external_id, source, title, provider_name, provider_ein,
          provider_url, provider_email,
          amount_min, amount_max, amount_note,
          deadline, open_date, categories, eligibility,
          description, apply_url, status, raw_json,
          opportunity_number, applicant_types,
          contact_name, contact_phone, contact_email,
          expected_awards, cost_sharing,
          last_seen_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
          $13::text[],$14,$15,$16,$17,$18::jsonb,
          $19,$20::text[],$21,$22,$23,$24,$25,
          NOW()
        )
        ON CONFLICT (source, external_id) DO UPDATE SET
          title              = EXCLUDED.title,
          provider_name      = EXCLUDED.provider_name,
          provider_url       = EXCLUDED.provider_url,
          provider_email     = EXCLUDED.provider_email,
          amount_min         = EXCLUDED.amount_min,
          amount_max         = EXCLUDED.amount_max,
          amount_note        = EXCLUDED.amount_note,
          deadline           = EXCLUDED.deadline,
          categories         = EXCLUDED.categories,
          eligibility        = EXCLUDED.eligibility,
          description        = EXCLUDED.description,
          apply_url          = EXCLUDED.apply_url,
          status             = EXCLUDED.status,
          raw_json           = EXCLUDED.raw_json,
          opportunity_number = EXCLUDED.opportunity_number,
          applicant_types    = EXCLUDED.applicant_types,
          contact_name       = EXCLUDED.contact_name,
          contact_phone      = EXCLUDED.contact_phone,
          contact_email      = EXCLUDED.contact_email,
          expected_awards    = EXCLUDED.expected_awards,
          cost_sharing       = EXCLUDED.cost_sharing,
          last_seen_at       = NOW(),
          updated_at         = NOW()
        RETURNING (xmax = '0'::xid) AS inserted
        `,
        [
          g.external_id, g.source, g.title, g.provider_name, g.provider_ein,
          g.provider_url, g.provider_email,
          g.amount_min, g.amount_max, g.amount_note,
          g.deadline, g.open_date, g.categories ?? [], g.eligibility,
          g.description, g.apply_url, g.status,
          JSON.stringify(g.raw_json),
          g.opportunity_number ?? null,
          g.applicant_types ?? [],
          g.contact_name ?? null,
          g.contact_phone ?? null,
          g.contact_email ?? null,
          g.expected_awards ?? null,
          g.cost_sharing ?? null,
        ]
      );
      count++;
      if (res.rows[0]?.inserted) inserts++;
      else updates++;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { count, inserts, updates };
}

/**
 * Mark grants inactive if not seen in the last 30 days,
 * or whose deadline has passed.
 * @returns {Promise<number>} count of rows deactivated
 */
export async function markStaleGrants() {
  const res = await pool().query(`
    UPDATE grants
    SET status = 'closed', updated_at = NOW()
    WHERE status = 'open'
      AND (
        last_seen_at < NOW() - INTERVAL '30 days'
        OR (deadline IS NOT NULL AND deadline < CURRENT_DATE)
      )
    RETURNING id
  `);
  return res.rowCount ?? 0;
}

/**
 * Write a sync run summary to the sync_logs table.
 * Optionally writes a stats JSONB blob — requires migration 001_phase3.sql.
 */
export async function writeSyncLog(log) {
  const { rows } = await pool().query(
    `INSERT INTO sync_logs (source_gov, source_candid, upserted, errors, duration_seconds, started_at)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)
     RETURNING id`,
    [
      log.gov ?? 0,
      log.candid ?? 0,
      (log.gov ?? 0) + (log.candid ?? 0),
      JSON.stringify(log.errors ?? []),
      log.duration ?? 0,
      log.startedAt ?? new Date(),
    ]
  );

  if (log.stats && rows[0]?.id) {
    try {
      await pool().query(
        `UPDATE sync_logs SET stats = $1::jsonb WHERE id = $2`,
        [JSON.stringify(log.stats), rows[0].id]
      );
    } catch {
      // stats column not yet created — run db/migrations/001_phase3.sql
    }
  }
}

/**
 * Read the most recent sync log entry.
 */
export async function getSyncLog() {
  const res = await pool().query(
    `SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 1`
  );
  return res.rows[0] ?? null;
}

/**
 * Fetch all gov grants for backfill enrichment.
 * Returns lightweight rows — raw_json is large, only load what we need.
 */
/**
 * Fetch gov grants due for enrichment — those created or updated in the last 14 days.
 * Capped at 500 rows per run so the enrichment pass doesn't blow the cron time budget.
 */
export async function getGrantsForEnrichment() {
  const res = await pool().query(`
    SELECT id, external_id, source, provider_name,
           description, categories, eligibility,
           amount_min, amount_max, amount_note,
           raw_json
    FROM grants
    WHERE source = 'gov'
      AND updated_at > NOW() - INTERVAL '14 days'
    ORDER BY updated_at DESC
    LIMIT 500
  `);
  return res.rows;
}

/**
 * Get total grant count broken down by status.
 */
export async function getGrantCounts() {
  const res = await pool().query(`
    SELECT status, COUNT(*) AS count
    FROM grants
    GROUP BY status
    ORDER BY count DESC
  `);
  const counts = {};
  let total = 0;
  for (const row of res.rows) {
    counts[row.status] = Number(row.count);
    total += Number(row.count);
  }
  return { total, byStatus: counts };
}

/**
 * Apply enrichment fields to a single grant row.
 * Only updates non-null values — never overwrites existing real data with null.
 */
export async function updateGrantEnrichment(id, fields) {
  // Build SET clause dynamically so we only touch provided fields
  const sets = [];
  const vals = [];
  let i = 1;

  if (fields.provider_name      != null) { sets.push(`provider_name      = $${i++}`);          vals.push(fields.provider_name); }
  if (fields.description        != null) { sets.push(`description        = $${i++}`);          vals.push(fields.description); }
  if (fields.amount_min         != null) { sets.push(`amount_min         = $${i++}`);          vals.push(fields.amount_min); }
  if (fields.amount_max         != null) { sets.push(`amount_max         = $${i++}`);          vals.push(fields.amount_max); }
  if (fields.amount_note        != null) { sets.push(`amount_note        = $${i++}`);          vals.push(fields.amount_note); }
  if (fields.eligibility        != null) { sets.push(`eligibility        = $${i++}`);          vals.push(fields.eligibility); }
  if (fields.categories?.length)        { sets.push(`categories         = $${i++}::text[]`);   vals.push(fields.categories); }
  if (fields.applicant_types?.length)   { sets.push(`applicant_types    = $${i++}::text[]`);   vals.push(fields.applicant_types); }
  if (fields.opportunity_number != null) { sets.push(`opportunity_number = $${i++}`);          vals.push(fields.opportunity_number); }
  if (fields.contact_name       != null) { sets.push(`contact_name       = $${i++}`);          vals.push(fields.contact_name); }
  if (fields.contact_phone      != null) { sets.push(`contact_phone      = $${i++}`);          vals.push(fields.contact_phone); }
  if (fields.contact_email      != null) { sets.push(`contact_email      = $${i++}`);          vals.push(fields.contact_email); }
  if (fields.expected_awards    != null) { sets.push(`expected_awards    = $${i++}`);          vals.push(fields.expected_awards); }
  if (fields.cost_sharing       != null) { sets.push(`cost_sharing       = $${i++}`);          vals.push(fields.cost_sharing); }

  if (sets.length === 0) return false; // nothing to update

  sets.push(`updated_at = NOW()`);
  vals.push(id);

  await pool().query(
    `UPDATE grants SET ${sets.join(', ')} WHERE id = $${i}`,
    vals
  );
  return true;
}

export { pool };
