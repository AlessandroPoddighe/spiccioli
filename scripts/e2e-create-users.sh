#!/usr/bin/env bash
# Crea gli utenti di prova per i test e2e sullo stack Supabase LOCALE
# (registrazioni pubbliche disattivate: si usa l'API admin con la secret key
# locale, che è un valore di sviluppo noto e non un segreto).
#
# Uso: SUPABASE_URL=http://127.0.0.1:54321 SECRET_KEY=... E2E_PASSWORD=... \
#        scripts/e2e-create-users.sh
set -euo pipefail

url="${SUPABASE_URL:-http://127.0.0.1:54321}"
key="${SECRET_KEY:?SECRET_KEY mancante}"
password="${E2E_PASSWORD:?E2E_PASSWORD mancante}"

case "$url" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "::error::Questo script funziona solo sullo stack locale ($url)"; exit 1 ;;
esac

# Un utente per progetto Playwright: i test girano in parallelo e ognuno
# registra il proprio fattore TOTP.
for project in iphone-webkit desktop-chromium; do
  email="e2e-${project}@example.test"
  code=$(curl -s -o /tmp/e2e-user.json -w '%{http_code}' -X POST "$url/auth/v1/admin/users" \
    -H "apikey: $key" -H "Authorization: Bearer $key" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"email_confirm\":true}")
  if [[ "$code" == "200" || "$code" == "201" ]]; then
    echo "creato $email"
  else
    echo "::error::creazione di $email fallita (HTTP $code): $(cat /tmp/e2e-user.json)"
    exit 1
  fi
done
