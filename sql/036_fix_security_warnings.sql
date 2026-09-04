-- ═══════════════════════════════════════════════════════════════════════════
-- SQL 036: Fix Security Warnings - Tighten RPC Permissions
-- ═══════════════════════════════════════════════════════════════════════════
-- Target: Reduce Supabase lint warnings untuk SECURITY DEFINER functions
-- Safety: Hanya restrict admin functions, keep public functions for login/register
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. REVOKE admin functions dari semua role (hanya bisa via admin dashboard)
REVOKE EXECUTE ON FUNCTION public.admin_delete_student FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reset_password FROM anon, authenticated;

COMMENT ON FUNCTION public.admin_delete_student IS
  'ADMIN ONLY: Execute permission revoked. Only callable via admin dashboard with role check.';
COMMENT ON FUNCTION public.admin_reset_password IS
  'ADMIN ONLY: Execute permission revoked. Only callable via admin dashboard with role check.';

-- 2. get_email_by_nim - Restrict ke authenticated only (user sudah login)
REVOKE EXECUTE ON FUNCTION public.get_email_by_nim FROM anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_nim TO authenticated;

COMMENT ON FUNCTION public.get_email_by_nim IS
  'AUTHENTICATED ONLY: Requires login. Used for password reset flow.';

-- 3. get_email_for_login - KEEP anon access (dipakai untuk login flow!)
--    Accept warning, tambah dokumentasi saja
COMMENT ON FUNCTION public.get_email_for_login IS
  'PUBLIC (anon): Intentionally allows NIM->email lookup for login. SECURITY DEFINER needed to bypass RLS. Acceptable risk for login UX.';

-- 4. register_student_atomic - KEEP anon access (untuk registrasi)
COMMENT ON FUNCTION public.register_student_atomic IS 
  'PUBLIC (anon): Intentionally allows registration without auth. SECURITY DEFINER needed for atomic insert. Safe: NIM validated with row lock (FOR UPDATE NOWAIT).';

-- 5. Attendance functions - Add documentation
COMMENT ON FUNCTION public.validate_and_record_attendance IS
  'AUTHENTICATED: Requires login. SECURITY DEFINER needed to bypass RLS. Safe: validates session token internally.';
  
COMMENT ON FUNCTION public.finalize_attendance IS
  'AUTHENTICATED: Requires login. SECURITY DEFINER needed to bypass RLS. Safe: checks admin role internally.';

COMMENT ON FUNCTION public.get_user_role IS
  'AUTHENTICATED: Requires login. SECURITY DEFINER needed to read user_roles table.';

COMMENT ON FUNCTION public.is_admin IS
  'AUTHENTICATED: Requires login. SECURITY DEFINER needed to check admin role.';

-- Log
DO $$
BEGIN
  RAISE NOTICE '✓ Security tightening completed';
  RAISE NOTICE '  - Admin functions: access revoked';
  RAISE NOTICE '  - get_email_by_nim: authenticated only';
  RAISE NOTICE '  - Public functions: documented (accept warnings)';
END $$;
