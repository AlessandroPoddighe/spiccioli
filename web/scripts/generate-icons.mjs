// Genera le icone PNG della PWA a partire da public/favicon.svg usando il
// Chromium di Playwright. Uso: npm run icons (i PNG generati sono committati).
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const svg = await readFile(`${publicDir}favicon.svg`, 'utf8')

const targets = [
  { file: 'apple-touch-icon.png', size: 180, padding: 0 },
  { file: 'pwa-192.png', size: 192, padding: 0 },
  { file: 'pwa-512.png', size: 512, padding: 0 },
  // Le icone "maskable" devono avere il contenuto nella safe zone centrale (80%).
  { file: 'pwa-512-maskable.png', size: 512, padding: 52 },
]

// CHROMIUM_PATH: browser già installato (es. ambiente dell'agente).
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)
const page = await browser.newPage()
for (const { file, size, padding } of targets) {
  const inner = size - padding * 2
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<html><body style="margin:0;background:#0f172a;width:${size}px;height:${size}px;display:grid;place-items:center">
       <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
     </body></html>`,
  )
  await page.screenshot({ path: `${publicDir}${file}`, omitBackground: false })
  console.warn(`generata ${file}`)
}
await browser.close()
