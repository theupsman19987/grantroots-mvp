'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Bookmark, BookmarkCheck, Calendar, DollarSign, MapPin } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { MagicCard } from '@/components/ui/magic-card'
import { Grant } from '@/lib/types'
import { formatAmountRange, formatDeadline, getDeadlineUrgency, getDeadlineProgress, cn } from '@/lib/utils'

interface GrantCardProps {
  grant: Grant
  isSaved?: boolean
  onSave?: (id: string) => void
  onUnsave?: (id: string) => void
}

const funderTypeColors: Record<string, string> = {
  government: 'bg-[#A07830] text-white',
  foundation: 'bg-[#A07830] text-white',
  corporate: 'bg-[#A07830] text-white',
  community: 'bg-[#A07830] text-white',
}

export function GrantCard({ grant, isSaved, onSave, onUnsave }: GrantCardProps) {
  const urgency = getDeadlineUrgency(grant.deadline)
  const progress = getDeadlineProgress(grant.deadline, grant.createdAt)

  return (
    <MagicCard gradientColor="#6B0F1A" gradientOpacity={0.35} className="flex flex-col h-full rounded-xl">
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                funderTypeColors[grant.funderType]
              )}
            >
              {grant.funderType.charAt(0).toUpperCase() + grant.funderType.slice(1)}
            </span>
            {(urgency === 'critical' || urgency === 'warning') && (
              <Badge className="text-xs bg-[#6B0F1A] text-white border-transparent">
                Closing Soon
              </Badge>
            )}
            {!grant.isOpen && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Closed
              </Badge>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  className="shrink-0"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={isSaved ? 'Remove from saved' : 'Save grant'}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      isSaved ? onUnsave?.(grant.id) : onSave?.(grant.id)
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="size-3.5 text-primary" />
                    ) : (
                      <Bookmark className="size-3.5" />
                    )}
                  </Button>
                </motion.div>
              }
            />
            <TooltipContent>{isSaved ? 'Remove from saved' : 'Save grant'}</TooltipContent>
          </Tooltip>
        </div>

        <Link
          href={`/grants/${grant.id}`}
          className="font-semibold text-sm leading-snug hover:text-primary transition-colors line-clamp-2 mt-1"
        >
          {grant.title}
        </Link>
        <p className="text-xs text-muted-foreground">{grant.funder}</p>
      </CardHeader>

      <CardContent className="pb-3 flex-1 space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{grant.description}</p>

        <div className="flex flex-wrap gap-1">
          {grant.focusAreas.slice(0, 3).map((area) => (
            <Badge key={area} variant="secondary" className="text-xs px-1.5 py-0">
              {area}
            </Badge>
          ))}
          {grant.focusAreas.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              +{grant.focusAreas.length - 3}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="size-3 shrink-0" />
            <span className="truncate">{formatAmountRange(grant.amountMin, grant.amountMax)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{grant.geographicFocus[0]}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col gap-2">
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="size-3" />
              <span
                className={cn(
                  urgency === 'critical' && 'text-destructive font-medium',
                  urgency === 'warning' && 'text-amber-600 dark:text-amber-400 font-medium'
                )}
              >
                {formatDeadline(grant.deadline)}
              </span>
            </div>
          </div>
          <Progress
            value={progress}
            className={cn(
              'h-1',
              urgency === 'normal' && '[&>div]:bg-green-500',
              urgency === 'warning' && '[&>div]:bg-amber-500',
              urgency === 'critical' && '[&>div]:bg-destructive'
            )}
          />
        </div>
        <div className="flex gap-2 w-full">
          <Button
            nativeButton={false}
            render={<Link href={`/grants/${grant.id}`} />}
            size="sm"
            className="flex-1 h-7 text-xs"
          >
            View Details
          </Button>
          <Button
            size="sm"
            variant={isSaved ? 'default' : 'outline'}
            className="h-7 text-xs px-2"
            onClick={() => (isSaved ? onUnsave?.(grant.id) : onSave?.(grant.id))}
          >
            {isSaved ? <BookmarkCheck className="size-3" /> : <Bookmark className="size-3" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
    </MagicCard>
  )
}
