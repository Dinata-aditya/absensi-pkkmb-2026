-- ===================================
-- CREATE TEST USERS FOR TESTING
-- ===================================
-- Run this in Supabase SQL Editor to create test users and bypass rate limit

-- USER 1: Test Mahasiswa
DO $$
DECLARE
    user1_id uuid;
BEGIN
    user1_id := extensions.uuid_generate_v4();
    
    -- Create auth user
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        user1_id,
        '00000000-0000-0000-0000-000000000000',
        'test.mahasiswa1@example.com',
        crypt('123456', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        'authenticated',
        'authenticated'
    );

    -- Create role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user1_id, 'MAHASISWA');

    -- Create student
    INSERT INTO public.students (
        user_id,
        nim,
        nama_lengkap,
        fakultas_id,
        prodi_id,
        status
    ) VALUES (
        user1_id,
        '2526001',
        'Test Mahasiswa 1',
        (SELECT id FROM faculties WHERE nama = 'Fakultas Ilmu Komputer' LIMIT 1),
        (SELECT id FROM study_programs WHERE nama = 'S1 Sistem Informasi' LIMIT 1),
        'ACTIVE'
    );

    RAISE NOTICE 'User 1 created: test.mahasiswa1@example.com / password: 123456';
END $$;

-- USER 2: Test Mahasiswa 2
DO $$
DECLARE
    user2_id uuid;
BEGIN
    user2_id := extensions.uuid_generate_v4();
    
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        user2_id,
        '00000000-0000-0000-0000-000000000000',
        'test.mahasiswa2@example.com',
        crypt('123456', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        'authenticated',
        'authenticated'
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (user2_id, 'MAHASISWA');

    INSERT INTO public.students (
        user_id,
        nim,
        nama_lengkap,
        fakultas_id,
        prodi_id,
        status
    ) VALUES (
        user2_id,
        '2526002',
        'Test Mahasiswa 2',
        (SELECT id FROM faculties WHERE nama = 'Fakultas Teknik' LIMIT 1),
        (SELECT id FROM study_programs WHERE nama = 'S1 Teknik Mesin' LIMIT 1),
        'ACTIVE'
    );

    RAISE NOTICE 'User 2 created: test.mahasiswa2@example.com / password: 123456';
END $$;

-- VERIFICATION
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Test users created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'LOGIN CREDENTIALS:';
    RAISE NOTICE '1. Email: test.mahasiswa1@example.com';
    RAISE NOTICE '   Password: 123456';
    RAISE NOTICE '   NIM: 2526001';
    RAISE NOTICE '';
    RAISE NOTICE '2. Email: test.mahasiswa2@example.com';
    RAISE NOTICE '   Password: 123456';
    RAISE NOTICE '   NIM: 2526002';
    RAISE NOTICE '';
    RAISE NOTICE 'Both users status: ACTIVE (ready to scan QR)';
    RAISE NOTICE '========================================';
END $$;
