# ADR-0006 — Schemi `raw`/`core`/`mart` privati, solo `api` esposto

Stato: Proposto

## Contesto

La Data API di Supabase espone di default `public` e, sui progetti esistenti,
concede automaticamente privilegi a `anon`/`authenticated` sui nuovi oggetti.
Requisito: `raw` e `core` non esposti; frontend che legge solo ciò che serve,
sempre sotto RLS.

## Decisione

- `config.toml`: `[api] schemas = ["api"]`, `extra_search_path = []`; applicato a
  dev/prod con `supabase config push` (ADR-0016). `public` non è più esposto.
- Migrazione iniziale: `REVOKE ALL` su `public`, `raw`, `core`, `mart`,
  `internal` per `anon`; `ALTER DEFAULT PRIVILEGES … REVOKE` per i nuovi
  oggetti; `REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` negli schemi interni.
- **RLS attiva su ogni tabella** di `core` e `raw` (anche se non esposte:
  difesa in profondità), policy `owner_id = auth.uid()` **e** `aal2`.
- `api` contiene:
  - viste `security_invoker = true` su `core` (rispettano RLS del chiamante);
    per questo `authenticated` ha `USAGE` su `core` e `SELECT` sulle sole
    tabelle necessarie: lo schema resta non esposto da PostgREST;
  - funzioni RPC `SECURITY DEFINER` con `set search_path = ''` per le letture
    da viste materializzate (che non supportano RLS) e per le scritture ammesse
    (override, regole, categorie), ciascuna con controllo esplicito di
    `auth.uid()` e `aal2`.
- `raw` è leggibile/scrivibile **solo** da `service_role` (Edge Functions).
- **Test pgTAP obbligatori**: per ogni oggetto in `api`, `anon` non legge nulla;
  un secondo utente fittizio non vede i dati del primo; `aal1` non vede nulla;
  `raw`/`core`/`mart` non raggiungibili via PostgREST; elenco di tabelle senza
  RLS deve essere vuoto (test che fallisce se si aggiunge una tabella senza RLS).

## Alternative considerate

- *Esporre `core` con RLS*: superficie API molto più ampia e accoppiata al
  modello interno. Scartata.
- *Solo funzioni RPC, niente viste*: perde i filtri/paginazione automatici di
  PostgREST, utili per la lista movimenti. Scartata.

## Conseguenze

- Il client usa `supabase.schema('api')` (o `db.schema = 'api'`); i tipi
  TypeScript sono generati da `supabase gen types --schema api` e verificati in CI.
