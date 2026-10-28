# CLAUDE.md — Spiccioli

Web app personale (un solo utente) per analizzare le spese: Enable Banking AIS →
Supabase (Postgres + Edge Functions) → SPA React su Cloudflare Workers.
Architettura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Decisioni:
[`docs/adr/`](docs/adr/README.md). Guida utente: `docs/SETUP.md`,
`docs/OPERATIONS.md`.

> Stato: **Fase 0 (pianificazione)**. La struttura e i comandi sotto sono quelli
> previsti; verranno creati in Fase 1 e questo file aggiornato di conseguenza.

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
- Una branch e una PR per fase; check verdi prima di chiedere il merge.
- Documentazione e UI in **italiano**; identificatori di codice in inglese.

## Struttura del repository (prevista)

```
.
├── CLAUDE.md
├── README.md
├── .env.example              # solo nomi di variabili, nessun valore reale
├── .gitignore
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml            # PR: lint, typecheck, test, db, e2e, build → deploy-dev
│       ├── deploy-prod.yml   # push su main: migrazioni → functions → frontend
│       ├── reset-dev.yml     # manuale
│       ├── backup.yml        # schedulato (prod)
│       ├── restore.yml       # manuale
│       └── keepalive.yml     # schedulato (dev + prod)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── OPERATIONS.md
│   └── adr/
├── scripts/                  # utility CI (es. controllo migrazioni distruttive)
├── supabase/
│   ├── config.toml           # fonte di verità della config (ADR-0016)
│   ├── migrations/           # YYYYMMDDHHMMSS_descrizione.sql
│   ├── seed.sql              # SOLO dati sintetici per lo stack locale/CI
│   ├── tests/                # pgTAP: *.test.sql
│   └── functions/
│       ├── deno.json
│       ├── _shared/          # client Enable Banking, JWT, db, http, errori
│       ├── eb-aspsps/
│       ├── eb-auth-start/
│       ├── eb-callback/
│       ├── sync-worker/
│       └── health/
└── web/                      # frontend React + Vite
    ├── package.json
    ├── wrangler.jsonc
    ├── public/_headers
    ├── src/
    └── e2e/                  # Playwright
```

## Comandi (previsti)

Frontend (`web/`):

```bash
npm ci
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit
npm test              # Vitest
npm run build         # Vite → web/dist
npm run e2e           # Playwright (WebKit iPhone + Chromium desktop)
```

Edge Functions (`supabase/functions/`):

```bash
deno fmt --check && deno lint && deno check **/*.ts
deno test --allow-env --allow-read   # client EB con risposte mockate
```

Database (richiede Docker; in CI lo stack gira nel runner):

```bash
supabase start                       # stack locale
supabase db reset                    # applica tutte le migrazioni su DB pulito + seed
supabase test db                     # pgTAP
supabase db lint --level warning
supabase gen types typescript --local --schema api > web/src/lib/database.types.ts
```

Controlli trasversali:

```bash
gitleaks detect --no-banner          # anche prima di ogni commit dell'agente
scripts/check-destructive-migrations.sh origin/main
```

## Convenzioni

- **SQL**: minuscolo, `snake_case`, una migrazione per cambiamento logico,
  `create … if not exists` dove sensato, sempre `owner_id` + RLS + grant espliciti
  nella stessa migrazione. Funzioni `security definer` sempre con
  `set search_path = ''` e nomi qualificati. Trasformazioni in SQL, non in Deno.
- **TypeScript**: `strict`, niente `any`, errori tipizzati; nessun `console.log`
  di payload bancari (usare il logger che redige IBAN/importi/descrizioni).
- **Edge Functions**: `@supabase/server` (`withSupabase`) per l'autenticazione;
  `verify_jwt = false` solo per `eb-callback`, `sync-worker` (token cron) e
  `health` (token health). Import da `npm:`/`jsr:` con versione fissata.
- **Commit**: Conventional Commits in italiano o inglese (`feat:`, `fix:`,
  `chore:`, `docs:`, `test:`), messaggi descrittivi.
- **Branch**: `fase-N-descrizione` per le fasi; mai push diretti su `main`.

## Ambiente dell'agente (stato verificato in Fase 0)

- Disponibili: Node 22, npm, Postgres 16 (server + psql), Docker (daemon da
  avviare con `dockerd`), Deno via npm, Supabase CLI da GitHub Releases.
- **Pull Docker limitati** (rate limit Docker Hub / ECR): lo stack Supabase
  completo si esegue in **GitHub Actions**; in locale si usa Postgres 16 per
  verifiche SQL rapide.
- Rete: bloccati `enablebanking.com`, `supabase.com`, `cloudflare.com`; raggiungibili
  registry npm/JSR/PyPI e GitHub (sola lettura dei repo pubblici).
