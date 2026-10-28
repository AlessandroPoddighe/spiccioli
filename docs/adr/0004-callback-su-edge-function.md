# ADR-0004 — Callback di Enable Banking su Edge Function

Stato: Proposto

## Contesto

Dopo la SCA la banca reindirizza a `redirect_url?code=…&state=…` (oppure
`?error=…&error_description=…&state=…`, es. `access_denied` se annulli). Il
redirect URL deve essere registrato nell'applicazione Enable Banking; in
produzione **deve essere HTTPS**. Il `code` va scambiato con `POST /sessions`
firmando un JWT con la chiave privata, che il frontend non deve mai vedere.

## Decisione

Redirect URL = `https://<project-ref>.supabase.co/functions/v1/eb-callback`.

La function `eb-callback` (`verify_jwt = false`, `@supabase/server` con
`auth: 'none'`, perché chi arriva è il browser reindirizzato dalla banca, senza
JWT Supabase):

1. legge solo `code`, `state`, `error`, `error_description`;
2. consuma `state` atomicamente (esiste, non scaduto — TTL 15 min —, non usato);
   lo `state` lega la richiesta al tuo utente: è l'unica autenticazione, ed è
   sufficiente perché è un segreto casuale a uso singolo generato server-side;
3. chiama `POST /sessions` con gli header PSU ricavati dalla richiesta;
4. salva **subito** la risposta integrale in `raw.api_calls`, poi
   sessione/conti in `core`;
5. accoda la sync iniziale e la avvia in background;
6. risponde **303** verso `FRONTEND_URL/banche?esito=…` (mai HTML: senza dominio
   custom le Edge Functions riscrivono `text/html` in `text/plain`).

Errori: nessun dettaglio tecnico nell'URL di ritorno, solo un codice breve; il
dettaglio va in `raw.api_calls`/log.

## Alternative considerate

- *Redirect al frontend che poi chiama una function con il `code`*: il `code`
  transita nella cronologia del browser e in JS; un passaggio in più che può
  fallire su iPhone se la PWA è aperta in un contesto diverso da Safari. Scartata.
- *Dominio custom*: a pagamento su Supabase. Non necessario.

## Conseguenze

- Ogni progetto ha il suo redirect URL: l'app sandbox EB registra quello di dev,
  l'app production quello di prod.
- **[DA VERIFICARE] Fase 3**: che il Control Panel accetti l'URL con percorso
  `/functions/v1/eb-callback` (atteso: sì, è un normale URL HTTPS).
- Nota iPhone: se la SCA apre l'app della banca, il ritorno avviene in Safari,
  non nella PWA installata; la pagina di esito invita a tornare alla PWA (le
  PWA iOS hanno storage separato da Safari, ma il risultato è già salvato a DB).
