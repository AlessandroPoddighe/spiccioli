# CLAUDE.md — Spiccioli

Web app personale (un solo utente) per analizzare le spese: Enable Banking AIS →
Supabase (Postgres + Edge Functions) → SPA React su Cloudflare Workers.
Architettura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Decisioni:
[`docs/adr/`](docs/adr/README.md). Guida utente: `docs/SETUP.md`,
`docs/OPERATIONS.md`.

> Stato: **Fase 1 (scaffolding)**. Le voci marcate *(fase N)* non esistono ancora.

## Regole non negoziabili

- **Nessun segreto** nel repo, nei log, nei test, nelle fixture, nell'ambiente
  dell'agente. La chiave privata Enable Banking esiste solo nei secret Supabase.
- **Nessun dato bancario reale** in test, fixture, log, issue, PR, commit.
  Le fixture sono sintetiche, costruite sugli esempi della documentazione EB.
- **RLS attiva su ogni tabella** (anche in schemi non esposti) + test pgTAP.
- Esposto dalla Data API **solo** lo schema `api`. `raw` è append-only.
- La secret key Supabase solo nelle Edge Functions; il frontend usa solo la
  publishable key.
- Il service worker non mette in cache risposte di `*.supabase.co`.
- **Migrazioni additive e retrocompatibili.** `DROP`, `RENAME`, cambi di tipo,
  `TRUNCATE` richiedono conferma esplicita dell'utente (etichetta PR
  `migrazione-distruttiva-approvata`, messa dall'utente).
- I deploy li fa **solo GitHub Actions**. L'agente non esegue mai
  `supabase link`/`db push`/`functions deploy`/`wrangler deploy` verso progetti
  remoti.
- Una PR per fase, check verdi prima di chiedere il merge. Il branch di lavoro
  dell'agente è `claude/expense-analyzer-enable-banking-wofpap`: dopo il merge
  di una fase si riparte da `main` con lo stesso nome (mai commit sopra una PR
  già mergiata).
- Documentazione e UI in **italiano**; identificatori di codice in inglese.

## Struttura del repository

```
.
├── CLAUDE.md
├── README.md
├── .env.example              # solo nomi di variabili, nessun valore reale
├── .gitignore
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml            # PR: web, functions, database, e2e, security (+ deploy-dev in fase 2)
│       ├── deploy-prod.yml   # (fase 2) push su main: migrazioni → functions → frontend
│       ├── reset-dev.yml     # (fase 2) manuale
│       ├── backup.yml        # (fase 7) schedulato (prod)
│       ├── restore.yml       # (fase 7) manuale
│       └── keepalive.yml     # (fase 7) schedulato (dev + prod)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── OPERATIONS.md
│   └── adr/
├── .gitleaks.toml            # regole extra: sb_secret_, sbp_, PEM
├── scripts/
│   ├── check-destructive-migrations.sh   # CI: solo migrazioni additive
│   └── check-data-api-exposure.sh        # CI: solo lo schema api è esposto
├── supabase/
│   ├── config.toml           # fonte di verità della config (ADR-0016)
│   ├── migrations/           # YYYYMMDDHHMMSS_descrizione.sql
│   ├── seed.sql              # SOLO dati sintetici per lo stack locale/CI
│   ├── tests/                # pgTAP: *.test.sql
│   └── functions/
│       ├── deno.json         # fmt/lint/test (CI); ogni function ha il suo deno.json
│       ├── _shared/          # db.ts (postgres diretto), http.ts, log.ts (redazione)
│       ├── health/           # keep-alive/diagnostica, token x-health-token
│       ├── eb-aspsps/        # (fase 3)
│       ├── eb-auth-start/    # (fase 3)
│       ├── eb-callback/      # (fase 3)
│       └── sync-worker/      # (fase 4)
└── web/                      # frontend React + Vite
    ├── package.json
    ├── wrangler.jsonc
    ├── vite.config.ts        # genera dist/_headers (CSP) e il service worker
    ├── scripts/              # check-bundle.mjs (post-build), generate-icons.mjs
    ├── public/               # favicon + icone PWA (PNG generati e committati)
    ├── src/                  # app (env.ts, routes.tsx, auth/, pages/, components/)
    └── e2e/                  # Playwright
```

## Comandi

Frontend (`web/`):

```bash
npm ci
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit
npm test              # Vitest
npm run build         # tsc + Vite → web/dist + check-bundle (niente segreti, niente cache dati)
npm run e2e           # Playwright (WebKit iPhone + Chromium desktop)
```

Edge Functions (`supabase/functions/`):

```bash
deno fmt --check && deno lint && deno check .
deno test --allow-env --allow-read
```

Database (richiede Docker; in CI lo stack gira nel runner):

```bash
export SITE_URL=http://127.0.0.1:4173   # richiesto da config.toml
supabase start -x studio,imgproxy,vector,logflare,supavisor,mailpit,realtime,storage-api
supabase db reset                    # applica tutte le migrazioni su DB pulito + seed
supabase test db                     # pgTAP (supabase/tests)
supabase db lint --level warning --fail-on warning
PUBLISHABLE_KEY=$(supabase status -o json | jq -r .PUBLISHABLE_KEY) scripts/check-data-api-exposure.sh
supabase gen types typescript --local --schema api > web/src/lib/database.types.ts
```

Controlli trasversali:

```bash
gitleaks git --no-banner --redact .  # anche prima di ogni commit dell'agente
actionlint                           # validità dei workflow GitHub
scripts/check-destructive-migrations.sh origin/main
```

## Convenzioni

- **SQL**: minuscolo, `snake_case`, una migrazione per cambiamento logico,
  `create … if not exists` dove sensato, sempre `owner_id` + RLS + grant espliciti
  nella stessa migrazione. Funzioni `security definer` sempre con
  `set search_path = ''` e nomi qualificati. Trasformazioni in SQL, non in Deno.
- **TypeScript**: `strict`, niente `any`, errori tipizzati; nessun `console.log`
  di payload bancari (usare il logger che redige IBAN/importi/descrizioni).
- **Edge Functions**: logica in `handler.ts` puro e testabile (dipendenze
  iniettate), `index.ts` solo wiring. `@supabase/server` (`withSupabase`) per le
  function chiamate dall'utente; `verify_jwt = false` solo per `eb-callback`,
  `sync-worker` (token cron) e `health` (token health). Schemi interni via
  `_shared/db.ts` (connessione diretta). Log solo con `_shared/log.ts`.
  Import `npm:`/`jsr:` con versione fissata.
- **Commit**: Conventional Commits in italiano o inglese (`feat:`, `fix:`,
  `chore:`, `docs:`, `test:`), messaggi descrittivi.
- **Branch**: vedi regole sopra; mai push diretti su `main`.

## Ambiente dell'agente (verificato in Fase 1)

- Node 22 e npm preinstallati; Docker presente (avviare `dockerd` se il socket
  manca); Supabase CLI e Deno si scaricano dalle release ufficiali in una
  cartella temporanea (non nel repo); Chromium di Playwright in
  `/opt/pw-browsers/chromium` → `CHROMIUM_PATH=/opt/pw-browsers/chromium`
  per `npm run e2e -- --project=desktop-chromium` e `npm run icons`. WebKit gira solo in CI.
- Lo stack Supabase completo funziona in locale. Le Edge Functions servite
  dal container non scaricano dipendenze npm dietro il proxy dell'agente:
  provarle con Deno sull'host (`DENO_CERT=/root/.ccr/ca-bundle.crt`) o in CI.
- Rete aperta (documentazione ufficiale raggiungibile).
