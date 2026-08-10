-- SUPABASE PASSWORD HASH FIX
-- WordPress uses the PHP-specific "$2y$" bcrypt prefix. 
-- Supabase Auth (written in Go) strictly expects standard "$2a$" bcrypt prefixes.
-- Since the encryption mathematics are completely identical, we just need to rename the prefix!

UPDATE auth.users 
SET encrypted_password = REPLACE(encrypted_password, '$2y$10$', '$2a$10$')
WHERE encrypted_password LIKE '$2y$10$%';
