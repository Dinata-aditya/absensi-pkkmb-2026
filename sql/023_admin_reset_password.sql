-- ====================================
-- RPC: admin_reset_password
-- Dipanggil dari admin dashboard untuk reset password mahasiswa
-- ====================================

CREATE OR REPLACE FUNCTION public.admin_reset_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
