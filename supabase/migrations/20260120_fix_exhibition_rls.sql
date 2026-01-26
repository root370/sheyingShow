
-- Allow users to update their own exhibitions
DROP POLICY IF EXISTS "Users can update their own exhibitions" ON public.exhibitions;

CREATE POLICY "Users can update their own exhibitions"
ON public.exhibitions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure users can insert photos if they own the exhibition (more secure than public)
-- But for now, we leave the public insert policy if it exists, or add this as valid alternative.
-- The public policy in schema.sql allows (true).

-- Ensure users can update photos (if needed in future, though currently we delete/insert)
DROP POLICY IF EXISTS "Users can update photos of their own exhibitions" ON public.photos;

CREATE POLICY "Users can update photos of their own exhibitions"
ON public.photos
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM public.exhibitions WHERE id = photos.exhibition_id
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.exhibitions WHERE id = photos.exhibition_id
    )
);
