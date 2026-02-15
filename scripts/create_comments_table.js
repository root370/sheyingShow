require('dotenv').config();
const { Client } = require('pg');

// Parse the connection string
const connectionString = process.env.DATABASE_URL;

// Disable SSL verification for simplicity (Supabase requires SSL but self-signed certs are common issues in node)
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const createTableSQL = `
-- Create comments table if not exists
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;

-- Create Policies
CREATE POLICY "Public comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    await client.query(createTableSQL);
    console.log('✅ Comments table created successfully.');
    
  } catch (err) {
    console.error('❌ Error creating table:', err);
  } finally {
    await client.end();
  }
}

run();