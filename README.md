# Sistem Absensi PKKMB 2026

Sistem absensi berbasis QR Code untuk Pengenalan Kehidupan Kampus Mahasiswa Baru (PKKMB) selama 3 hari dengan kapasitas ~1000 mahasiswa.

## 🚀 Features

### Mahasiswa
- ✅ Registrasi akun dengan verifikasi admin
- ✅ Login dengan session persistence (tidak perlu login ulang setiap hari)
- ✅ Scan QR Code untuk absensi menggunakan camera HP
- ✅ Lihat riwayat absensi 3 hari
- ✅ Edit profil dan reset password

### Admin
- ✅ Dashboard monitoring realtime dengan statistik
- ✅ Kelola mahasiswa (verifikasi status PENDING → ACTIVE)
- ✅ Generate 3 QR Code berbeda untuk 3 hari
- ✅ Buka/tutup sesi absensi dengan auto-finalisasi ALPHA
- ✅ Filter data berdasarkan fakultas, prodi, hari, status
- ✅ Koreksi absensi dengan audit log
- ✅ Export laporan ke Excel

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Supabase
  - PostgreSQL (Database)
  - Supabase Auth (Authentication)
  - Row Level Security (RLS)
  - Realtime (Live updates)
- **QR Libraries:**
  - `html5-qrcode` - QR Code scanner
  - `qrcode.js` - QR Code generator
- **Export:** SheetJS (xlsx) - Excel export

## 📁 Project Structure

```
abasensi-pkkmb2026/
├── public/
│   ├── css/
│   │   └── style.css              # Global styles
│   ├── js/
│   │   ├── config.js              # Supabase configuration
│   │   └── auth.js                # Authentication utilities
│   ├── index.html                 # Landing page
│   ├── login.html                 # Login page
│   ├── register.html              # Registration page
│   ├── mahasiswa-dashboard.html   # Student dashboard
│   └── admin-dashboard.html       # Admin dashboard
├── sql/
│   ├── 001_initial_schema.sql     # Database schema + seed data
│   ├── 002_seed_admin.sql         # Create first admin
│   ├── 003_rls_policies.sql       # Row Level Security
│   └── 004_attendance_rpc.sql     # RPC functions
├── docs/
│   ├── SETUP.md                   # Setup instructions
│   ├── USER_GUIDE.md              # User guide
│   └── ADMIN_CREDENTIALS.md       # Admin credentials (gitignored)
└── README.md

```

## 🎯 Database Schema

### Tables
- `user_roles` - User role management (ADMIN/MAHASISWA)
- `faculties` - 7 Fakultas
- `study_programs` - 19 Program Studi
- `students` - Data mahasiswa
- `attendance_sessions` - 3 Sesi absensi (Hari 1, 2, 3)
- `attendances` - Record absensi mahasiswa
- `audit_logs` - Tracking perubahan admin

### Key Relationships
```
auth.users → user_roles
auth.users → students → attendances
faculties → study_programs → students
attendance_sessions → attendances
```

## 📦 Setup

Lihat [SETUP.md](docs/SETUP.md) untuk instruksi lengkap.

### Quick Start

1. Clone repository
2. Setup Supabase project
3. Run SQL migrations di Supabase SQL Editor
4. Update `public/js/config.js` dengan Supabase credentials
5. Serve dengan http-server atau deploy ke hosting

## 🔐 Security

- ✅ Row Level Security (RLS) aktif untuk semua tabel sensitif
- ✅ Server-side validation menggunakan PostgreSQL RPC
- ✅ Password dikelola Supabase Auth (bcrypt hashing)
- ✅ Anti-duplicate attendance dengan unique constraint
- ✅ QR token secure dan tidak mudah dimanipulasi
- ✅ Audit log untuk tracking koreksi admin

## 📱 Mobile Support

- Responsive design mobile-first
- Touch-friendly buttons (min 44x44px)
- Camera scanner optimized untuk mobile
- Tested di iOS Safari dan Android Chrome

## 🎓 Academic Data

### 7 Fakultas
1. Fakultas Teknik
2. Fakultas Ekonomi
3. Fakultas Pertanian
4. Fakultas Keguruan dan Ilmu Pendidikan (FKIP)
5. Fakultas Hukum
6. Fakultas Ilmu Komputer
7. Fakultas Ilmu Kesehatan

### 19 Program Studi
- Lihat `sql/001_initial_schema.sql` untuk daftar lengkap

## 📊 Flow

### Registration Flow
```
Mahasiswa → Register → Status PENDING → Admin Verifikasi → Status ACTIVE
```

### Attendance Flow
```
Admin → Generate QR → Cetak QR
Mahasiswa → Scan QR → Server Validation → Record Attendance
Admin → Tutup Sesi → Finalisasi (ALPHA untuk yang tidak scan)
```

## 🧪 Testing

Target: ~1000 mahasiswa concurrent
- Load testing dengan simulasi 1000 users
- Performance optimization dengan indexing
- Realtime updates dengan Supabase Realtime
- Anti-duplicate dengan database constraint

## 📝 License

Proprietary - Sistem Absensi PKKMB 2026

## 👥 Support

Untuk pertanyaan dan support, hubungi tim panitia PKKMB.

---

**Status:** ✅ Task 1 Complete - Project structure dan Supabase configuration ready!
