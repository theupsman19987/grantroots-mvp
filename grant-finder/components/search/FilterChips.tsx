'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GrantFilters } from '@/lib/types'

interface FilterChipsProps {
  filters: GrantFilters
  onRemove: <K extends keyof GrantFilters>(key: K, value?: unknown) => void
  onClearAll: () => void
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  const chips: Array<{ label: string; onRemove: () => void }> = []

  if (filters.query) {
    chips.push({
      label: `"${filters.query}"`,
      onRemove: () => onRemove('query'),
    })
  }

  filters.funderTypes.forEach((type) => {
    chips.push({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      onRemove: () => onRemove('funderTypes', type),
    })
  })

  if (filters.amountMin !== null) {
    chips.push({
      label: `Min $${filters.amountMin.toLocaleString()}`,
      onRemove: () => onRemove('amountMin'),
    })
  }

  if (filters.amountMax !== null) {
    chips.push({
      label: `Max $${filters.amountMax.toLocaleString()}`,
      onRemove: () => onRemove('amountMax'),
    })
  }

  filters.eligibleApplicants.forEach((type) => {
    chips.push({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      onRemove: () => onRemove('eligibleApplicants', type),
    })
  })

  filters.focusAreas.forEach((area) => {
    chips.push({
      label: area,
      onRemove: () => onRemove('focusAreas', area),
    })
  })

  if (filters.isOpenOnly) {
    chips.push({
      label: 'Open only',
      onRemove: () => onRemove('isOpenOnly'),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <Badge key={i} variant="secondary" className="gap-1 pr-1 py-1 text-xs">
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-0.5 rounded hover:bg-muted p-0.5"
            aria-label={`Remove filter: ${chip.label}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  )
}
