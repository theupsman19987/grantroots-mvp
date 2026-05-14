import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export function SiteFooter() {
  return (
    <footer className="border-t border-[#A07830] bg-[#A07830]/20 mt-auto">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-1">
              <span
                className="font-black text-base text-[#6B0F1A]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                URBAN GRANTROOTS
              </span>
            </div>
            <p
              className="text-sm font-bold italic text-black mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              &#8220;Find grants. Build communities. Grow roots.&#8221;
            </p>
            <p className="text-sm font-semibold text-[#6B0F1A] mb-1">
              Federal grants. Made accessible. For every community.
            </p>
            <p className="text-sm text-[#4a2e09]">
              Connecting nonprofits, reentry programs, youth organizations, and grassroots leaders with federal funding.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[#6B0F1A]">Discover</h4>
            <ul className="space-y-2 text-sm text-[#4a2e09]">
              <li><Link href="/search" className="hover:text-[#6B0F1A] transition-colors">Search Grants</Link></li>
              <li><Link href="/search?area=Community+development" className="hover:text-[#6B0F1A] transition-colors">Community Grants</Link></li>
              <li><Link href="/search?funderType=government" className="hover:text-[#6B0F1A] transition-colors">Government Grants</Link></li>
              <li><Link href="/search?isOpen=true" className="hover:text-[#6B0F1A] transition-colors">Open Grants</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[#6B0F1A]">Categories</h4>
            <ul className="space-y-2 text-sm text-[#4a2e09]">
              <li><Link href="/search?area=Education" className="hover:text-[#6B0F1A] transition-colors">Education</Link></li>
              <li><Link href="/search?area=Health" className="hover:text-[#6B0F1A] transition-colors">Health</Link></li>
              <li><Link href="/search?area=Arts" className="hover:text-[#6B0F1A] transition-colors">Arts & Culture</Link></li>
              <li><Link href="/search?area=Environment" className="hover:text-[#6B0F1A] transition-colors">Environment</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[#6B0F1A]">Company</h4>
            <ul className="space-y-2 text-sm text-[#4a2e09]">
              <li><Link href="/about" className="hover:text-[#6B0F1A] transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#6B0F1A] transition-colors">Contact</Link></li>
              <li><span className="text-[#4a2e09]/50 cursor-default">Member Accounts <span className="text-xs">(coming soon)</span></span></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-[#A07830]" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#4a2e09]">
          <p>© 2026 Urban Grantroots. Built to help communities find funding.</p>
          <p className="text-xs text-center text-[#4a2e09]/70">
            Grant data sourced directly from <span className="font-semibold">Grants.gov</span> (U.S. federal grants database) · Updated regularly · Always free
          </p>
        </div>
      </div>
    </footer>
  )
}
