import { Pool } from 'pg'

let _pool: Pool | null = null

export function getPool(): Pool {
  if (!_pool) {
    const url = new URL(process.env.POSTGRES_URL!)
    _pool = new Pool({
      host: url.hostname,
      port: Number(url.port) || 6543,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      max: 5,
      idleTimeoutMillis: 30_000,
      ssl: { rejectUnauthorized: false },
    })
  }
  return _pool
}
