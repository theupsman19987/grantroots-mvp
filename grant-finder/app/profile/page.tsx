'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, CheckCircle2, Clock, Trophy, XCircle, TrendingUp } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SavedGrantsDrawer } from '@/components/grants/SavedGrantsDrawer'
import { useSavedGrants } from '@/hooks/useSavedGrants'
import { formatAmountRange, formatDeadline, getDeadlineUrgency, getDeadlineProgress, cn } from '@/lib/utils'
import { GrantStatus } from '@/lib/types'

const statusConfig: Record<GrantStatus, { label: string; icon: React.ElementType; color: string }> = {
  saved: { label: 'Interested', icon: Bookmark, color: 'bg-secondary text-secondary-foreground' },
  applied: { label: 'Applied', icon: Clock, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  awarded: { label: 'Awarded', icon: Trophy, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default function ProfilePage() {
  const { isSaved, unsaveGrant } = useSavedGrants()
  const savedGrantsWithData: Array<{ savedGrant: import('@/lib/types').SavedGrant; grant: import('@/lib/types').Grant }> = []
  const updateStatus = (_id: string, _s: GrantStatus) => {}
  const updateNotes = (_id: string, _n: string) => {}
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  const byStatus = (status: GrantStatus) => savedGrantsWithData.filter((s) => s.savedGrant.status === status)

  const stats = [
    { label: 'Saved', value: savedGrantsWithData.length, icon: Bookmark, color: 'text-primary' },
    { label: 'Applied', value: byStatus('applied').length, icon: Clock, color: 'text-blue-500' },
    { label: 'Awarded', value: byStatus('awarded').length, icon: Trophy, color: 'text-green-500' },
    { label: 'Rejected', value: byStatus('rejected').length, icon: XCircle, color: 'text-red-500' },
  ]

  const closingSoon = savedGrantsWithData.filter(({ grant }) => {
    const urgency = getDeadlineUrgency(grant.deadline)
    return urgency === 'critical' || urgency === 'warning'
  })

  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Grants Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your saved grants and application progress.</p>
        </div>
        <div className="flex gap-2">
          <SavedGrantsDrawer
            savedGrantsWithData={savedGrantsWithData}
            onUnsave={unsaveGrant}
            onUpdateStatus={updateStatus}
          />
          <Button nativeButton={false} render={<Link href="/search" />}>
            Find More Grants
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
              Deadline Alerts — {closingSoon.length} grant{closingSoon.length > 1 ? 's' : ''} closing soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {closingSoon.map(({ grant }) => {
              const urgency = getDeadlineUrgency(grant.deadline)
              const progress = getDeadlineProgress(grant.deadline, grant.createdAt)
              return (
                <div key={grant.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Link href={`/grants/${grant.id}`} className="text-sm font-medium hover:text-primary line-clamp-1">
                      {grant.title}
                    </Link>
                    <span
                      className={cn(
                        'text-xs font-medium ml-2 shrink-0',
                        urgency === 'critical' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {formatDeadline(grant.deadline)}
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className={cn(
                      'h-1',
                      urgency === 'critical' && '[&>div]:bg-destructive',
                      urgency === 'warning' && '[&>div]:bg-amber-500'
                    )}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved">Saved ({savedGrantsWithData.length})</TabsTrigger>
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Saved grants */}
        <TabsContent value="saved" className="mt-4">
          {savedGrantsWithData.length === 0 ? (
            <div className="py-24 text-center border rounded-lg">
              <Bookmark className="size-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-semibold">No saved grants</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Start exploring grants and save the ones that interest you.
              </p>
              <Button nativeButton={false} render={<Link href="/search" />}>Browse Grants</Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-2">
                {savedGrantsWithData.map(({ savedGrant, grant }) => {
                  const urgency = getDeadlineUrgency(grant.deadline)
                  const progress = getDeadlineProgress(grant.deadline, grant.createdAt)
                  const status = statusConfig[savedGrant.status]
                  return (
                    <Card key={grant.id}>
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/grants/${grant.id}`}
                              className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                            >
                              {grant.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">{grant.funder}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', status.color)}>
                              {status.label}
                            </span>
                            <Select
                              value={savedGrant.status}
                              onValueChange={(v) => updateStatus(grant.id, v as GrantStatus)}
                            >
                              <SelectTrigger className="h-6 w-28 text-xs px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="saved">Interested</SelectItem>
                                <SelectItem value="applied">Applied</SelectItem>
                                <SelectItem value="awarded">Awarded</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatAmountRange(grant.amountMin, grant.amountMax)}</span>
                          <span className={cn(
                            urgency === 'critical' && 'text-destructive font-medium',
                            urgency === 'warning' && 'text-amber-600 font-medium'
                          )}>
                            {formatDeadline(grant.deadline)}
                          </span>
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
                        <div className="flex gap-2">
                          <Button
                            nativeButton={false}
                            render={<Link href={`/grants/${grant.id}`} />}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => unsaveGrant(grant.id)}
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
            <CardContent className="pt-4">
              {savedGrantsWithData.length === 0 ? (
                <div className="py-12 text-center">
                  <TrendingUp className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No grants in tracker yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedGrantsWithData.map(({ savedGrant, grant }) => {
                        const urgency = getDeadlineUrgency(grant.deadline)
                        const conf = statusConfig[savedGrant.status]
                        return (
                          <TableRow key={grant.id}>
                            <TableCell>
                              <Link href={`/grants/${grant.id}`} className="font-medium text-sm hover:text-primary line-clamp-1 max-w-xs block">
                                {grant.title}
                              </Link>
                              <span className="text-xs text-muted-foreground">{grant.funder}</span>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatAmountRange(grant.amountMin, grant.amountMax)}
                            </TableCell>
                            <TableCell>
                              <span className={cn('text-sm whitespace-nowrap',
                                urgency === 'critical' && 'text-destructive font-medium',
                                urgency === 'warning' && 'text-amber-600 font-medium'
                              )}>
                                {formatDeadline(grant.deadline)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', conf.color)}>
                                {conf.label}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
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
                Currently tracking {closingSoon.length} grant{closingSoon.length !== 1 ? 's' : ''} with upcoming deadlines.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" id="settings" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" placeholder="Your organization or name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-type">Organization Type</Label>
                <Select defaultValue="nonprofit">
                  <SelectTrigger id="org-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nonprofit">Nonprofit (501c3)</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="for-profit">For-Profit Business</SelectItem>
                    <SelectItem value="education">Educational Institution</SelectItem>
                    <SelectItem value="government">Government Entity</SelectItem>
                    <SelectItem value="faith-based">Faith-Based Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="City, State" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email for Alerts</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
