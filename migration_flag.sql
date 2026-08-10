-- Add a flag to identify users migrated from WordPress who need an automatic password reset.
ALTER TABLE user_profiles 
ADD COLUMN legacy_migration BOOLEAN DEFAULT FALSE;

-- Set the flag to true for all existing users currently in the database
UPDATE user_profiles 
SET legacy_migration = TRUE;
