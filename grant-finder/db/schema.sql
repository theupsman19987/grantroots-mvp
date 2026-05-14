-- ============================================================
-- Grant Finder — Unified Database Schema
-- Compatible with PostgreSQL 14+
-- Run once:  psql $DATABASE_URL -f db/schema.sql
-- ============================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fast ILIKE / full-text search

-- — Enum types ————————————————————————————————————————————————————————————

CREATE TYPE grant_source AS ENUM ('gov', 'candid');
CREATE TYPE grant_status AS ENUM ('open', 'forecasted', 'closed', 'archived');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'featured');

-- — Core grants table ———————————————————————————————————————————————————————

CREATE TABLE IF NOT EXISTS grants (
  -- Identity
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT          NOT NULL,          -- ID from source API
  source          grant_source  NOT NULL,

  -- Content
  title           TEXT          NOT NULL,
  description     TEXT,
  eligibility     TEXT,

  -- Provider / funder
  provider_name   TEXT          NOT NULL,
  provider_ein    TEXT,                            -- IRS EIN (Candid enrichment)
  provider_url    TEXT,
  provider_email  TEXT,

  -- Funding details
  amount_min      INTEGER,                         -- in USD
  amount_max      INTEGER,                         -- in USD
  amount_note     TEXT,                            -- e.g. "Total program: $5M"

  -- Dates
  deadline        DATE,
  open_date       DATE,

  -- Classification
  categories      TEXT[]        NOT NULL DEFAULT '{}',
  apply_url       TEXT          NOT NULL,

  -- Workflow
  status          grant_status  NOT NULL DEFAULT 'open',
  review_status   review_status NOT NULL DEFAULT 'pending',
  is_featured     BOOLEAN       NOT NULL DEFAULT FALSE,
  reviewer_notes  TEXT,

  -- Raw payload for debugging / re-processing
  raw_json        JSONB,

  -- Timestamps
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Unique constraint: one row per (source, external_id)
ALTER TABLE grants
  ADD CONSTRAINT grants_source_external_id_key
  UNIQUE (source, external_id);

-- — Sync logs table —————————————————————————————————————————————————————————

CREATE TABLE IF NOT EXISTS sync_logs (
  id               SERIAL        PRIMARY KEY,
  source_gov       INTEGER       NOT NULL DEFAULT 0,
  source_candid    INTEGER       NOT NULL DEFAULT 0,
  upserted         INTEGER       NOT NULL DEFAULT 0,
  errors           JSONB         NOT NULL DEFAULT '[]',
  duration_seconds INTEGER       NOT NULL DEFAULT 0,
  started_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- — Saved searches / user alerts ————————————————————————————————————————————

CREATE TABLE IF NOT EXISTS saved_searches (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  keyword     TEXT,
  categories  TEXT[]      DEFAULT '{}',
  sources     TEXT[]      DEFAULT '{gov,candid}',
  notify_days INTEGER     NOT NULL DEFAULT 7,   -- alert N days before deadline
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE
);

-- — Indexes —————————————————————————————————————————————————————————————————

-- Fast lookups used by the public API
CREATE INDEX IF NOT EXISTS idx_grants_status
  ON grants (status)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_grants_review
  ON grants (review_status)
  WHERE review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_grants_deadline
  ON grants (deadline)
  WHERE deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grants_source
  ON grants (source);

CREATE INDEX IF NOT EXISTS idx_grants_featured
  ON grants (is_featured)
  WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_grants_categories
  ON grants USING GIN (categories);

-- Full-text search across title + description
CREATE INDEX IF NOT EXISTS idx_grants_fts
  ON grants
  USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  );

-- Fast ILIKE / partial match on title and provider
CREATE INDEX IF NOT EXISTS idx_grants_title_trgm
  ON grants USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_grants_provider_trgm
  ON grants USING GIN (provider_name gin_trgm_ops);

-- — Auto-update updated_at ——————————————————————————————————————————————————

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER grants_updated_at
  BEFORE UPDATE ON grants
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- — Useful views ————————————————————————————————————————————————————————————

-- Public feed: only approved + open grants
CREATE OR REPLACE VIEW public_grants AS
SELECT
  id, source, title, provider_name, provider_url, provider_email,
  amount_min, amount_max, amount_note,
  deadline, categories, eligibility, description, apply_url,
  is_featured,
  CASE
    WHEN deadline IS NULL THEN NULL
    ELSE (deadline - CURRENT_DATE)
  END AS days_until_deadline
FROM grants
WHERE status = 'open'
  AND review_status = 'approved'
ORDER BY is_featured DESC, deadline ASC NULLS LAST;

-- Admin review queue: pending grants sorted by deadline
CREATE OR REPLACE VIEW review_queue AS
SELECT
  id, source, title, provider_name,
  amount_max, deadline, categories,
  created_at,
  CASE
    WHEN deadline IS NULL THEN 9999
    ELSE (deadline - CURRENT_DATE)
  END AS days_remaining
FROM grants
WHERE review_status = 'pending'
  AND status != 'closed'
ORDER BY days_remaining ASC;

-- Sync health dashboard
CREATE OR REPLACE VIEW sync_health AS
SELECT
  started_at,
  source_gov,
  source_candid,
  upserted,
  duration_seconds,
  jsonb_array_length(errors) AS error_count
FROM sync_logs
ORDER BY started_at DESC
LIMIT 30;

-- ============================================================
-- Sample query — public listing with filters:
--
--   SELECT * FROM public_grants
--   WHERE 'Health' = ANY(categories)
--     AND (deadline IS NULL OR deadline > CURRENT_DATE + 7)
--   LIMIT 20;
--
-- Sample query — full-text search:
--
--   SELECT *, ts_rank(
--     to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')),
--     plainto_tsquery('english', 'affordable housing community')
--   ) AS rank
--   FROM public_grants
--   ORDER BY rank DESC;
-- ============================================================
