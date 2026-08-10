INSERT INTO admin_settings (setting_key, setting_value) VALUES
  ('referrals_enabled', 'false'),
  ('referral_reward_type', 'flat'),
  ('referral_reward_amount', '0')
ON CONFLICT (setting_key) DO NOTHING;
