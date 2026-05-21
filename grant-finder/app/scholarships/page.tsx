'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { GraduationCap, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard'
import { ScholarshipFilterSidebar } from '@/components/scholarships/ScholarshipFilterSidebar'
import { MembersOnlyDialog } from '@/components/members-only-dialog'
import { useScholarshipSearch } from '@/hooks/useScholarshipSearch'
import { useSavedGrants } from '@/hooks/useSavedGrants'
import { useAuth } from '@/hooks/useAuth'
import type { ScholarshipFilters } from '@/lib/types'

const PAGE_SIZE = 12

export default function ScholarshipsPage() {
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [membersOnlyOpen, setMembersOnlyOpen] = useState(false)

  const {
    filters,
    results,
    loading,
    updateFilter,
    resetFilters,
    activeFilterCount,
    toggleSchoolType,
    toggleEthnicity,
  } = useScholarshipSearch()

  const { user, userState, schoolType: userSchoolType, gpa: userGpa, loading: authLoading } = useAuth()
  const { isSaved, saveGrant, unsaveGrant } = useSavedGrants()

  // Auto-apply user profile filters once on load
  const hasAutoApplied = useRef(false)
  useEffect(() => {
    if (authLoading || hasAutoApplied.current) return
    hasAutoApplied.current = true
    if (userState) updateFilter('states', [userState])
    if (userSchoolType) updateFilter('schoolTypes', [userSchoolType])
    if (userGpa) {
      const gpaNum = parseFloat(userGpa)
      if (!isNaN(gpaNum)) updateFilter('gpaMin', gpaNum)
    }
  }, [authLoading, userState, userSchoolType, userGpa])

  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [filters])

  const handleSave = (id: string) => {
    if (!user) { setMembersOnlyOpen(true); return }
    saveGrant(id)
    toast.success('Scholarship saved!', { description: 'Added to your saved grants.' })
  }

  const handleUnsave = (id: string) => {
    if (!user) { setMembersOnlyOpen(true); return }
    unsaveGrant(id)
    toast('Scholarship removed from saved.')
  }

  const guestClick = !user && !authLoading ? () => setMembersOnlyOpen(true) : undefined

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="size-5 text-[#6B0F1A]" />
            <h1 className="text-2xl font-bold text-[#6B0F1A]">Scholarships</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Find college and trade school scholarships matched to your profile — filtered by GPA, state, ethnicity, and school type.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-20 relative">
              <ScholarshipFilterSidebar
                filters={filters}
                onUpdate={updateFilter}
                onToggleSchoolType={toggleSchoolType}
                onToggleEthnicity={toggleEthnicity}
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
                <ScholarshipFilterSidebar
                  filters={filters}
                  onUpdate={updateFilter}
                  onToggleSchoolType={toggleSchoolType}
                  onToggleEthnicity={toggleEthnicity}
                  onReset={resetFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Keyword search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => { updateFilter('query', e.target.value); setPage(1) }}
                onFocus={() => { if (!user && !authLoading) setMembersOnlyOpen(true) }}
                placeholder="Search by name, sponsor, or field…"
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

            {/* Results bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${results.length} scholarship${results.length !== 1 ? 's' : ''} found`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden h-8 gap-1.5 text-xs"
                  onClick={() => {
                    if (!user && !authLoading) { setMembersOnlyOpen(true); return }
                    setMobileFiltersOpen(true)
                  }}
                >
                  <SlidersHorizontal className="size-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-[#6B0F1A] text-white text-[10px] size-4 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as ScholarshipFilters['sortBy'])}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#6B0F1A]/30"
                >
                  <option value="deadline">Deadline (soonest)</option>
                  <option value="amount">Amount (highest)</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="py-24 text-center border rounded-lg">
                <p className="text-4xl mb-3">🎓</p>
                <p className="font-semibold">No scholarships found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search query.
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pageResults.map((scholarship) => (
                  <ScholarshipCard
                    key={scholarship.id}
                    scholarship={scholarship}
                    isSaved={isSaved(scholarship.id)}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                    onGuestClick={guestClick}
                  />
                ))}
              </div>
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
              Scholarship details change frequently. Always verify deadlines and eligibility at the official sponsor website before applying.
            </p>
          </div>
        </div>
      </div>

      <MembersOnlyDialog open={membersOnlyOpen} onOpenChange={setMembersOnlyOpen} />
    </div>
  )
}
