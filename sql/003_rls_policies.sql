-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Security policies for all tables
-- ===================================

-- ===================================
-- HELPER FUNCTION: Get Current User Role
-- ===================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_roles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role() IS 'Returns current user role (ADMIN or MAHASISWA)';

-- ===================================
-- HELPER FUNCTION: Check if User is Admin
-- ===================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS (
            SELECT 1 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user is ADMIN';

-- ===================================
-- 1. USER_ROLES TABLE
-- ===================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users can read own role"
    ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage all roles"
    ON user_roles
    FOR ALL
    USING (is_admin());

-- ===================================
-- 2. FACULTIES TABLE
-- ===================================

ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;

-- Everyone can read faculties (needed for registration)
CREATE POLICY "Anyone can read faculties"
    ON faculties
    FOR SELECT
    USING (true);

-- Only admins can modify faculties
CREATE POLICY "Admins can manage faculties"
    ON faculties
    FOR ALL
    USING (is_admin());

-- ===================================
-- 3. STUDY_PROGRAMS TABLE
-- ===================================

ALTER TABLE study_programs ENABLE ROW LEVEL SECURITY;

-- Everyone can read study programs (needed for registration)
CREATE POLICY "Anyone can read study programs"
    ON study_programs
    FOR SELECT
    USING (true);

-- Only admins can modify study programs
CREATE POLICY "Admins can manage study programs"
    ON study_programs
    FOR ALL
    USING (is_admin());

-- ===================================
-- 4. STUDENTS TABLE
-- ===================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Students can read their own data
CREATE POLICY "Students can read own data"
    ON students
    FOR SELECT
    USING (auth.uid() = user_id);

-- Students can insert their own data (for registration)
CREATE POLICY "Students can insert own data"
    ON students
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Students can update their own data (for profile edit)
CREATE POLICY "Students can update own data"
    ON students
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all students
CREATE POLICY "Admins can read all students"
    ON students
    FOR SELECT
    USING (is_admin());

-- Admins can update all students (for verification)
CREATE POLICY "Admins can update all students"
    ON students
    FOR UPDATE
    USING (is_admin());

-- Admins can delete students if needed
CREATE POLICY "Admins can delete students"
    ON students
    FOR DELETE
    USING (is_admin());

-- ===================================
-- 5. ATTENDANCE_SESSIONS TABLE
-- ===================================

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Everyone can read attendance sessions (to know schedule)
CREATE POLICY "Anyone can read attendance sessions"
    ON attendance_sessions
    FOR SELECT
    USING (true);

-- Only admins can manage attendance sessions
CREATE POLICY "Admins can manage attendance sessions"
    ON attendance_sessions
    FOR ALL
    USING (is_admin());

-- ===================================
-- 6. ATTENDANCES TABLE
-- ===================================

ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- Students can read their own attendance
CREATE POLICY "Students can read own attendance"
    ON attendances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = attendances.student_id
            AND students.user_id = auth.uid()
        )
    );

-- Students CANNOT insert attendance directly
-- Attendance insertion must be done via RPC function for validation

-- Admins can read all attendances
CREATE POLICY "Admins can read all attendances"
    ON attendances
    FOR SELECT
    USING (is_admin());

-- Admins can insert attendances (for manual correction)
CREATE POLICY "Admins can insert attendances"
    ON attendances
    FOR INSERT
    WITH CHECK (is_admin());

-- Admins can update attendances (for correction)
CREATE POLICY "Admins can update attendances"
    ON attendances
    FOR UPDATE
    USING (is_admin());

-- Admins can delete attendances if needed
CREATE POLICY "Admins can delete attendances"
    ON attendances
    FOR DELETE
    USING (is_admin());

-- ===================================
-- 7. AUDIT_LOGS TABLE
-- ===================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
    ON audit_logs
    FOR SELECT
    USING (is_admin());

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (is_admin());

-- Audit logs should never be updated or deleted
-- (for data integrity and accountability)

-- ===================================
-- VERIFICATION
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '✓ Row Level Security policies created successfully';
    RAISE NOTICE '✓ Helper functions created: get_user_role(), is_admin()';
    RAISE NOTICE '✓ All sensitive tables are now protected';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Test RLS policies before going to production!';
    RAISE NOTICE '   - Test as MAHASISWA role';
    RAISE NOTICE '   - Test as ADMIN role';
    RAISE NOTICE '   - Test unauthorized access attempts';
END $$;
