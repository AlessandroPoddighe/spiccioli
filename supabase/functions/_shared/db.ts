import postgres from 'npm:postgres@3.4.9'

export type Sql = postgres.Sql

let client: Sql | undefined

/**
 * Connessione diretta a Postgres per le Edge Functions (schemi interni non
 * esposti dalla Data API). SUPABASE_DB_URL è iniettata dalla piattaforma.
 */
export function getSql(): Sql {
  if (client) return client
  const url = Deno.env.get('SUPABASE_DB_URL')
  if (!url) throw new Error('SUPABASE_DB_URL non impostata')
  client = postgres(url, {
    // Il pooler in modalità transaction non supporta i prepared statement.
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return client
}
