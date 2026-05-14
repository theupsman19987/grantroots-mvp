import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import savedGrantsRoutes from './routes/savedGrants'
import searchHistoryRoutes from './routes/searchHistory'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/saved-grants', savedGrantsRoutes)
app.use('/api/search-history', searchHistoryRoutes)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Urban Grantroots API running on http://localhost:${PORT}`)
})
