'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GrantDetailError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-24 text-center">
      <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
      <h2 className="text-xl font-bold mb-2">Grant not found</h2>
      <p className="text-muted-foreground text-sm mb-6">We could not find that grant. It may have been removed.</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset}>Try Again</Button>
        <Button nativeButton={false} render={<Link href="/search" />} variant="outline">Browse Grants</Button>
      </div>
    </div>
  )
}
