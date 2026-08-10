-- Create sub_profiles table
CREATE TABLE IF NOT EXISTS public.sub_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  genre_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alter watch_history
ALTER TABLE public.watch_history ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.sub_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.watch_history DROP CONSTRAINT IF EXISTS watch_history_user_id_movie_id_key;
ALTER TABLE public.watch_history ADD CONSTRAINT watch_history_profile_id_movie_id_key UNIQUE (profile_id, movie_id);

-- Alter favorites
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.sub_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_movie_id_key;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_profile_id_movie_id_key UNIQUE (profile_id, movie_id);

-- Create default profiles for existing users and migrate their history/favorites
DO $$
DECLARE
  usr RECORD;
  new_profile_id UUID;
BEGIN
  FOR usr IN SELECT id, email FROM auth.users LOOP
    -- Create a main profile for each user if they don't have one
    IF NOT EXISTS (SELECT 1 FROM public.sub_profiles WHERE user_id = usr.id) THEN
      INSERT INTO public.sub_profiles (user_id, name)
      VALUES (usr.id, 'Main Profile')
      RETURNING id INTO new_profile_id;

      -- Update watch_history for this user
      UPDATE public.watch_history 
      SET profile_id = new_profile_id 
      WHERE user_id = usr.id AND profile_id IS NULL;

      -- Update favorites for this user
      UPDATE public.favorites 
      SET profile_id = new_profile_id 
      WHERE user_id = usr.id AND profile_id IS NULL;
    END IF;
  END LOOP;
END $$;
