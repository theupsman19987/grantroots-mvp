'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FundersPage() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 py-16 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="size-20 rounded-full bg-[#6B0F1A]/10 flex items-center justify-center mb-6">
        <Building2 className="size-10 text-[#6B0F1A]" />
      </div>
      <h1 className="text-2xl font-black text-[#6B0F1A] mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
        Funder Directory Coming Soon
      </h1>
      <p className="text-sm text-[#4a2e09] max-w-sm mb-6">
        Browse foundations, government agencies, and corporate funders — coming soon. For now, explore our federal grant database.
      </p>
      <Button nativeButton={false} render={<Link href="/search" />}
        className="bg-[#6B0F1A] text-white hover:bg-[#8B1A28]">
        Browse Federal Grants
      </Button>
    </main>
  )
}
