'use client'

import Link from 'next/link'
import { Bookmark, ExternalLink, X } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GrantStatus } from '@/lib/types'
import { SavedRecord } from '@/hooks/useSavedGrants'
import { formatAmountRange, formatDeadline, getDeadlineUrgency, cn } from '@/lib/utils'

interface SavedEntry {
  id: string
  title: string
  sponsor: string
  amountMin: number
  amountMax: number
  amountNote: string | null
  deadline: Date | null
  href: string
  isExternal: boolean
  rec: SavedRecord
}

interface SavedGrantsDrawerProps {
  entries: SavedEntry[]
  onUnsave: (id: string) => void
  onUpdateStatus: (id: string, status: GrantStatus) => void
  trigger?: React.ReactNode
}

export function SavedGrantsDrawer({
  entries,
  onUnsave,
  onUpdateStatus,
  trigger,
}: SavedGrantsDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <Bookmark className="size-4" />
            Saved
            {entries.length > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                {entries.length}
              </Badge>
            )}
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Bookmark className="size-4" />
            Saved Grants &amp; Scholarships
            <Badge variant="secondary">{entries.length}</Badge>
          </DrawerTitle>
          <DrawerDescription>
            Your saved items and application tracker.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4 max-h-[60vh]">
          {entries.length === 0 ? (
            <div className="py-12 text-center">
              <Bookmark className="size-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
              <Button nativeButton={false} render={<Link href="/search" />} size="sm" className="mt-4">
                Find Grants
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {entries.map((entry) => {
                const urgency = entry.deadline ? getDeadlineUrgency(entry.deadline) : 'normal'
                return (
                  <div key={entry.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      {entry.isExternal ? (
                        <a
                          href={entry.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm hover:text-primary transition-colors line-clamp-2 flex items-center gap-1"
                        >
                          {entry.title} <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : (
                        <Link
                          href={entry.href}
                          className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                        >
                          {entry.title}
                        </Link>
                      )}
                      <button
                        onClick={() => onUnsave(entry.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Remove from saved"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.sponsor}</p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs text-muted-foreground">
                        {entry.amountNote && entry.amountMin === 0 && entry.amountMax === 0
                          ? entry.amountNote
                          : formatAmountRange(entry.amountMin, entry.amountMax)}{' '}
                        {entry.deadline && (
                          <>·{' '}
                            <span className={cn(
                              urgency === 'critical' && 'text-destructive font-medium',
                              urgency === 'warning' && 'text-amber-600 font-medium'
                            )}>
                              {formatDeadline(entry.deadline)}
                            </span>
                          </>
                        )}
                      </div>
                      <Select
                        value={entry.rec.status}
                        onValueChange={(v) => onUpdateStatus(entry.id, v as GrantStatus)}
                      >
                        <SelectTrigger className="h-6 w-28 text-[10px] px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saved">Interested</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="awarded">Awarded</SelectItem>
                          <SelectItem value="rejected">Not Selected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <DrawerFooter>
          <Button nativeButton={false} render={<Link href="/profile" />} variant="outline">
            View Full Dashboard
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
