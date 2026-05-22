'use client'

import { useState, useEffect, useCallback } from 'react'
import { GrantStatus } from '@/lib/types'

const STORAGE_KEY = 'ug_saved_grants_v2'

export interface SavedRecord {
  id: string
  status: GrantStatus
  savedAt: string      // ISO string
  appliedAt: string | null
  resolvedAt: string | null  // date when marked awarded or rejected
  notes: string
}

type StorageMap = Record<string, SavedRecord>

function loadFromStorage(): StorageMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StorageMap) : {}
  } catch {
    return {}
  }
}

function saveToStorage(map: StorageMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function useSavedGrants() {
  const [records, setRecords] = useState<StorageMap>({})

  useEffect(() => {
    setRecords(loadFromStorage())
  }, [])

  const savedIds = new Set(Object.keys(records))

  const isSaved = useCallback((id: string) => id in records, [records])

  const getRecord = useCallback((id: string): SavedRecord | null => records[id] ?? null, [records])

  const saveGrant = useCallback((id: string) => {
    setRecords((prev) => {
      if (id in prev) return prev
      const next: StorageMap = {
        ...prev,
        [id]: {
          id,
          status: 'saved',
          savedAt: new Date().toISOString(),
          appliedAt: null,
          resolvedAt: null,
          notes: '',
        },
      }
      saveToStorage(next)
      return next
    })
  }, [])

  const unsaveGrant = useCallback((id: string) => {
    setRecords((prev) => {
      const next = { ...prev }
      delete next[id]
      saveToStorage(next)
      return next
    })
  }, [])

  const updateStatus = useCallback((id: string, status: GrantStatus) => {
    setRecords((prev) => {
      const existing = prev[id]
      if (!existing) return prev
      const now = new Date().toISOString()
      const next: StorageMap = {
        ...prev,
        [id]: {
          ...existing,
          status,
          appliedAt:
            status === 'applied' && !existing.appliedAt ? now : existing.appliedAt,
          resolvedAt:
            (status === 'awarded' || status === 'rejected') && !existing.resolvedAt
              ? now
              : existing.resolvedAt,
        },
      }
      saveToStorage(next)
      return next
    })
  }, [])

  const updateNotes = useCallback((id: string, notes: string) => {
    setRecords((prev) => {
      if (!prev[id]) return prev
      const next: StorageMap = { ...prev, [id]: { ...prev[id], notes } }
      saveToStorage(next)
      return next
    })
  }, [])

  return { savedIds, records, isSaved, getRecord, saveGrant, unsaveGrant, updateStatus, updateNotes, loading: false }
}
