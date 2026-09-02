-- ============================================================
-- Fix SECURITY DEFINER warnings:
-- Revoke EXECUTE dari PUBLIC (yang menyebabkan anon bisa akses),
-- lalu grant ulang hanya ke role yang memang perlu.
-- ============================================================

-- admin_reset_password: hanya boleh dipanggil authenticated (dicek is_admin() di dalamnya)
REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;

-- finalize_attendance: hanya boleh dipanggil authenticated (dicek is_admin() di dalamnya)
REVOKE EXECUTE ON FUNCTION public.finalize_attendance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_attendance(uuid) TO authenticated;

-- get_email_by_nim: dipakai untuk reset password, hanya perlu authenticated
REVOKE EXECUTE ON FUNCTION public.get_email_by_nim(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_nim(text) TO authenticated;

-- get_user_role: hanya perlu authenticated
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- is_admin: hanya perlu authenticated
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- validate_and_record_attendance: hanya perlu authenticated (sudah ada cek auth.uid())
REVOKE EXECUTE ON FUNCTION public.validate_and_record_attendance(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_and_record_attendance(uuid, text) TO authenticated;;
