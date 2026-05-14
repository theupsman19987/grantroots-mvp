import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../lib/db'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.email, u.created_at,
              p.organization_name, p.organization_type, p.focus_areas,
              p.geographic_focus, p.website, p.ein
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.userId]
    )
    const user = rows[0]
    if (!user) { res.status(404).json({ error: 'User not found.' }); return }

    res.json({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      organizationName: user.organization_name ?? null,
      organizationType: user.organization_type ?? null,
      focusAreas: user.focus_areas ? JSON.parse(user.focus_areas as string) : [],
      geographicFocus: user.geographic_focus ?? 'national',
      website: user.website ?? null,
      ein: user.ein ?? null,
    })
  } catch (err) {
    console.error('GET profile error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// PUT /api/profile
router.put('/', requireAuth, async (req, res) => {
  const { organizationName, organizationType, focusAreas, geographicFocus, website, ein } =
    req.body as {
      organizationName?: string
      organizationType?: string
      focusAreas?: string[]
      geographicFocus?: string
      website?: string
      ein?: string
    }
  try {
    await pool.execute(
      `INSERT INTO profiles (user_id, organization_name, organization_type, focus_areas, geographic_focus, website, ein)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         organization_name  = VALUES(organization_name),
         organization_type  = VALUES(organization_type),
         focus_areas        = VALUES(focus_areas),
         geographic_focus   = VALUES(geographic_focus),
         website            = VALUES(website),
         ein                = VALUES(ein)`,
      [
        req.userId,
        organizationName ?? null,
        organizationType ?? null,
        JSON.stringify(focusAreas ?? []),
        geographicFocus ?? 'national',
        website ?? null,
        ein ?? null,
      ]
    )
    res.json({ message: 'Profile updated.' })
  } catch (err) {
    console.error('PUT profile error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// DELETE /api/profile (delete account)
router.delete('/', requireAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.userId])
    res.clearCookie('token')
    res.json({ message: 'Account deleted.' })
  } catch (err) {
    console.error('DELETE profile error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
