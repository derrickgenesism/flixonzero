-- Drop the previous policy
DROP POLICY IF EXISTS "Users can insert own affiliate profile" ON affiliates;

-- Create the new policy using auth.jwt()
CREATE POLICY "Users can insert own affiliate profile"
ON affiliates FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles WHERE email = (auth.jwt() ->> 'email')
  )
);
