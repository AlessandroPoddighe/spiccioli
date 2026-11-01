import { createClient } from '@supabase/supabase-js'
import type { AppConfig } from '../env'

/**
 * Client Supabase del frontend: usa SOLO la publishable key e lo schema `api`,
 * l'unico esposto dalla Data API.
 */
export function createSupabase(config: AppConfig) {
  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    db: { schema: 'api' },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })
}

export type AppSupabaseClient = ReturnType<typeof createSupabase>
