'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, BookOpen, Building2, Clock, Loader2, Search, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SearchCommand } from '@/components/search/SearchCommand'
import { GrantCard } from '@/components/grants/GrantCard'
import { TextAnimate } from '@/components/ui/text-animate'
import { NumberTicker } from '@/components/ui/number-ticker'
import { BlurFade } from '@/components/ui/blur-fade'
import { MagicCard } from '@/components/ui/magic-card'
import { Marquee } from '@/components/ui/marquee'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { SparklesText } from '@/components/ui/sparkles-text'
import { Particles } from '@/components/ui/particles'
import { useGrants } from '@/hooks/useGrants'
import { useSavedGrants } from '@/hooks/useSavedGrants'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuth } from '@/hooks/useAuth'
import { MembersOnlyDialog } from '@/components/members-only-dialog'

const CATEGORIES = [
  { label: 'Community Development', href: '/search?area=Community+development' },
  { label: 'Education', href: '/search?area=Education' },
  { label: 'Youth Programs', href: '/search?q=youth' },
  { label: 'Reentry & Justice', href: '/search?area=Justice' },
  { label: 'Health', href: '/search?area=Health' },
  { label: 'Housing', href: '/search?area=Housing' },
  { label: 'Arts & Culture', href: '/search?area=Arts+%26+culture' },
  { label: 'Faith-Based', href: '/search?q=faith-based' },
]

const FUNDERS = [
  'Ford Foundation', 'Gates Foundation', 'W.K. Kellogg Foundation',
  'Robert Wood Johnson', 'Annie E. Casey', 'MacArthur Foundation',
  'Rockefeller Foundation', 'Bloomberg Philanthropies', 'Lumina Foundation',
  'Knight Foundation', 'Pew Charitable Trusts', 'Joyce Foundation',
]

const BENTO_TILES = [
  {
    icon: Zap,
    title: 'Find Faster',
    body: '55,000+ grants searchable in seconds. No more hunting through PDFs or outdated databases.',
    wide: true,
  },
  {
    icon: Clock,
    title: 'Never Miss a Deadline',
    body: 'Live countdowns and urgency alerts keep your applications on track.',
    wide: false,
  },
  {
    icon: Users,
    title: 'Built for Communities',
    body: 'Designed for nonprofits, reentry programs, youth orgs, schools, and grassroots leaders.',
    wide: false,
  },
  {
    icon: TrendingUp,
    title: 'Track Everything',
    body: 'Save grants, monitor status, and measure impact from one dashboard.',
    wide: false,
  },
]

