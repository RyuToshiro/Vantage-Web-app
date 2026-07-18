-- Minimal stand-ins for the pieces of Supabase's platform schema that our
-- migration references, so we can run the REAL migration file against a
-- real Postgres and sanity-check it, not just eyeball it.

create schema if not exists auth;
create schema if not exists storage;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

-- Supabase sets this from the request JWT; we fake it with a settable GUC
-- so we can simulate "logged in as user X" per session for RLS testing.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.uid', true), '')::uuid;
$$;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid
);

-- Real Supabase implementation splits an object path on '/' and returns
-- everything but the last segment (the filename) as a text[].
create or replace function storage.foldername(name text) returns text[]
language sql immutable
as $$
  select case
    when array_length(regexp_split_to_array(name, '/'), 1) > 1
      then (regexp_split_to_array(name, '/'))[1 : array_length(regexp_split_to_array(name, '/'), 1) - 1]
    else '{}'::text[]
  end;
$$;

alter table storage.objects enable row level security;
