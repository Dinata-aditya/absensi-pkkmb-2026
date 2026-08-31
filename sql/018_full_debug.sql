-- ===================================
-- FULL DEBUG: Check Everything
-- ===================================

-- 1. Check mahasiswa test
SELECT '=== MAHASISWA STATUS ===' as info;
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    s.id as student_id,
    s.nim,
    s.nama_lengkap,
    s.status as student_status
FROM auth.users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.email = 'mahasiswa.test@example.com';

-- 2. Check OPEN sessions
SELECT '=== OPEN SESSIONS ===' as info;
SELECT 
    id as session_id,
    nama_kegiatan,
    hari_ke,
    tanggal,
    jam_mulai,
    jam_selesai,
    status,
    LEFT(qr_token, 20) || '...' as qr_token_preview,
    created_at
FROM attendance_sessions
WHERE status = 'OPEN'
ORDER BY created_at DESC;

-- 3. Check current time
SELECT '=== CURRENT TIME ===' as info;
SELECT 
    NOW() as current_timestamp,
    NOW()::DATE as current_date,
    NOW()::TIME as current_time;

-- 4. Check all attendance records for mahasiswa
SELECT '=== ATTENDANCE HISTORY ===' as info;
SELECT 
    a.id as attendance_id,
    ses.nama_kegiatan,
    ses.hari_ke,
    a.status,
    a.scan_time,
    ses.status as session_status
FROM attendances a
JOIN attendance_sessions ses ON a.session_id = ses.id
JOIN students st ON a.student_id = st.id
JOIN auth.users u ON st.user_id = u.id
WHERE u.email = 'mahasiswa.test@example.com'
ORDER BY a.scan_time DESC;

-- 5. Test RPC function manually
SELECT '=== RPC FUNCTION TEST ===' as info;
SELECT validate_and_record_attendance(
    (SELECT id FROM attendance_sessions WHERE status = 'OPEN' LIMIT 1),
    (SELECT qr_token FROM attendance_sessions WHERE status = 'OPEN' LIMIT 1)
) as rpc_result;
