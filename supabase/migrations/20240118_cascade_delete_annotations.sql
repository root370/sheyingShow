-- Enable cascade delete for annotations when photos are deleted

ALTER TABLE annotations
DROP CONSTRAINT IF EXISTS annotations_photo_id_fkey;

ALTER TABLE annotations
ADD CONSTRAINT annotations_photo_id_fkey
FOREIGN KEY (photo_id)
REFERENCES photos(id)
ON DELETE CASCADE;

-- Also update RLS for annotations if needed (optional but good practice)
DROP POLICY IF EXISTS "Users can delete annotations of their own photos" ON annotations;

CREATE POLICY "Users can delete annotations of their own photos"
ON annotations
FOR DELETE
USING (
    auth.uid() IN (
        SELECT user_id FROM profiles WHERE id = annotations.user_id
    )
);
