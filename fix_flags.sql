-- 1. Automatically confirm all emails in the database so nobody gets the "Email not confirmed" error.
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- 2. Ensure all existing profiles are flagged for the password reset backdoor
UPDATE user_profiles 
SET legacy_migration = TRUE;
