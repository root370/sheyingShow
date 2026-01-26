
-- Restore the full statistics update function (count + cover)
-- This replaces the limited version from 20260118

CREATE OR REPLACE FUNCTION public.update_exhibition_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_exhibition_id uuid;
    new_cover_url text;
    new_count integer;
BEGIN
    -- Determine which exhibition to update
    IF (TG_OP = 'DELETE') THEN
        target_exhibition_id := OLD.exhibition_id;
    ELSE
        target_exhibition_id := NEW.exhibition_id;
    END IF;

    -- Calculate count
    SELECT count(*) INTO new_count
    FROM public.photos
    WHERE exhibition_id = target_exhibition_id;

    -- Get cover url (first photo by sort_order)
    SELECT url INTO new_cover_url
    FROM public.photos
    WHERE exhibition_id = target_exhibition_id
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;

    -- Update exhibition
    -- We update cover_url only if we found a new one, or if count is 0 (clear it?)
    -- Let's just update both.
    UPDATE public.exhibitions
    SET 
        cover_url = COALESCE(new_cover_url, cover_url), -- Keep existing if no photos found (optional, or set to null)
        photo_count = new_count
    WHERE id = target_exhibition_id;
    
    -- Explicitly set cover if we found one (to override COALESCE if needed, though COALESCE handles null new_cover)
    -- Actually, if new_cover_url IS NULL (no photos), we might want to keep the old cover or clear it.
    -- Let's stick to: if photos exist, use the first one.
    IF new_count > 0 AND new_cover_url IS NOT NULL THEN
         UPDATE public.exhibitions SET cover_url = new_cover_url WHERE id = target_exhibition_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger to recreate it with the correct function
DROP TRIGGER IF EXISTS on_photo_change ON public.photos;

CREATE TRIGGER on_photo_change
AFTER INSERT OR UPDATE OR DELETE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.update_exhibition_stats();
