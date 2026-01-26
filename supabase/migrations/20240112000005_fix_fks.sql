
-- Fix Guestbook Entries FK to reference profiles instead of auth.users
ALTER TABLE public.guestbook_entries
DROP CONSTRAINT IF EXISTS guestbook_entries_user_id_fkey;

ALTER TABLE public.guestbook_entries
ADD CONSTRAINT guestbook_entries_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Fix Annotations FK to reference profiles instead of auth.users
ALTER TABLE public.annotations
DROP CONSTRAINT IF EXISTS annotations_user_id_fkey;

ALTER TABLE public.annotations
ADD CONSTRAINT annotations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
