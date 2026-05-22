'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, CheckCircle2, Clock, Trophy, XCircle, TrendingUp, GraduationCap, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSavedGrants, SavedRecord } from '@/hooks/useSavedGrants'
import { useGrants } from '@/hooks/useGrants'
import { useScholarships } from '@/hooks/useScholarships'
import { formatAmountRange, formatDeadline, getDeadlineUrgency, getDeadlineProgress, cn } from '@/lib/utils'
import { GrantStatus } from '@/lib/types'

interface Entry {
  id: string
  title: string
  sponsor: string
  amountMin: number
  amountMax: number
  amountNote: string | null
  deadline: Date | null
  createdAt: Date | null
  href: string
  isExternal: boolean
  type: 'grant' | 'scholarship'
  rec: SavedRecord
}

const statusConfig: Record<GrantStatus, { label: string; icon: React.ElementType; color: string }> = {
  saved: { label: 'Interested', icon: Bookmark, color: 'bg-secondary text-secondary-foreground' },
  applied: { label: 'Applied', icon: Clock, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  awarded: { label: 'Awarded 🏆', icon: Trophy, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Not Selected', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ProfilePage() {
  const { records, isSaved, unsaveGrant, updateStatus } = useSavedGrants()
  const { grants: allGrants } = useGrants()
  const { scholarships: allScholarships } = useScholarships()
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  // Unified tracker entries — grants and scholarships combined
  const entries: Entry[] = Object.values(records).flatMap((rec): Entry[] => {
    const grant = allGrants.find((g) => g.id === rec.id)
    if (grant) {
      return [{
        id: rec.id,
        title: grant.title,
        sponsor: grant.funder,
        amountMin: grant.amountMin,
        amountMax: grant.amountMax,
        amountNote: grant.amountNote,
        deadline: grant.deadline,
        createdAt: grant.createdAt,
        href: `/grants/${grant.id}`,
        isExternal: false,
        type: 'grant',
        rec,
      }]
    }
    const scholarship = allScholarships.find((s) => s.id === rec.id)
    if (scholarship) {
      return [{
        id: rec.id,
        title: scholarship.title,
        sponsor: scholarship.sponsor,
        amountMin: scholarship.amountMin,
        amountMax: scholarship.amountMax,
        amountNote: scholarship.amountNote,
        deadline: scholarship.deadline,
        createdAt: null,
        href: scholarship.applyUrl,
        isExternal: true,
        type: 'scholarship',
        rec,
      }]
    }
    return []
  })

  const byStatus = (status: GrantStatus) => entries.filter((e) => e.rec.status === status)
  const savedItems = byStatus('saved')
  const appliedItems = byStatus('applied')
  const awardedItems = byStatus('awarded')
  const rejectedItems = byStatus('rejected')
  const inProgressItems = [...appliedItems, ...awardedItems, ...rejectedItems]

  const closingSoon = entries.filter(({ deadline }) => {
    if (!deadline) return false
    const urgency = getDeadlineUrgency(deadline)
    return urgency === 'critical' || urgency === 'warning'
  })

  const stats = [
    { label: 'Saved', value: entries.length, icon: Bookmark, color: 'text-primary' },
    { label: 'Applied', value: appliedItems.length, icon: Clock, color: 'text-blue-500' },
    { label: 'Awarded', value: awardedItems.length, icon: Trophy, color: 'text-green-500' },
    { label: 'Not Selected', value: rejectedItems.length, icon: XCircle, color: 'text-red-500' },
  ]

  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your saved grants, scholarships, and application history.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button nativeButton={false} render={<Link href="/search" />} variant="outline">
            Find Grants
          </Button>
          <Button nativeButton={false} render={<Link href="/scholarships" />} variant="outline">
            <GraduationCap className="size-3.5 mr-1.5" />
            Scholarships
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <stat.icon className={cn('size-8 p-1.5 rounded-md bg-muted', stat.color)} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deadline alerts */}
      {closingSoon.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Clock className="size-4" />
              Deadline Alerts — {closingSoon.length} item{closingSoon.length > 1 ? 's' : ''} closing soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {closingSoon.map(({ id, title, deadline, createdAt }) => {
              const urgency = deadline ? getDeadlineUrgency(deadline) : 'normal'
              const progress = deadline && createdAt ? getDeadlineProgress(deadline, createdAt) : 0
              return (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium line-clamp-1">{title}</p>
                    <span className={cn('text-xs font-medium ml-2 shrink-0',
                      urgency === 'critical' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
                    )}>
                      {deadline ? formatDeadline(deadline) : ''}
                    </span>
                  </div>
                  {createdAt && (
                    <Progress
                      value={progress}
                      className={cn('h-1',
                        urgency === 'critical' && '[&>div]:bg-destructive',
                        urgency === 'warning' && '[&>div]:bg-amber-500'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved">
            Saved ({savedItems.length})
          </TabsTrigger>
          <TabsTrigger value="tracker">
            Application Tracker ({inProgressItems.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Saved tab — items not yet applied */}
        <TabsContent value="saved" className="mt-4">
          {savedItems.length === 0 ? (
            <div className="py-24 text-center border rounded-lg">
              <Bookmark className="size-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold">Nothing saved yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Save grants or scholarships to track them here.
              </p>
              <div className="flex gap-2 justify-center">
                <Button nativeButton={false} render={<Link href="/search" />} variant="outline">Browse Grants</Button>
                <Button nativeButton={false} render={<Link href="/scholarships" />} variant="outline">Browse Scholarships</Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-2">
                {savedItems.map((entry) => {
                  const urgency = entry.deadline ? getDeadlineUrgency(entry.deadline) : 'normal'
                  const progress = entry.deadline && entry.createdAt
                    ? getDeadlineProgress(entry.deadline, entry.createdAt) : 0
                  return (
                    <Card key={entry.id}>
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {entry.type === 'scholarship' && (
                                <GraduationCap className="size-3.5 text-[#6B0F1A] shrink-0" />
                              )}
                              {entry.isExternal ? (
                                <a
                                  href={entry.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                                >
                                  {entry.title}
                                </a>
                              ) : (
                                <Link
                                  href={entry.href}
                                  className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                                >
                                  {entry.title}
                                </Link>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{entry.sponsor}</p>
                            <p className="text-xs text-muted-foreground">Saved {fmtDate(entry.rec.savedAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Select
                              value={entry.rec.status}
                              onValueChange={(v) => updateStatus(entry.id, v as GrantStatus)}
                            >
                              <SelectTrigger className="h-6 w-28 text-xs px-2">
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
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {entry.amountNote && entry.amountMin === 0 && entry.amountMax === 0
                              ? entry.amountNote
                              : formatAmountRange(entry.amountMin, entry.amountMax)}
                          </span>
                          <span className={cn(
                            urgency === 'critical' && 'text-destructive font-medium',
                            urgency === 'warning' && 'text-amber-600 font-medium'
                          )}>
                            {entry.deadline ? formatDeadline(entry.deadline) : 'Rolling deadline'}
                          </span>
                        </div>
                        {entry.deadline && entry.createdAt && (
                          <Progress
                            value={progress}
                            className={cn('h-1',
                              urgency === 'normal' && '[&>div]:bg-green-500',
                              urgency === 'warning' && '[&>div]:bg-amber-500',
                              urgency === 'critical' && '[&>div]:bg-destructive'
                            )}
                          />
                        )}
                        <div className="flex gap-2">
                          {entry.isExternal ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1 gap-1"
                              onClick={() => window.open(entry.href, '_blank', 'noopener,noreferrer')}
                            >
                              Apply Now <ExternalLink className="size-3" />
                            </Button>
                          ) : (
                            <Button
                              nativeButton={false}
                              render={<Link href={entry.href} />}
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1"
                            >
                              View Details
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => unsaveGrant(entry.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Application Tracker */}
        <TabsContent value="tracker" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="size-4" />
                Application History
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Grants and scholarships you&apos;ve marked as Applied, Awarded, or Not Selected.
              </p>
            </CardHeader>
            <CardContent>
              {inProgressItems.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No applications tracked yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Save a grant or scholarship, then mark it as &quot;Applied&quot; to track it here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Outcome Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inProgressItems.map((entry) => {
                        const conf = statusConfig[entry.rec.status]
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>
                              {entry.isExternal ? (
                                <a
                                  href={entry.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-sm hover:text-primary line-clamp-1 max-w-xs flex items-center gap-1"
                                >
                                  {entry.title}
                                  <ExternalLink className="size-3 shrink-0" />
                                </a>
                              ) : (
                                <Link
                                  href={entry.href}
                                  className="font-medium text-sm hover:text-primary line-clamp-1 max-w-xs block"
                                >
                                  {entry.title}
                                </Link>
                              )}
                              <span className="text-xs text-muted-foreground">{entry.sponsor}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">
                                {entry.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {fmtDate(entry.rec.appliedAt)}
                            </TableCell>
                            <TableCell>
                              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', conf.color)}>
                                {conf.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {(entry.rec.status === 'awarded' || entry.rec.status === 'rejected')
                                ? fmtDate(entry.rec.resolvedAt)
                                : '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Win summary */}
              {awardedItems.length > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="size-4 text-green-600" />
                    <p className="font-semibold text-sm text-green-800 dark:text-green-400">
                      Congratulations! You&apos;ve been awarded {awardedItems.length} grant{awardedItems.length > 1 ? 's' : ''}.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {awardedItems.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium line-clamp-1 max-w-xs">{entry.title}</span>
                        <div className="text-right text-xs text-muted-foreground ml-4 shrink-0">
                          <span>Awarded {fmtDate(entry.rec.resolvedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Deadline Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified 7 days before a saved grant deadline</p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Weekly Digest</Label>
                  <p className="text-xs text-muted-foreground">Weekly email with new matching grants</p>
                </div>
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Currently tracking {closingSoon.length} item{closingSoon.length !== 1 ? 's' : ''} with upcoming deadlines.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" id="settings" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <p className="text-sm text-muted-foreground">
                Update your profile details to get better-matched grants and scholarships.
              </p>
              <Button nativeButton={false} render={<Link href="/auth/signup" />} variant="outline">
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
