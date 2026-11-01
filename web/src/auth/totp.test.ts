import { describe, expect, it } from 'vitest'
import { isCompleteCode, mfaErrorMessage, normalizeCode } from './totp'

describe('codice TOTP', () => {
  it('tiene solo le cifre e al massimo 6', () => {
    expect(normalizeCode(' 123 456 7')).toBe('123456')
  })

  it('riconosce un codice completo', () => {
    expect(isCompleteCode('123456')).toBe(true)
    expect(isCompleteCode('12345')).toBe(false)
  })

  it('traduce gli errori di verifica', () => {
    expect(mfaErrorMessage('mfa_verification_failed')).toMatch(/non valido/)
    expect(mfaErrorMessage(undefined)).toMatch(/non riuscita/)
  })
})
