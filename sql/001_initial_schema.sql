-- ===================================
-- SISTEM ABSENSI PKKMB 2026
-- Initial Database Schema
-- ===================================

-- Drop tables if exists (for clean migration)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS study_programs CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- ===================================
-- 1. USER ROLES TABLE
-- ===================================
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MAHASISWA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Index for faster role lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

COMMENT ON TABLE user_roles IS 'Menyimpan role pengguna (ADMIN atau MAHASISWA)';

-- ===================================
-- 2. FACULTIES TABLE
-- ===================================
CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faculties_nama ON faculties(nama);

COMMENT ON TABLE faculties IS 'Daftar fakultas di universitas';

-- ===================================
-- 3. STUDY PROGRAMS TABLE
-- ===================================
CREATE TABLE study_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(faculty_id, nama)
);

CREATE INDEX idx_study_programs_faculty_id ON study_programs(faculty_id);
CREATE INDEX idx_study_programs_nama ON study_programs(nama);

COMMENT ON TABLE study_programs IS 'Program studi, harus terhubung dengan fakultas';

-- ===================================
-- 4. STUDENTS TABLE
-- ===================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nim TEXT NOT NULL UNIQUE,
    nama_lengkap TEXT NOT NULL,
    fakultas_id UUID NOT NULL REFERENCES faculties(id),
    prodi_id UUID NOT NULL REFERENCES study_programs(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'NEEDS_REVISION', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_nim ON students(nim);
CREATE INDEX idx_students_fakultas_id ON students(fakultas_id);
CREATE INDEX idx_students_prodi_id ON students(prodi_id);
CREATE INDEX idx_students_status ON students(status);

COMMENT ON TABLE students IS 'Data mahasiswa peserta PKKMB';
COMMENT ON COLUMN students.status IS 'Status: PENDING (menunggu verifikasi), ACTIVE (bisa absen), NEEDS_REVISION (perlu revisi), INACTIVE (nonaktif)';

-- ===================================
-- 5. ATTENDANCE SESSIONS TABLE
-- ===================================
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kegiatan TEXT NOT NULL,
    hari_ke INTEGER NOT NULL CHECK (hari_ke >= 1 AND hari_ke <= 3),
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    qr_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'OPEN', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(hari_ke)
);

CREATE INDEX idx_attendance_sessions_hari_ke ON attendance_sessions(hari_ke);
CREATE INDEX idx_attendance_sessions_status ON attendance_sessions(status);
CREATE INDEX idx_attendance_sessions_qr_token ON attendance_sessions(qr_token);
CREATE INDEX idx_attendance_sessions_tanggal ON attendance_sessions(tanggal);

COMMENT ON TABLE attendance_sessions IS 'Sesi absensi untuk setiap hari PKKMB';
COMMENT ON COLUMN attendance_sessions.qr_token IS 'Token unik untuk validasi QR code';
COMMENT ON COLUMN attendance_sessions.status IS 'SCHEDULED (belum dibuka), OPEN (sedang berlangsung), CLOSED (sudah ditutup)';

