-- ===================================
-- FIX RPC: Allow Update ALPHA to HADIR
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
    v_existing_attendance RECORD;
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
    
    -- Get current time
    v_current_time := NOW();
    
    -- Validate time (check if current time is within session hours)
    IF v_current_time::TIME < v_session.jam_mulai OR v_current_time::TIME > v_session.jam_selesai THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Absensi hanya dapat dilakukan antara jam ' || v_session.jam_mulai || ' - ' || v_session.jam_selesai
        );
    END IF;
    
    -- Check for existing attendance
    SELECT * INTO v_existing_attendance
    FROM attendances
    WHERE student_id = v_student_id
    AND session_id = p_session_id;
    
    IF FOUND THEN
        -- If already HADIR, reject
        IF v_existing_attendance.status = 'HADIR' THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Anda sudah melakukan absensi untuk sesi ini'
            );
        END IF;
        
        -- If ALPHA, update to HADIR (late scan after finalization)
        IF v_existing_attendance.status = 'ALPHA' THEN
            UPDATE attendances
            SET 
                status = 'HADIR',
                scan_time = v_current_time,
                updated_at = v_current_time
            WHERE id = v_existing_attendance.id
            RETURNING id INTO v_attendance_id;
            
            RETURN json_build_object(
                'success', true,
                'message', 'Absensi berhasil! (Status diperbarui dari ALPHA)',
                'data', json_build_object(
                    'attendance_id', v_attendance_id,
                    'scan_time', v_current_time,
                    'session_name', v_session.nama_kegiatan,
                    'hari_ke', v_session.hari_ke,
                    'updated_from_alpha', true
                )
            );
        END IF;
    END IF;
    
    -- No existing record - Insert new attendance
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

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✓ RPC function updated: Now allows updating ALPHA to HADIR';
END $$;
