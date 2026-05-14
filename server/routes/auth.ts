import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { pool } from '../lib/db'
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, organizationName } = req.body as {
    email: string
    password: string
    organizationName?: string
  }
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' })
    return
  }
  try {
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    )
    if (existing.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (email, password_hash, verification_token) VALUES (?, ?, ?)',
      [email.toLowerCase(), passwordHash, verificationToken]
    )
    const userId = result.insertId

    if (organizationName?.trim()) {
      await pool.execute(
        'INSERT INTO profiles (user_id, organization_name) VALUES (?, ?)',
        [userId, organizationName.trim()]
      )
    }

    try {
      await sendVerificationEmail(email.toLowerCase(), verificationToken)
    } catch {
      // non-blocking — account created even if email fails in dev
    }

    res.status(201).json({ message: 'Account created. Check your email to verify.' })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' })
    return
  }
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    )
    const user = rows[0]

    if (!user) { res.status(401).json({ error: 'Invalid email or password.' }); return }
    if (!user.email_verified) {
      res.status(403).json({ error: 'Please verify your email before signing in.' })
      return
    }

    const match = await bcrypt.compare(password, user.password_hash as string)
    if (!match) { res.status(401).json({ error: 'Invalid email or password.' }); return }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ message: 'Signed in.' })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token')
  res.json({ message: 'Signed out.' })
})

// GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE verification_token = ?',
      [token]
    )
    const user = rows[0]
    if (!user) { res.status(400).json({ error: 'Invalid or expired verification link.' }); return }
    await pool.execute(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
      [user.id]
    )
    res.json({ message: 'Email verified. You can now sign in.' })
  } catch (err) {
    console.error('Verify error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email: string }
  const successMsg = 'If that email exists, a reset link has been sent.'
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email?.toLowerCase()]
    )
    const user = rows[0]
    if (!user) { res.json({ message: successMsg }); return }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, expires, user.id]
    )
    try { await sendPasswordResetEmail(email.toLowerCase(), resetToken) } catch { /* non-blocking */ }

    res.json({ message: successMsg })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body as { token: string; password: string }
  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: 'Valid token and password (min 8 chars) required.' })
    return
  }
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    )
    const user = rows[0]
    if (!user) { res.status(400).json({ error: 'Invalid or expired reset link.' }); return }

    const passwordHash = await bcrypt.hash(password, 12)
    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    )
    res.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
