-- ============================================
-- Fix Settings Table Permissions
-- ============================================

-- 1. Disable RLS pada settings table
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;

-- 2. Drop policy lama kalau ada
DROP POLICY IF EXISTS "anyone_can_read_settings" ON settings;
DROP POLICY IF EXISTS "admin_can_write_settings" ON settings;

-- 3. Grant permissions
GRANT SELECT ON settings TO authenticated;
GRANT SELECT ON settings TO anon;
GRANT ALL ON settings TO service_role;

-- 4. Insert default value kalau belum ada
INSERT INTO settings (key, value, updated_at)
VALUES ('sertifikat_aktif', 'false', now())
ON CONFLICT (key) DO NOTHING;

-- Verification
SELECT 'Settings table permissions fixed!' as status,
       key, value 
FROM settings;
