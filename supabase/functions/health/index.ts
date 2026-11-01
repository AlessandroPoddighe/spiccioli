import { getSql } from '../_shared/db.ts'
import { handleHealth } from './handler.ts'

Deno.serve((req) =>
  handleHealth(req, {
    expectedToken: Deno.env.get('HEALTH_TOKEN'),
    checkDb: async () => {
      const [row] = await getSql()`select internal.health() as health`
      return row?.health
    },
    ebConfigured: {
      appId: Boolean(Deno.env.get('EB_APP_ID')),
      privateKey: Boolean(Deno.env.get('EB_PRIVATE_KEY')),
    },
  })
)
