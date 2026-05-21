'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Database, RefreshCw, ShieldCheck, Search, X } from 'lucide-react'
import { GrantCard } from '@/components/grants/GrantCard'
import { GrantTable } from '@/components/grants/GrantTable'
import { FilterSidebar } from '@/components/search/FilterSidebar'
import { ResultsHeader } from '@/components/search/ResultsHeader'
import { MembersOnlyDialog } from '@/components/members-only-dialog'
import { useGrantSearch } from '@/hooks/useGrantSearch'
import { useGrants } from '@/hooks/useGrants'
import { useSavedGrants } from '@/hooks/useSavedGrants'
import { useAuth } from '@/hooks/useAuth'
import { GrantFilters, FunderType, ApplicantType } from '@/lib/types'

const PAGE_SIZE = 12

function SearchResults() {
  const searchParams = useSearchParams()
  const [view, setView] = useState<'card' | 'table'>('card')
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [membersOnlyOpen, setMembersOnlyOpen] = useState(false)

  const initialFilters: Partial<GrantFilters> = {
    query: searchParams.get('q') ?? '',
    isOpenOnly: searchParams.get('isOpen') === 'true',
    focusAreas: searchParams.get('area') ? [searchParams.get('area')!] : [],
    funderTypes: searchParams.get('funderType') ? [searchParams.get('funderType') as FunderType] : [],
  }

  const {
    filters,
    results,
    updateFilter,
    resetFilters,
    activeFilterCount,
    toggleFunderType,
    toggleApplicant,
    toggleFocusArea,
    toggleAgency,
  } = useGrantSearch(initialFilters)

  const { user, userState, loading: authLoading } = useAuth()
  const { grants: allGrants } = useGrants()
  const { isSaved, saveGrant, unsaveGrant } = useSavedGrants()

  // Auto-apply user's home state as a geographic filter on first load
  const hasAutoApplied = useRef(false)
  useEffect(() => {
    if (!authLoading && userState && !hasAutoApplied.current && filters.geographicFocus.length === 0) {
      updateFilter('geographicFocus', [userState])
      hasAutoApplied.current = true
    }
  }, [authLoading, userState])

  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [filters])

  const handleSave = (id: string) => {
    if (!user) { setMembersOnlyOpen(true); return }
    saveGrant(id)
    toast.success('Grant saved!', {
      description: 'Added to your saved grants.',
      action: { label: 'View Saved', onClick: () => {} },
    })
  }

  const handleUnsave = (id: string) => {
    if (!user) { setMembersOnlyOpen(true); return }
    unsaveGrant(id)
    toast('Grant removed from saved.')
  }

  const handleFilterRemove = <K extends keyof GrantFilters>(_key: K, _value?: unknown) => {
    // handled inside ResultsHeader via updateFilter
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-20 relative">
              <FilterSidebar
                filters={filters}
                onUpdate={updateFilter}
                onToggleFunderType={toggleFunderType}
                onToggleApplicant={toggleApplicant}
                onToggleFocusArea={toggleFocusArea}
                onToggleAgency={toggleAgency}
                onReset={resetFilters}
                activeFilterCount={activeFilterCount}
              />
              {!user && !authLoading && (
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={() => setMembersOnlyOpen(true)}
                  aria-hidden="true"
                />
              )}
            </div>
          </aside>

          {/* Mobile filters sheet */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left" className="w-72 overflow-y-auto">
              <div className="pt-4">
                <FilterSidebar
                  filters={filters}
                  onUpdate={updateFilter}
                  onToggleFunderType={toggleFunderType}
                  onToggleApplicant={toggleApplicant}
                  onToggleFocusArea={toggleFocusArea}
                  onToggleAgency={toggleAgency}
                  onReset={resetFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Results */}
          <div className="flex-1 min-w-0 space-y-4">
            <p className="text-sm text-[#4a2e09] font-medium">
              We make federal grants easier to find and understand — especially for underserved communities.
            </p>

            {/* Keyword search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => { updateFilter('query', e.target.value); setPage(1) }}
                onFocus={() => { if (!user && !authLoading) setMembersOnlyOpen(true) }}
                placeholder="Search by keyword, agency, or topic…"
                readOnly={!user && !authLoading}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6B0F1A]/30 focus:border-[#6B0F1A] placeholder:text-muted-foreground"
              />
              {filters.query && (
                <button
                  onClick={() => { updateFilter('query', ''); setPage(1) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Database className="size-3.5 text-primary" />
                {allGrants.length > 0 ? `${allGrants.length}+ Federal Grants` : 'Federal Grants'}
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCw className="size-3" />
                Updated from Grants.gov
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3" />
                Live grant database
              </span>
            </div>

            <div className="relative">
              <ResultsHeader
                count={results.length}
                filters={filters}
                view={view}
                onViewChange={setView}
                onFilterUpdate={updateFilter}
                onFilterRemove={handleFilterRemove}
                onClearAll={resetFilters}
                activeFilterCount={activeFilterCount}
                onOpenMobileFilters={() => {
                  if (!user && !authLoading) { setMembersOnlyOpen(true); return }
                  setMobileFiltersOpen(true)
                }}
              />
              {!user && !authLoading && (
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={() => setMembersOnlyOpen(true)}
                  aria-hidden="true"
                />
              )}
            </div>

            {results.length === 0 ? (
              <div className="py-24 text-center border rounded-lg">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold">No grants found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search query.
                </p>
              </div>
            ) : view === 'card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pageResults.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    grant={grant}
                    isSaved={isSaved(grant.id)}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                    onGuestClick={!user && !authLoading ? () => setMembersOnlyOpen(true) : undefined}
                  />
                ))}
              </div>
            ) : (
              <GrantTable
                grants={pageResults}
                isSaved={isSaved}
                onSave={handleSave}
                onUnsave={handleUnsave}
                onGuestClick={!user && !authLoading ? () => setMembersOnlyOpen(true) : undefined}
              />
            )}

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => { e.preventDefault(); setPage(p) }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }}
                      aria-disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2">
              Grant data sourced from <span className="font-medium">Grants.gov</span>, the official U.S. federal grants database. Always verify details at the official source before applying.
            </p>
          </div>
        </div>
      </div>

      <MembersOnlyDialog open={membersOnlyOpen} onOpenChange={setMembersOnlyOpen} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults />
    </Suspense>
  )
}

function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 flex gap-6">
      <div className="hidden md:block w-64 shrink-0 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
