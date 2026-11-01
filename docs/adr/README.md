# Architecture Decision Records

Formato: *Contesto → Decisione → Alternative considerate → Conseguenze*.
Stato: `Proposto` finché non approvato dall'utente, poi `Accettato` / `Sostituito da ADR-xxxx`.

| # | Titolo | Stato | Disaccordo con la richiesta iniziale |
|---|---|---|---|
| [0001](0001-hosting-frontend-cloudflare-workers.md) | Hosting frontend su Cloudflare Workers (Static Assets) | Accettato | Sì: Workers invece di Pages |
| [0002](0002-ambienti-dev-prod.md) | Due progetti Supabase: dev (sandbox) e prod | Accettato | No |
| [0003](0003-visibilita-repository.md) | Repository pubblico vs privato sul piano GitHub Free | Accettato (A: pubblico) | **Sì** |
| [0004](0004-callback-su-edge-function.md) | Callback Enable Banking su Edge Function | Accettato | No |
| [0005](0005-autenticazione.md) | Email + password + TOTP obbligatoria; passkey in seguito | Accettato | Parziale |
| [0006](0006-schemi-ed-esposizione-api.md) | Schemi `raw`/`core`/`mart` privati, solo `api` esposto | Accettato | No |
| [0007](0007-raw-deduplicato-per-contenuto.md) | Layer `raw` deduplicato per contenuto | Accettato | Parziale |
| [0008](0008-sync-a-blocchi.md) | Sync a blocchi ripartibile e budget PSD2 | Accettato | No |
| [0009](0009-deduplica-pending-booked.md) | Deduplica e transizione pending → booked | Accettato | No |
| [0010](0010-categorizzazione.md) | Categorizzazione materializzata con precedenze | Accettato | No |
| [0011](0011-gestione-segreti.md) | Gestione dei segreti | Accettato | No |
| [0012](0012-backup-cifrati.md) | Backup cifrati con `age` via GitHub Actions | Accettato | No |
| [0013](0013-keep-alive-e-avvisi.md) | Keep-alive e avvisi di scadenza consenso | Accettato | No |
| [0014](0014-export.md) | Export CSV e Parquet nel browser senza duckdb-wasm | Accettato | Parziale |
| [0015](0015-stack-frontend.md) | Stack frontend e PWA senza cache dei dati | Accettato | No |
| [0016](0016-configurazione-supabase-as-code.md) | Configurazione Supabase come codice (`config push`) | Accettato | No |
