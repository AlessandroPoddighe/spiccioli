#!/usr/bin/env bash
# Blocca le migrazioni distruttive o non retrocompatibili (CLAUDE.md).
#
# Uso: scripts/check-destructive-migrations.sh <ref-base>   (es. origin/main)
#
# Controlla solo le migrazioni AGGIUNTE rispetto alla base e fallisce se
# contengono DROP, RENAME, ALTER ... TYPE, TRUNCATE o DELETE senza WHERE.
# Controlla anche che le migrazioni già esistenti non siano state modificate.
# Per autorizzare una migrazione distruttiva l'utente aggiunge alla PR
# l'etichetta "migrazione-distruttiva-approvata" (ALLOW_DESTRUCTIVE=true in CI).
set -euo pipefail

base="${1:-origin/main}"
dir="supabase/migrations"

if ! git rev-parse --verify --quiet "$base" >/dev/null; then
  echo "Riferimento base '$base' non trovato: nessun confronto possibile." >&2
  exit 1
fi

status=0

# 1) Migrazioni esistenti modificate o cancellate: mai ammesso.
changed=$(git diff --name-only --diff-filter=MDR "$base"...HEAD -- "$dir" || true)
if [[ -n "$changed" ]]; then
  echo "::error::Migrazioni già esistenti modificate/cancellate (creane una nuova):"
  echo "$changed"
  status=1
fi

# 2) Nuove migrazioni: niente operazioni distruttive senza approvazione.
added=$(git diff --name-only --diff-filter=A "$base"...HEAD -- "$dir" | grep -E '\.sql$' || true)
pattern='\b(drop[[:space:]]+(table|column|schema|view|materialized|function|index|type|policy|trigger|extension|sequence)|rename[[:space:]]+(to|column)|alter[[:space:]]+column[[:space:]]+[a-z_"]+[[:space:]]+(set[[:space:]]+data[[:space:]]+)?type|truncate)\b'

for file in $added; do
  # Rimuove i commenti "--" prima di cercare.
  body=$(sed -e 's/--.*$//' "$file")
  hits=$(grep -inE "$pattern" <<<"$body" || true)
  deletes=$(grep -inE '\bdelete[[:space:]]+from\b' <<<"$body" | grep -viE '\bwhere\b' || true)
  if [[ -n "$hits" || -n "$deletes" ]]; then
    if [[ "${ALLOW_DESTRUCTIVE:-false}" == "true" ]]; then
      echo "::warning file=$file::Operazioni distruttive APPROVATE dall'utente (etichetta PR)."
    else
      echo "::error file=$file::Operazioni distruttive senza approvazione:"
      [[ -n "$hits" ]] && echo "$hits"
      [[ -n "$deletes" ]] && echo "$deletes"
      status=1
    fi
  fi
done

if [[ $status -eq 0 ]]; then
  echo "Migrazioni OK: solo modifiche additive."
fi
exit $status
