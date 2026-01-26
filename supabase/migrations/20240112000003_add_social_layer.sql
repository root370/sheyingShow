
-- Create Collections Table (For "Steal the Magnet")
CREATE TABLE public.collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exhibition_id uuid REFERENCES public.exhibitions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, exhibition_id)
);

-- Create Guestbook Entries Table
CREATE TABLE public.guestbook_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id uuid REFERENCES public.exhibitions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- or profiles(id) if we want to enforce profile existence
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Policies for Collections
CREATE POLICY "Users can view their own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for Guestbook
CREATE POLICY "Anyone can view guestbook entries" ON public.guestbook_entries
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create guestbook entries" ON public.guestbook_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to delete their own guestbook entries
CREATE POLICY "Users can delete their own guestbook entries" ON public.guestbook_entries
  FOR DELETE USING (auth.uid() = user_id);
