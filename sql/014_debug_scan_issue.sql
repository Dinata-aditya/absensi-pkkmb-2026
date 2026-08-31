-- ===================================
-- DEBUG: Check Scan Issue
-- ===================================

-- 1. Check mahasiswa test status
SELECT 
    u.email,
    s.nim,
    s.nama_lengkap,
    s.status as student_status
FROM auth.users u
JOIN students s ON u.id = s.user_id
WHERE u.email = 'mahasiswa.test@example.com';

-- 2. Check all OPEN sessions
SELECT 
    id,
    nama_kegiatan,
    hari_ke,
    tanggal,
    jam_mulai,
    jam_selesai,
    status,
    qr_token
FROM attendance_sessions
WHERE status = 'OPEN'
ORDER BY hari_ke;

-- 3. Check if mahasiswa already has attendance
SELECT 
    a.id,
    s.nama_kegiatan,
    a.status,
    a.scan_time
FROM attendances a
JOIN attendance_sessions s ON a.session_id = s.id
JOIN students st ON a.student_id = st.id
JOIN auth.users u ON st.user_id = u.id
WHERE u.email = 'mahasiswa.test@example.com'
ORDER BY a.scan_time DESC;
