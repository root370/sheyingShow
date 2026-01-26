-- Create the exhibitions bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('exhibitions', 'exhibitions', true)
on conflict (id) do nothing;

-- Policy 1: Allow Public Read Access
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'exhibitions' );

-- Policy 2: Allow Public Upload Access
drop policy if exists "Public Upload" on storage.objects;
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'exhibitions' );

-- Policy 3: Allow Public Update/Delete
drop policy if exists "Public Update" on storage.objects;
create policy "Public Update"
on storage.objects for update
using ( bucket_id = 'exhibitions' );

drop policy if exists "Public Delete" on storage.objects;
create policy "Public Delete"
on storage.objects for delete
using ( bucket_id = 'exhibitions' );
