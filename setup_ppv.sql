-- PPV (Pay-Per-View) purchases table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ppv_purchases (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id    BIGINT REFERENCES movies(id) ON DELETE CASCADE,
  amount      DECIMAL(12,2) NOT NULL,
  tx_ref      TEXT UNIQUE,
  status      TEXT DEFAULT 'pending',   -- pending, successful, failed
  expires_at  TIMESTAMPTZ,              -- set to 48hrs after payment
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE ppv_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ppv" ON ppv_purchases FOR SELECT USING (auth.uid() = user_id);

-- Add ppv_price to admin_settings
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('ppv_price', '0')
ON CONFLICT (setting_key) DO NOTHING;

-- Add ppv_enabled to admin_settings
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('ppv_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;
