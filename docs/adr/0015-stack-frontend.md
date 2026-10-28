# ADR-0015 — Stack frontend e PWA senza cache dei dati

Stato: Proposto

## Decisione

- **React 19 + Vite + TypeScript strict**, React Router, **TanStack Query**
  (cache solo in memoria, nessun persister), `@supabase/supabase-js` v2.
- **Grafici: Apache ECharts** (import modulare `echarts/core` per contenere il
  bundle): tooltip touch nativi, `dataZoom` per le serie temporali su mobile,
  rendering canvas fluido su iPhone. Recharts è più leggero ma più debole sul
  touch e sulle serie lunghe.
- **Stile**: CSS moderno con custom properties (tema chiaro/scuro di sistema),
  nessun framework CSS pesante; componenti accessibili.
- **PWA** con `vite-plugin-pwa` (Workbox): precache dell'app-shell,
  `navigateFallback` per l'SPA, **`NetworkOnly`** per qualunque richiesta a
  `*.supabase.co`, nessuna cache runtime di API. Aggiornamento del service
  worker con prompt "Nuova versione disponibile".
- **iPhone**: `apple-touch-icon`, `apple-mobile-web-app-capable`,
  `viewport-fit=cover`, safe area, `display: standalone`.
- **Qualità**: ESLint (flat config, `typescript-eslint` strict), Prettier,
  Vitest + Testing Library, Playwright (WebKit "iPhone 15 Pro" — l'ultimo
  profilo iPhone disponibile in Playwright — e Chromium desktop).

## Conseguenze

- Offline l'app mostra solo lo shell con "Sei offline": coerente con il
  requisito di non salvare dati bancari sul dispositivo.
