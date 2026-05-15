import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getPool } from '@/lib/db'

// Vercel Hobby plan maximum is 300s
export const maxDuration = 300

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret configured — open in dev
  return request.headers.get('authorization') === `Bearer ${secret}`
}

// ── Resend email alert ────────────────────────────────────────────────────────

async function sendFailureAlert(error: string, durationSeconds: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[cron/sync] RESEND_API_KEY not set — skipping email alert')
    return
  }

  const resend = new Resend(apiKey)
  const from   = process.env.ALERT_FROM_EMAIL ?? 'onboarding@resend.dev'
  const to     = process.env.ALERT_TO_EMAIL   ?? 'theupsman1998@gmail.com'
  const time   = new Date().toUTCString()

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#800020;margin-bottom:4px">Grant Sync Failed</h2>
      <p style="color:#666;margin-top:0;font-size:14px">${time}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap">Duration before failure</td><td>${durationSeconds}s</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap">Environment</td><td>${process.env.VERCEL_ENV ?? 'local'}</td></tr>
      </table>
      <h3 style="margin-bottom:8px">Error</h3>
      <pre style="background:#f8f0f0;border:1px solid #e0c0c0;padding:12px;border-radius:6px;font-size:12px;white-space:pre-wrap;word-break:break-word">${error}</pre>
      <p style="font-size:13px;color:#555">Check the <code>sync_logs</code> table in Supabase for the full run history.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
      <p style="font-size:11px;color:#aaa">Urban Grantroots automated alert &mdash; /api/cron/sync</p>
    </div>
  `.trim()

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [to],
      subject: '[Urban Grantroots] Grant sync failed',
      html,
    })
    if (sendError) {
      console.error('[cron/sync] Resend error:', sendError)
    }
  } catch (err) {
    console.error('[cron/sync] Could not send alert email:', err)
  }
}

// ── Supabase error log ────────────────────────────────────────────────────────

async function logFailureToDb(error: string): Promise<void> {
  try {
    const pool = getPool()
    await pool.query(
      `INSERT INTO sync_logs (source_gov, source_candid, upserted, errors, duration_seconds, started_at)
       VALUES (0, 0, 0, $1::jsonb, 0, NOW())`,
      [JSON.stringify([{ error, failed: true }])]
    )
  } catch (dbErr) {
    console.error('[cron/sync] Could not log failure to DB:', dbErr)
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const { runSync } = await import('../../../../sync/index.js') as {
      runSync: () => Promise<{
        gov: number
        candid: number
        errors: Array<{ error: string }>
        enriched?: number
      }>
    }

    const results = await runSync()
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000)

    return NextResponse.json({
      success:  true,
      gov:      results.gov,
      candid:   results.candid,
      enriched: results.enriched ?? 0,
      errors:   results.errors.length,
      duration: durationSeconds,
    })

  } catch (err) {
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000)
    const message = err instanceof Error ? err.message : String(err)

    console.error('[cron/sync] Fatal sync failure:', message)

    await Promise.allSettled([
      logFailureToDb(message),
      sendFailureAlert(message, durationSeconds),
    ])

    return NextResponse.json(
      { error: 'Sync failed', detail: message, duration: durationSeconds },
      { status: 500 }
    )
  }
}
