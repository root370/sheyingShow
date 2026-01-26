
-- Create Annotations Table
CREATE TABLE public.annotations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  x_coord float NOT NULL CHECK (x_coord >= 0 AND x_coord <= 100),
  y_coord float NOT NULL CHECK (y_coord >= 0 AND y_coord <= 100),
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Policies for Annotations
CREATE POLICY "Anyone can view annotations" ON public.annotations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create annotations" ON public.annotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations" ON public.annotations
  FOR DELETE USING (auth.uid() = user_id);
