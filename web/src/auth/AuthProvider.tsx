import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppSupabaseClient } from '../lib/supabase'
import { AuthContext, type Assurance, type AuthState } from './context'

export function AuthProvider({
  supabase,
  children,
}: {
  supabase: AppSupabaseClient
  children: ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [assurance, setAssurance] = useState<Assurance | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAssurance = useCallback(
    async (next: Session | null): Promise<Assurance | null> => {
      if (!next) return null
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (error) return { current: null, next: null }
      return { current: data.currentLevel, next: data.nextLevel }
    },
    [supabase],
  )

  const apply = useCallback(
    async (next: Session | null) => {
      const level = await loadAssurance(next)
      setSession(next)
      setAssurance(level)
      setLoading(false)
    },
    [loadAssurance],
  )

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void apply(data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      // Mai await dentro la callback: supabase-js la esegue sotto lock.
      setTimeout(() => {
        if (active) void apply(next)
      }, 0)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [supabase, apply])

  const refreshAssurance = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await apply(data.session)
  }, [supabase, apply])

  const value = useMemo<AuthState>(
    () => ({ supabase, session, assurance, loading, refreshAssurance }),
    [supabase, session, assurance, loading, refreshAssurance],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
