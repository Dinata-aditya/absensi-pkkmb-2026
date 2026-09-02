-- Fix infinite recursion di RLS policy user_roles
-- Masalah: policy admin SELECT/UPDATE/DELETE query ke user_roles itu sendiri
-- Solusi: gunakan fungsi is_admin() yang sudah SECURITY DEFINER
-- (tidak trigger RLS saat dieksekusi)

-- Drop policy lama yang menyebabkan recursion
DROP POLICY IF EXISTS user_roles_admin_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;

-- Buat ulang dengan is_admin() yang SECURITY DEFINER (tidak kena RLS)
CREATE POLICY user_roles_admin_select ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY user_roles_admin_update ON public.user_roles
    FOR UPDATE
    USING (is_admin());

CREATE POLICY user_roles_admin_delete ON public.user_roles
    FOR DELETE
    USING (is_admin());;
