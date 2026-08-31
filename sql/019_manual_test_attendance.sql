-- ===================================
-- MANUAL TEST ATTENDANCE
-- ===================================
-- Manually insert attendance for testing without QR scan

-- Get the student ID
DO $$
DECLARE
    v_student_id UUID;
    v_session_id UUID;
    v_session_name TEXT;
BEGIN
    -- Get student ID
    SELECT s.id INTO v_student_id
    FROM students s
    JOIN auth.users u ON s.user_id = u.id
    WHERE u.email = 'mahasiswa.test@example.com';
    
    -- Get first OPEN session
    SELECT id, nama_kegiatan INTO v_session_id, v_session_name
    FROM attendance_sessions
    WHERE status = 'OPEN'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_session_id IS NULL THEN
        RAISE NOTICE '❌ No OPEN session found. Please open a session first.';
        RETURN;
    END IF;
    
    -- Check if already attended
    IF EXISTS (
        SELECT 1 FROM attendances
        WHERE student_id = v_student_id
        AND session_id = v_session_id
    ) THEN
        RAISE NOTICE '❌ Already attended this session';
        RETURN;
    END IF;
    
    -- Insert attendance manually
    INSERT INTO attendances (student_id, session_id, status, scan_time)
    VALUES (v_student_id, v_session_id, 'HADIR', NOW());
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Manual attendance recorded successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Session: %', v_session_name;
    RAISE NOTICE 'Student: mahasiswa.test@example.com';
    RAISE NOTICE 'Status: HADIR';
    RAISE NOTICE 'Time: %', NOW();
    RAISE NOTICE '========================================';
END $$;
