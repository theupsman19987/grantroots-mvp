'use client'

import { useMemo, useState } from 'react'
import { useGrants } from './useGrants'
import { GrantFilters, FunderType, ApplicantType } from '@/lib/types'

const defaultFilters: GrantFilters = {
  query: '',
  funderTypes: [],
  amountMin: null,
  amountMax: null,
  deadlineBefore: null,
  geographicFocus: [],
  eligibleApplicants: [],
  focusAreas: [],
  agencies: [],
  isOpenOnly: false,
  includeArchived: false,
  sortBy: 'deadline',
}

export function useGrantSearch(initialFilters?: Partial<GrantFilters>) {
  const { grants: allGrants, loading, error } = useGrants()
  const [filters, setFilters] = useState<GrantFilters>({
    ...defaultFilters,
    ...initialFilters,
  })

  const results = useMemo(() => {
    let filtered = [...allGrants]

    // Exclude closed/archived by default; include them when the toggle is on
    if (!filters.includeArchived) {
      filtered = filtered.filter((g) => g.status === 'open' || g.status === 'forecasted')
    }

    if (filters.query) {
      const q = filters.query.toLowerCase()
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.funder.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.focusAreas.some((a) => a.toLowerCase().includes(q)) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (filters.funderTypes.length > 0) {
      filtered = filtered.filter((g) => filters.funderTypes.includes(g.funderType))
    }

    if (filters.amountMin !== null) {
      // amountMax === 0 means no amount data — include rather than exclude
      filtered = filtered.filter((g) => g.amountMax === 0 || g.amountMax >= (filters.amountMin ?? 0))
    }

    if (filters.amountMax !== null) {
      // amountMin === 0 means no data (always ≤ any positive max, so already passes through)
      filtered = filtered.filter((g) => g.amountMin <= (filters.amountMax ?? Infinity))
    }

    if (filters.deadlineBefore) {
      filtered = filtered.filter((g) => g.deadline <= (filters.deadlineBefore as Date))
    }

    if (filters.geographicFocus.length > 0) {
      filtered = filtered.filter((g) =>
        g.geographicFocus.some((loc) =>
          filters.geographicFocus.some(
            (f) =>
              loc.toLowerCase().includes(f.toLowerCase()) ||
              f.toLowerCase().includes(loc.toLowerCase())
          )
        )
      )
    }

    if (filters.eligibleApplicants.length > 0) {
      filtered = filtered.filter((g) =>
        g.eligibleApplicants.some((a) => filters.eligibleApplicants.includes(a))
      )
    }

    if (filters.focusAreas.length > 0) {
      filtered = filtered.filter((g) =>
        g.focusAreas.some((fa) =>
          filters.focusAreas.some((f) => fa.toLowerCase().includes(f.toLowerCase()))
        )
      )
    }

    if (filters.agencies.length > 0) {
      filtered = filtered.filter((g) => filters.agencies.includes(g.funder))
    }

    if (filters.isOpenOnly) {
      filtered = filtered.filter((g) => g.status === 'open')
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'deadline':
          return a.deadline.getTime() - b.deadline.getTime()
        case 'amount':
          return b.amountMax - a.amountMax
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'relevance':
        default:
          return 0
      }
    })

    return filtered
  }, [filters, allGrants])

  const updateFilter = <K extends keyof GrantFilters>(key: K, value: GrantFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => setFilters(defaultFilters)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.query) count++
    if (filters.funderTypes.length > 0) count++
    if (filters.amountMin !== null) count++
    if (filters.amountMax !== null) count++
    if (filters.deadlineBefore) count++
    if (filters.geographicFocus.length > 0) count++
    if (filters.eligibleApplicants.length > 0) count++
    if (filters.focusAreas.length > 0) count++
    if (filters.agencies.length > 0) count++
    if (filters.isOpenOnly) count++
    if (filters.includeArchived) count++
    return count
  }, [filters])

  const toggleFunderType = (type: FunderType) => {
    setFilters((prev) => ({
      ...prev,
      funderTypes: prev.funderTypes.includes(type)
        ? prev.funderTypes.filter((t) => t !== type)
        : [...prev.funderTypes, type],
    }))
  }

  const toggleApplicant = (type: ApplicantType) => {
    setFilters((prev) => ({
      ...prev,
      eligibleApplicants: prev.eligibleApplicants.includes(type)
        ? prev.eligibleApplicants.filter((t) => t !== type)
        : [...prev.eligibleApplicants, type],
    }))
  }

  const toggleFocusArea = (area: string) => {
    setFilters((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }))
  }

  const toggleAgency = (agency: string) => {
    setFilters((prev) => ({
      ...prev,
      agencies: prev.agencies.includes(agency)
        ? prev.agencies.filter((a) => a !== agency)
        : [...prev.agencies, agency],
    }))
  }

  return {
    filters,
    results,
    loading,
    error,
    updateFilter,
    resetFilters,
    activeFilterCount,
    toggleFunderType,
    toggleApplicant,
    toggleFocusArea,
    toggleAgency,
  }
}
