#!/usr/bin/env bash
# Verifica che nessuno possa registrarsi da solo (utente unico, ADR-0005) e che
# il login con email resti attivo.
#
# Uso: SUPABASE_URL=... PUBLISHABLE_KEY=... scripts/check-signup-disabled.sh
set -euo pipefail

url="${SUPABASE_URL:-http://127.0.0.1:54321}"
key="${PUBLISHABLE_KEY:?PUBLISHABLE_KEY mancante}"
status=0

body=$(curl -s -X POST "$url/auth/v1/signup" -H "apikey: $key" -H "Content-Type: application/json" \
  -d '{"email":"registrazione-vietata@example.test","password":"Prova-Registrazione-1234"}')
if grep -q '"signup_disabled"' <<<"$body"; then
  echo "OK   registrazioni pubbliche disattivate"
else
  echo "::error::La registrazione pubblica NON è bloccata: $body"
  status=1
fi

# Login con credenziali inventate: deve rispondere "credenziali errate",
# non "provider email disattivato" (che bloccherebbe anche il tuo accesso).
body=$(curl -s -X POST "$url/auth/v1/token?grant_type=password" -H "apikey: $key" \
  -H "Content-Type: application/json" \
  -d '{"email":"nessuno@example.test","password":"Credenziali-Inventate-1234"}')
if grep -q '"invalid_credentials"' <<<"$body"; then
  echo "OK   login con email attivo"
else
  echo "::error::Login con email non disponibile: $body"
  status=1
fi

exit $status
