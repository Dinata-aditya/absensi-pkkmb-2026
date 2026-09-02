-- get_email_by_nim dipanggil saat login via NIM (belum authenticated)
-- Perlu bisa diakses anon, tapi function ini hanya return email saja (tidak sensitif)
GRANT EXECUTE ON FUNCTION public.get_email_by_nim(text) TO anon;;
