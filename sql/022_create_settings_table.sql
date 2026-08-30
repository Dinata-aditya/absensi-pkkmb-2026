-- ====================================
-- CREATE SETTINGS TABLE
-- Untuk kontrol fitur seperti toggle sertifikat
-- ====================================

CREATE TABLE IF NOT EXISTS public.settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT 'false',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default setting sertifikat (nonaktif)
INSERT INTO public.settings (key, value)
VALUES ('sertifikat_aktif', 'false')
ON CONFLICT (key) DO NOTHING;

-- Cek hasilnya
SELECT * FROM public.settings;
