import type { Session } from '@supabase/supabase-js'
import type { Assurance } from './context'

export type AuthStep = 'login' | 'mfa-enroll' | 'mfa-verify' | 'ready'

/**
 * Cosa manca per entrare nell'area riservata. L'accesso ai dati richiede
 * sempre aal2 (password + TOTP), anche lato database (RLS, ADR-0005).
 */
export function nextAuthStep(session: Session | null, assurance: Assurance | null): AuthStep {
  if (!session) return 'login'
  if (assurance?.current === 'aal2') return 'ready'
  if (assurance?.next === 'aal2') return 'mfa-verify'
  return 'mfa-enroll'
}

export const STEP_PATHS: Record<Exclude<AuthStep, 'ready'>, string> = {
  login: '/login',
  'mfa-enroll': '/mfa/attiva',
  'mfa-verify': '/mfa/verifica',
}
