-- 1. Add new columns to movies table for the TMDB importer/creator
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS release_year VARCHAR(10),
ADD COLUMN IF NOT EXISTS actors TEXT;

-- 2. Create Watch History Table to track user progress
CREATE TABLE IF NOT EXISTS watch_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, movie_id)
);

-- Index for fast "Continue Watching" lookups
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, updated_at DESC);
