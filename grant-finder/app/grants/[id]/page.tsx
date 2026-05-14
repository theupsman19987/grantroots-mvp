import type { Metadata } from 'next'
import { getPool } from '@/lib/db'
import { GrantDetailClient } from '@/components/grants/GrantDetailClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.urbangrantroots.com'

async function getGrantSeoData(id: string) {
  const pool = getPool()
  try {
    const { rows } = await pool.query<{
      title: string
      description: string | null
      provider_name: string | null
      amount_min: number | null
      amount_max: number | null
      deadline: Date | null
      apply_url: string | null
      status: string
    }>(
      `SELECT title, description, provider_name, amount_min, amount_max,
              deadline, apply_url, status
       FROM grants WHERE id = $1 LIMIT 1`,
      [id]
    )
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const grant = await getGrantSeoData(id)

  if (!grant) {
    return { title: 'Grant Not Found', robots: { index: false, follow: false } }
  }

  const title = grant.title
  const funder = grant.provider_name ?? ''
  const rawDesc = grant.description
  const description = rawDesc
    ? (rawDesc.length > 155 ? rawDesc.slice(0, 152) + '…' : rawDesc)
    : `Federal grant opportunity from ${funder}. View eligibility requirements, deadlines, and how to apply on Urban Grantroots.`

  const canonicalUrl = `${SITE_URL}/grants/${id}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: `${title} | Urban Grantroots`,
      description,
      siteName: 'Urban Grantroots',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Urban Grantroots`,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default async function GrantDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const grant = await getGrantSeoData(id)

  const grantJsonLd = grant
    ? {
        '@context': 'https://schema.org',
        '@type': 'MonetaryGrant',
        name: grant.title,
        ...(grant.description ? { description: grant.description } : {}),
        ...(grant.provider_name
          ? { funder: { '@type': 'Organization', name: grant.provider_name } }
          : {}),
        ...(grant.amount_max
          ? {
              amount: {
                '@type': 'MonetaryAmount',
                currency: 'USD',
                maxValue: Number(grant.amount_max),
                ...(grant.amount_min ? { minValue: Number(grant.amount_min) } : {}),
              },
            }
          : {}),
        url: grant.apply_url ?? `${SITE_URL}/grants/${id}`,
      }
    : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Grants', item: `${SITE_URL}/search` },
      ...(grant
        ? [{ '@type': 'ListItem', position: 3, name: grant.title }]
        : []),
    ],
  }

  return (
    <>
      {grantJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(grantJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <GrantDetailClient id={id} />
    </>
  )
}
