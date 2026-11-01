-- Test di sicurezza trasversali (ADR-0006). Devono restare verdi a ogni fase:
-- quando si aggiunge una tabella senza RLS o un grant di troppo, falliscono.
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

-- Schemi previsti ------------------------------------------------------------
select has_schema('raw');
select has_schema('core');
select has_schema('mart');
select has_schema('internal');
select has_schema('api');

-- anon non usa nessuno schema applicativo --------------------------------------
select ok(not has_schema_privilege('anon', s, 'USAGE'), 'anon non ha USAGE su ' || s)
from unnest(array['raw', 'core', 'mart', 'internal', 'api']) as s;

-- authenticated vede solo api ----------------------------------------------------
select ok(not has_schema_privilege('authenticated', s, 'USAGE'),
          'authenticated non ha USAGE su ' || s)
from unnest(array['raw', 'mart', 'internal']) as s;
select ok(has_schema_privilege('authenticated', 'api', 'USAGE'),
          'authenticated ha USAGE su api');

-- RLS attiva su OGNI tabella degli schemi applicativi e di public -----------------
select is_empty(
  $$ select n.nspname || '.' || c.relname
     from pg_catalog.pg_class c
     join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where c.relkind in ('r', 'p')
       and n.nspname in ('raw', 'core', 'mart', 'internal', 'api', 'public')
       and not c.relrowsecurity $$,
  'tutte le tabelle hanno Row Level Security attiva'
);

-- Nessun grant a anon/authenticated/PUBLIC su oggetti degli schemi interni ---------
select is_empty(
  $$ select table_schema || '.' || table_name || ' → ' || grantee || ' ' || privilege_type
     from information_schema.role_table_grants
     where table_schema in ('raw', 'mart', 'internal')
       and grantee in ('anon', 'authenticated', 'PUBLIC') $$,
  'nessun privilegio su tabelle/viste di raw, mart, internal per i ruoli del client'
);

-- Nessuna funzione di api eseguibile da anon -----------------------------------
select is_empty(
  $$ select p.oid::regprocedure::text
     from pg_catalog.pg_proc p
     join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'api'
       and has_function_privilege('anon', p.oid, 'EXECUTE') $$,
  'nessuna funzione di api è eseguibile da anon'
);

-- Nessuna funzione di internal/raw/core/mart eseguibile dai ruoli del client ----
select is_empty(
  $$ select p.oid::regprocedure::text || ' → ' || r
     from pg_catalog.pg_proc p
     join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     cross join unnest(array['anon', 'authenticated']) as r
     where n.nspname in ('raw', 'core', 'mart', 'internal')
       and has_function_privilege(r, p.oid, 'EXECUTE') $$,
  'nessuna funzione interna è eseguibile da anon o authenticated'
);

-- Ogni funzione security definer fissa il search_path ---------------------------
select is_empty(
  $$ select p.oid::regprocedure::text
     from pg_catalog.pg_proc p
     join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('raw', 'core', 'mart', 'internal', 'api')
       and p.prosecdef
       and not exists (
         select 1 from unnest(coalesce(p.proconfig, '{}')) as c
         where c like 'search_path=%'
       ) $$,
  'tutte le funzioni security definer hanno search_path fissato'
);

-- api.session_info() --------------------------------------------------------------
select set_config(
  'request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-000000000001", "role": "authenticated", "aal": "aal2"}',
  true
);
set local role authenticated;
select is(api.session_info() ->> 'user_id', '00000000-0000-4000-8000-000000000001',
          'session_info restituisce l''utente del JWT');
select is(api.session_info() ->> 'aal', 'aal2', 'session_info restituisce il livello MFA');
reset role;

set local role anon;
select throws_ok('select api.session_info()', '42501', null,
                 'anon non può chiamare api.session_info');
reset role;

select * from finish();
rollback;
