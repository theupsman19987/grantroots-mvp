import type { MetadataRoute } from 'next'
import { getPool } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.urbangrantroots.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/search`,        lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/funders`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
  ]

  try {
    const pool = getPool()
    const { rows } = await pool.query<{ id: string; updated_at: Date; status: string }>(
      `SELECT id, updated_at, status
       FROM grants
       WHERE status IN ('open', 'forecasted')
       ORDER BY updated_at DESC
       LIMIT 5000`
    )

    const grantPages: MetadataRoute.Sitemap = rows.map((row) => ({
      url:             `${SITE_URL}/grants/${row.id}`,
      lastModified:    row.updated_at ? new Date(row.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority:        row.status === 'open' ? 0.8 : 0.5,
    }))

    return [...staticPages, ...grantPages]
  } catch {
    return staticPages
  }
}
