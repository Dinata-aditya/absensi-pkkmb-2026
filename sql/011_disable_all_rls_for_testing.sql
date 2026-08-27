-- ===================================
-- TEMPORARY: Disable ALL RLS for Testing
-- ===================================
-- This will disable RLS on all tables to test the application
-- We'll fix RLS properly after confirming everything works

-- Disable RLS on all tables
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculties DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  RLS DISABLED ON ALL TABLES';
    RAISE NOTICE '⚠️  This is TEMPORARY for TESTING ONLY';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '1. Login as mahasiswa';
    RAISE NOTICE '2. Login as admin';
    RAISE NOTICE '3. Test all features';
    RAISE NOTICE '';
    RAISE NOTICE 'After testing, we will properly re-enable RLS';
    RAISE NOTICE 'with correct policies for production';
    RAISE NOTICE '========================================';
END $$;
