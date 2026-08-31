-- ===================================
-- REMOVE UNIQUE CONSTRAINT on hari_ke
-- ===================================
-- This allows creating multiple sessions per day for testing

-- Drop the UNIQUE constraint
ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_hari_ke_key;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✓ UNIQUE constraint on hari_ke removed';
    RAISE NOTICE '✓ You can now create multiple sessions per day';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NOTE: For production, consider if you need this constraint back';
END $$;
