-- ====================================
-- Fix: admin_reset_password function
-- Issue: Function tidak bisa dipanggil dari client
-- ====================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.admin_reset_password(uuid, text);

-- Recreate with proper security
CREATE OR REPLACE FUNCTION public.admin_reset_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if caller is admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'ADMIN'
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Unauthorized: Admin access required'
        );
    END IF;

    -- Update password using Supabase auth schema
    UPDATE auth.users
    SET 
        encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Password reset successfully'
    );
END;
$$;

-- Grant permissions
REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;

-- Test
SELECT public.admin_reset_password(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test123'
);
