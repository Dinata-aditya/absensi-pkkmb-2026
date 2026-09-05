-- ═══════════════════════════════════════════════════════════════════════════
-- SQL 038: Verify & Fix Faculties/Study Programs Data
-- ═══════════════════════════════════════════════════════════════════════════
-- Issue: Dropdown fakultas kosong saat registrasi
-- Possible causes: Data deleted, RLS block, atau table kosong
-- ═══════════════════════════════════════════════════════════════════════════

-- STEP 1: Check if data exists
DO $$
DECLARE
    v_faculty_count INT;
    v_program_count INT;
BEGIN
    SELECT COUNT(*) INTO v_faculty_count FROM faculties;
    SELECT COUNT(*) INTO v_program_count FROM study_programs;
    
    RAISE NOTICE ''━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'';
    RAISE NOTICE ''Data Check Results:'';
    RAISE NOTICE ''  Faculties: % rows'', v_faculty_count;
    RAISE NOTICE ''  Study Programs: % rows'', v_program_count;
    RAISE NOTICE ''━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'';
    
    IF v_faculty_count = 0 THEN
        RAISE WARNING ''⚠️  CRITICAL: Faculties table is EMPTY!'';
    END IF;
    
    IF v_program_count = 0 THEN
        RAISE WARNING ''⚠️  CRITICAL: Study Programs table is EMPTY!'';
    END IF;
END $$;

-- STEP 2: Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN (''faculties'', ''study_programs'')
ORDER BY tablename, policyname;

-- STEP 3: Test anonymous read access
SET ROLE anon;
SELECT COUNT(*) as faculties_readable_by_anon FROM faculties;
SELECT COUNT(*) as programs_readable_by_anon FROM study_programs;
RESET ROLE;

-- STEP 4: If data is missing, re-insert sample data
-- (Uncomment only if data is confirmed missing)

/*
-- Re-insert Faculties (if empty)
INSERT INTO faculties (nama) VALUES
    (''Fakultas Ekonomi''),
    (''Fakultas Teknik''),
    (''Fakultas Ilmu Sosial dan Politik''),
    (''Fakultas Pertanian''),
    (''Fakultas Keguruan dan Ilmu Pendidikan'')
ON CONFLICT (nama) DO NOTHING;

-- Re-insert Study Programs (if empty)
INSERT INTO study_programs (nama, fakultas_id) 
SELECT ''Manajemen'', id FROM faculties WHERE nama = ''Fakultas Ekonomi''
UNION ALL
SELECT ''Akuntansi'', id FROM faculties WHERE nama = ''Fakultas Ekonomi''
UNION ALL
SELECT ''Teknik Sipil'', id FROM faculties WHERE nama = ''Fakultas Teknik''
UNION ALL
SELECT ''Teknik Elektro'', id FROM faculties WHERE nama = ''Fakultas Teknik''
UNION ALL
SELECT ''Ilmu Administrasi Negara'', id FROM faculties WHERE nama = ''Fakultas Ilmu Sosial dan Politik''
UNION ALL
SELECT ''Ilmu Komunikasi'', id FROM faculties WHERE nama = ''Fakultas Ilmu Sosial dan Politik''
UNION ALL
SELECT ''Agroteknologi'', id FROM faculties WHERE nama = ''Fakultas Pertanian''
UNION ALL
SELECT ''Agribisnis'', id FROM faculties WHERE nama = ''Fakultas Pertanian''
UNION ALL
SELECT ''Pendidikan Matematika'', id FROM faculties WHERE nama = ''Fakultas Keguruan dan Ilmu Pendidikan''
UNION ALL
SELECT ''Pendidikan Bahasa Inggris'', id FROM faculties WHERE nama = ''Fakultas Keguruan dan Ilmu Pendidikan''
ON CONFLICT (nama, fakultas_id) DO NOTHING;
*/

-- STEP 5: Final verification
SELECT 
    ''✓ Faculties: '' || COUNT(*) as status 
FROM faculties
UNION ALL
SELECT 
    ''✓ Study Programs: '' || COUNT(*) 
FROM study_programs;

RAISE NOTICE ''━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'';
RAISE NOTICE ''Run completed. Check results above.'';
RAISE NOTICE ''If data is missing, uncomment STEP 4 and re-run.'';
RAISE NOTICE ''━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'';
