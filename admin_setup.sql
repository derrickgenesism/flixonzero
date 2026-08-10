-- 1. Add admin role to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- 2. Create admin settings table to store keys (TMDB, Flutterwave, etc.)
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default empty settings so they can be edited in the admin panel
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
('tmdb_api_key', ''),
('flutterwave_public_key', ''),
('flutterwave_secret_key', ''),
('flutterwave_encryption_key', '')
ON CONFLICT (setting_key) DO NOTHING;
