-- ═══════════════════════════════════════════════════════════════════════════
-- SQL 037: Restore Admin Functions Permission
-- ═══════════════════════════════════════════════════════════════════════════
-- Issue: SQL 036 revoked EXECUTE from authenticated, breaking admin dashboard
-- Fix: GRANT back to authenticated (functions have internal role check)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Restore admin_reset_password permission
GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;

-- 2. Restore admin_delete_student permission  
GRANT EXECUTE ON FUNCTION public.admin_delete_student(uuid) TO authenticated;

-- 3. Update comments - clarify that functions have internal role checks
COMMENT ON FUNCTION public.admin_reset_password IS
  'AUTHENTICATED: Requires login. SECURITY DEFINER with internal admin role check. Safe: validates is_admin() before executing.';

COMMENT ON FUNCTION public.admin_delete_student IS
  'AUTHENTICATED: Requires login. SECURITY DEFINER with internal admin role check. Safe: validates is_admin() before deleting.';

-- Log
DO $$
BEGIN
  RAISE NOTICE '✓ Admin functions permission restored';
  RAISE NOTICE '  - admin_reset_password: GRANT to authenticated';
  RAISE NOTICE '  - admin_delete_student: GRANT to authenticated';
  RAISE NOTICE '  - Security: Internal role checks still enforced';
END $$;
