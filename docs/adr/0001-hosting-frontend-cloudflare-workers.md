# ADR-0001 — Hosting del frontend su Cloudflare Workers (Static Assets)

Stato: Proposto

## Contesto

Serve hosting gratuito, HTTPS, routing SPA, deploy da GitHub Actions,
configurabile dal browser, con **anteprime per le PR** (non si può eseguire nulla
in locale). Candidati richiesti: Cloudflare Pages, Vercel, GitHub Pages.

## Decisione

**Cloudflare Workers con Static Assets** (non Pages), due Worker:

- `spiccioli` → prod, deploy su push in `main`;
- `spiccioli-dev` → dev, deploy a ogni PR (serializzato), URL stabile
  `https://spiccioli-dev.<sottodominio>.workers.dev`.

Configurazione in `wrangler.jsonc`: `assets.directory = "dist"`,
`assets.not_found_handling = "single-page-application"`, nessuno script
server-side. Header di sicurezza tramite file `_headers`.
Deploy con `cloudflare/wrangler-action` usando un API token con il solo permesso
*Workers Scripts: Edit*.

## Alternative considerate

| Opzione | Pro | Contro |
|---|---|---|
| **Cloudflare Pages** | Preview per branch native, SPA di default | Cloudflare indirizza i nuovi progetti verso Workers; Pages è di fatto in manutenzione e il nuovo CLI `cf` non lo supporta. Partire oggi su Pages significa migrare domani. |
| **Vercel Hobby** | Preview eccellenti | Le preview "native" passano dall'integrazione Git di Vercel (deploy fuori da Actions); con deploy da Actions servono token e `vercel` CLI; licenza Hobby solo non commerciale (ok), ma un servizio in più con accesso al repo. |
| **GitHub Pages** | Nessun account in più | **Non disponibile per repo privati sul piano Free**; niente preview per PR; niente header custom (CSP). |
| **Cloudflare Workers** ✅ | Asset statici gratuiti e illimitati, SPA fallback, `_headers`, preview URL/alias per versione, CDN anche in Italia | Un account Cloudflare in più (gratuito, senza carta) |

## Perché un Worker dev stabile invece di un URL per PR

Il progetto Supabase dev è uno solo e i deploy dev sono serializzati: in ogni
momento esiste **una** versione di backend dev. Un URL stabile permette di
registrarlo una sola volta come redirect (Supabase Auth, `FRONTEND_URL` del
callback) e di salvarlo nei preferiti dell'iPhone. Il badge in app mostra quale
PR/SHA è deployata. (Gli alias per PR `pr-N-spiccioli-dev…` restano possibili in
futuro con `wrangler versions upload --preview-alias`.)

## Conseguenze

- Registrazione su Cloudflare (gratuita) e creazione di un API token: passi in SETUP.md.
- Gli URL `*.workers.dev` sono pubblici: la protezione è l'autenticazione
  Supabase + MFA; il bundle non contiene dati né segreti.
