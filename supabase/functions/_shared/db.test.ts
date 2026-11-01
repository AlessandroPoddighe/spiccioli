import { assertEquals, assertThrows } from 'jsr:@std/assert@1'
import { databaseUrl } from './db.ts'

Deno.test('databaseUrl usa SUPABASE_DB_URL in cloud', () => {
  const env: Record<string, string> = { SUPABASE_DB_URL: 'postgresql://cloud' }
  assertEquals(databaseUrl((n) => env[n]), 'postgresql://cloud')
})

Deno.test('databaseUrl preferisce LOCAL_DB_URL nello stack locale', () => {
  const env: Record<string, string> = {
    SUPABASE_DB_URL: 'postgresql://postgres:postgres@supabase_db_x:5432/postgres',
    LOCAL_DB_URL: 'postgresql://postgres:postgres@db:5432/postgres',
  }
  assertEquals(databaseUrl((n) => env[n]), 'postgresql://postgres:postgres@db:5432/postgres')
})

Deno.test('databaseUrl senza variabili → errore', () => {
  assertThrows(() => databaseUrl(() => undefined), Error, 'SUPABASE_DB_URL')
})
