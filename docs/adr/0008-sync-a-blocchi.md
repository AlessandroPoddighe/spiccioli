# ADR-0008 — Sync a blocchi ripartibile e budget PSD2

Stato: Proposto

## Contesto

- Edge Functions Free: 150 s wall clock, **2 s di CPU** per richiesta.
- Le banche limitano gli accessi senza utente presente (tipicamente 4 ogni 24 h);
  con header PSU la richiesta conta come "utente presente".
- Lo storico lungo è spesso disponibile solo subito dopo la SCA;
  `strategy=longest` lo recupera, con paginazione via `continuation_key`
  (valida solo nella sessione corrente, pagine anche vuote).

## Decisione

Dettaglio in ARCHITECTURE.md §6. In sintesi:

- coda di job per conto in `core.sync_state`, lock con `FOR UPDATE SKIP LOCKED`
  + `locked_until` (protezione da worker concorrenti o morti);
- la function fa solo HTTP e salva il JSON; la normalizzazione è SQL
  (`internal.ingest_*`), una transazione per pagina;
- budget di tempo per invocazione ~100 s; continuazione via `pg_cron` ogni
  5 minuti, che chiama il worker **solo se ci sono job pronti**;
- sync iniziale con header PSU subito dopo il callback; incrementale giornaliera
  senza header PSU (1 accesso/giorno per conto, ben sotto 4); manuale con
  header PSU;
- retry con backoff esponenziale + jitter; `429` → pausa 6 h; sessione
  scaduta/revocata → job sospeso e avviso in app.

## Alternative considerate

- *Function ricorsiva che si richiama*: limite di 30 chiamate per trace in 60 s
  e catene fragili. Scartata (resta solo l'avvio immediato con `waitUntil`).
- *Supabase Queues (pgmq)*: valida, ma per ≤ 10 job al giorno una tabella di
  stato è più semplice da testare e da leggere in app. Scartata per ora.
- *GitHub Actions come scheduler della sync*: porterebbe le credenziali Enable
  Banking su GitHub. Scartata.

## Conseguenze

- Una sync iniziale lunga può richiedere più invocazioni: l'app mostra lo stato
  "in corso" letto da `sync_state`/`sync_runs`.
- Gli header PSU (IP, user agent) sono salvati solo nel job e cancellati a fine
  job.
