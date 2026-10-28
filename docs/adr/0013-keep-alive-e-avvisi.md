# ADR-0013 — Keep-alive e avvisi di scadenza del consenso

Stato: Proposto

## Contesto

Supabase mette in pausa i progetti Free con "attività utente sul database
insufficiente" nell'arco di 7 giorni; la documentazione non garantisce che
l'attività interna (`pg_cron`) conti. Il consenso bancario scade
(`valid_until`, tipicamente 180 giorni) e va rinnovato con una nuova SCA.

## Decisione

- La sync giornaliera genera già traffico reale (Edge Function → Data API), ma
  **non ci affidiamo solo a quella**: workflow GitHub `keepalive` ogni 2 giorni
  che chiama la function `health` di **dev e prod** (header `x-health-token`).
- `health` esegue una query reale e restituisce solo metadati non sensibili:
  `{ ok, db: true, eb_key_loaded: true, last_sync_ok_at, consents: [{ bank,
  days_left }] }` — nessun importo, IBAN o descrizione.
- Avvisi consenso:
  - **in app**: banner a ≤ 14 giorni dalla scadenza con bottone "Ricollega";
  - **fuori dall'app**: se un consenso scade entro 7 giorni o l'ultima sync
    riuscita è più vecchia di 3 giorni, il workflow `keepalive` apre (o
    aggiorna) una **issue GitHub** → notifica email/app GitHub, gratis.
    Il testo dell'issue contiene solo nome banca e giorni rimanenti.
- Se un progetto è comunque in pausa: procedura di ripristino in OPERATIONS.md
  (*Resume project* dalla dashboard; finestra di 1 anno).

## Alternative considerate

- *Web Push sulla PWA iOS*: possibile (iOS ≥ 16.4) ma richiede chiavi VAPID e una
  libreria di push nelle function; rinviato a un'eventuale fase successiva.
- *Email da Supabase Auth SMTP*: non pensata per notifiche applicative. Scartata.
