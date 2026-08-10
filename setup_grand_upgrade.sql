-- ================================================================
-- FLIXON GRAND UPGRADE SQL — Run in Supabase SQL Editor
-- Covers: PPV, Promo Codes, Gift Cards, Ratings, Notifications,
--         Collections, User Prefs, Coming Soon, View Counts, SEO
-- ================================================================

-- 1. Add new columns to movies table
ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS view_count       BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imdb_rating      DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS content_rating   TEXT,
  ADD COLUMN IF NOT EXISTS runtime          INTEGER,        -- in minutes
  ADD COLUMN IF NOT EXISTS language         TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS release_date     DATE,
  ADD COLUMN IF NOT EXISTS trailer_url      TEXT,
  ADD COLUMN IF NOT EXISTS cast_list        JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS director         TEXT,
  ADD COLUMN IF NOT EXISTS seo_title        TEXT,
  ADD COLUMN IF NOT EXISTS seo_description  TEXT,
  ADD COLUMN IF NOT EXISTS is_coming_soon   BOOLEAN DEFAULT FALSE;

-- 2. Add new columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS genre_preferences  TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_done    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar             TEXT,
  ADD COLUMN IF NOT EXISTS username           TEXT,
  ADD COLUMN IF NOT EXISTS plan_type          TEXT DEFAULT 'free';

-- 3. Notifications table (broadcast & per-user)
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,   -- NULL = broadcast to all
  type        TEXT NOT NULL DEFAULT 'general',
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own or broadcast notifications" ON notifications;
CREATE POLICY "Users view own or broadcast notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 4. Ratings & Reviews
CREATE TABLE IF NOT EXISTS ratings (
  id           BIGSERIAL PRIMARY KEY,
  movie_id     BIGINT REFERENCES movies(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
  review_text  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (movie_id, user_id)
);
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read ratings" ON ratings;
CREATE POLICY "Anyone can read ratings" ON ratings FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Logged in users can rate" ON ratings;
CREATE POLICY "Logged in users can rate" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own rating" ON ratings;
CREATE POLICY "Users update own rating" ON ratings FOR UPDATE USING (auth.uid() = user_id);

-- 5. PPV (Pay-Per-View) purchases
CREATE TABLE IF NOT EXISTS ppv_purchases (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id    BIGINT REFERENCES movies(id) ON DELETE CASCADE,
  amount      DECIMAL(12,2) NOT NULL,
  tx_ref      TEXT UNIQUE,
  status      TEXT DEFAULT 'pending',
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, movie_id)
);
ALTER TABLE ppv_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ppv" ON ppv_purchases;
CREATE POLICY "Users view own ppv" ON ppv_purchases FOR SELECT USING (auth.uid() = user_id);

-- 6. Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id             BIGSERIAL PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  discount_type  TEXT NOT NULL DEFAULT 'percentage',  -- percentage | flat
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses       INTEGER,
  use_count      INTEGER DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_code_uses (
  id       BIGSERIAL PRIMARY KEY,
  code_id  BIGINT REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(code_id, user_id)
);

-- 7. Gift Cards
CREATE TABLE IF NOT EXISTS gift_cards (
  id          BIGSERIAL PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  days        INTEGER NOT NULL DEFAULT 30,
  used_by     UUID REFERENCES auth.users(id),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 8. Collections (curated playlists)
CREATE TABLE IF NOT EXISTS collections (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail   TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active collections" ON collections FOR SELECT USING (is_active = TRUE);

CREATE TABLE IF NOT EXISTS collection_items (
  id             BIGSERIAL PRIMARY KEY,
  collection_id  BIGINT REFERENCES collections(id) ON DELETE CASCADE,
  movie_id       BIGINT REFERENCES movies(id) ON DELETE CASCADE,
  sort_order     INTEGER DEFAULT 0,
  UNIQUE(collection_id, movie_id)
);
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collection items" ON collection_items FOR SELECT USING (TRUE);

-- 9. PPV settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES ('ppv_enabled', 'false') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO admin_settings (setting_key, setting_value) VALUES ('ppv_price', '0') ON CONFLICT (setting_key) DO NOTHING;

-- 10. Increment view_count function (called by video player)
CREATE OR REPLACE FUNCTION increment_view_count(p_movie_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE movies SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_movie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- DONE! All tables and columns created.
-- ================================================================
