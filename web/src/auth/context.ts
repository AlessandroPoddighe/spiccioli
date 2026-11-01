import type { Session } from '@supabase/supabase-js'
import type { AppSupabaseClient } from '../lib/supabase'
import { createContext, use } from 'react'

export interface AuthState {
  supabase: AppSupabaseClient
  session: Session | null
  loading: boolean
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return value
}
