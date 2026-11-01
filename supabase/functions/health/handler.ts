import { json, timingSafeEqual } from '../_shared/http.ts'
import { log } from '../_shared/log.ts'

export interface HealthDeps {
  /** Valore atteso dell'header x-health-token (secret HEALTH_TOKEN). */
  expectedToken: string | undefined
  /** Esegue internal.health() sul database. */
  checkDb: () => Promise<unknown>
  /** Presenza (non il valore!) dei secret Enable Banking. */
  ebConfigured: { appId: boolean; privateKey: boolean }
}

/**
 * Health check usato dal workflow keepalive (ADR-0013). Risponde solo con
 * metadati non sensibili e solo a chi presenta il token condiviso.
 */
export async function handleHealth(req: Request, deps: HealthDeps): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
  }
  if (!deps.expectedToken) {
    return json({ ok: false, error: 'not_configured' }, { status: 503 })
  }
  const token = req.headers.get('x-health-token') ?? ''
  if (!timingSafeEqual(token, deps.expectedToken)) {
    return json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const db = await deps.checkDb()
    return json({
      ok: true,
      db,
      enable_banking: {
        app_id_configured: deps.ebConfigured.appId,
        private_key_configured: deps.ebConfigured.privateKey,
      },
    })
  } catch (err) {
    log.error('health.db_failed', {
      error_type: err instanceof Error ? err.name : 'unknown',
      error_code: errorCode(err),
      error_message: err instanceof Error ? err.message : undefined,
    })
    return json({ ok: false, error: 'db_unavailable' }, { status: 503 })
  }
}

function errorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String(err.code)
  }
  return undefined
}
