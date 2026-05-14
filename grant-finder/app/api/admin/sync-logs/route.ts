import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pool = getPool()

    const [logsResult, countsResult] = await Promise.all([
      pool.query(`
        SELECT
          id,
          started_at,
          source_gov,
          source_candid,
          upserted,
          duration_seconds,
          jsonb_array_length(errors)  AS error_count,
          errors,
          stats
        FROM sync_logs
        ORDER BY started_at DESC
        LIMIT 30
      `),
      pool.query(`
        SELECT
          status,
          COUNT(*) AS count
        FROM grants
        GROUP BY status
        ORDER BY count DESC
      `),
    ])

    const byStatus: Record<string, number> = {}
    let total = 0
    for (const row of countsResult.rows) {
      byStatus[row.status] = Number(row.count)
      total += Number(row.count)
    }

    const runs = logsResult.rows.map((r) => ({
      id:              r.id,
      startedAt:       r.started_at,
      durationSeconds: r.duration_seconds,
      sourceGov:       r.source_gov,
      sourceCandid:    r.source_candid,
      upserted:        r.upserted,
      errorCount:      Number(r.error_count),
      errors:          r.errors ?? [],
      stats:           r.stats ?? {},
    }))

    return NextResponse.json({
      db: { total, byStatus },
      runs,
    })
  } catch (err) {
    console.error('GET /api/admin/sync-logs:', err)
    return NextResponse.json({ error: 'Failed to fetch sync logs' }, { status: 500 })
  }
}
