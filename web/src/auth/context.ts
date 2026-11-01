import type { Session } from '@supabase/supabase-js'
import { createContext, use } from 'react'
import type { AppSupabaseClient } from '../lib/supabase'

/** Livello di garanzia della sessione (aal1 = solo password, aal2 = password + TOTP). */
export interface Assurance {
  current: string | null
  /** 'aal2' se l'utente ha almeno un fattore TOTP verificato. */
  next: string | null
}

export interface AuthState {
  supabase: AppSupabaseClient
  session: Session | null
  assurance: Assurance | null
  loading: boolean
  /** Ricalcola il livello di garanzia (dopo attivazione o verifica del TOTP). */
  refreshAssurance: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return value
}
