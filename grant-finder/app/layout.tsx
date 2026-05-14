import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700', '800', '900'], variable: '--font-sans' })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.urbangrantroots.com'

export const viewport: Viewport = {
  themeColor: '#C9A84C',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Urban Grantroots — Find Grants for Your Community',
    template: '%s | Urban Grantroots',
  },
  description:
    'Search thousands of federal grants for nonprofits, community organizations, youth programs, reentry initiatives, and grassroots leaders. Free to use, updated daily from Grants.gov.',
  keywords: [
    'federal grants', 'nonprofit grants', 'community grants', 'grant finder',
    'grants.gov', 'funding opportunities', 'nonprofit funding',
    'community development grants', 'youth program grants', 'reentry grants',
    'urban grants', 'faith-based grants', 'education grants',
  ],
  authors: [{ name: 'Urban Grantroots' }],
  creator: 'Urban Grantroots',
  publisher: 'Urban Grantroots',
  verification: {
    google: 'wLdcpmL-jBoUoShoyOTxzt9GA1BZ2XEAxzxTuQjJXtY',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Urban Grantroots',
    title: 'Urban Grantroots — Find Grants for Your Community',
    description:
      'Search thousands of federal grants for nonprofits, community organizations, and grassroots leaders. Free, updated daily from Grants.gov.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Urban Grantroots — Federal Grant Finder' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Urban Grantroots — Find Grants for Your Community',
    description:
      'Search thousands of federal grants for nonprofits and community organizations. Free, updated daily.',
    images: ['/og-image.png'],
    creator: '@urbangrantroots',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Urban Grantroots',
  url: SITE_URL,
  description: 'Federal grant finder for nonprofits, community organizations, and grassroots leaders.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Urban Grantroots',
  url: SITE_URL,
  description: 'Free federal grant discovery platform for underserved communities.',
  contactPoint: { '@type': 'ContactPoint', email: 'hello@urbangrantroots.com', contactType: 'customer support' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning style={{ backgroundColor: '#C9A84C' }}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background antialiased" style={{ backgroundColor: '#C9A84C' }}>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
