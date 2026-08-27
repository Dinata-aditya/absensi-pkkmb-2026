-- ===================================
-- ATTENDANCE RPC FUNCTIONS
-- Server-side validation for QR scan
-- ===================================

-- ===================================
-- 1. VALIDATE AND RECORD ATTENDANCE
-- ===================================

CREATE OR REPLACE FUNCTION public.validate_and_record_attendance(
    p_session_id UUID,
    p_token TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_student_id UUID;
    v_student_status TEXT;
    v_session RECORD;
    v_attendance_id UUID;
    v_current_time TIMESTAMPTZ;
    v_session_date DATE;
    v_session_start TIME;
    v_session_end TIME;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Anda harus login terlebih dahulu'
        );
    END IF;
    
    -- Get student data
    SELECT id, status INTO v_student_id, v_student_status
    FROM students
    WHERE user_id = v_user_id;
    
    IF v_student_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Data mahasiswa tidak ditemukan'
        );
    END IF;
    
    -- Check student status
    IF v_student_status != 'ACTIVE' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Akun Anda belum aktif. Silakan hubungi panitia.'
        );
    END IF;
    
    -- Get session data
    SELECT * INTO v_session
    FROM attendance_sessions
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'QR Code tidak valid'
        );
    END IF;
    
    -- Validate token
    IF v_session.qr_token != p_token THEN
        RETURN json_build_object(
            'success', false,
            'message', 'QR Code tidak valid'
        );
    END IF;
    
    -- Check session status
    IF v_session.status != 'OPEN' THEN
        IF v_session.status = 'SCHEDULED' THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Absensi belum dibuka'
            );
        ELSIF v_session.status = 'CLOSED' THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Absensi sudah ditutup'
            );
        ELSE
            RETURN json_build_object(
                'success', false,
                'message', 'Sesi tidak aktif'
            );
        END IF;
    END IF;
    
    -- Get current time and session time
    v_current_time := NOW();
    v_session_date := v_session.tanggal;
    v_session_start := v_session.jam_mulai;
    v_session_end := v_session.jam_selesai;
    
    -- Validate time (check if current time is within session hours)
    -- Note: This is a simplified check. For production, consider timezone handling
    IF v_current_time::TIME < v_session_start OR v_current_time::TIME > v_session_end THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Absensi hanya dapat dilakukan antara jam ' || v_session_start || ' - ' || v_session_end
        );
    END IF;
    
    -- Check for duplicate attendance
    IF EXISTS (
        SELECT 1 FROM attendances
        WHERE student_id = v_student_id
        AND session_id = p_session_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Anda sudah melakukan absensi untuk sesi ini'
        );
    END IF;
    
    -- All validations passed - Insert attendance record
    INSERT INTO attendances (student_id, session_id, status, scan_time)
    VALUES (v_student_id, p_session_id, 'HADIR', v_current_time)
    RETURNING id INTO v_attendance_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'Absensi berhasil!',
        'data', json_build_object(
            'attendance_id', v_attendance_id,
            'scan_time', v_current_time,
            'session_name', v_session.nama_kegiatan,
            'hari_ke', v_session.hari_ke
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Terjadi kesalahan: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_and_record_attendance IS 'Validate QR scan and record attendance with comprehensive checks';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_and_record_attendance TO authenticated;

-- ===================================
-- 2. FINALIZE ATTENDANCE (Auto-Alpha)
-- ===================================

CREATE OR REPLACE FUNCTION public.finalize_attendance(
    p_session_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_total_active_students INT;
    v_total_present INT;
    v_total_alpha INT;
    v_session_name TEXT;
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Hanya admin yang dapat melakukan finalisasi'
        );
    END IF;
    
    -- Get session name
    SELECT nama_kegiatan INTO v_session_name
    FROM attendance_sessions
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Sesi tidak ditemukan'
        );
    END IF;
    
    -- Count total active students
    SELECT COUNT(*) INTO v_total_active_students
    FROM students
    WHERE status = 'ACTIVE';
    
    -- Count students who already have attendance
    SELECT COUNT(*) INTO v_total_present
    FROM attendances
    WHERE session_id = p_session_id;
    
    -- Insert ALPHA status for students who didn't attend
    INSERT INTO attendances (student_id, session_id, status, scan_time)
    SELECT 
        s.id,
        p_session_id,
        'ALPHA',
        NOW()
    FROM students s
    WHERE s.status = 'ACTIVE'
    AND NOT EXISTS (
        SELECT 1 FROM attendances a
        WHERE a.student_id = s.id
        AND a.session_id = p_session_id
    )
    ON CONFLICT (student_id, session_id) DO NOTHING;
    
    -- Calculate alpha count
    v_total_alpha := v_total_active_students - v_total_present;
    
    -- Return summary
    RETURN json_build_object(
        'success', true,
        'message', 'Finalisasi absensi berhasil',
        'data', json_build_object(
            'session_name', v_session_name,
            'total_students', v_total_active_students,
            'total_present', v_total_present,
            'total_alpha', v_total_alpha
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Terjadi kesalahan: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.finalize_attendance IS 'Finalize attendance session and mark absent students as ALPHA';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.finalize_attendance TO authenticated;

-- ===================================
-- VERIFICATION
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '✓ RPC functions created successfully';
    RAISE NOTICE '  - validate_and_record_attendance()';
    RAISE NOTICE '  - finalize_attendance()';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Test these functions before production!';
END $$;
