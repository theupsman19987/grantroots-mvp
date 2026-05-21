'use client'

import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GrantFilters } from '@/lib/types'
import { FilterChips } from './FilterChips'
import { FunderType, ApplicantType } from '@/lib/types'

interface ResultsHeaderProps {
  count: number
  filters: GrantFilters
  view: 'card' | 'table'
  onViewChange: (v: 'card' | 'table') => void
  onFilterUpdate: <K extends keyof GrantFilters>(key: K, value: GrantFilters[K]) => void
  onFilterRemove: <K extends keyof GrantFilters>(key: K, value?: unknown) => void
  onClearAll: () => void
  activeFilterCount: number
  onOpenMobileFilters?: () => void
  onGuestClick?: () => void
}

export function ResultsHeader({
  count,
  filters,
  view,
  onViewChange,
  onFilterUpdate,
  onFilterRemove,
  onClearAll,
  activeFilterCount,
  onOpenMobileFilters,
  onGuestClick,
}: ResultsHeaderProps) {
  const gate = (action: () => void) => {
    if (onGuestClick) { onGuestClick(); return }
    action()
  }
  const handleRemove = <K extends keyof GrantFilters>(key: K, value?: unknown) => {
    if (key === 'funderTypes') {
      onFilterUpdate('funderTypes', filters.funderTypes.filter((t) => t !== value) as FunderType[])
    } else if (key === 'eligibleApplicants') {
      onFilterUpdate('eligibleApplicants', filters.eligibleApplicants.filter((t) => t !== value) as ApplicantType[])
    } else if (key === 'focusAreas') {
      onFilterUpdate('focusAreas', filters.focusAreas.filter((a) => a !== value))
    } else if (key === 'query') {
      onFilterUpdate('query', '')
    } else if (key === 'amountMin') {
      onFilterUpdate('amountMin', null)
    } else if (key === 'amountMax') {
      onFilterUpdate('amountMax', null)
    } else if (key === 'isOpenOnly') {
      onFilterUpdate('isOpenOnly', false)
    }
    onFilterRemove(key, value)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{count.toLocaleString()} grants found</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onOpenMobileFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => gate(onOpenMobileFilters!)}
              className="md:hidden gap-1.5"
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
          <Select
            value={filters.sortBy}
            onValueChange={(v) => gate(() => onFilterUpdate('sortBy', v as GrantFilters['sortBy']))}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup
            value={[view]}
            onValueChange={(v) => gate(() => v.length > 0 && onViewChange(v[0] as 'card' | 'table'))}
            className="border rounded-md"
          >
            <ToggleGroupItem value="card" aria-label="Card view" className="h-8 w-8 p-0">
              <LayoutGrid className="size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view" className="h-8 w-8 p-0">
              <List className="size-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <FilterChips filters={filters} onRemove={handleRemove} onClearAll={onClearAll} />
    </div>
  )
}
