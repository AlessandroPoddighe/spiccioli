# ADR-0007 — Layer `raw` deduplicato per contenuto

Stato: Proposto

## Contesto

Richiesta: `raw` con risposte API "così come arrivano", mai modificato. La sync
incrementale riscarica ogni giorno una finestra sovrapposta di 10 giorni: salvare
ogni pagina intera duplica gli stessi movimenti decine di volte (~100+ MB/anno
contro un limite di 500 MB per il DB Free).

## Decisione

- `raw.api_calls`: una riga per **ogni** chiamata (endpoint, parametri, status,
  durata, header di risposta rilevanti, `sync_run_id`) con la **busta della
  risposta integrale tranne l'array `transactions`** (per `/sessions`, `/auth`,
  `/balances`, `/aspsps` la risposta è salvata per intero).
- `raw.transactions(sha256 PK, body jsonb, first_seen_at)`: ogni oggetto
  movimento esattamente come arrivato, una sola volta per contenuto.
- `raw.api_call_transactions(api_call_id, position, sha256)`: l'ordine originale.
- Una vista `raw.api_responses` ricostruisce la risposta completa.
- Trigger che rifiutano `UPDATE`/`DELETE` su tutto `raw` (append-only), salvo una
  funzione di retention esplicita, mai automatica.
- Le risposte `/aspsps` (grandi, ripetitive) sono salvate solo quando cambia il
  loro hash.

## Conseguenze

- ~6 MB/anno per i movimenti invece di ~100 MB.
- Nessuna perdita di informazione: ogni risposta è ricostruibile.
- Il JSON è salvato come `jsonb` (non preserva spazi/ordine delle chiavi:
  equivalente semanticamente, non byte per byte). Accettabile.
