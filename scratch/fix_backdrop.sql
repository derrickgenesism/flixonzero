-- Run this in Supabase SQL Editor to fix the missing column error
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;

-- NOTE: If you still get a schema cache error after running this,
-- go to your Supabase Dashboard -> Project Settings -> API -> click "Reload schema cache"
