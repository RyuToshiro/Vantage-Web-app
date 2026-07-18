-- These two statements are each expected to ERROR with "new row violates
-- row-level security policy" — run.sh checks for a non-zero exit, and
-- treats that as the test passing. A zero exit here (i.e. the insert
-- silently succeeding) means RLS regressed and would be the real failure.

set role app_user;
set request.jwt.uid = '11111111-1111-1111-1111-111111111111';

-- user A trying to create a tour that belongs to user B
insert into public.tours (user_id, photo_urls)
  values ('22222222-2222-2222-2222-222222222222', '["x.jpg","y.jpg"]');
