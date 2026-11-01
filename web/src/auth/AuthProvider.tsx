import type { Session } from '@supabase/supabase-js'
import type { AppSupabaseClient } from '../lib/supabase'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({
  supabase,
  children,
}: {
  supabase: AppSupabaseClient
  children: ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  const value = useMemo<AuthState>(
    () => ({ supabase, session, loading }),
    [supabase, session, loading],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
