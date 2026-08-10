-- ================================================================
-- FLIXON REFERRAL SYSTEM SQL
-- ================================================================

-- 1. Track which user referred who
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending' (signed up, not paid), 'converted' (paid)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (referred_id) -- A user can only be referred by one person
);

-- 2. Track earnings and withdrawals for users
CREATE TABLE IF NOT EXISTS referral_earnings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_earned DECIMAL(12,2) DEFAULT 0.00,
  amount_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  amount_converted DECIMAL(12,2) DEFAULT 0.00, -- Amount converted to watch days
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- 3. Log of specific payouts/conversions
CREATE TABLE IF NOT EXISTS payout_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL, -- 'cash_withdrawal', 'watch_days_conversion'
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  payment_details TEXT, -- e.g. Phone number for Mobile Money
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add referral code to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS ref_code TEXT UNIQUE;

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do anything, users can see their own
CREATE POLICY "Users can see their own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can see their own earnings" ON referral_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can see their own payouts" ON payout_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payout requests" ON payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to generate a unique ref code for new users automatically
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := substr(md5(random()::text), 0, 9);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_ref_code ON user_profiles;
CREATE TRIGGER tr_generate_ref_code
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_ref_code();
