
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_exhibitions_user_id ON exhibitions(user_id);
CREATE INDEX IF NOT EXISTS idx_exhibitions_status ON exhibitions(status);
