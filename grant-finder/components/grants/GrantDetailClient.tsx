'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { toast } from 'sonner'
import {
  Bookmark, BookmarkCheck, Calendar, CheckSquare, DollarSign,
  ExternalLink, Loader2, Phone, Mail, Users, Share2, Copy, Hash,
  Award, AlertCircle
} from 'lucide-react'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { GrantCard } from '@/components/grants/GrantCard'
import { useGrants } from '@/hooks/useGrants'
import { useSavedGrants } from '@/hooks/useSavedGrants'
import {
  formatAmountRange, formatDeadline, getDeadlineUrgency,
  getDeadlineProgress, cn
} from '@/lib/utils'

const funderTypeLabels = {
  government: 'Government Agency',
  foundation: 'Private Foundation',
  corporate:  'Corporate Foundation',
  community:  'Community Foundation',
}

const applicantLabels: Record<string, string> = {
  nonprofit:    'Nonprofit Organizations (501c3)',
  individual:   'Individual Applicants',
  'for-profit': 'For-Profit Businesses',
  government:   'Government Entities',
  education:    'Educational Institutions',
  'faith-based':'Faith-Based Organizations',
  tribal:       'Tribal Nations & Governments',
}

function InfoNotProvided() {
  return (
    <p className="text-sm text-muted-foreground italic">
      Information not provided by agency.
    </p>
  )
}

