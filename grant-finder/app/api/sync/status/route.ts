import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getPool()
    const [countResult, logResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM grants WHERE status IN ('open', 'forecasted')`),
      pool.query(`SELECT started_at, upserted FROM sync_logs ORDER BY started_at DESC LIMIT 1`),
    ])

    return NextResponse.json({
      grantCount: Number(countResult.rows[0].count),
      lastSyncAt: logResult.rows[0]?.started_at ?? null,
      lastUpserted: logResult.rows[0]?.upserted ?? null,
    })
  } catch (err) {
    console.error('GET /api/sync/status:', err)
    return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 })
  }
}
