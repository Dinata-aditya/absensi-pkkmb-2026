-- Function untuk admin hapus mahasiswa (hard delete)
-- Menghapus: auth.users, user_roles, students, attendances
CREATE OR REPLACE FUNCTION public.admin_delete_student(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_nim text;
    v_nama text;
    v_attendance_count int;
BEGIN
    -- Cek apakah yang memanggil adalah admin
    IF NOT is_admin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Akses ditolak: hanya admin yang dapat menghapus mahasiswa'
        );
    END IF;

    -- Ambil data mahasiswa
    SELECT user_id, nim, nama INTO v_user_id, v_nim, v_nama
    FROM students
    WHERE id = p_student_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Mahasiswa tidak ditemukan'
        );
    END IF;

    -- Hitung jumlah absensi yang akan dihapus
    SELECT COUNT(*) INTO v_attendance_count
    FROM attendances
    WHERE student_id = p_student_id;

    -- Hapus data absensi
    DELETE FROM attendances WHERE student_id = p_student_id;

    -- Hapus data mahasiswa
    DELETE FROM students WHERE id = p_student_id;

    -- Hapus role
    DELETE FROM user_roles WHERE user_id = v_user_id;

    -- Hapus akun auth
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Mahasiswa berhasil dihapus',
        'data', jsonb_build_object(
            'nim', v_nim,
            'nama', v_nama,
            'deleted_attendances', v_attendance_count
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Terjadi kesalahan: ' || SQLERRM
    );
END;
$$;

-- Grant execute ke authenticated (admin akan dicek di dalam function)
GRANT EXECUTE ON FUNCTION public.admin_delete_student(uuid) TO authenticated;;
