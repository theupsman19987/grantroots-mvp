'use client'

import { useState, useEffect, useMemo } from 'react'
import { useGrants } from './useGrants'
import { ApplicantType } from '@/lib/types'

const KNOWN_APPLICANTS: { value: ApplicantType; label: string }[] = [
  { value: 'nonprofit',   label: 'Nonprofits (501c3)' },
  { value: 'individual',  label: 'Individuals' },
  { value: 'for-profit',  label: 'For-Profit' },
  { value: 'government',  label: 'Government' },
  { value: 'education',   label: 'Educational Institutions' },
  { value: 'faith-based', label: 'Faith-Based Orgs' },
  { value: 'tribal',      label: 'Tribal Nations' },
]

const MAX_AGENCIES = 20

export interface FocusAreaCount  { name: string; count: number }
export interface ApplicantCount  { value: ApplicantType; label: string; count: number }
export interface AgencyCount     { name: string; count: number }

export interface FilterCounts {
  focusAreas: FocusAreaCount[]
  applicants: ApplicantCount[]
  agencies: AgencyCount[]
  loading: boolean
}

export function useFilterCounts(): FilterCounts {
  const { grants, loading: grantsLoading } = useGrants()
  const [focusAreas, setFocusAreas] = useState<FocusAreaCount[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/grants/categories')
      .then((r) => r.json())
      .then((data: { category: string; count: number }[]) => {
        if (!cancelled) setFocusAreas(data.map(({ category, count }) => ({ name: category, count })))
      })
      .catch(() => { if (!cancelled) setFocusAreas([]) })
      .finally(() => { if (!cancelled) setCategoriesLoading(false) })
    return () => { cancelled = true }
  }, [])

  const { applicants, agencies } = useMemo(() => {
    if (grantsLoading) {
      return {
        applicants: KNOWN_APPLICANTS.map((a) => ({ ...a, count: -1 })),
        agencies: [],
      }
    }

    const activeGrants = grants.filter((g) => g.status === 'open' || g.status === 'forecasted')

    const applicants: ApplicantCount[] = KNOWN_APPLICANTS.map(({ value, label }) => ({
      value,
      label,
      count: activeGrants.filter((g) => g.eligibleApplicants.includes(value)).length,
    })).sort((a, b) => {
      if (a.count > 0 && b.count === 0) return -1
      if (a.count === 0 && b.count > 0) return  1
      return b.count - a.count
    })

    const agencyMap = new Map<string, number>()
    for (const grant of activeGrants) {
      const name = grant.funder.trim()
      if (name && name !== 'Federal agency') {
        agencyMap.set(name, (agencyMap.get(name) ?? 0) + 1)
      }
    }

    const agencies: AgencyCount[] = [...agencyMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_AGENCIES)

    return { applicants, agencies }
  }, [grants, grantsLoading])

  return {
    focusAreas,
    applicants,
    agencies,
    loading: grantsLoading || categoriesLoading,
  }
}
