-- Add extra_profile_slots column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS extra_profile_slots INTEGER DEFAULT 0;

-- Ensure admin_settings have default values for the new settings
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES 
  ('profiles_enabled', 'true'),
  ('free_profiles_limit', '2'),
  ('extra_profile_price', '5000')
ON CONFLICT (setting_key) DO NOTHING;
