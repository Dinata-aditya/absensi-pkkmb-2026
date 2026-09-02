-- ============================================
-- Fix Attendances Table Permissions
-- ============================================
-- Pastikan RLS disabled dan permissions OK

-- 1. Disable RLS pada attendances
ALTER TABLE attendances DISABLE ROW LEVEL SECURITY;

-- 2. Drop semua policy lama yang mungkin masih aktif
DROP POLICY IF EXISTS "mahasiswa_read_own_attendance" ON attendances;
DROP POLICY IF EXISTS "admin_full_access_attendance" ON attendances;
DROP POLICY IF EXISTS "allow_authenticated_read" ON attendances;

-- 3. Grant permissions yang tepat
GRANT ALL ON attendances TO authenticated;
GRANT ALL ON attendances TO anon;
GRANT ALL ON attendances TO service_role;

-- 4. Pastikan sequence bisa diakses
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verification
DO $'$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Attendances table permissions fixed';
    RAISE NOTICE '✓ RLS disabled';
    RAISE NOTICE '✓ All users can read/write';
    RAISE NOTICE '========================================';
END $'$;
