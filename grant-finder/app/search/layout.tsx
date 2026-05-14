import type { Metadata } from 'next'
import type { ReactNode } from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.urbangrantroots.com'

export const metadata: Metadata = {
  title: 'Search Federal Grants',
  description:
    'Search and filter thousands of federal grants by category, funding amount, deadline, and eligible applicants. Find grants for nonprofits, community organizations, education, housing, reentry programs, and more.',
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/search`,
    title: 'Search Federal Grants | Urban Grantroots',
    description:
      'Find federal grants for nonprofits, community orgs, youth programs, and more. Filter by category, amount, and deadline. Free, updated daily.',
    siteName: 'Urban Grantroots',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Search Federal Grants — Urban Grantroots' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Federal Grants | Urban Grantroots',
    description: 'Find federal grants for nonprofits and community organizations. Free, updated daily.',
    images: ['/og-image.png'],
  },
}

export default function SearchLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
