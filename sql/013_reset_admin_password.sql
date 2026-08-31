-- ===================================
-- RESET ADMIN PASSWORD
-- ===================================

-- Reset password admin menjadi: admin123

UPDATE auth.users
SET 
    encrypted_password = crypt('admin123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'upp.pkkmb@gmail.com';

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Admin password has been reset!';
    RAISE NOTICE '';
    RAISE NOTICE 'NEW LOGIN CREDENTIALS:';
    RAISE NOTICE '  Email: upp.pkkmb@gmail.com';
    RAISE NOTICE '  Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE 'Please login and change password immediately';
    RAISE NOTICE '========================================';
END $$;
