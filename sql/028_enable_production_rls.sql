-- ============================================
-- PRODUCTION RLS POLICIES
-- Enable RLS dengan policies yang proper
-- ============================================

-- ══════════════════════════════════════════
-- 1. ATTENDANCES TABLE
-- ══════════════════════════════════════════

-- Enable RLS
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "mahasiswa_read_own_attendance" ON attendances;
DROP POLICY IF EXISTS "admin_full_access_attendance" ON attendances;
DROP POLICY IF EXISTS "allow_authenticated_read" ON attendances;
DROP POLICY IF EXISTS "Admins can delete attendances" ON attendances;
DROP POLICY IF EXISTS "Admins can insert attendances" ON attendances;
DROP POLICY IF EXISTS "Admins can read all attendances" ON attendances;
DROP POLICY IF EXISTS "Admins can update attendances" ON attendances;
DROP POLICY IF EXISTS "Students can read own attendance" ON attendances;

-- Policy 1: Admin full access
CREATE POLICY "admin_attendances_all" ON attendances
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'ADMIN'
    )
);

-- Policy 2: Mahasiswa read own attendance
CREATE POLICY "mahasiswa_read_own_attendances" ON attendances
FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM students
        WHERE user_id = auth.uid()
    )
);

-- Policy 3: Service role full access (untuk RPC functions)
CREATE POLICY "service_role_attendances_all" ON attendances
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ══════════════════════════════════════════
-- 2. SETTINGS TABLE
-- ══════════════════════════════════════════

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "anyone_can_read_settings" ON settings;
DROP POLICY IF EXISTS "admin_can_write_settings" ON settings;

-- Policy 1: Everyone can read settings
CREATE POLICY "public_read_settings" ON settings
FOR SELECT
TO authenticated, anon
USING (true);

-- Policy 2: Admin can write settings
CREATE POLICY "admin_write_settings" ON settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'ADMIN'
    )
);

-- Policy 3: Service role full access
CREATE POLICY "service_role_settings_all" ON settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ══════════════════════════════════════════
-- 3. GRANT BASIC PERMISSIONS
-- ══════════════════════════════════════════

-- Attendances
GRANT SELECT ON attendances TO authenticated;
GRANT INSERT, UPDATE, DELETE ON attendances TO authenticated;
GRANT ALL ON attendances TO service_role;

-- Settings
GRANT SELECT ON settings TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON settings TO authenticated;
GRANT ALL ON settings TO service_role;

-- Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ══════════════════════════════════════════
-- VERIFICATION
-- ══════════════════════════════════════════

DO $'$
DECLARE
    attendances_rls BOOLEAN;
    settings_rls BOOLEAN;
BEGIN
    -- Check RLS status
    SELECT relrowsecurity INTO attendances_rls
    FROM pg_class WHERE relname = 'attendances';
    
    SELECT relrowsecurity INTO settings_rls
    FROM pg_class WHERE relname = 'settings';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ RLS ENABLED & POLICIES CONFIGURED';
    RAISE NOTICE '';
    RAISE NOTICE 'Attendances RLS: %', attendances_rls;
    RAISE NOTICE 'Settings RLS: %', settings_rls;
    RAISE NOTICE '';
    RAISE NOTICE 'Security Rules:';
    RAISE NOTICE '- Admin: Full access to all data';
    RAISE NOTICE '- Mahasiswa: Read own attendance only';
    RAISE NOTICE '- Everyone: Read settings';
    RAISE NOTICE '- Service role: Full access (for RPCs)';
    RAISE NOTICE '========================================';
END $'$;
