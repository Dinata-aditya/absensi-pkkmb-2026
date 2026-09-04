-- ═══════════════════════════════════════════════════════════════════════════
-- SQL 035: Atomic Student Registration Function
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.register_student_atomic(
    p_user_id UUID,
    p_nim TEXT,
    p_nama_lengkap TEXT,
    p_fakultas_id UUID,
    p_prodi_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_nim TEXT;
BEGIN
    -- Cek NIM dengan lock (prevent race condition)
    SELECT nim INTO v_existing_nim
    FROM students
    WHERE nim = p_nim
    FOR UPDATE NOWAIT;
    
    IF v_existing_nim IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error_code', 'NIM_DUPLICATE',
            'message', 'NIM sudah terdaftar oleh mahasiswa lain'
        );
    END IF;
    
    -- Insert user_roles
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, 'MAHASISWA');
    
    -- Insert students
    INSERT INTO students (user_id, nim, nama_lengkap, fakultas_id, prodi_id, status)
    VALUES (p_user_id, p_nim, p_nama_lengkap, p_fakultas_id, p_prodi_id, 'ACTIVE');
    
    RETURN json_build_object('success', true, 'message', 'Registrasi berhasil');
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error_code', 'DUPLICATE_KEY',
            'message', 'Data sudah terdaftar (NIM atau User ID duplikat)'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error_code', 'DATABASE_ERROR',
            'message', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_student_atomic TO authenticated, anon;
