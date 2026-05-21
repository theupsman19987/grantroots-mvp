'use client'

import { useState, useEffect } from 'react'
import { Scholarship } from '@/lib/types'

function mapRow(row: Record<string, unknown>): Scholarship {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    sponsor: String(row.sponsor ?? ''),
    amountMin: Number(row.amountMin ?? 0),
    amountMax: Number(row.amountMax ?? 0),
    amountNote: row.amountNote ? String(row.amountNote) : null,
    deadline: row.deadline ? new Date(String(row.deadline)) : null,
    description: String(row.description ?? ''),
    gpaMin: row.gpaMin != null ? Number(row.gpaMin) : null,
    eligibleStates: Array.isArray(row.eligibleStates) ? (row.eligibleStates as string[]) : [],
    eligibleEthnicities: Array.isArray(row.eligibleEthnicities) ? (row.eligibleEthnicities as Scholarship['eligibleEthnicities']) : [],
    schoolTypes: Array.isArray(row.schoolTypes) ? (row.schoolTypes as ('college' | 'trade')[]) : [],
    focusAreas: Array.isArray(row.focusAreas) ? (row.focusAreas as string[]) : [],
    applyUrl: String(row.applyUrl ?? ''),
    isOpen: Boolean(row.isOpen),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
  }
}

let _cache: Scholarship[] | null = null
let _inFlight: Promise<Scholarship[]> | null = null

function loadScholarships(): Promise<Scholarship[]> {
  if (_cache) return Promise.resolve(_cache)
  if (!_inFlight) {
    _inFlight = fetch('/api/scholarships')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((rows: unknown) => {
        _cache = Array.isArray(rows) ? rows.map(mapRow) : []
        _inFlight = null
        return _cache
      })
      .catch((err) => {
        _inFlight = null
        throw err
      })
  }
  return _inFlight
}

export function useScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>(_cache ?? [])
  const [loading, setLoading] = useState(_cache === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (_cache !== null) return
    loadScholarships()
      .then((s) => {
        setScholarships(s)
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return { scholarships, loading, error }
}
