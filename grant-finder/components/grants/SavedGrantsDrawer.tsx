'use client'

import Link from 'next/link'
import { Bookmark, X } from 'lucide-react'
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
import { SavedGrant, Grant, GrantStatus } from '@/lib/types'
import { formatAmountRange, formatDeadline, getDeadlineUrgency, cn } from '@/lib/utils'

interface SavedGrantsDrawerProps {
  savedGrantsWithData: Array<{ savedGrant: SavedGrant; grant: Grant }>
  onUnsave: (id: string) => void
  onUpdateStatus: (id: string, status: GrantStatus) => void
  trigger?: React.ReactNode
}

export function SavedGrantsDrawer({
  savedGrantsWithData,
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
            Saved Grants
            {savedGrantsWithData.length > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                {savedGrantsWithData.length}
              </Badge>
            )}
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Bookmark className="size-4" />
            Saved Grants
            <Badge variant="secondary">{savedGrantsWithData.length}</Badge>
          </DrawerTitle>
          <DrawerDescription>
            Your saved grants and application tracker.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4 max-h-[60vh]">
          {savedGrantsWithData.length === 0 ? (
            <div className="py-12 text-center">
              <Bookmark className="size-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No saved grants yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save grants from the search page to track them here.
              </p>
              <Button nativeButton={false} render={<Link href="/search" />} size="sm" className="mt-4">
                Find Grants
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {savedGrantsWithData.map(({ savedGrant, grant }) => {
                const urgency = getDeadlineUrgency(grant.deadline)
                return (
                  <div key={grant.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/grants/${grant.id}`}
                        className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                      >
                        {grant.title}
                      </Link>
                      <button
                        onClick={() => onUnsave(grant.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Remove from saved"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{grant.funder}</p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs text-muted-foreground">
                        {formatAmountRange(grant.amountMin, grant.amountMax)} ·{' '}
                        <span
                          className={cn(
                            urgency === 'critical' && 'text-destructive font-medium',
                            urgency === 'warning' && 'text-amber-600 font-medium'
                          )}
                        >
                          {formatDeadline(grant.deadline)}
                        </span>
                      </div>
                      <Select
                        value={savedGrant.status}
                        onValueChange={(v) => onUpdateStatus(grant.id, v as GrantStatus)}
                      >
                        <SelectTrigger className="h-6 w-24 text-[10px] px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saved">Saved</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="awarded">Awarded</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
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