-- ===================================
-- 6. ATTENDANCES TABLE
-- ===================================
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    scan_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'HADIR' CHECK (status IN ('HADIR', 'ALPHA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- CRITICAL: Prevent duplicate attendance
    UNIQUE(student_id, session_id)
);

CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_attendances_session_id ON attendances(session_id);
CREATE INDEX idx_attendances_status ON attendances(status);
CREATE INDEX idx_attendances_scan_time ON attendances(scan_time);

COMMENT ON TABLE attendances IS 'Record absensi mahasiswa';
COMMENT ON COLUMN attendances.status IS 'HADIR (scan berhasil), ALPHA (tidak hadir)';

-- ===================================
-- 7. AUDIT LOGS TABLE
-- ===================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Log untuk tracking perubahan yang dilakukan admin';

-- ===================================
-- TRIGGERS FOR UPDATED_AT
-- ===================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_faculties_updated_at BEFORE UPDATE ON faculties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_programs_updated_at BEFORE UPDATE ON study_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_sessions_updated_at BEFORE UPDATE ON attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- SEED DATA: FACULTIES & STUDY PROGRAMS
-- ===================================

-- Insert Faculties
INSERT INTO faculties (nama) VALUES
    ('Fakultas Teknik'),
    ('Fakultas Ekonomi'),
    ('Fakultas Pertanian'),
    ('Fakultas Keguruan dan Ilmu Pendidikan (FKIP)'),
    ('Fakultas Hukum'),
    ('Fakultas Ilmu Komputer'),
    ('Fakultas Ilmu Kesehatan');

-- Insert Study Programs for each Faculty
-- Fakultas Teknik
INSERT INTO study_programs (faculty_id, nama)
SELECT id, 'S1 Teknik Mesin' FROM faculties WHERE nama = 'Fakultas Teknik'
UNION ALL
SELECT id, 'S1 Teknik Sipil' FROM faculties WHERE nama = 'Fakultas Teknik';

-- Fakultas Ekonomi
INSERT INTO study_programs (faculty_id, nama)
SELECT id, 'S1 Manajemen' FROM faculties WHERE nama = 'Fakultas Ekonomi'
UNION ALL
SELECT id, 'S1 Akuntansi' FROM faculties WHERE nama = 'Fakultas Ekonomi'
UNION ALL
SELECT id, 'S1 Kewirausahaan' FROM faculties WHERE nama = 'Fakultas Ekonomi';

-- Fakultas Pertanian
INSERT INTO study_programs (faculty_id, nama)
SELECT id, 'S1 Agroteknologi' FROM faculties WHERE nama = 'Fakultas Pertanian'
UNION ALL
SELECT id, 'S1 Agribisnis' FROM faculties WHERE nama = 'Fakultas Pertanian';

-- Fakultas Keguruan dan Ilmu Pendidikan (FKIP)
INSERT INTO study_programs (faculty_id, nama)
SELECT id, 'S1 Pendidikan Matematika' FROM faculties WHERE nama = 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)'
UNION ALL
SELECT id, 'S1 Pendidikan Biologi' FROM faculties WHERE nama = 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)'
UNION ALL
SELECT id, 'S1 Pendidikan Fisika' FROM faculties WHERE nama = 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)'
UNION ALL
SELECT id, 'S1 Pendidikan Bahasa Inggris' FROM faculties WHERE nama = 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)'
UNION ALL
SELECT id, 'S1 Pendidikan Olahraga dan Kesehatan' FROM faculties WHERE nama = 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)'
UNION ALL
SELECT id, 'S1 Pendidikan IPS' FROM faculties WHERE nama = 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)';

-- Fakultas Hukum
INSERT INTO study_programs (faculty_id, nama)
SELECT id, 'S1 Ilmu Hukum' FROM faculties WHERE nama = 'Fakultas Hukum';

-- Fakultas Ilmu Komputer
INSERT INTO study_programs (faculty_id, nama)
SELECT id, 'S1 Teknik Informatika' FROM faculties WHERE nama = 'Fakultas Ilmu Komputer'
UNION ALL
SELECT id, 'S1 Sistem Informasi' FROM faculties WHERE nama = 'Fakultas Ilmu Komputer';

-- Fakultas Ilmu Kesehatan
INSERT INTO study_programs (faculty_id, nama)
SELECT id, 'DIII Kebidanan' FROM faculties WHERE nama = 'Fakultas Ilmu Kesehatan'
UNION ALL
SELECT id, 'S1 Kebidanan' FROM faculties WHERE nama = 'Fakultas Ilmu Kesehatan'
UNION ALL
SELECT id, 'Pendidikan Profesi Bidan' FROM faculties WHERE nama = 'Fakultas Ilmu Kesehatan';

-- ===================================
-- VERIFICATION
-- ===================================

-- Verify counts
DO $$
DECLARE
    faculty_count INTEGER;
    prodi_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO faculty_count FROM faculties;
    SELECT COUNT(*) INTO prodi_count FROM study_programs;
    
    RAISE NOTICE '✓ Database schema created successfully';
    RAISE NOTICE '✓ Faculties inserted: %', faculty_count;
    RAISE NOTICE '✓ Study programs inserted: %', prodi_count;
END $$;
