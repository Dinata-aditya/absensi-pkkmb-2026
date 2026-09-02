-- ============================================
-- Fix Security Warnings - Supabase Advisor
-- ============================================

-- ── Warning 1: Fix search_path mutable ──────
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.finalize_attendance(uuid) SET search_path = public;
ALTER FUNCTION public.validate_and_record_attendance(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_reset_password(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_email_by_nim(text) SET search_path = public;

-- ── Warning 2: Revoke anon access from sensitive functions ──
-- admin_reset_password: tidak boleh dipanggil tanpa login
REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM anon;

-- finalize_attendance: hanya admin yang boleh
REVOKE EXECUTE ON FUNCTION public.finalize_attendance(uuid) FROM anon;

-- get_user_role: tidak perlu tanpa login
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;

-- is_admin: tidak perlu tanpa login
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- validate_and_record_attendance: mahasiswa harus login dulu sebelum scan
REVOKE EXECUTE ON FUNCTION public.validate_and_record_attendance(uuid, text) FROM anon;

-- get_email_by_nim: DIBIARKAN karena dibutuhkan saat login pakai NIM (belum login)
-- GRANT EXECUTE ON FUNCTION public.get_email_by_nim(text) TO anon; -- sudah ada

-- Konfirmasi
SELECT 'Security warnings fixed successfully' AS status;
