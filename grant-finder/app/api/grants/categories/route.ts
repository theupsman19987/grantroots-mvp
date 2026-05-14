import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getPool()
    const { rows } = await pool.query<{ category: string; count: string }>(`
      SELECT
        c AS category,
        COUNT(*) FILTER (WHERE status IN ('open', 'forecasted')) AS count
      FROM grants, unnest(categories) c
      WHERE categories IS NOT NULL AND trim(c) <> ''
      GROUP BY category
      ORDER BY count DESC, category ASC
    `)
    return NextResponse.json(
      rows.map((r) => ({ category: r.category, count: Number(r.count) }))
    )
  } catch (err) {
    console.error('GET /api/grants/categories:', err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
