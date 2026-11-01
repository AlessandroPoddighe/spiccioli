#!/usr/bin/env bash
# Verifica, sullo stack Supabase locale avviato, che la Data API esponga SOLO
# lo schema "api" e che anon non possa usarlo (ADR-0006).
#
# Uso: SUPABASE_URL=http://127.0.0.1:54321 PUBLISHABLE_KEY=... scripts/check-data-api-exposure.sh
set -euo pipefail

url="${SUPABASE_URL:-http://127.0.0.1:54321}"
key="${PUBLISHABLE_KEY:?PUBLISHABLE_KEY mancante}"
status=0

call() {
  curl -s -X POST "$url/rest/v1/rpc/session_info" \
    -H "apikey: $key" -H "Content-Type: application/json" \
    -H "Content-Profile: $1" -d '{}'
}

for schema in public raw core mart internal; do
  body=$(call "$schema")
  if grep -q '"PGRST106"' <<<"$body"; then
    echo "OK   schema '$schema' non esposto"
  else
    echo "::error::Lo schema '$schema' risulta esposto dalla Data API: $body"
    status=1
  fi
done

body=$(call api)
if grep -q '"42501"' <<<"$body"; then
  echo "OK   anon non può usare lo schema api"
else
  echo "::error::anon riesce a usare lo schema api: $body"
  status=1
fi

exit $status
