# ADR-0005 — Autenticazione: email + password + TOTP obbligatoria; passkey in seguito

Stato: Proposto

## Contesto

Un solo utente. Richiesta: passkey se supportate nativamente da Supabase Auth,
altrimenti email + password con MFA TOTP.

Verifica (documentazione Supabase, ottobre 2026): le **passkey sono supportate
ma "Experimental"** (API soggetta a modifiche senza preavviso, opt-in nel client
con `auth.experimental.passkey`, `supabase-js` ≥ 2.105). Registrare una passkey
richiede un utente **già esistente e confermato**. Il Relying Party ID è legato
al dominio del frontend: cambiarlo invalida tutte le passkey.

## Decisione

1. **Fase 2**: email + password (password lunga da password manager) +
   **TOTP obbligatoria** (app Authenticator/Password di iOS). Tutte le policy RLS
   e le Edge Functions richiedono `aal = 'aal2'`.
2. Registrazioni pubbliche disattivate (`enable_signup = false` via
   `config push`); l'utente viene creato da te in dashboard
   (*Authentication → Users → Add user*).
3. **Fase 7 (opzionale)**: passkey come metodo di accesso aggiuntivo **solo su
   prod**, con RP ID = host del Worker prod, se a quel punto non sono più
   sperimentali **e** se verifichiamo che una sessione da passkey soddisfi la
   nostra policy `aal2` (o se decidiamo di considerarla equivalente). Fino ad
   allora password + TOTP restano l'unico percorso.

## Alternative considerate

- *Passkey subito come unico metodo*: dipendenza da un'API sperimentale per
  l'accesso a dati bancari; rischio di lock-out a ogni cambio di API. Scartata.
- *Magic link*: dipende dalla consegna email (SMTP Supabase di default ha limiti
  molto bassi). Scartata come metodo primario.

## Conseguenze

- Login su iPhone: password autocompletata da Portachiavi + codice TOTP
  (anche questo autocompletabile dall'app Password di iOS).
- Codici di recupero: Supabase non li genera; si registrano **due fattori TOTP**
  (es. iPhone e un secondo dispositivo/password manager). Documentato in SETUP.md.
