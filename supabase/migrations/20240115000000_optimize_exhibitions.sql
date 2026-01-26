-- Add columns
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS photo_count integer DEFAULT 0;

-- Function to update exhibition stats
CREATE OR REPLACE FUNCTION update_exhibition_stats()
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
    FROM photos
    WHERE exhibition_id = target_exhibition_id;

    -- Get cover url (first photo by sort_order)
    SELECT url INTO new_cover_url
    FROM photos
    WHERE exhibition_id = target_exhibition_id
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1;

    -- Update exhibition
    UPDATE exhibitions
    SET 
        cover_url = new_cover_url,
        photo_count = new_count
    WHERE id = target_exhibition_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS on_photo_change ON photos;
CREATE TRIGGER on_photo_change
AFTER INSERT OR UPDATE OR DELETE ON photos
FOR EACH ROW
EXECUTE FUNCTION update_exhibition_stats();

-- Initial population of data
DO $$
DECLARE
    r RECORD;
    p_url text;
    p_count integer;
BEGIN
    FOR r IN SELECT id FROM exhibitions LOOP
        -- Get count
        SELECT count(*) INTO p_count
        FROM photos
        WHERE exhibition_id = r.id;

        -- Get cover
        SELECT url INTO p_url
        FROM photos
        WHERE exhibition_id = r.id
        ORDER BY sort_order ASC, created_at ASC
        LIMIT 1;

        -- Update
        UPDATE exhibitions
        SET 
            cover_url = p_url,
            photo_count = p_count
        WHERE id = r.id;
    END LOOP;
END $$;
