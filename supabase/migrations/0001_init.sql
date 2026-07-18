-- Vantage — initial schema, RLS, storage policies, and credit RPC.
-- Run this once against a fresh Supabase project (SQL Editor or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  agency text,
  credits int not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'failed')),
  photo_urls jsonb not null default '[]',
  prompt text,
  aspect_ratio text not null default '9:16',
  segment_length_s int not null default 5 check (segment_length_s in (5, 8)),
  style text,
  progress int not null default 0 check (progress between 0 and 100),
  step text,
  result_url text,
  poster_url text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists tours_user_id_created_at_idx on tours (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Credits helpers (used by the generation pipeline to charge / refund)
-- ---------------------------------------------------------------------------
create or replace function public.increment_credits(p_user_id uuid, p_amount int)
returns void
language sql
security definer set search_path = public
as $$
  update profiles set credits = credits + p_amount where id = p_user_id;
$$;

create or replace function public.decrement_credit_if_available(p_user_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  affected int;
begin
  update profiles set credits = credits - 1
  where id = p_user_id and credits > 0;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table tours enable row level security;

drop policy if exists "profiles: select own" on profiles;
create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

drop policy if exists "tours: select own" on tours;
create policy "tours: select own" on tours
  for select using (auth.uid() = user_id);

drop policy if exists "tours: insert own" on tours;
create policy "tours: insert own" on tours
  for insert with check (auth.uid() = user_id);

drop policy if exists "tours: update own" on tours;
create policy "tours: update own" on tours
  for update using (auth.uid() = user_id);

-- Note: the generation pipeline (lib/generation/**) writes progress/status
-- updates using the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely —
-- that's expected for a trusted server-side background job.

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------
-- Both buckets are PRIVATE. Nothing is served from a public bucket URL —
-- the app always resolves short-lived signed URLs server-side (see
-- lib/supabase and the /api/tours routes), so storage RLS is the real
-- gate on who can read what, not obscurity of the URL.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('tours', 'tours', false)
on conflict (id) do update set public = false;

-- Folder convention for both buckets: {user_id}/{tour_id}/{filename}
drop policy if exists "photos: read own" on storage.objects;
create policy "photos: read own" on storage.objects
  for select using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "photos: insert own" on storage.objects;
create policy "photos: insert own" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "photos: delete own" on storage.objects;
create policy "photos: delete own" on storage.objects
  for delete using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "tours: read own" on storage.objects;
create policy "tours: read own" on storage.objects
  for select using (bucket_id = 'tours' and auth.uid()::text = (storage.foldername(name))[1]);

-- Tour videos/posters are written server-side only via the service-role key
-- (which bypasses these policies), so no insert/update policy is needed for
-- regular users on the `tours` bucket.
