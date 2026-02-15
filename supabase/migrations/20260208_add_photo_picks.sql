-- Add picks_count to photos
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS picks_count INTEGER DEFAULT 0;

-- Create photo_picks table
CREATE TABLE IF NOT EXISTS public.photo_picks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, photo_id)
);

-- RLS for photo_picks
ALTER TABLE public.photo_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public picks access" ON public.photo_picks
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can pick" ON public.photo_picks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own picks" ON public.photo_picks
    FOR DELETE USING (auth.uid() = user_id);

-- RPC Functions for atomic counter updates
CREATE OR REPLACE FUNCTION increment_picks_count(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.photos
  SET picks_count = COALESCE(picks_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_picks_count(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.photos
  SET picks_count = GREATEST(0, COALESCE(picks_count, 0) - 1)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
