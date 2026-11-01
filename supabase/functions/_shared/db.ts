import postgres from 'npm:postgres@3.4.9'

export type Sql = postgres.Sql

let client: Sql | undefined

/**
 * URL del database: SUPABASE_DB_URL è iniettata dalla piattaforma.
 * LOCAL_DB_URL esiste solo nello stack locale/CI (supabase/functions/.env):
 * lì l'host iniettato è "supabase_db_<progetto>" e il resolver DNS dell'Edge
 * Runtime rifiuta i nomi con "_"; si usa l'alias "db". Mai impostata in cloud.
 */
export function databaseUrl(env: (name: string) => string | undefined): string {
  const url = env('LOCAL_DB_URL') ?? env('SUPABASE_DB_URL')
  if (!url) throw new Error('SUPABASE_DB_URL non impostata')
  return url
}

/**
 * Connessione diretta a Postgres per le Edge Functions (schemi interni non
 * esposti dalla Data API).
 */
export function getSql(): Sql {
  if (client) return client
  const url = databaseUrl((name) => Deno.env.get(name))
  client = postgres(url, {
    // Il pooler in modalità transaction non supporta i prepared statement.
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return client
}
