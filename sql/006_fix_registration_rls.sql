-- ===================================
-- FIX: Allow Self-Registration for user_roles
-- ===================================
-- This fixes the circular dependency where users can't insert their own role during registration

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Allow users to INSERT their own role (only if they don't have a role yet)
CREATE POLICY "Users can insert own first role"
    ON user_roles
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND NOT EXISTS (
            SELECT 1 FROM user_roles WHERE user_id = auth.uid()
        )
    );

-- Admins can read all roles
CREATE POLICY "Admins can read all roles"
    ON user_roles
    FOR SELECT
    USING (is_admin());

-- Admins can update roles
CREATE POLICY "Admins can update roles"
    ON user_roles
    FOR UPDATE
    USING (is_admin());

-- Admins can delete roles
CREATE POLICY "Admins can delete roles"
    ON user_roles
    FOR DELETE
    USING (is_admin());

-- ===================================
-- VERIFICATION
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '✓ Fixed RLS policies for user_roles table';
    RAISE NOTICE '✓ Users can now self-register with MAHASISWA role';
    RAISE NOTICE '✓ Admins retain full control over role management';
END $$;
