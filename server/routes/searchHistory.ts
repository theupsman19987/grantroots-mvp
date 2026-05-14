import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../lib/db'
import { requireAuth } from '../middleware/auth'

const router = Router()

// POST /api/search-history
router.post('/', requireAuth, async (req, res) => {
  const { query, filters } = req.body as { query: string; filters?: Record<string, unknown> }
  if (!query?.trim()) { res.status(400).json({ error: 'query is required.' }); return }
  try {
    await pool.execute(
      'INSERT INTO search_history (user_id, query, filters) VALUES (?, ?, ?)',
      [req.userId, query.trim(), JSON.stringify(filters ?? {})]
    )
    res.status(201).json({ message: 'Logged.' })
  } catch (err) {
    console.error('POST search-history error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// GET /api/search-history
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, query, filters, searched_at FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 10',
      [req.userId]
    )
    res.json(rows)
  } catch (err) {
    console.error('GET search-history error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// DELETE /api/search-history
router.delete('/', requireAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM search_history WHERE user_id = ?', [req.userId])
    res.json({ message: 'History cleared.' })
  } catch (err) {
    console.error('DELETE search-history error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
