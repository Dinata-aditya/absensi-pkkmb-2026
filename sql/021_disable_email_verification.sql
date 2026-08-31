-- ====================================
-- DISABLE EMAIL VERIFICATION
-- ====================================
-- This SQL confirms all existing users and updates auth settings
-- Run this in Supabase SQL Editor after disabling email confirmation in Auth settings

-- Confirm all existing users (set email_confirmed_at if NULL)
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email_confirmed_at IS NULL;

-- Show results
SELECT 
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users
ORDER BY created_at DESC;
