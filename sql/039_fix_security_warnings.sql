-- ============================================================
-- SQL 039: Fix 18 Supabase Security Warnings
-- Executed: 2026-09-05
-- ============================================================

-- FIX 1: Revoke anon access
REVOKE EXECUTE ON FUNCTION public.get_all_students() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_attendance_stats() FROM anon;

-- FIX 2: Set search_path on ALL functions
ALTER FUNCTION public.admin_delete_student(uuid)                                SET search_path = public;
ALTER FUNCTION public.admin_reset_password(uuid, text)                          SET search_path = public;
ALTER FUNCTION public.finalize_attendance(uuid)                                 SET search_path = public;
ALTER FUNCTION public.get_all_students()                                        SET search_path = public;
ALTER FUNCTION public.get_attendance_stats()                                    SET search_path = public;
ALTER FUNCTION public.get_email_by_nim(text)                                    SET search_path = public;
ALTER FUNCTION public.get_email_for_login(text)                                 SET search_path = public;
ALTER FUNCTION public.get_user_role()                                           SET search_path = public;
ALTER FUNCTION public.is_admin()                                                SET search_path = public;
ALTER FUNCTION public.register_student_atomic(uuid, text, text, uuid, uuid)     SET search_path = public;
ALTER FUNCTION public.validate_and_record_attendance(uuid, text)                SET search_path = public;

-- REMAINING: auth_leaked_password_protection
-- Enable via: Dashboard > Authentication > Email > Password strength
-- ============================================================
