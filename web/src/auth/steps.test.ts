import type { Session } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { nextAuthStep } from './steps'

const session = { access_token: 'x' } as unknown as Session

describe('nextAuthStep', () => {
  it('senza sessione chiede il login', () => {
    expect(nextAuthStep(null, null)).toBe('login')
  })

  it('password ok ma nessun fattore → attivazione TOTP', () => {
    expect(nextAuthStep(session, { current: 'aal1', next: 'aal1' })).toBe('mfa-enroll')
  })

  it('password ok e fattore presente → verifica del codice', () => {
    expect(nextAuthStep(session, { current: 'aal1', next: 'aal2' })).toBe('mfa-verify')
  })

  it('password + TOTP → area riservata', () => {
    expect(nextAuthStep(session, { current: 'aal2', next: 'aal2' })).toBe('ready')
  })

  it('livello sconosciuto → mai accesso ai dati', () => {
    expect(nextAuthStep(session, { current: null, next: null })).toBe('mfa-enroll')
  })
})
