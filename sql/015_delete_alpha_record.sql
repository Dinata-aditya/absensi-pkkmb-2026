-- ===================================
-- DELETE ALPHA RECORD (For Testing)
-- ===================================

-- Delete ALPHA attendance record for mahasiswa test
DELETE FROM attendances
WHERE id = 'a1f4ad1d-b070-4965-ae31-6c5c2de2f04a';

-- Verification
SELECT 
    'Record deleted successfully' as message,
    COUNT(*) as remaining_records
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'mahasiswa.test@example.com';
