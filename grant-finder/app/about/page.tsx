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

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-[#6B0F1A]">How Urban GrantRoots Helps Communities Rise</h2>
        <p className="text-lg text-[#4a2e09] leading-relaxed">
          Urban GrantRoots was created to help underserved communities, nonprofits, schools, youth
          leaders, and grassroots organizations connect with real opportunities that can create
          lasting impact. Our platform helps users discover verified grants, scholarships, workforce
          programs, and funding resources directly from trusted sources like Grants.gov and official
          funder websites, while also allowing organizations to track applications, deadlines,
          awards, and progress in one place. Because when communities finally gain access to
          opportunity, real transformation begins.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-[#6B0F1A]">What Is Grants.gov and Why Does It Matter?</h2>
        <p className="text-lg text-[#4a2e09] leading-relaxed">
          Grants.gov is the official gateway for federal grant opportunities that help nonprofits,
          schools, youth programs, and community organizations access real funding support. Before
          applying, most organizations must first register with SAM.gov, create a verified
          Grants.gov account, and complete detailed application requirements that can often feel
          overwhelming for smaller or underserved communities. Urban GrantRoots helps simplify that
          journey by helping organizations discover the right opportunities first, saving valuable
          time, energy, and resources before starting the application process.
        </p>
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
