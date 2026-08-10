-- 1. Create Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Modify Transactions Table
-- We will add a duration_days column so webhooks don't rely on the plan still existing
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0;

-- 3. Insert Default Plans to start with
INSERT INTO subscription_plans (name, price, duration_days, features)
VALUES 
('Daily Pass', 1000.00, 1, '24 hours of access, Stream in HD, Watch on any device'),
('Monthly Pass', 15000.00, 30, '30 days of access, Stream in 4K UHD, Download for offline')
ON CONFLICT DO NOTHING;
