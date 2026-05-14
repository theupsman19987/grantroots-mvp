import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.urbangrantroots.com'

export const metadata: Metadata = {
  title: 'About Urban Grantroots',
  description:
    'Urban Grantroots opens real pathways to federal funding for nonprofits, reentry programs, youth organizations, schools, and grassroots leaders. Free grant discovery, always.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/about`,
    title: 'About Urban Grantroots',
    description:
      'We make federal grant discovery accessible to the organizations that need it most. Free forever, updated daily from Grants.gov.',
    siteName: 'Urban Grantroots',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'About Urban Grantroots' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Urban Grantroots',
    description: 'We make federal grant discovery accessible to nonprofits and community organizations. Free forever.',
    images: ['/og-image.png'],
  },
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[800px] px-4 sm:px-6 py-16 space-y-8">
      <h1 className="text-4xl font-black text-[#6B0F1A]">About Urban Grantroots</h1>

      <p className="text-lg text-[#4a2e09] leading-relaxed">
        Urban Grantroots exists to open real pathways to federal funding for the organizations
        doing the hardest work in their communities — nonprofits, reentry programs, youth
        organizations, schools, and grassroots leaders.
      </p>

      <p className="text-lg text-[#4a2e09] leading-relaxed">
        Too often, the groups that need funding most are the last to find it. Grant databases are
        complicated, deadlines get missed, and the application process can feel designed for
        organizations with full-time grant writers — not small teams running programs on the
        ground. We built Urban Grantroots to change that.
      </p>

      <p className="text-lg text-[#4a2e09] leading-relaxed">
        We aggregate federal grants directly from Grants.gov into a single, searchable database —
        organized around the causes that matter to underserved communities: community development,
        education, housing, health, reentry and justice, youth programs, and more. Every grant
        is free to access. No paywalls, no subscriptions, ever.
      </p>

      <div className="border-l-4 border-[#6B0F1A] pl-6 space-y-2">
        <p className="text-xl font-bold italic text-[#6B0F1A]">
          &#8220;Find grants. Build communities. Grow roots.&#8221;
        </p>
        <p className="text-sm text-[#4a2e09]">Federal grants. Made accessible. For every community.</p>
      </div>

      <div className="rounded-xl bg-[#FDF8EE] border border-[#A07830]/40 p-6 space-y-3">
        <h2 className="text-lg font-bold text-[#6B0F1A]">Who we serve</h2>
        <ul className="space-y-2 text-[#4a2e09]">
          {[
            'Nonprofits and 501(c)(3) organizations',
            'Community development organizations',
            'Youth programs and after-school initiatives',
            'Reentry and criminal justice reform programs',
            'Schools, educators, and educational institutions',
            'Faith-based organizations',
            'Grassroots leaders and small community groups',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className="mt-1 size-1.5 rounded-full bg-[#6B0F1A] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
