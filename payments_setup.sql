-- 1. Add subscription tracking to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);

-- 2. Create transactions table for Flutterwave logs
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tx_ref VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UGX',
  status VARCHAR(50) DEFAULT 'pending',
  plan_type VARCHAR(50) NOT NULL,
  flw_transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for quick lookups during webhooks
CREATE INDEX IF NOT EXISTS idx_transactions_tx_ref ON transactions(tx_ref);
