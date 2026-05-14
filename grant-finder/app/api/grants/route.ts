import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

const BASE_SELECT = `
  id, external_id, source,
  title, description, eligibility,
  provider_name, provider_url, provider_email,
  amount_min, amount_max, amount_note,
  deadline, open_date, categories, apply_url,
  status, review_status, is_featured,
  created_at, updated_at, last_seen_at
`

const ENRICHED_SELECT = `${BASE_SELECT},
  opportunity_number, applicant_types,
  contact_name, contact_phone, contact_email,
  expected_awards, cost_sharing
`

const ORDER_BY = `
  ORDER BY
    CASE WHEN status = 'open'       THEN 0
         WHEN status = 'forecasted' THEN 1
         ELSE 2
    END,
    deadline ASC NULLS LAST
`

export async function GET() {
  const pool = getPool()
  try {
    // Prefer enriched query (migration 002); fall back to base columns if not yet applied
    let result
    try {
      result = await pool.query(`SELECT ${ENRICHED_SELECT} FROM grants ${ORDER_BY}`)
    } catch {
      result = await pool.query(`SELECT ${BASE_SELECT} FROM grants ${ORDER_BY}`)
    }
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('GET /api/grants:', err)
    return NextResponse.json({ error: 'Failed to fetch grants' }, { status: 500 })
  }
}
