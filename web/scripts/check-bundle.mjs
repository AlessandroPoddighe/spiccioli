// Verifica post-build: nessuna chiave segreta Supabase nel bundle del frontend
// e nessuna regola di cache del service worker verso Supabase diversa da NetworkOnly.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const forbidden = [/sb_secret_[A-Za-z0-9_-]+/, /service_role/, /BEGIN [A-Z ]*PRIVATE KEY/]

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

const problems = []
for await (const file of walk(dist)) {
  if (!/\.(js|html|css|json|webmanifest|txt|map)$/.test(file) && !file.endsWith('_headers')) {
    continue
  }
  const content = await readFile(file, 'utf8')
  for (const pattern of forbidden) {
    if (pattern.test(content)) problems.push(`${file}: contiene ${pattern}`)
  }
}

const sw = await readFile(join(dist, 'sw.js'), 'utf8')
if (!sw.includes('NetworkOnly')) problems.push('sw.js: manca la regola NetworkOnly per Supabase')
for (const strategy of ['CacheFirst', 'StaleWhileRevalidate', 'NetworkFirst']) {
  if (sw.includes(`new ${strategy}`)) problems.push(`sw.js: strategia di cache runtime ${strategy}`)
}

if (problems.length > 0) {
  console.error('Controllo del bundle FALLITO:\n' + problems.join('\n'))
  process.exit(1)
}
console.warn('Controllo del bundle OK: nessun segreto, nessuna cache dei dati.')
