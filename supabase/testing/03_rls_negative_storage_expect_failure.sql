set role app_user;
set request.jwt.uid = '22222222-2222-2222-2222-222222222222';

-- user B trying to write a file into user A's storage folder
insert into storage.objects (bucket_id, name, owner)
  values ('photos', '11111111-1111-1111-1111-111111111111/draft1/evil.jpg', '22222222-2222-2222-2222-222222222222');
