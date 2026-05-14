'use client'

import { useMemo } from 'react'
import { useGrants } from './useGrants'
import type { Grant } from '@/lib/types'

export function useRecommendedGrants(focusAreas: string[], limit = 6): Grant[] {
  const { grants, loading } = useGrants()

  return useMemo(() => {
    if (loading) return []
    const open = grants.filter((g) => g.isOpen)

    if (!focusAreas.length) {
      return open
        .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
        .slice(0, limit)
    }

    const scored = open.map((g) => ({
      grant: g,
      score: g.focusAreas.filter((a) => focusAreas.includes(a)).length,
    }))

    const matched = scored
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.grant.deadline.getTime() - b.grant.deadline.getTime())
      .map((x) => x.grant)

    if (matched.length >= limit) return matched.slice(0, limit)

    const matchedIds = new Set(matched.map((g) => g.id))
    const fallback = open
      .filter((g) => !matchedIds.has(g.id))
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, limit - matched.length)

    return [...matched, ...fallback]
  }, [grants, loading, focusAreas, limit])
}
