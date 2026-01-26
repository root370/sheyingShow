-- Create a table to store AI analysis results for photos
CREATE TABLE IF NOT EXISTS public.photo_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    analysis_result JSONB NOT NULL, -- Stores the full JSON result from Coze
    model_version TEXT DEFAULT 'v1', -- To track which prompt/model was used
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one analysis per photo (for a given version)
    UNIQUE(photo_id, model_version)
);

-- Enable RLS
ALTER TABLE public.photo_analysis ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since analysis is shown on public exhibition pages)
CREATE POLICY "Public analysis access" ON public.photo_analysis
    FOR SELECT USING (true);

-- Allow authenticated users (authors) to insert analysis for their photos
CREATE POLICY "Authors can insert analysis" ON public.photo_analysis
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.photos 
            JOIN public.exhibitions ON photos.exhibition_id = exhibitions.id
            WHERE photos.id = photo_analysis.photo_id 
            AND exhibitions.user_id = auth.uid()
        )
    );
