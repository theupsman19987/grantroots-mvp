'use client'

import { useState, useEffect } from 'react'

interface SyncStatus {
  grantCount: number | null
  lastSyncAt: string | null
  lastUpserted: number | null
  loading: boolean
}

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({
    grantCount: null,
    lastSyncAt: null,
    lastUpserted: null,
    loading: true,
  })

  useEffect(() => {
    fetch('/api/sync/status')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setStatus({
            grantCount: data.grantCount ?? null,
            lastSyncAt: data.lastSyncAt ?? null,
            lastUpserted: data.lastUpserted ?? null,
            loading: false,
          })
        } else {
          setStatus((s) => ({ ...s, loading: false }))
        }
      })
      .catch(() => setStatus((s) => ({ ...s, loading: false })))
  }, [])

  return status
}
