-- Behavioral RLS + RPC tests, run via ./supabase/testing/run.sh
--
-- These exercise the REAL migration (0001_init.sql) against a real
-- Postgres, as a real non-superuser role (superusers bypass RLS entirely,
-- which would make this a no-op test), simulating two different signed-in
-- users the way Supabase's PostgREST layer would.

create role app_user nosuperuser nobypassrls login;
grant usage on schema public, storage to app_user;
grant select, insert, update on public.profiles, public.tours to app_user;
grant select, insert, delete on storage.objects to app_user;
grant select on storage.buckets to app_user;
grant execute on function public.increment_credits(uuid, int) to app_user;
grant execute on function public.decrement_credit_if_available(uuid) to app_user;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'agent-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'agent-b@example.com');

\echo '>>> expect: both users auto-provisioned with 5 credits by the signup trigger'
select id, credits from public.profiles order by id;

set role app_user;
set request.jwt.uid = '11111111-1111-1111-1111-111111111111';

insert into public.tours (user_id, photo_urls) values
  ('11111111-1111-1111-1111-111111111111', '["a/x/1.jpg","a/x/2.jpg"]');
insert into storage.objects (bucket_id, name, owner) values
  ('photos', '11111111-1111-1111-1111-111111111111/draft1/1.jpg', '11111111-1111-1111-1111-111111111111');

\echo '>>> expect: 1 (user A sees their own tour)'
select count(*) from public.tours;

reset role;
reset request.jwt.uid;
set role app_user;
set request.jwt.uid = '22222222-2222-2222-2222-222222222222';

\echo '>>> expect: 0, 0, 0 (user B cannot see user A''s tours or photos via any query shape)'
select count(*) from public.tours where user_id = '11111111-1111-1111-1111-111111111111';
select count(*) from public.tours;
select count(*) from storage.objects where name like '11111111%';

\echo '>>> expect: UPDATE 0 (user B cannot touch user A''s credits)'
update public.profiles set credits = 999 where id = '11111111-1111-1111-1111-111111111111';
select credits from public.profiles where id = '11111111-1111-1111-1111-111111111111';

reset role;
reset request.jwt.uid;
set role app_user;
set request.jwt.uid = '11111111-1111-1111-1111-111111111111';

\echo '>>> credit RPCs: charge to 0, fail closed on the 6th, then refund'
select public.decrement_credit_if_available('11111111-1111-1111-1111-111111111111');
select public.decrement_credit_if_available('11111111-1111-1111-1111-111111111111');
select public.decrement_credit_if_available('11111111-1111-1111-1111-111111111111');
select public.decrement_credit_if_available('11111111-1111-1111-1111-111111111111');
select public.decrement_credit_if_available('11111111-1111-1111-1111-111111111111');
\echo '>>> expect: 0'
select credits from public.profiles where id = '11111111-1111-1111-1111-111111111111';
\echo '>>> expect: f (false) — fails closed, does not go negative'
select public.decrement_credit_if_available('11111111-1111-1111-1111-111111111111');
select public.increment_credits('11111111-1111-1111-1111-111111111111', 1);
\echo '>>> expect: 1 (refunded)'
select credits from public.profiles where id = '11111111-1111-1111-1111-111111111111';
