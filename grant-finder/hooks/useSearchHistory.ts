'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'

export interface SearchHistoryEntry {
  id: number
  query: string
  filters: Record<string, unknown>
  searched_at: string
}

export function useSearchHistory(isAuthenticated: boolean) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([])

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await api.get<SearchHistoryEntry[] | { error: string }>('/api/search-history')
      if (Array.isArray(data)) setHistory(data)
    } catch { /* silent */ }
  }, [isAuthenticated])

  const logSearch = useCallback(
    async (query: string, filters: Record<string, unknown> = {}) => {
      if (!isAuthenticated || !query.trim()) return
      try {
        await api.post('/api/search-history', { query, filters })
      } catch { /* silent — never block the UI */ }
    },
    [isAuthenticated]
  )

  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      await api.delete('/api/search-history')
      setHistory([])
    } catch { /* silent */ }
  }, [isAuthenticated])

  return { history, fetchHistory, logSearch, clearHistory }
}
