'use client'

import { useMemo, useState } from 'react'
import { useScholarships } from './useScholarships'
import { ScholarshipFilters, ScholarshipEthnicity } from '@/lib/types'

const defaultFilters: ScholarshipFilters = {
  query: '',
  gpaMin: null,
  states: [],
  ethnicities: [],
  schoolTypes: [],
  focusAreas: [],
  amountMin: null,
  isOpenOnly: false,
  sortBy: 'deadline',
}

export function useScholarshipSearch(initialFilters?: Partial<ScholarshipFilters>) {
  const { scholarships: all, loading, error } = useScholarships()
  const [filters, setFilters] = useState<ScholarshipFilters>({
    ...defaultFilters,
    ...initialFilters,
  })

  const results = useMemo(() => {
    let filtered = [...all]

    if (filters.isOpenOnly) {
      filtered = filtered.filter((s) => s.isOpen)
    }

    if (filters.query) {
      const q = filters.query.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.sponsor.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.focusAreas.some((a) => a.toLowerCase().includes(q)) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (filters.gpaMin !== null) {
      filtered = filtered.filter(
        (s) => s.gpaMin === null || s.gpaMin <= (filters.gpaMin as number)
      )
    }

    if (filters.states.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.eligibleStates.length === 0 ||
          s.eligibleStates.some((st) => filters.states.includes(st))
      )
    }

    if (filters.ethnicities.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.eligibleEthnicities.length === 0 ||
          s.eligibleEthnicities.some((e) => filters.ethnicities.includes(e))
      )
    }

    if (filters.schoolTypes.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.schoolTypes.length === 0 ||
          s.schoolTypes.some((t) => filters.schoolTypes.includes(t))
      )
    }

    if (filters.focusAreas.length > 0) {
      filtered = filtered.filter((s) =>
        s.focusAreas.some((fa) =>
          filters.focusAreas.some((f) => fa.toLowerCase().includes(f.toLowerCase()))
        )
      )
    }

    if (filters.amountMin !== null) {
      filtered = filtered.filter(
        (s) => s.amountMax === 0 || s.amountMax >= (filters.amountMin as number)
      )
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'deadline': {
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return a.deadline.getTime() - b.deadline.getTime()
        }
        case 'amount':
          return b.amountMax - a.amountMax
        case 'relevance':
        default:
          return 0
      }
    })

    return filtered
  }, [filters, all])

  const updateFilter = <K extends keyof ScholarshipFilters>(key: K, value: ScholarshipFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => setFilters(defaultFilters)

  const toggleSchoolType = (type: 'college' | 'trade') => {
    setFilters((prev) => ({
      ...prev,
      schoolTypes: prev.schoolTypes.includes(type)
        ? prev.schoolTypes.filter((t) => t !== type)
        : [...prev.schoolTypes, type],
    }))
  }

  const toggleEthnicity = (e: ScholarshipEthnicity) => {
    setFilters((prev) => ({
      ...prev,
      ethnicities: prev.ethnicities.includes(e)
        ? prev.ethnicities.filter((x) => x !== e)
        : [...prev.ethnicities, e],
    }))
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.query) count++
    if (filters.gpaMin !== null) count++
    if (filters.states.length > 0) count++
    if (filters.ethnicities.length > 0) count++
    if (filters.schoolTypes.length > 0) count++
    if (filters.focusAreas.length > 0) count++
    if (filters.amountMin !== null) count++
    if (filters.isOpenOnly) count++
    return count
  }, [filters])

  return {
    filters,
    results,
    loading,
    error,
    updateFilter,
    resetFilters,
    activeFilterCount,
    toggleSchoolType,
    toggleEthnicity,
  }
}
