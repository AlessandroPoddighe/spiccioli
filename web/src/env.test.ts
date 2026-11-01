import { describe, expect, it } from 'vitest'
import { parseConfig } from './env'

const valid = {
  VITE_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
}

describe('parseConfig', () => {
  it('accetta una configurazione valida con valori di default', () => {
    const result = parseConfig(valid)
    expect(result).toEqual({
      ok: true,
      config: {
        supabaseUrl: valid.VITE_SUPABASE_URL,
        supabasePublishableKey: 'sb_publishable_test',
        appEnv: 'local',
        buildInfo: 'sviluppo',
      },
    })
  })

  it('elenca le variabili mancanti', () => {
    expect(parseConfig({})).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    })
  })

  it('rifiuta URL non validi', () => {
    const result = parseConfig({ ...valid, VITE_SUPABASE_URL: 'non un url' })
    expect(result.ok).toBe(false)
  })

  it('rifiuta una secret key al posto della publishable key', () => {
    const result = parseConfig({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_xyz' })
    expect(result).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_PUBLISHABLE_KEY (è una secret key: vietato)'],
    })
  })

  it('riconosce gli ambienti noti e ignora quelli sconosciuti', () => {
    const dev = parseConfig({ ...valid, VITE_APP_ENV: 'dev', VITE_BUILD_INFO: 'PR #3 · abc1234' })
    expect(dev.ok && dev.config.appEnv).toBe('dev')
    expect(dev.ok && dev.config.buildInfo).toBe('PR #3 · abc1234')
    const other = parseConfig({ ...valid, VITE_APP_ENV: 'staging' })
    expect(other.ok && other.config.appEnv).toBe('local')
  })
})
