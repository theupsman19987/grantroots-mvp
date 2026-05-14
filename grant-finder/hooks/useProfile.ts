'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
interface UserProfile {
  id: string
  email: string
  organizationName?: string | null
}

export function useProfile(initial: UserProfile | null) {
  const [profile, setProfile] = useState<UserProfile | null>(initial)
  const [saving, setSaving] = useState(false)

  const saveProfile = useCallback(async (data: Partial<UserProfile>) => {
    setSaving(true)
    try {
      setProfile((prev) => (prev ? { ...prev, ...data } : prev))
      toast.success('Profile saved!')
    } catch {
      toast.error('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }, [])

  return { profile, setProfile, saving, saveProfile }
}
