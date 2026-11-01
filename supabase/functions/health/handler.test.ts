import { assertEquals } from 'jsr:@std/assert@1'
import { handleHealth, type HealthDeps } from './handler.ts'

const baseDeps: HealthDeps = {
  expectedToken: 'token-di-test-lungo',
  checkDb: () => Promise.resolve({ db: true }),
  ebConfigured: { appId: true, privateKey: false },
}

function req(token?: string, method = 'GET'): Request {
  const headers = new Headers()
  if (token !== undefined) headers.set('x-health-token', token)
  return new Request('http://localhost/health', { method, headers })
}

Deno.test('senza HEALTH_TOKEN configurato risponde 503', async () => {
  const res = await handleHealth(req('x'), { ...baseDeps, expectedToken: undefined })
  assertEquals(res.status, 503)
  assertEquals((await res.json()).error, 'not_configured')
})

Deno.test('token assente o errato → 401', async () => {
  assertEquals((await handleHealth(req(), baseDeps)).status, 401)
  assertEquals((await handleHealth(req('sbagliato'), baseDeps)).status, 401)
})

Deno.test('metodo non ammesso → 405', async () => {
  assertEquals((await handleHealth(req('token-di-test-lungo', 'DELETE'), baseDeps)).status, 405)
})

Deno.test('token corretto → stato del db e presenza dei secret, mai i valori', async () => {
  const res = await handleHealth(req('token-di-test-lungo'), baseDeps)
  assertEquals(res.status, 200)
  assertEquals(res.headers.get('cache-control'), 'no-store')
  assertEquals(await res.json(), {
    ok: true,
    db: { db: true },
    enable_banking: { app_id_configured: true, private_key_configured: false },
  })
})

Deno.test('database non raggiungibile → 503 senza dettagli', async () => {
  const res = await handleHealth(req('token-di-test-lungo'), {
    ...baseDeps,
    checkDb: () => Promise.reject(new Error('connessione rifiutata a host-segreto')),
  })
  assertEquals(res.status, 503)
  const body = await res.json()
  assertEquals(body, { ok: false, error: 'db_unavailable' })
})
