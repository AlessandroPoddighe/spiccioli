# ADR-0011 — Gestione dei segreti

Stato: Proposto

## Decisione

Tabella completa in ARCHITECTURE.md §10. Principi:

1. **Chiave privata Enable Banking e `app_id`**: solo nei secret delle Edge
   Functions di Supabase, inseriti da te dalla dashboard. Mai su GitHub, mai
   nell'ambiente dell'agente, mai nei log. Il file `.pem` scaricato dal Control
   Panel va conservato in un password manager (o cancellato dopo l'inserimento:
   in caso di perdita si genera una nuova chiave).
2. **PEM multilinea**: il campo della dashboard accetta l'incolla diretto del
   contenuto; il codice normalizza comunque qualunque forma (a capo, `\n`
   letterali, spazi) e supporta PKCS#8 e PKCS#1. All'avvio la function verifica
   che la chiave si importi e lo segnala in `health` (senza esporla).
3. **GitHub**: solo ciò che serve a deployare (PAT Supabase con scope sul singolo
   progetto, password DB, token Cloudflare con permesso minimo). Un set per
   environment; prod limitato al branch `main` (se ADR-0003 opzione A).
4. **Token del cron**: generato **dentro Postgres** dalla migrazione
   (`gen_random_bytes`) e salvato nel Vault; il cron lo invia in un header, la
   function lo verifica chiamando una funzione SQL. Nessun umano lo vede.
5. **Secret key Supabase** (ex `service_role`): usata solo dentro le Edge
   Functions, dove è iniettata dalla piattaforma (`SUPABASE_SECRET_KEYS`). Il
   frontend usa solo la publishable key. Un test di build fallisce se nel bundle
   compare `sb_secret_` o `service_role`.
6. **Repository**: `.gitignore` ed `.env.example` dal primo commit; `gitleaks`
   in CI e prima di ogni commit dell'agente; secret scanning + push protection
   di GitHub (se ADR-0003 opzione A).

## Rotazione

- Chiave EB: nuova chiave dal Control Panel → aggiorna secret Supabase → nessun
  redeploy necessario (i secret sono letti a runtime).
- PAT Supabase / token Cloudflare: scadenza consigliata 1 anno, promemoria in
  OPERATIONS.md.
