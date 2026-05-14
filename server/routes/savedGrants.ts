import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../lib/db'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/saved-grants
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM saved_grants WHERE user_id = ? ORDER BY saved_at DESC',
      [req.userId]
    )
    res.json(rows)
  } catch (err) {
    console.error('GET saved-grants error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// POST /api/saved-grants
router.post('/', requireAuth, async (req, res) => {
  const { grantId } = req.body as { grantId: string }
  if (!grantId) { res.status(400).json({ error: 'grantId is required.' }); return }
  try {
    await pool.execute(
      'INSERT IGNORE INTO saved_grants (user_id, grant_id) VALUES (?, ?)',
      [req.userId, grantId]
    )
    res.status(201).json({ message: 'Grant saved.' })
  } catch (err) {
    console.error('POST saved-grants error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// PATCH /api/saved-grants/:grantId
router.patch('/:grantId', requireAuth, async (req, res) => {
  const { grantId } = req.params
  const { status, notes, alert7Days, alert3Days } = req.body as {
    status?: string
    notes?: string
    alert7Days?: boolean
    alert3Days?: boolean
  }
  const fields: string[] = []
  const values: unknown[] = []
  if (status !== undefined) { fields.push('status = ?'); values.push(status) }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes) }
  if (alert7Days !== undefined) { fields.push('alert_7_days = ?'); values.push(alert7Days) }
  if (alert3Days !== undefined) { fields.push('alert_3_days = ?'); values.push(alert3Days) }
  if (fields.length === 0) { res.status(400).json({ error: 'No fields to update.' }); return }
  values.push(req.userId, grantId)
  try {
    await pool.execute(
      `UPDATE saved_grants SET ${fields.join(', ')} WHERE user_id = ? AND grant_id = ?`,
      values
    )
    res.json({ message: 'Updated.' })
  } catch (err) {
    console.error('PATCH saved-grants error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// DELETE /api/saved-grants/:grantId
router.delete('/:grantId', requireAuth, async (req, res) => {
  const { grantId } = req.params
  try {
    await pool.execute(
      'DELETE FROM saved_grants WHERE user_id = ? AND grant_id = ?',
      [req.userId, grantId]
    )
    res.json({ message: 'Removed.' })
  } catch (err) {
    console.error('DELETE saved-grants error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
