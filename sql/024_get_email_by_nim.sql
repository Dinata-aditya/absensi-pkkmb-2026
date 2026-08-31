-- ====================================
-- RPC: get_email_by_nim
-- Ambil email dari auth.users berdasarkan NIM
-- Dipanggil saat login dengan NIM
-- ====================================

CREATE OR REPLACE FUNCTION public.get_email_by_nim(p_nim TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT au.email
    INTO v_email
    FROM public.students s
    JOIN auth.users au ON au.id = s.user_id
    WHERE s.nim = p_nim
    LIMIT 1;

    RETURN v_email;
END;
$$;
