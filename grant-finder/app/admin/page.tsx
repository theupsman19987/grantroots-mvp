'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Check, X, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatAmountRange, cn } from '@/lib/utils'

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'featured'
type FilterValue = 'all' | ReviewStatus

interface AdminGrant {
  id: string
  title: string
  source: 'gov' | 'candid'
  provider_name: string
  amount_min: number | null
  amount_max: number | null
  deadline: string | null
  review_status: ReviewStatus
  status: string
  created_at: string
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  if (status === 'approved')
    return <Badge className="bg-green-100 text-green-800 border border-green-300 hover:bg-green-100 font-medium">Approved</Badge>
  if (status === 'rejected')
    return <Badge className="bg-red-100 text-red-800 border border-red-300 hover:bg-red-100 font-medium">Rejected</Badge>
  if (status === 'featured')
    return <Badge className="bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-100 font-medium">Featured</Badge>
  return <Badge variant="outline" className="text-amber-700 border-amber-400 font-medium">Pending</Badge>
}

export default function AdminPage() {
  const [grants, setGrants] = useState<AdminGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  const fetchGrants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/grants')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setGrants(await res.json())
    } catch (err) {
      toast.error('Could not load grants from database.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGrants() }, [fetchGrants])

  const updateStatus = async (id: string, review_status: 'approved' | 'rejected') => {
    const previous = grants.find(g => g.id === id)?.review_status
    setUpdating(prev => new Set(prev).add(id))
    setGrants(gs => gs.map(g => g.id === id ? { ...g, review_status } : g))

    try {
      const res = await fetch(`/api/grants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(`Grant ${review_status}.`)
    } catch (err) {
      setGrants(gs => gs.map(g => g.id === id ? { ...g, review_status: previous! } : g))
      toast.error('Failed to update grant status.')
      console.error(err)
    } finally {
      setUpdating(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const counts = {
    all: grants.length,
    pending: grants.filter(g => g.review_status === 'pending').length,
    approved: grants.filter(g => g.review_status === 'approved').length,
    rejected: grants.filter(g => g.review_status === 'rejected').length,
  }

  const filtered = filter === 'all' ? grants : grants.filter(g => g.review_status === filter)

  return (
    <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Grant Admin</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchGrants}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v: string) => setFilter(v as FilterValue)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[260px]">Title / Provider</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  Loading grants…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  No grants found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((grant) => {
                const busy = updating.has(grant.id)
                return (
                  <TableRow key={grant.id} className="hover:bg-muted/30">
                    <TableCell>
                      <p className="font-medium text-sm leading-snug max-w-xs truncate">{grant.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{grant.provider_name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        {grant.source === 'gov' ? 'Grants.gov' : 'Candid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {grant.amount_min != null || grant.amount_max != null
                        ? formatAmountRange(grant.amount_min ?? 0, grant.amount_max ?? 0)
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {grant.deadline
                        ? new Date(grant.deadline).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={grant.review_status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={grant.review_status === 'approved' || busy}
                          onClick={() => updateStatus(grant.id, 'approved')}
                          className="h-7 px-2.5 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50 disabled:opacity-40"
                        >
                          <Check className="size-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={grant.review_status === 'rejected' || busy}
                          onClick={() => updateStatus(grant.id, 'rejected')}
                          className="h-7 px-2.5 text-xs gap-1 text-red-700 border-red-300 hover:bg-red-50 disabled:opacity-40"
                        >
                          <X className="size-3" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {counts.all} grant{counts.all !== 1 ? 's' : ''}
        </p>
      )}
    </main>
  )
}
