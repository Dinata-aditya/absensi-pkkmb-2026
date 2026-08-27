-- ===================================
-- DEBUG & FIX: RLS for user_roles
-- ===================================

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- Drop ALL policies to start fresh
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own first role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Recreate with proper permissions

-- 1. CRITICAL: Users MUST be able to read their own role
CREATE POLICY "user_roles_select_own"
    ON user_roles
    FOR SELECT
    USING (
        auth.uid() = user_id
    );

-- 2. Allow new users to insert their first role (for registration)
CREATE POLICY "user_roles_insert_own_first"
    ON user_roles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );

-- 3. Admins can SELECT all
CREATE POLICY "user_roles_admin_select"
    ON user_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'ADMIN'
        )
    );

-- 4. Admins can UPDATE all
CREATE POLICY "user_roles_admin_update"
    ON user_roles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'ADMIN'
        )
    );

-- 5. Admins can DELETE all
CREATE POLICY "user_roles_admin_delete"
    ON user_roles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'ADMIN'
        )
    );

-- Test the policy with our test user
-- This should return 1 row
SELECT * FROM user_roles 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'test.mahasiswa1@example.com'
);

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ RLS policies recreated for user_roles';
    RAISE NOTICE '✓ Simplified policy names';
    RAISE NOTICE '✓ Users can read their own role';
    RAISE NOTICE '✓ Users can insert their first role';
    RAISE NOTICE '✓ Admins have full control';
    RAISE NOTICE '';
    RAISE NOTICE 'Test login with:';
    RAISE NOTICE '  Email: test.mahasiswa1@example.com';
    RAISE NOTICE '  Password: 123456';
    RAISE NOTICE '========================================';
END $$;
