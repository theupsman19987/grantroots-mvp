import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
