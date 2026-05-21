'use client'

import { motion } from 'motion/react'
import { Bookmark, BookmarkCheck, Calendar, DollarSign, GraduationCap, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MagicCard } from '@/components/ui/magic-card'
import { Scholarship } from '@/lib/types'
import { formatAmountRange, formatDeadline, getDeadlineUrgency, cn } from '@/lib/utils'

interface ScholarshipCardProps {
  scholarship: Scholarship
  isSaved?: boolean
  onSave?: (id: string) => void
  onUnsave?: (id: string) => void
  onGuestClick?: () => void
}

export function ScholarshipCard({ scholarship: s, isSaved, onSave, onUnsave, onGuestClick }: ScholarshipCardProps) {
  const urgency = s.deadline ? getDeadlineUrgency(s.deadline) : 'normal'
  const amountDisplay = s.amountNote && s.amountMin === 0 && s.amountMax === 0
    ? s.amountNote
    : formatAmountRange(s.amountMin, s.amountMax)

  return (
    <MagicCard gradientColor="#6B0F1A" gradientOpacity={0.35} className="flex flex-col h-full rounded-xl">
      <Card className="flex flex-col h-full bg-transparent border-0 shadow-none group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {s.schoolTypes.includes('trade') && !s.schoolTypes.includes('college') && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#A07830] text-white">
                  Trade School
                </span>
              )}
              {s.schoolTypes.includes('college') && !s.schoolTypes.includes('trade') && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#6B0F1A] text-white">
                  College
                </span>
              )}
              {s.schoolTypes.includes('college') && s.schoolTypes.includes('trade') && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#6B0F1A]/80 text-white">
                  College &amp; Trade
                </span>
              )}
              {(urgency === 'critical' || urgency === 'warning') && (
                <Badge className="text-xs bg-[#6B0F1A] text-white border-transparent">
                  Closing Soon
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
                      aria-label={isSaved ? 'Remove from saved' : 'Save scholarship'}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        if (onGuestClick) { onGuestClick(); return }
                        isSaved ? onUnsave?.(s.id) : onSave?.(s.id)
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
              <TooltipContent>{isSaved ? 'Remove from saved' : 'Save scholarship'}</TooltipContent>
            </Tooltip>
          </div>

          <p className="font-semibold text-sm leading-snug line-clamp-2 mt-1">{s.title}</p>
          <p className="text-xs text-muted-foreground">{s.sponsor}</p>
        </CardHeader>

        <CardContent className="pb-3 flex-1 space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>

          <div className="flex flex-wrap gap-1">
            {s.eligibleEthnicities.slice(0, 2).map((e) => (
              <Badge key={e} variant="secondary" className="text-xs px-1.5 py-0">
                {e}
              </Badge>
            ))}
            {s.eligibleEthnicities.length === 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">All Ethnicities</Badge>
            )}
            {s.eligibleEthnicities.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{s.eligibleEthnicities.length - 2}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="size-3 shrink-0" />
              <span className="truncate">{amountDisplay}</span>
            </div>
            {s.gpaMin !== null && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <GraduationCap className="size-3 shrink-0" />
                <span className="truncate">Min GPA: {s.gpaMin.toFixed(1)}</span>
              </div>
            )}
            {s.eligibleStates.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                <span className="truncate">📍 {s.eligibleStates.join(', ')}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground w-full">
            <Calendar className="size-3" />
            <span
              className={cn(
                urgency === 'critical' && 'text-destructive font-medium',
                urgency === 'warning' && 'text-amber-600 dark:text-amber-400 font-medium'
              )}
            >
              {s.deadline ? formatDeadline(s.deadline) : 'Rolling deadline'}
            </span>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs bg-[#6B0F1A] hover:bg-[#8B1A28] text-white gap-1"
              onClick={() => {
                if (onGuestClick) { onGuestClick(); return }
                window.open(s.applyUrl, '_blank', 'noopener,noreferrer')
              }}
            >
              Apply Now
              <ExternalLink className="size-3" />
            </Button>
            <Button
              size="sm"
              variant={isSaved ? 'default' : 'outline'}
              className="h-7 text-xs px-2"
              onClick={() => {
                if (onGuestClick) { onGuestClick(); return }
                isSaved ? onUnsave?.(s.id) : onSave?.(s.id)
              }}
            >
              {isSaved ? <BookmarkCheck className="size-3" /> : <Bookmark className="size-3" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </MagicCard>
  )
}
