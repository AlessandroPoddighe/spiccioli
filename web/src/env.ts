export type AppEnv = 'local' | 'dev' | 'prod'

export interface AppConfig {
  supabaseUrl: string
  supabasePublishableKey: string
  appEnv: AppEnv
  buildInfo: string
}

export type ConfigResult = { ok: true; config: AppConfig } | { ok: false; missing: string[] }

type RawEnv = Partial<Record<string, string | undefined>>

const APP_ENVS: readonly AppEnv[] = ['local', 'dev', 'prod']

function isAppEnv(value: string): value is AppEnv {
  return (APP_ENVS as readonly string[]).includes(value)
}

/** Legge e valida la configurazione pubblica iniettata al build (VITE_*). */
export function parseConfig(env: RawEnv): ConfigResult {
  const missing: string[] = []
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim() ?? ''
  const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
  else if (!URL.canParse(supabaseUrl)) missing.push('VITE_SUPABASE_URL (URL non valido)')
  if (!supabasePublishableKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')

  // Difesa in profondità: una secret key non deve mai finire nel frontend.
  if (supabasePublishableKey.startsWith('sb_secret_')) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY (è una secret key: vietato)')
  }

  if (missing.length > 0) return { ok: false, missing }

  const rawEnv = env.VITE_APP_ENV?.trim() ?? 'local'
  const buildInfo = env.VITE_BUILD_INFO?.trim()
  return {
    ok: true,
    config: {
      supabaseUrl,
      supabasePublishableKey,
      appEnv: isAppEnv(rawEnv) ? rawEnv : 'local',
      buildInfo: buildInfo === undefined || buildInfo === '' ? 'sviluppo' : buildInfo,
    },
  }
}

export const configResult = parseConfig(import.meta.env)
