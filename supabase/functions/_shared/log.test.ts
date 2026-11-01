import { assertEquals } from 'jsr:@std/assert@1'
import { format, redact } from './log.ts'

Deno.test('redact nasconde IBAN e token lunghi', () => {
  assertEquals(redact('conto IT60X0542811101000000123456 ok'), 'conto [IBAN] ok')
  assertEquals(
    redact('jwt eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi fine'),
    'jwt [REDATTO] fine',
  )
})

Deno.test('redact lascia passare valori non stringa e testo innocuo', () => {
  assertEquals(redact(42), 42)
  assertEquals(redact(null), null)
  assertEquals(redact('sync completata'), 'sync completata')
})

Deno.test('format redige i campi sensibili ma non quelli diagnostici', () => {
  const line = JSON.parse(
    format('error', 'evento', {
      error_code: 'ECONNREFUSED',
      auth_code: 'abc',
      counterparty_name: 'Mario Rossi',
      status_code: 503,
    }),
  )
  assertEquals(line, {
    level: 'error',
    event: 'evento',
    error_code: 'ECONNREFUSED',
    auth_code: '[REDATTO]',
    counterparty_name: '[REDATTO]',
    status_code: 503,
  })
})
