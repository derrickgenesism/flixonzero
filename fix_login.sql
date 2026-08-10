-- 1. FIX SUPABASE PASSWORD HASHES
-- WordPress uses the PHP-specific "$2y$" bcrypt prefix. 
-- Supabase Auth strictly expects standard "$2a$" bcrypt prefixes.
UPDATE auth.users 
SET encrypted_password = REPLACE(encrypted_password, '$2y$10$', '$2a$10$')
WHERE encrypted_password LIKE '$2y$10$%';

-- 2. FIX USERNAME CASE-SENSITIVITY
-- Make the login system ignore capital letters in usernames (e.g. emma256 matches Emma256)
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT) 
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM user_profiles WHERE LOWER(username) = LOWER(p_username);
  RETURN v_email;
END;
$$;
