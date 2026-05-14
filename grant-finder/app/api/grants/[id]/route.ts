import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM grants WHERE id = $1', [id])
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(`GET /api/grants/${id}:`, err)
    return NextResponse.json({ error: 'Failed to fetch grant' }, { status: 500 })
  }
}

const VALID_STATUSES = ['approved', 'rejected', 'pending'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: { review_status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { review_status } = body
  if (!review_status || !VALID_STATUSES.includes(review_status as typeof VALID_STATUSES[number])) {
    return NextResponse.json({ error: 'review_status must be approved, rejected, or pending' }, { status: 400 })
  }

  try {
    const pool = getPool()
    const result = await pool.query(
      `UPDATE grants SET review_status = $1 WHERE id = $2 RETURNING id, review_status`,
      [review_status, id]
    )
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error(`PATCH /api/grants/${id}:`, err)
    return NextResponse.json({ error: 'Failed to update grant' }, { status: 500 })
  }
}
