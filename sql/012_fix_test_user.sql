-- ===================================
-- FIX: Test User Authentication
-- ===================================

-- First, delete the problematic user completely
DELETE FROM auth.users WHERE email = 'test.mahasiswa1@example.com';

-- Wait a moment for cascade deletes
SELECT pg_sleep(1);

-- Now recreate the user properly
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users with proper fields
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'mahasiswa.test@example.com',
        crypt('123456', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Insert role
    INSERT INTO user_roles (user_id, role)
    VALUES (new_user_id, 'MAHASISWA');
    
    -- Insert student data
    INSERT INTO students (
        user_id,
        nim,
        nama_lengkap,
        fakultas_id,
        prodi_id,
        status
    ) VALUES (
        new_user_id,
        '2526010',
        'Mahasiswa Test',
        (SELECT id FROM faculties WHERE nama = 'Fakultas Ilmu Komputer' LIMIT 1),
        (SELECT id FROM study_programs WHERE nama = 'S1 Sistem Informasi' LIMIT 1),
        'ACTIVE'
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ New test user created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'LOGIN CREDENTIALS:';
    RAISE NOTICE '  Email: mahasiswa.test@example.com';
    RAISE NOTICE '  Password: 123456';
    RAISE NOTICE '  NIM: 2526010';
    RAISE NOTICE '  Status: ACTIVE';
    RAISE NOTICE '';
    RAISE NOTICE 'User ID: %', new_user_id;
    RAISE NOTICE '========================================';
END $$;
