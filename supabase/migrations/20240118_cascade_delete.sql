-- Enable cascade delete for smoother UX and data integrity

-- 1. Photos Table
ALTER TABLE photos 
DROP CONSTRAINT IF EXISTS photos_exhibition_id_fkey;

ALTER TABLE photos
ADD CONSTRAINT photos_exhibition_id_fkey
FOREIGN KEY (exhibition_id)
REFERENCES exhibitions(id)
ON DELETE CASCADE;

-- 2. Collections Table
ALTER TABLE collections 
DROP CONSTRAINT IF EXISTS collections_exhibition_id_fkey;

ALTER TABLE collections
ADD CONSTRAINT collections_exhibition_id_fkey
FOREIGN KEY (exhibition_id)
REFERENCES exhibitions(id)
ON DELETE CASCADE;

-- 3. Guestbook Table
ALTER TABLE guestbook_entries 
DROP CONSTRAINT IF EXISTS guestbook_entries_exhibition_id_fkey;

ALTER TABLE guestbook_entries
ADD CONSTRAINT guestbook_entries_exhibition_id_fkey
FOREIGN KEY (exhibition_id)
REFERENCES exhibitions(id)
ON DELETE CASCADE;

-- 4. RLS: Allow users to delete their own exhibitions
DROP POLICY IF EXISTS "Users can delete their own exhibitions" ON exhibitions;

CREATE POLICY "Users can delete their own exhibitions"
ON exhibitions
FOR DELETE
USING (auth.uid() = user_id);

-- 5. RLS: Allow users to delete photos from their exhibitions (needed for Editor delete/replace logic)
DROP POLICY IF EXISTS "Users can delete photos of their own exhibitions" ON photos;

CREATE POLICY "Users can delete photos of their own exhibitions"
ON photos
FOR DELETE
USING (
    auth.uid() IN (
        SELECT user_id FROM exhibitions WHERE id = photos.exhibition_id
    )
);
