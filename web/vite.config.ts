import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Genera `dist/_headers` (Cloudflare Workers Static Assets) con una CSP che
 * consente connessioni solo al progetto Supabase di questo build.
 */
function securityHeaders(supabaseUrl: string): Plugin {
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : ''
  const wsOrigin = supabaseOrigin.replace(/^http/, 'ws')
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    // ECharts e React usano attributi style inline.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin} ${wsOrigin}`.trim(),
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  const headers = `/*
  Content-Security-Policy: ${csp}
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/index.html
  Cache-Control: no-cache

/sw.js
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`

  return {
    name: 'spiccioli-security-headers',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_headers', source: headers })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      securityHeaders(env.VITE_SUPABASE_URL ?? ''),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Spiccioli',
          short_name: 'Spiccioli',
          description: 'Le mie spese, sotto controllo',
          lang: 'it',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#0f172a',
          theme_color: '#0f172a',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/pwa-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache solo dell'app-shell: nessun dato bancario sul dispositivo.
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Tutto ciò che va a Supabase passa sempre dalla rete.
              urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    build: {
      sourcemap: false,
      rolldownOptions: {
        output: {
          // Librerie separate dal codice dell'app: cambiano raramente e restano in cache.
          codeSplitting: {
            groups: [
              { name: 'supabase', test: /node_modules[\\/]@supabase/ },
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              },
              { name: 'vendor', test: /node_modules/ },
            ],
          },
        },
      },
    },
  }
})
