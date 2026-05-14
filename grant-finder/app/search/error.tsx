'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function SearchError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-24 text-center">
      <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground text-sm mb-6">{error.message ?? 'Failed to load search results.'}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  )
}
