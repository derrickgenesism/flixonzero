-- 1. Add role column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 2. Migrate existing admins to the 'administrator' role
UPDATE user_profiles 
SET role = 'administrator' 
WHERE is_admin = TRUE;

-- 3. (Optional) We can safely drop is_admin later once the code is updated, 
-- but we will keep it for now just in case.

-- 4. Create function to automatically create a user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (email, username, role)
  VALUES (
    new.email, 
    -- Provide a default username based on the email (before the @ symbol)
    SPLIT_PART(new.email, '@', 1), 
    'user'
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
