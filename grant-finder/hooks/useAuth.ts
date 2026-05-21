'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  userState: string | null
  accountType: 'student' | 'organization' | null
  schoolType: 'college' | 'trade' | null
  gpa: string | null
  fieldOfStudy: string | null
  loading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      setLoading(false)
      return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  const meta = user?.user_metadata ?? {}
  const userState = (meta.state as string) ?? null
  const accountType = (meta.account_type as 'student' | 'organization') ?? null
  const schoolType = (meta.school_type as 'college' | 'trade') ?? null
  const gpa = (meta.gpa as string) ?? null
  const fieldOfStudy = (meta.field_of_study as string) ?? null

  return { user, userState, accountType, schoolType, gpa, fieldOfStudy, loading, signOut }
}
