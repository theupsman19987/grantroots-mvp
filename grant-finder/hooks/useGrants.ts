'use client'

import { useState, useEffect } from 'react'
import { Grant, FunderType, ApplicantType, GrantSyncStatus } from '@/lib/types'

function parseFunderType(source: unknown): FunderType {
  if (source === 'gov') return 'government'
  if (source === 'candid') return 'foundation'
  return 'foundation'
}

function parseEligibility(eligibility: unknown): ApplicantType[] {
  if (!eligibility) return []
  const s = String(eligibility).toLowerCase()
  const types: ApplicantType[] = []
  if (s.includes('non-profit') || s.includes('nonprofit') || s.includes('501')) types.push('nonprofit')
  if (s.includes('individual') || s.includes('small business owner')) types.push('individual')
  if (s.includes('for-profit') || s.includes('profit organization') || s.includes('business') || s.includes('commercial')) types.push('for-profit')
  if (s.includes('state government') || s.includes('local government') || s.includes('county') || s.includes('city') || s.includes('municipality') || s.includes('public agency')) types.push('government')
  if (s.includes('institution of higher education') || s.includes('university') || s.includes('college') || s.includes('school district') || s.includes('educational')) types.push('education')
  if (s.includes('faith') || s.includes('religious') || s.includes('church')) types.push('faith-based')
  if (s.includes('tribal') || s.includes('native american') || s.includes('indian tribe') || s.includes('alaska native')) types.push('tribal')
  return [...new Set(types)]
}

function mapRow(row: Record<string, unknown>): Grant {
  // Use structured applicant_types column when populated, fall back to parsing eligibility text
  const storedTypes = Array.isArray(row.applicant_types) ? (row.applicant_types as string[]) : []
  const eligibleApplicants: ApplicantType[] = storedTypes.length > 0
    ? (storedTypes as ApplicantType[])
    : parseEligibility(row.eligibility)

  const categories = Array.isArray(row.categories) ? (row.categories as string[]) : []

  return {
    id:                String(row.id ?? ''),
    title:             String(row.title ?? ''),
    funder:            String(row.provider_name ?? ''),
    funderType:        parseFunderType(row.source),
    amountMin:         Number(row.amount_min ?? 0),
    amountMax:         Number(row.amount_max ?? 0),
    deadline:          row.deadline ? new Date(String(row.deadline)) : new Date(Date.now() + 90 * 86400000),
    eligibleApplicants,
    focusAreas:        categories,
    geographicFocus:   [],
    description:       String(row.description ?? ''),
    requirements:      [],
    applicationUrl:    String(row.apply_url ?? ''),
    isOpen:            row.status === 'open',
    status:            (String(row.status ?? 'open') as GrantSyncStatus),
    tags:              categories,
    createdAt:         row.created_at ? new Date(String(row.created_at)) : new Date(),
    // Enriched fields
    opportunityNumber: row.opportunity_number ? String(row.opportunity_number) : null,
    eligibilityText:   row.eligibility ? String(row.eligibility) : null,
    contactName:       row.contact_name ? String(row.contact_name) : null,
    contactPhone:      row.contact_phone ? String(row.contact_phone) : null,
    contactEmail:      row.contact_email ? String(row.contact_email) : null,
    expectedAwards:    row.expected_awards != null ? Number(row.expected_awards) : null,
    costSharing:       row.cost_sharing != null ? Boolean(row.cost_sharing) : null,
    openDate:          row.open_date ? new Date(String(row.open_date)) : null,
    amountNote:        row.amount_note ? String(row.amount_note) : null,
  }
}

// Module-level cache — one fetch shared across all components
let _cache: Grant[] | null = null
let _inFlight: Promise<Grant[]> | null = null

function loadGrants(): Promise<Grant[]> {
  if (_cache) return Promise.resolve(_cache)
  if (!_inFlight) {
    _inFlight = fetch('/api/grants')
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

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>(_cache ?? [])
  const [loading, setLoading] = useState(_cache === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (_cache !== null) return
    loadGrants()
      .then((g) => {
        setGrants(g)
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return { grants, loading, error }
}
