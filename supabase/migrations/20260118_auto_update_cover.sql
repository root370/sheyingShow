-- Function to update cover_url automatically
CREATE OR REPLACE FUNCTION public.update_exhibition_cover()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if sort_order is 0
  -- We use the new URL to update the exhibition cover
  IF NEW.sort_order = 0 THEN
    UPDATE public.exhibitions
    SET cover_url = NEW.url
    WHERE id = NEW.exhibition_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_photo_change ON public.photos;

CREATE TRIGGER on_photo_change
AFTER INSERT OR UPDATE OF url, sort_order ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.update_exhibition_cover();
