-- This script ensures all tables and columns exist and are up to date!

-- 1. Ensure user_profiles has subscription columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);

-- 2. Ensure transactions table exists with ALL columns
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tx_ref VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  status VARCHAR(50) DEFAULT 'pending',
  plan_type VARCHAR(50) NOT NULL,
  duration_days INTEGER DEFAULT 0,
  flw_transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- If the transactions table already existed but was missing columns, add them:
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'UGX',
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS flw_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'unknown';

-- 3. Ensure subscription_plans table exists
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
