-- ============================================================
-- Fix: Revoke EXECUTE on SECURITY DEFINER functions from anon
-- Fungsi-fungsi ini tidak boleh dipanggil tanpa login
-- ============================================================

-- 1. admin_reset_password: hanya boleh dipanggil admin
REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM authenticated;
-- Tambahkan pengecekan is_admin() agar hanya admin yang bisa pakai
CREATE OR REPLACE FUNCTION public.admin_reset_password(p_user_id uuid, p_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Hanya admin yang boleh reset password
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: hanya admin');
    END IF;

    -- Validasi password minimal 6 karakter
    IF length(p_new_password) < 6 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Password minimal 6 karakter');
    END IF;

    -- Update password di auth.users
    UPDATE auth.users
    SET
        encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User tidak ditemukan');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Password berhasil direset');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
-- Hanya authenticated yang boleh memanggil, dan di dalamnya sudah dicek is_admin()
GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM anon;

-- 2. finalize_attendance: hanya admin (sudah ada is_admin() check di dalamnya)
REVOKE EXECUTE ON FUNCTION public.finalize_attendance(uuid) FROM anon;

-- 3. get_email_by_nim: dipakai untuk fitur lupa password, boleh anon tapi batasi
-- Fungsi ini dipakai di reset password flow (sebelum login), jadi kita biarkan
-- tapi pastikan tidak leak data sensitif - fungsi ini hanya return email
-- Untuk keamanan tambah rate limiting via RLS, kita revoke dari anon dan
-- hanya izinkan dari authenticated saja karena reset password sudah ada di form
REVOKE EXECUTE ON FUNCTION public.get_email_by_nim(text) FROM anon;

-- 4. get_user_role: tidak perlu dipanggil tanpa login
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;

-- 5. is_admin: tidak perlu dipanggil tanpa login
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- 6. validate_and_record_attendance: sudah ada pengecekan auth.uid() di dalamnya
-- tapi tetap revoke dari anon agar tidak bisa dipanggil tanpa login sama sekali
REVOKE EXECUTE ON FUNCTION public.validate_and_record_attendance(uuid, text) FROM anon;;
