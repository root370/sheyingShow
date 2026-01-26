-- Enable RLS on Storage Objects (usually enabled by default, but good to ensure)
-- Note: Storage is handled in the `storage.objects` table in the `storage` schema.

-- Policy 1: Allow Public Read Access (Anyone can view photos)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'exhibitions' );

-- Policy 2: Allow Public Upload Access (Anyone can upload photos)
-- WARNING: In a real app, you'd restrict this to authenticated users.
-- But for this demo, we allow anon uploads.
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'exhibitions' );

-- Policy 3: Allow Public Update/Delete (Optional, if you want users to edit/delete)
-- create policy "Public Update" on storage.objects for update using ( bucket_id = 'exhibitions' );
-- create policy "Public Delete" on storage.objects for delete using ( bucket_id = 'exhibitions' );
