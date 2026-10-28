# ADR-0016 — Configurazione Supabase come codice (`supabase config push`)

Stato: Proposto

## Contesto

Molte impostazioni (schemi esposti, registrazioni, MFA, URL di redirect, JWT
`verify_jwt` delle function) si possono cambiare dalla dashboard, ma così
divergono tra dev e prod e non sono revisionabili.

## Decisione

- `supabase/config.toml` è la fonte di verità per: `[api] schemas`,
  `[auth] enable_signup = false`, `site_url` e `additional_redirect_urls` (via
  `env()`), `[auth.mfa.totp]` abilitata, durata JWT, `[functions.*] verify_jwt`.
- I deploy eseguono `supabase config push` dopo le migrazioni (lo schema `api`
  deve esistere prima di essere esposto).
- Valori diversi per ambiente tramite variabili d'ambiente del workflow
  (`env(FRONTEND_URL)`), nessun segreto nel file.
- La dashboard resta usata per: creazione progetto, utente, secret delle
  function, verifiche. SETUP.md avvisa che le modifiche manuali alle voci gestite
  da `config.toml` vengono sovrascritte al deploy successivo.

## Conseguenze

- Meno passi manuali in SETUP.md e meno errori di configurazione.
- Il PAT usato in CI deve avere i permessi per leggere/scrivere la config del
  progetto (scope verificati in Fase 2).
