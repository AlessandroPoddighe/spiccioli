// deno-lint-ignore-file no-console
/**
 * Logger delle Edge Functions. È l'UNICO punto autorizzato a scrivere nei log
 * (regola lint no-console altrove). Accetta solo valori primitivi e redige
 * tutto ciò che somiglia a dati bancari: i log di Supabase non devono mai
 * contenere IBAN, importi, descrizioni o token.
 */

type LogValue = string | number | boolean | null | undefined
export type LogFields = Record<string, LogValue>

const IBAN = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g
const LONG_TOKEN = /\b[A-Za-z0-9_\-.]{32,}\b/g
const SENSITIVE_KEYS = /(iban|amount|importo|description|remittance|name|token|key|secret|code)/i
// Chiavi diagnostiche che contengono parole "sensibili" ma non dati sensibili.
const SAFE_KEYS = new Set(['error_code', 'status_code', 'error_type'])

export function redact(value: LogValue): LogValue {
  if (typeof value !== 'string') return value
  return value.replace(IBAN, '[IBAN]').replace(LONG_TOKEN, '[REDATTO]')
}

export function format(level: string, event: string, fields: LogFields): string {
  const safe: LogFields = {}
  for (const [k, v] of Object.entries(fields)) {
    const sensitive = !SAFE_KEYS.has(k) && SENSITIVE_KEYS.test(k)
    safe[k] = sensitive && typeof v === 'string' ? '[REDATTO]' : redact(v)
  }
  return JSON.stringify({ level, event, ...safe })
}

export const log = {
  info(event: string, fields: LogFields = {}) {
    console.log(format('info', event, fields))
  },
  warn(event: string, fields: LogFields = {}) {
    console.warn(format('warn', event, fields))
  },
  error(event: string, fields: LogFields = {}) {
    console.error(format('error', event, fields))
  },
}
