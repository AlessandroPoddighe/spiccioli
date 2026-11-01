-- Fase 1 — Schemi e privilegi di base (ADR-0006).
--
--   raw       risposte Enable Banking così come arrivano (append-only), mai esposto
--   core      modello normalizzato, mai esposto dalla Data API
--   mart      viste analitiche, mai esposto
--   internal  funzioni di servizio, mai esposto
--   api       UNICO schema esposto dalla Data API (config.toml: [api] schemas)
--
-- Regola: nessun privilegio implicito. Ogni oggetto riceve grant espliciti nella
-- migrazione che lo crea; RLS attiva su ogni tabella, in qualunque schema.

create schema if not exists raw;
create schema if not exists core;
create schema if not exists mart;
create schema if not exists internal;
create schema if not exists api;

comment on schema raw is 'Risposte Enable Banking così come arrivano. Append-only, non esposto.';
comment on schema core is 'Modello dati normalizzato. Non esposto dalla Data API.';
comment on schema mart is 'Viste e viste materializzate analitiche. Non esposto.';
comment on schema internal is 'Funzioni di servizio. Non esposto, mai eseguibile da anon/authenticated.';
comment on schema api is 'Unico schema esposto dalla Data API: viste e RPC per il frontend.';

-- Nessun accesso di default agli schemi interni.
revoke all on schema raw, core, mart, internal, api from public;
revoke all on schema raw, core, mart, internal, api from anon, authenticated;

-- Il frontend (utente autenticato) vede solo lo schema api; anon nulla.
grant usage on schema api to authenticated;

-- Le Edge Functions lavorano come service_role (Data API) o come postgres
-- (connessione diretta): accesso completo agli schemi interni.
grant usage on schema raw, core, mart, internal, api to service_role;

-- Niente privilegi automatici sui nuovi oggetti creati dalle migrazioni:
-- ogni grant deve essere esplicito.
alter default privileges for role postgres in schema raw, core, mart, internal, api
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema raw, core, mart, internal, api
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema raw, core, mart, internal, api
  revoke execute on functions from public, anon, authenticated;

-- Lo schema public non è esposto, ma togliamo comunque i privilegi automatici
-- concessi da Supabase su tabelle/funzioni nuove create da postgres.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- service_role riceve i privilegi sui nuovi oggetti degli schemi interni.
alter default privileges for role postgres in schema raw, core, mart, internal, api
  grant all on tables to service_role;
alter default privileges for role postgres in schema raw, core, mart, internal, api
  grant all on sequences to service_role;
alter default privileges for role postgres in schema raw, core, mart, internal, api
  grant execute on functions to service_role;

-- ---------------------------------------------------------------------------
-- api.session_info(): conferma al frontend identità e livello di garanzia
-- (aal1/aal2) visti dal database. Non legge tabelle: security invoker.
-- ---------------------------------------------------------------------------
create or replace function api.session_info()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'aal', coalesce(auth.jwt() ->> 'aal', 'aal1'),
    'server_time', now()
  );
$$;

comment on function api.session_info() is
  'Identità e livello MFA della sessione corrente, come visti dal database.';

revoke execute on function api.session_info() from public, anon;
grant execute on function api.session_info() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- internal.health(): usata dalla Edge Function health (connessione diretta).
-- Restituisce solo metadati non sensibili.
-- ---------------------------------------------------------------------------
create or replace function internal.health()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'db', true,
    'server_time', now(),
    'schemas', (
      select jsonb_agg(nspname order by nspname)
      from pg_catalog.pg_namespace
      where nspname in ('raw', 'core', 'mart', 'internal', 'api')
    )
  );
$$;

revoke execute on function internal.health() from public, anon, authenticated;
grant execute on function internal.health() to service_role;
