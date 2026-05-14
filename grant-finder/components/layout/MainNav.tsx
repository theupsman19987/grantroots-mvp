'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Find Grants' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact Us' },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navLinks.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink
              render={<Link href={link.href} />}
              className={cn(
                navigationMenuTriggerStyle(),
                'bg-transparent text-[#6B0F1A] font-semibold transition-all duration-200',
                'hover:bg-[#A07830]/20 hover:text-[#C9A84C] hover:[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]',
                'focus:bg-[#A07830]/20',
                pathname === link.href && 'bg-[#A07830]/30 text-[#6B0F1A]'
              )}
            >
              {link.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}

      </NavigationMenuList>
    </NavigationMenu>
  )
}
