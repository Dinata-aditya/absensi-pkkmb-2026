-- ===================================
-- TEMPORARY: Disable RLS for Testing
-- ===================================
-- This will temporarily disable RLS on user_roles to test login
-- We'll re-enable it properly after testing

-- Disable RLS temporarily
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '⚠️  RLS TEMPORARILY DISABLED on user_roles';
    RAISE NOTICE '⚠️  This is for TESTING ONLY';
    RAISE NOTICE '';
    RAISE NOTICE 'Now try to login with:';
    RAISE NOTICE '  Email: test.mahasiswa1@example.com';
    RAISE NOTICE '  Password: 123456';
    RAISE NOTICE '';
    RAISE NOTICE 'After testing works, we will re-enable RLS properly';
END $$;
