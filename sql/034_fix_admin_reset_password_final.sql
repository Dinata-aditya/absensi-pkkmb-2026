-- ====================================
-- Fix: admin_reset_password function (FINAL VERSION)
-- ====================================

-- Step 1: Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Drop all versions of the function
DROP FUNCTION IF EXISTS public.admin_reset_password(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_reset_password(p_user_id uuid, p_new_password text) CASCADE;

-- Step 3: Create function with explicit parameter types
CREATE OR REPLACE FUNCTION public.admin_reset_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_row_count INTEGER;
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
        )::json;
    END IF;

    -- Update password using pgcrypto (with explicit schema)
    UPDATE auth.users
    SET 
        encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    
    IF v_row_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User not found'
        )::json;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Password reset successfully'
    )::json;
END;
$$;

-- Step 4: Grant permissions
REVOKE ALL ON FUNCTION public.admin_reset_password(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reset_password(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;

-- Step 5: Test the function (replace with real user_id to test)
-- SELECT public.admin_reset_password('REAL-USER-ID-HERE'::uuid, 'test123');
