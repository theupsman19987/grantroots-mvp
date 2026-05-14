import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.urbangrantroots.com'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Have a question, suggestion, or a grant you think we should list? Reach out to the Urban Grantroots team.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/contact`,
    title: 'Contact Urban Grantroots',
    description: 'Get in touch with the Urban Grantroots team. We respond within 2 business days.',
    siteName: 'Urban Grantroots',
  },
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-[800px] px-4 sm:px-6 py-16 space-y-8">
      <h1 className="text-4xl font-black text-[#6B0F1A]">Contact Us</h1>
      <p className="text-lg text-[#4a2e09] leading-relaxed">
        Have a question, suggestion, or a grant you think we should list? We'd love to hear from you.
      </p>
      <div className="space-y-2 text-[#4a2e09]">
        <p className="text-base">
          <span className="font-semibold">Email: </span>
          <a
            href="mailto:hello@urbangrantroots.com"
            className="text-[#6B0F1A] font-semibold hover:underline"
          >
            hello@urbangrantroots.com
          </a>
        </p>
        <p className="text-sm text-[#4a2e09]/70">We'll respond as soon as possible.</p>
      </div>
    </main>
  )
}
