-- ============================================
-- FIX SECURITY DEFINER FUNCTION PERMISSIONS
-- ============================================

-- ══════════════════════════════════════════
-- 1. DROP EXISTING FUNCTIONS
-- ══════════════════════════════════════════

DROP FUNCTION IF EXISTS admin_delete_student(uuid);
DROP FUNCTION IF EXISTS admin_reset_password(uuid, text);
DROP FUNCTION IF EXISTS finalize_attendance(uuid);

-- ══════════════════════════════════════════
-- 2. RECREATE FUNCTIONS WITH ROLE CHECK
-- ══════════════════════════════════════════

-- Function: admin_delete_student
CREATE FUNCTION admin_delete_student(p_student_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_deleted_att_count INT;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if caller is admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ''ADMIN''
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN json_build_object(
            ''success'', false,
            ''message'', ''Unauthorized: Admin access required''
        );
    END IF;

    -- Get student data
    SELECT nim, nama_lengkap, user_id INTO v_student
    FROM students WHERE id = p_student_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            ''success'', false,
            ''message'', ''Student not found''
        );
    END IF;
    
    -- Delete data
    DELETE FROM attendances WHERE student_id = p_student_id;
    GET DIAGNOSTICS v_deleted_att_count = ROW_COUNT;
    
    DELETE FROM user_roles WHERE user_id = v_student.user_id;
    DELETE FROM students WHERE id = p_student_id;
    DELETE FROM auth.users WHERE id = v_student.user_id;
    
    RETURN json_build_object(
        ''success'', true,
        ''message'', ''Student deleted successfully'',
        ''data'', json_build_object(
            ''nim'', v_student.nim,
            ''nama'', v_student.nama_lengkap,
            ''deleted_attendances'', v_deleted_att_count
        )
    );
END;
$$;

-- Function: admin_reset_password
CREATE FUNCTION admin_reset_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if caller is admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ''ADMIN''
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN json_build_object(
            ''success'', false,
            ''message'', ''Unauthorized: Admin access required''
        );
    END IF;

    -- Update password
    UPDATE auth.users
    SET 
        encrypted_password = crypt(p_new_password, gen_salt(''bf'')),
        updated_at = now()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            ''success'', false,
            ''message'', ''User not found''
        );
    END IF;
    
    RETURN json_build_object(
        ''success'', true,
        ''message'', ''Password reset successfully''
    );
END;
$$;

-- Function: finalize_attendance
CREATE FUNCTION finalize_attendance(p_session_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inserted_count INT := 0;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if caller is admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ''ADMIN''
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN json_build_object(
            ''success'', false,
            ''message'', ''Unauthorized: Admin access required''
        );
    END IF;

    -- Insert ALPHA for absent students
    INSERT INTO attendances (student_id, session_id, status, scan_time)
    SELECT 
        s.id,
        p_session_id,
        ''ALPHA'',
        NOW()
    FROM students s
    WHERE s.status = ''ACTIVE''
    AND NOT EXISTS (
        SELECT 1 FROM attendances a
        WHERE a.student_id = s.id
        AND a.session_id = p_session_id
    );
    
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    
    RETURN json_build_object(
        ''success'', true,
        ''message'', format(''Marked %s students as ALPHA'', v_inserted_count),
        ''alpha_count'', v_inserted_count
    );
END;
$$;

-- ══════════════════════════════════════════
-- 3. GRANT PERMISSIONS
-- ══════════════════════════════════════════

GRANT EXECUTE ON FUNCTION admin_delete_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_attendance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_by_nim(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_and_record_attendance(uuid, text) TO authenticated;

-- Verification
SELECT ''Functions recreated with security checks!'' as status;
