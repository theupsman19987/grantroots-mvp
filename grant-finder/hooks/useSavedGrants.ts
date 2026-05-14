'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'ug_saved_grants'

function loadFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveToStorage(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore storage errors
  }
}

export function useSavedGrants() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSavedIds(loadFromStorage())
  }, [])

  const saveGrant = useCallback((grantId: string) => {
    setSavedIds((prev) => {
      const next = new Set([...prev, grantId])
      saveToStorage(next)
      return next
    })
  }, [])

  const unsaveGrant = useCallback((grantId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      next.delete(grantId)
      saveToStorage(next)
      return next
    })
  }, [])

  const isSaved = useCallback((grantId: string) => savedIds.has(grantId), [savedIds])

  return { savedIds, isSaved, saveGrant, unsaveGrant, loading: false }
}
