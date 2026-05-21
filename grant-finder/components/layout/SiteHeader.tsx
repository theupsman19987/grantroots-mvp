'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, LogIn, LogOut, UserCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useTransform } from 'motion/react'
import { Button } from '@/components/ui/button'
import { MainNav } from './MainNav'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/'
  const { user, loading, signOut } = useAuth()

  const { scrollY } = useScroll()
  const taglineOpacity = useTransform(scrollY, [0, 80], [1, 0])
  const taglineHeight = useTransform(scrollY, [0, 80], [40, 0])
  const taglinePaddingBottom = useTransform(scrollY, [0, 80], [12, 0])

  async function handleSignOut() {
    await signOut()
    toast('Signed out successfully.')
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#A07830] bg-[#C9A84C]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className={`flex items-center gap-4 ${isHome ? 'pt-3 pb-1' : 'h-16'}`}>
          <span
            className="text-xl font-black tracking-tight text-[#6B0F1A] shrink-0"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            URBAN GRANTROOTS
          </span>

          <div className="hidden md:flex">
            <MainNav />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              render={<Link href="/search" />}
              nativeButton={false}
              size="sm"
              className="hidden sm:flex bg-[#6B0F1A] text-white hover:bg-[#8B1A28] border-transparent"
            >
              <Search className="size-3.5 mr-1.5" />
              Search Grants
            </Button>

            {!loading && (
              user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    render={<Link href="/profile" />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                    className="text-[#6B0F1A] hover:bg-[#A07830]/20 gap-1.5"
                  >
                    <UserCircle className="size-3.5" />
                    <span className="max-w-[120px] truncate text-xs">{user.email}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#6B0F1A] hover:bg-[#A07830]/20"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                  >
                    <LogOut className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    render={<Link href="/auth/login" />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                    className="text-[#6B0F1A] hover:bg-[#A07830]/20 gap-1.5"
                  >
                    <LogIn className="size-3.5" />
                    Sign In
                  </Button>
                  <Button
                    render={<Link href="/auth/signup" />}
                    nativeButton={false}
                    size="sm"
                    className="bg-white text-[#6B0F1A] hover:bg-[#FDF8EE] border border-[#6B0F1A]/30 gap-1.5"
                  >
                    Sign Up Free
                  </Button>
                </div>
              )
            )}

            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-[#6B0F1A] hover:bg-[#A07830]/20"
                    aria-label="Open menu"
                  >
                    <Menu className="size-4" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 bg-[#FDF8EE]">
                <nav className="mt-8 flex flex-col gap-3">
                  <Link href="/" className="text-sm font-medium text-[#6B0F1A] hover:text-[#C9A84C] hover:[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] transition-all duration-200">Home</Link>
                  <Link href="/search" className="text-sm font-medium text-[#6B0F1A] hover:text-[#C9A84C] hover:[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] transition-all duration-200">Find Grants</Link>
                  <Link href="/scholarships" className="text-sm font-medium text-[#6B0F1A] hover:text-[#C9A84C] hover:[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] transition-all duration-200">Scholarships</Link>
                  <Link href="/about" className="text-sm font-medium text-[#6B0F1A] hover:text-[#C9A84C] hover:[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] transition-all duration-200">About</Link>
                  <Link href="/contact" className="text-sm font-medium text-[#6B0F1A] hover:text-[#C9A84C] hover:[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000] transition-all duration-200">Contact Us</Link>

                  <div className="mt-4 pt-4 border-t border-[#A07830]/40 space-y-2">
                    {!loading && (
                      user ? (
                        <>
                          <p className="text-xs text-[#6B0F1A]/60 truncate">{user.email}</p>
                          <Link href="/profile" className="block text-sm font-medium text-[#6B0F1A] hover:underline">
                            My Dashboard
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="text-sm text-[#6B0F1A]/70 hover:text-[#6B0F1A] hover:underline"
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/auth/login" className="block text-sm font-medium text-[#6B0F1A] hover:underline">
                            Sign In
                          </Link>
                          <Link href="/auth/signup" className="block text-sm font-medium text-[#6B0F1A] hover:underline">
                            Create Free Account
                          </Link>
                        </>
                      )
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>
    </header>
  )
}
