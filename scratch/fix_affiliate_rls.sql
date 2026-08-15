-- Run this in your Supabase SQL Editor to allow users to join the affiliate program
CREATE POLICY "Users can insert own affiliate profile"
ON affiliates FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE email = auth.email()));
