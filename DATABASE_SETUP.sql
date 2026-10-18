-- ==============================================================================
-- COMPLETE MASTER DATABASE SETUP SCRIPT
-- For: Turnkey Video & Movie Streaming Platform
--
-- Instructions:
-- 1. Open your Supabase Dashboard (https://supabase.com).
-- 2. Go to "SQL Editor" in the left sidebar.
-- 3. Click "New Query", paste this entire file, and click "RUN".
-- 4. Your database is now completely initialized and ready!
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'administrator', 'affiliate'
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  subscription_plan VARCHAR(50) DEFAULT 'free',
  extra_profile_slots INTEGER DEFAULT 0,
  referred_by BIGINT,
  genre_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- 3. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active plans are viewable by everyone" ON public.subscription_plans;
CREATE POLICY "Active plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);

-- Insert Default Starter Plans (Can be edited in Admin Dashboard)
INSERT INTO public.subscription_plans (id, name, price, duration_days, features, is_active) VALUES
(1, 'Daily Pass', 1000.00, 1, '24 Hours Full Access, Unlimited HD Movies & Series, Fast Streaming', true),
(2, '2 Weeks Pass', 3000.00, 14, '14 Days Full Access, All Movies & Series, Download for Offline', true),
(3, 'Monthly Pass', 8000.00, 30, '30 Days Full Access, VIP New Releases, Ultra HD Streaming, Priority Support', true)
ON CONFLICT (id) DO NOTHING;

-- 4. TRANSACTIONS TABLE (With Manual Payment Support)
CREATE TABLE IF NOT EXISTS public.transactions (
  id SERIAL PRIMARY KEY,
  tx_ref VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'successful', 'failed'
  plan_type VARCHAR(50) NOT NULL,
  duration_days INTEGER DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'automated', -- 'automated', 'manual'
  phone_number VARCHAR(100),
  flw_transaction_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist even on existing databases
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'UGX',
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS flw_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'automated',
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_tx_ref ON public.transactions(tx_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- 5. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view non-secret settings" ON public.admin_settings;
CREATE POLICY "Public can view non-secret settings" ON public.admin_settings FOR SELECT USING (true);

-- Insert Default Platform Settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
('platform_name', 'FlixOn'),
('platform_currency', 'UGX'),
('manual_payment_enabled', 'true'),
('manual_payment_title', 'Direct Mobile Money / Bank Transfer'),
('manual_payment_numbers', 'MTN Mobile Money: 0770000000 (Account Name)\nAirtel Money: 0750000000 (Account Name)'),
('manual_payment_instructions', '1. Send the exact plan amount to any of our official numbers above.\n2. Enter the phone number or account name you paid from below.\n3. Click "I Have Sent Money". Our team will verify and activate your subscription in 5-15 minutes!'),
('flutterwave_public_key', ''),
('flutterwave_secret_key', ''),
('flutterwave_webhook_secret', ''),
('tmdb_api_key', ''),
('app_download_url', ''),
('r2_account_id', ''),
('r2_bucket_name', ''),
('r2_access_key', ''),
('r2_secret_key', ''),
('cdn_domain', ''),
('free_mode_enabled', 'false'),
('series_enabled', 'true'),
('referrals_enabled', 'true'),
('referral_reward_type', 'flat'),
('referral_reward_amount', '1000'),
('referral_ugx_per_day', '500'),
('affiliate_cpa_enabled', 'true'),
('affiliate_commission_type', 'fixed'),
('affiliate_plan_1_reward', '200'),
('affiliate_plan_2_reward', '750'),
('affiliate_plan_3_reward', '2000'),
('affiliate_min_payout', '5000'),
('affiliate_ppc_enabled', 'true'),
('affiliate_cpm_rate', '5000'),
('ppv_enabled', 'true'),
('ppv_price', '3000'),
('promo_enabled', 'true'),
('profiles_enabled', 'true'),
('free_profiles_limit', '2'),
('extra_profile_price', '5000'),
('offer_enabled', 'true'),
('offer_duration_minutes', '60'),
('offer_discount_percent', '50'),
('vpn_blocking_enabled', 'false'),
('vpn_blocking_mode', 'checkout'),
('telegram_bot_token', ''),
('telegram_chat_id', '')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. MOVIES TABLE
CREATE TABLE IF NOT EXISTS public.movies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'movie',
  thumbnail_url TEXT,
  video_url TEXT,
  duration VARCHAR(50),
  release_year INTEGER,
  genres TEXT,
  cast_members TEXT,
  rating DECIMAL(3,1) DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_series BOOLEAN DEFAULT false,
  vj_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Movies viewable by everyone" ON public.movies;
CREATE POLICY "Movies viewable by everyone" ON public.movies FOR SELECT USING (true);

-- 7. SERIES SEASONS & EPISODES
CREATE TABLE IF NOT EXISTS public.series_seasons (
  id SERIAL PRIMARY KEY,
  movie_id INTEGER NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.series_episodes (
  id SERIAL PRIMARY KEY,
  season_id INTEGER NOT NULL REFERENCES public.series_seasons(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.series_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_episodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Seasons viewable by everyone" ON public.series_seasons;
CREATE POLICY "Seasons viewable by everyone" ON public.series_seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Episodes viewable by everyone" ON public.series_episodes;
CREATE POLICY "Episodes viewable by everyone" ON public.series_episodes FOR SELECT USING (true);

-- 8. WATCH HISTORY & FAVORITES (MY LIST)
CREATE TABLE IF NOT EXISTS public.watch_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User manage own watch history" ON public.watch_history;
CREATE POLICY "User manage own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User manage own favorites" ON public.favorites;
CREATE POLICY "User manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- 9. SUB-PROFILES (WHO'S WATCHING?)
CREATE TABLE IF NOT EXISTS public.sub_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  is_kids BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sub_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User manage own sub profiles" ON public.sub_profiles;
CREATE POLICY "User manage own sub profiles" ON public.sub_profiles FOR ALL USING (auth.uid() = user_id);

-- 10. PAY-PER-VIEW (RENTALS)
CREATE TABLE IF NOT EXISTS public.ppv_purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id BIGINT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  tx_ref TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, movie_id)
);

ALTER TABLE public.ppv_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ppv" ON public.ppv_purchases;
CREATE POLICY "Users view own ppv" ON public.ppv_purchases FOR SELECT USING (auth.uid() = user_id);

-- 11. PROMO CODES
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.promo_code_uses (
  id SERIAL PRIMARY KEY,
  code_id INTEGER NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE (code_id, user_id)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promo codes viewable by authenticated users" ON public.promo_codes;
CREATE POLICY "Promo codes viewable by authenticated users" ON public.promo_codes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users view own code uses" ON public.promo_code_uses;
CREATE POLICY "Users view own code uses" ON public.promo_code_uses FOR SELECT USING (auth.uid() = user_id);

-- 12. MOVIE REQUESTS
CREATE TABLE IF NOT EXISTS public.movie_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  title TEXT NOT NULL,
  year TEXT,
  tmdb_id TEXT,
  poster_path TEXT,
  vj_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.movie_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own requests" ON public.movie_requests;
CREATE POLICY "Users can view own requests" ON public.movie_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert requests" ON public.movie_requests;
CREATE POLICY "Users can insert requests" ON public.movie_requests FOR INSERT WITH CHECK (true);

-- 13. SUPPORT THREADS & MESSAGES
CREATE TABLE IF NOT EXISTS public.support_threads (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject TEXT DEFAULT 'Customer Support',
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL, -- 'user', 'admin'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own support threads" ON public.support_threads;
CREATE POLICY "Users manage own support threads" ON public.support_threads FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own support messages" ON public.support_messages;
CREATE POLICY "Users manage own support messages" ON public.support_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.support_threads WHERE id = support_messages.thread_id AND user_id = auth.uid())
);

-- 14. AFFILIATES & REFERRALS
CREATE TABLE IF NOT EXISTS public.affiliates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  total_earned DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(50) DEFAULT 'subscription',
  description TEXT,
  referred_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'rejected'
  payout_method VARCHAR(50) DEFAULT 'mobile_money',
  payout_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own affiliate" ON public.affiliates;
CREATE POLICY "Users view own affiliate" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);

-- 15. SECURITY LOGS
CREATE TABLE IF NOT EXISTS public.security_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'INFO',
  details TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 16. AUTO-CREATE USER PROFILE TRIGGER UPON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username, role, subscription_plan)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'user',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 17. NOTIFY SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- SETUP COMPLETE!
-- To make yourself Administrator:
-- UPDATE public.user_profiles SET role = 'administrator' WHERE email = 'your-email@example.com';
-- ==============================================================================
