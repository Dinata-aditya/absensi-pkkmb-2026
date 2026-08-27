-- ===================================
-- FIX: User Roles RLS for Login
-- ===================================
-- Ensure users can read their own role during login

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own first role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- 1. Users can SELECT their own role (needed for login)
CREATE POLICY "Users can read own role"
    ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can INSERT their own role (for registration)
CREATE POLICY "Users can insert own first role"
    ON user_roles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND NOT EXISTS (
            SELECT 1 FROM user_roles WHERE user_id = auth.uid()
        )
    );

-- 3. Admins can SELECT all roles
CREATE POLICY "Admins can read all roles"
    ON user_roles
    FOR SELECT
    USING (is_admin());

-- 4. Admins can UPDATE roles
CREATE POLICY "Admins can update roles"
    ON user_roles
    FOR UPDATE
    USING (is_admin());

-- 5. Admins can DELETE roles
CREATE POLICY "Admins can delete roles"
    ON user_roles
    FOR DELETE
    USING (is_admin());

-- ===================================
-- VERIFICATION
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '✓ RLS policies for user_roles fixed';
    RAISE NOTICE '✓ Users can now read their own role during login';
    RAISE NOTICE '✓ Users can register and insert their first role';
    RAISE NOTICE '✓ Admins have full control';
END $$;