export function GrantDetailClient({ id }: { id: string }) {
  const { grants: allGrants, loading } = useGrants()
  const { isSaved, saveGrant, unsaveGrant } = useSavedGrants()

  const grant = useMemo(() => allGrants.find((g) => g.id === id), [allGrants, id])
  const relatedGrants = useMemo(
    () =>
      grant
        ? allGrants
            .filter((g) => g.id !== id && g.isOpen && g.focusAreas.some((a) => grant.focusAreas.includes(a)))
            .slice(0, 3)
        : [],
    [allGrants, grant, id]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin size-8 text-[#6B0F1A]" />
      </div>
    )
  }

  if (!grant) notFound()

  const saved   = isSaved(grant.id)
  const urgency = getDeadlineUrgency(grant.deadline)
  const progress = getDeadlineProgress(grant.deadline, grant.createdAt)

  const handleSave = () => { saveGrant(grant.id); toast.success('Grant saved to your profile!') }
  const handleUnsave = () => { unsaveGrant(grant.id); toast('Grant removed from saved.') }
  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }

  const hasContactInfo = grant.contactName || grant.contactPhone || grant.contactEmail

  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/search" />}>Grants</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] truncate">{grant.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* ── Main content ─────────────────────────────── */}
        <div className="space-y-6 order-2 lg:order-1">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="capitalize">
                {funderTypeLabels[grant.funderType]}
              </Badge>
              {urgency === 'critical' && <Badge variant="destructive">Closing Soon</Badge>}
              {urgency === 'warning'  && <Badge className="bg-amber-500 hover:bg-amber-600">Closing Soon</Badge>}
              {!grant.isOpen && <Badge variant="secondary">Closed</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{grant.title}</h1>
            <p className="text-muted-foreground mt-1 text-lg">{grant.funder}</p>
            {grant.opportunityNumber && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Hash className="size-3" />
                {grant.opportunityNumber}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={saved ? handleUnsave : handleSave} variant={saved ? 'default' : 'outline'} className="gap-2">
              {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {saved ? 'Saved' : 'Save Grant'}
            </Button>
            <Popover>
              <PopoverTrigger render={<Button variant="outline" className="gap-2"><Share2 className="size-4" />Share</Button>} />
              <PopoverContent className="w-64 space-y-3">
                <p className="text-sm font-medium">Share this grant</p>
                <div className="flex items-center gap-2 rounded border px-3 py-2 bg-muted text-xs truncate">
                  <span className="flex-1 truncate text-muted-foreground">
                    {typeof window !== 'undefined' ? window.location.href : ''}
                  </span>
                </div>
                <Button size="sm" className="w-full gap-2" onClick={handleCopyLink}>
                  <Copy className="size-3.5" />Copy Link
                </Button>
              </PopoverContent>
            </Popover>
            <Button
              render={<a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer" />}
              variant="outline" className="gap-2"
            >
              <ExternalLink className="size-4" />Official Page
            </Button>
          </div>

          <Tabs defaultValue="overview">
            <div className="overflow-x-auto">
              <TabsList className="w-max min-w-full sm:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                <TabsTrigger value="apply">How to Apply</TabsTrigger>
                <TabsTrigger value="similar">Similar</TabsTrigger>
              </TabsList>
            </div>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">About this Grant</CardTitle></CardHeader>
                <CardContent>
                  {grant.description ? (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {grant.description}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <InfoNotProvided />
                      <a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[#6B0F1A] font-medium hover:underline">
                        <ExternalLink className="size-3.5" />View on Grants.gov
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Focus Areas</CardTitle></CardHeader>
                <CardContent>
                  {grant.focusAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {grant.focusAreas.map((area) => (
                        <Badge key={area} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  ) : <InfoNotProvided />}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Opportunity Details</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {grant.opportunityNumber && (
                      <>
                        <dt className="text-muted-foreground">Opportunity Number</dt>
                        <dd className="font-mono text-xs">{grant.opportunityNumber}</dd>
                      </>
                    )}
                    {grant.expectedAwards != null && (
                      <>
                        <dt className="text-muted-foreground">Expected Awards</dt>
                        <dd>{grant.expectedAwards.toLocaleString()}</dd>
                      </>
                    )}
                    {grant.costSharing != null && (
                      <>
                        <dt className="text-muted-foreground">Cost Sharing Required</dt>
                        <dd className={grant.costSharing ? 'text-amber-600 font-medium' : ''}>
                          {grant.costSharing ? 'Yes' : 'No'}
                        </dd>
                      </>
                    )}
                    {grant.amountNote && (
                      <>
                        <dt className="text-muted-foreground">Program Funding</dt>
                        <dd>{grant.amountNote}</dd>
                      </>
                    )}
                    {grant.openDate && (
                      <>
                        <dt className="text-muted-foreground">Application Opens</dt>
                        <dd>{grant.openDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                      </>
                    )}
                    {!grant.opportunityNumber && grant.expectedAwards == null && grant.costSharing == null && (
                      <div className="col-span-2"><InfoNotProvided /></div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Eligibility ── */}
            <TabsContent value="eligibility" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Eligible Applicants</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {grant.eligibleApplicants.length > 0 ? (
                    grant.eligibleApplicants.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-primary shrink-0" />
                        <span className="text-sm">{applicantLabels[type] ?? type}</span>
                      </div>
                    ))
                  ) : (
                    <InfoNotProvided />
                  )}
                </CardContent>
              </Card>

              {grant.eligibilityText && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Full Eligibility Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {grant.eligibilityText}
                    </p>
                  </CardContent>
                </Card>
              )}

              {!grant.eligibilityText && grant.eligibleApplicants.length === 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>Full eligibility requirements are available on the official Grants.gov listing.</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── How to Apply ── */}
            <TabsContent value="apply" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">How to Apply</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Applications are submitted through Grants.gov. Review all eligibility requirements
                    before starting your application.
                  </p>
                  <Button
                    render={<a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer" />}
                    className="w-full sm:w-auto gap-2"
                  >
                    <ExternalLink className="size-4" />
                    Go to Application on Grants.gov
                  </Button>
                </CardContent>
              </Card>

              {hasContactInfo && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Agency Contact</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {grant.contactName && (
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground shrink-0" />
                        <span>{grant.contactName}</span>
                      </div>
                    )}
                    {grant.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-muted-foreground shrink-0" />
                        <a href={`tel:${grant.contactPhone}`} className="hover:underline">
                          {grant.contactPhone}
                        </a>
                      </div>
                    )}
                    {grant.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground shrink-0" />
                        <a href={`mailto:${grant.contactEmail}`} className="hover:underline break-all">
                          {grant.contactEmail}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Similar Grants ── */}
            <TabsContent value="similar" className="mt-4">
              {relatedGrants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedGrants.map((g) => <GrantCard key={g.id} grant={g} />)}
                </div>
              ) : (
                <div className="py-12 text-center border rounded-lg">
                  <p className="text-muted-foreground text-sm">No similar open grants found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar ──────────────────────────────────── */}
        <div className="space-y-4 order-1 lg:order-2">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Funding Amount</p>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="font-semibold">{formatAmountRange(grant.amountMin, grant.amountMax)}</span>
                </div>
                {grant.amountNote && (
                  <p className="text-xs text-muted-foreground">{grant.amountNote}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Application Deadline</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className={cn(
                    'font-semibold',
                    urgency === 'critical' && 'text-destructive',
                    urgency === 'warning'  && 'text-amber-600 dark:text-amber-400'
                  )}>
                    {formatDeadline(grant.deadline)}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={cn(
                    'h-1.5',
                    urgency === 'normal'   && '[&>div]:bg-green-500',
                    urgency === 'warning'  && '[&>div]:bg-amber-500',
                    urgency === 'critical' && '[&>div]:bg-destructive'
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {grant.deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Funder Type</p>
                <Badge variant="outline" className="capitalize">{funderTypeLabels[grant.funderType]}</Badge>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Who Can Apply</p>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="size-3.5 text-muted-foreground" />
                  {grant.eligibleApplicants.length > 0 ? (
                    <span>{grant.eligibleApplicants.length} applicant type{grant.eligibleApplicants.length > 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-muted-foreground">See official listing</span>
                  )}
                </div>
              </div>

              {grant.expectedAwards != null && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Expected Awards</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Award className="size-3.5 text-muted-foreground" />
                      <span>{grant.expectedAwards.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              {grant.costSharing != null && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cost Sharing</p>
                    <span className={cn('text-sm font-medium', grant.costSharing && 'text-amber-600')}>
                      {grant.costSharing ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full gap-2"
            onClick={saved ? handleUnsave : handleSave}
            variant={saved ? 'secondary' : 'default'}
          >
            {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            {saved ? 'Saved to Profile' : 'Save this Grant'}
          </Button>
          <Button
            render={<a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer" />}
            variant="outline" className="w-full gap-2"
          >
            <ExternalLink className="size-4" />Apply on Grants.gov
          </Button>
        </div>
      </div>
    </main>
  )
}