export default function HomePage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user, loading: authLoading } = useAuth()
  const [membersOnlyOpen, setMembersOnlyOpen] = useState(false)
  const { isSaved, saveGrant, unsaveGrant } = useSavedGrants()
  const { grants, loading: grantsLoading } = useGrants()
  const { lastSyncAt } = useSyncStatus()
  const featuredGrants = grants.slice(0, 6)
  const closingSoon = grants
    .filter((g) => {
      const days = Math.ceil((g.deadline.getTime() - Date.now()) / 86400000)
      return days >= 0 && days <= 14
    })
    .slice(0, 3)

  const guestClick = !user && !authLoading ? () => setMembersOnlyOpen(true) : undefined

  const handleSave = (id: string) => {
    if (!user) { setMembersOnlyOpen(true); return }
    saveGrant(id)
    toast.success('Grant saved!', { description: 'Added to your saved grants.' })
  }
  const handleUnsave = (id: string) => {
    if (!user) { setMembersOnlyOpen(true); return }
    unsaveGrant(id)
    toast('Grant removed from saved.')
  }

  return (
    <main>
      {/* Hero */}
      <section className="flex min-h-[92vh] bg-[#C9A84C] overflow-hidden">
        {/* Left: text content (60%) */}
        <div className="flex flex-col justify-center w-full md:w-[60%] px-8 sm:px-12 lg:px-20 py-20 gap-7">
          <TextAnimate
            as="h1"
            animation="blurInUp"
            by="word"
            once
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#800020] leading-[1.05]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            URBAN GRANTROOTS
          </TextAnimate>

          <BlurFade delay={0.25} inView direction="up">
            <p className="text-xl sm:text-2xl italic font-bold text-black" style={{ fontFamily: 'Inter, sans-serif' }}>
              &#8220;Find grants. Build communities. Grow roots.&#8221;
            </p>
          </BlurFade>

          <BlurFade delay={0.35} inView direction="up">
            <p className="text-base sm:text-lg font-bold text-[#800020] max-w-xl">
              Built for nonprofits, community organizations, youth programs, reentry initiatives, schools, and grassroots leaders who need funding but don&apos;t know where to start.
            </p>
          </BlurFade>

          <BlurFade delay={0.45} inView direction="up" className="flex flex-col gap-5 max-w-xl">
            <Button
              nativeButton={false}
              render={<Link href="/search" />}
              size="lg"
              className="self-start bg-[#800020] text-[#C9A84C] hover:bg-[#6B0F1A] font-bold px-12 gap-2 h-13 text-base shadow-lg border-transparent"
            >
              <Search className="size-4" />
              Browse Grants
            </Button>

            <div className="w-full">
              <SearchCommand gold />
              <p className="text-xs text-black mt-2">
                Press{' '}
                <kbd className="inline-flex h-4 items-center rounded border border-black/30 px-1 text-[10px] bg-black/10 text-black">
                  ⌘K
                </kbd>{' '}
                to open search anywhere
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Right: photo (40%) — hidden on mobile */}
        <div className="hidden md:block md:w-[40%] shrink-0">
          <img
            src="/hero-community.png"
            alt="Community members collaborating"
            className="w-full h-full object-cover rounded-l-3xl"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <BlurFade delay={0} inView direction="up">
              <Card className="text-center border-[#A07830] bg-[#FDF8EE] h-full">
                <CardContent className="pt-6">
                  <BookOpen className="size-6 mx-auto mb-2 text-[#6B0F1A]" />
                  <p className="text-3xl font-extrabold text-[#6B0F1A]">
                    {grantsLoading ? '…' : <><NumberTicker value={grants.length} className="text-[#6B0F1A]" />+</>}
                  </p>
                  <p className="text-sm font-medium text-black">Federal Grants</p>
                </CardContent>
              </Card>
            </BlurFade>
            <BlurFade delay={0.1} inView direction="up">
              <Card className="text-center border-[#A07830] bg-[#FDF8EE] h-full">
                <CardContent className="pt-6">
                  <Building2 className="size-6 mx-auto mb-2 text-[#6B0F1A]" />
                  <p className="text-3xl font-extrabold text-[#6B0F1A]">
                    <NumberTicker value={8200} className="text-[#6B0F1A]" />+
                  </p>
                  <p className="text-sm font-medium text-black">Funders Listed</p>
                </CardContent>
              </Card>
            </BlurFade>
            <BlurFade delay={0.2} inView direction="up">
              <Card className="text-center border-[#A07830] bg-[#FDF8EE] h-full">
                <CardContent className="pt-6">
                  <TrendingUp className="size-6 mx-auto mb-2 text-[#6B0F1A]" />
                  <p className="text-3xl font-extrabold text-[#6B0F1A]">Live Data</p>
                  <p className="text-sm font-medium text-black">Updated Daily</p>
                </CardContent>
              </Card>
            </BlurFade>
            <BlurFade delay={0.3} inView direction="up">
              <Card className="text-center border-[#A07830] bg-[#FDF8EE] h-full">
                <CardContent className="pt-6">
                  <Zap className="size-6 mx-auto mb-2 text-[#6B0F1A]" />
                  <p className="text-3xl font-extrabold text-[#6B0F1A]">Always</p>
                  <p className="text-sm font-medium text-black">Free to Use</p>
                </CardContent>
              </Card>
            </BlurFade>
          </div>
          <p className="text-xs text-center text-[#4a2e09]/60 mt-6">
            Powered by <span className="font-semibold text-[#6B0F1A]">Grants.gov</span>
            {lastSyncAt && (
              <>{' · '}Last updated:{' '}
                <span className="font-medium">
                  {new Date(lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </>
            )}
          </p>
        </div>
      </section>

      {/* Funder trust marquee */}
      <div className="py-4 border-y border-[#A07830]/40 bg-[#A07830]/10">
        <Marquee pauseOnHover className="[--duration:30s]">
          {FUNDERS.map((name) => (
            <span
              key={name}
              className="mx-6 text-sm font-semibold text-[#4a2e09] opacity-70 whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </Marquee>
      </div>

      <Separator className="bg-[#A07830]" />

      {/* Browse by Category */}
      <section className="py-12 px-4 bg-[#FDF8EE]">
        <div className="mx-auto max-w-[1280px] space-y-5">
          <BlurFade inView direction="up">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#6B0F1A]">Browse by Category</h2>
              <p className="text-sm text-[#4a2e09] mt-1">Find grants matched to your organization&apos;s focus</p>
            </div>
          </BlurFade>
          <BlurFade inView direction="up" delay={0.1}>
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="inline-flex items-center rounded-full border border-[#A07830] bg-white px-4 py-2 text-sm font-semibold text-[#6B0F1A] hover:bg-[#6B0F1A] hover:text-white hover:border-[#6B0F1A] transition-colors duration-150"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      <Separator className="bg-[#A07830]" />

      {/* Bento Grid */}
      <section className="py-14 px-4">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <BlurFade inView direction="up">
            <h2 className="text-2xl font-bold text-[#6B0F1A] text-center">Why Urban Grantroots</h2>
          </BlurFade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
            {BENTO_TILES.map((tile, i) => (
              <BlurFade
                key={tile.title}
                delay={i * 0.08}
                inView
                direction="up"
                className={tile.wide ? 'md:col-span-2 h-full' : 'h-full'}
              >
                <MagicCard
                  gradientColor="#6B0F1A"
                  gradientOpacity={0.3}
                  className="h-full rounded-xl"
                >
                  <div className="flex flex-col justify-between h-full p-5">
                    <tile.icon className="size-8 text-[#6B0F1A]" />
                    <div>
                      <p className={`text-[#6B0F1A] mb-1 ${tile.wide ? 'text-2xl font-extrabold' : 'text-xl font-bold'}`}>{tile.title}</p>
                      <p className="text-base font-medium text-[#4a2e09]">{tile.body}</p>
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            ))}
            {/* Always Free tile — accent tile, no MagicCard */}
            <BlurFade delay={BENTO_TILES.length * 0.08} inView direction="up" className="h-full">
              <div className="h-full rounded-xl bg-[#6B0F1A] flex flex-col justify-between p-5">
                <Zap className="size-8 text-[#E8C96A]" />
                <div>
                  <p className="font-bold text-white text-xl mb-1">Always Free</p>
                  <p className="text-base font-medium text-white/75">
                    No paywalls, no subscriptions. Every grant, every feature, free forever.
                  </p>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      <Separator className="bg-[#A07830]" />

      {/* Closing Soon */}
      {closingSoon.length > 0 && (
        <section className="py-12 px-4">
          <div className="mx-auto max-w-[1280px] space-y-6">
            <BlurFade inView direction="up">
              <div className="flex items-center justify-between">
                <div>
                  <SparklesText
                    colors={{ first: '#C9A84C', second: '#6B0F1A' }}
                    sparklesCount={isMobile ? 4 : 8}
                    className="text-xl font-bold text-[#6B0F1A]"
                  >
                    Closing Soon
                  </SparklesText>
                  <p className="text-sm text-[#4a2e09]">Deadlines within 14 days</p>
                </div>
                <Button
                  nativeButton={false}
                  render={<Link href="/search?urgency=closing" />}
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-[#6B0F1A] hover:bg-[#A07830]/20"
                >
                  See all <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </BlurFade>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {closingSoon.map((grant, i) => (
                <BlurFade key={grant.id} delay={i * 0.1} inView direction="up">
                  <GrantCard grant={grant} isSaved={isSaved(grant.id)} onSave={handleSave} onUnsave={handleUnsave} onGuestClick={guestClick} />
                </BlurFade>
              ))}
            </div>
          </div>
        </section>
      )}

      <Separator className="bg-[#A07830]" />

      {/* Featured Grants */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <BlurFade inView direction="up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#6B0F1A]">Featured Opportunities</h2>
                <p className="text-sm text-[#4a2e09]">Recently added grant opportunities</p>
              </div>
              <Button
                nativeButton={false}
                render={<Link href="/search" />}
                variant="ghost"
                size="sm"
                className="gap-1 text-[#6B0F1A] hover:bg-[#A07830]/20"
              >
                View all <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </BlurFade>
          {grantsLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="size-8 mx-auto mb-3 text-[#A07830] animate-spin" />
              <p className="text-sm text-[#4a2e09]">Loading grants...</p>
            </div>
          ) : featuredGrants.length === 0 ? (
            <div className="py-16 text-center border border-[#A07830]/40 rounded-xl bg-[#FDF8EE]">
              <BookOpen className="size-10 mx-auto mb-3 text-[#A07830]/60" />
              <p className="font-semibold text-[#6B0F1A]">No grants found.</p>
              <p className="text-sm text-[#4a2e09] mt-1">Try a different search or check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredGrants.map((grant, i) => (
                <BlurFade key={grant.id} delay={i * 0.07} inView direction="up">
                  <GrantCard grant={grant} isSaved={isSaved(grant.id)} onSave={handleSave} onUnsave={handleUnsave} onGuestClick={guestClick} />
                </BlurFade>
              ))}
            </div>
          )}
          <BlurFade inView direction="up" className="text-center">
            <ShimmerButton
              background="#6B0F1A"
              shimmerColor="#C9A84C"
              shimmerDuration="2s"
              className="mx-auto text-white font-semibold px-8 py-3"
              onClick={() => router.push('/search')}
            >
              <Search className="size-4 mr-2 inline" />
              Search All Grants →
            </ShimmerButton>
          </BlurFade>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#6B0F1A] text-white">
        <BlurFade inView direction="up">
          <div className="mx-auto max-w-[1280px] text-center space-y-4">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-2">Coming Soon</span>
            <h2 className="text-3xl font-bold">Track your grant applications</h2>
            <p className="text-white/80 max-w-md mx-auto">
              Save grants, track application status, and get deadline alerts — all for free.
            </p>
            <ShimmerButton
              background="#ffffff"
              shimmerColor="#C9A84C"
              shimmerDuration="2.5s"
              className="mx-auto text-[#6B0F1A] font-semibold px-8 py-3"
              onClick={() => router.push('/profile')}
            >
              <Users className="size-4 mr-2 inline" />
              Create Free Profile
            </ShimmerButton>
          </div>
        </BlurFade>
      </section>

      <MembersOnlyDialog open={membersOnlyOpen} onOpenChange={setMembersOnlyOpen} />
    </main>
  )
}
