-- ============================================================
-- Enriched Grant Fields Migration
-- Run once in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Structured applicant types (replaces free-text eligibility parsing)
ALTER TABLE grants ADD COLUMN IF NOT EXISTS applicant_types TEXT[] NOT NULL DEFAULT '{}';

-- Official opportunity / program number (e.g. "HHS-2024-ACF-OCS-EE-0006")
ALTER TABLE grants ADD COLUMN IF NOT EXISTS opportunity_number TEXT;

-- Agency contact for the opportunity
ALTER TABLE grants ADD COLUMN IF NOT EXISTS contact_name  TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Funding details
ALTER TABLE grants ADD COLUMN IF NOT EXISTS expected_awards INTEGER;
ALTER TABLE grants ADD COLUMN IF NOT EXISTS cost_sharing   BOOLEAN;

-- GIN index for applicant type filtering
CREATE INDEX IF NOT EXISTS idx_grants_applicant_types
  ON grants USING GIN (applicant_types);

-- Refresh public_grants view to include new columns
CREATE OR REPLACE VIEW public_grants AS
SELECT
  id, source, title, provider_name, provider_url, provider_email,
  amount_min, amount_max, amount_note,
  deadline, open_date, categories, eligibility, description, apply_url,
  is_featured, opportunity_number, applicant_types,
  contact_name, contact_phone, contact_email,
  expected_awards, cost_sharing,
  CASE
    WHEN deadline IS NULL THEN NULL
    ELSE (deadline - CURRENT_DATE)
  END AS days_until_deadline
FROM grants
WHERE status = 'open'
  AND review_status = 'approved'
ORDER BY is_featured DESC, deadline ASC NULLS LAST;
