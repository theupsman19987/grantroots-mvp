-- ============================================================
-- Phase 3 Automation Migration
-- Run once in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add stats column to sync_logs for richer per-run metadata
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}';

-- 2. Function: expire grants whose deadline has passed
--    Called by the pg_cron schedule below AND by the sync pipeline.
CREATE OR REPLACE FUNCTION expire_closed_grants()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE grants
  SET    status     = 'closed',
         updated_at = NOW()
  WHERE  status     IN ('open', 'forecasted')
    AND  deadline   IS NOT NULL
    AND  deadline   < CURRENT_DATE;

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- 3. Schedule hourly expiry via pg_cron (pre-installed on Supabase)
--    Runs at the top of every hour, independent of the sync pipeline.
DO $$
BEGIN
  PERFORM cron.unschedule('expire-closed-grants');
EXCEPTION WHEN OTHERS THEN NULL;  -- safe if job doesn't exist yet
END;
$$;

SELECT cron.schedule(
  'expire-closed-grants',     -- job name (must be unique)
  '0 * * * *',                -- every hour at :00
  'SELECT expire_closed_grants()'
);

-- Verify: SELECT * FROM cron.job WHERE jobname = 'expire-closed-grants';
-- Manual test: SELECT expire_closed_grants();
