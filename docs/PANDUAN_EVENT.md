# PANDUAN PELAKSANAAN EVENT PKKMB 2026

## 📋 PERSIAPAN SEBELUM EVENT

### 1. Pastikan Rate Limit Sudah Dinaikkan
- ✅ Supabase Dashboard → Authentication → Rate Limits
- ✅ Sign ups per hour: **2000** (untuk 1000 mahasiswa)

### 2. Pastikan Semua Fitur Berfungsi
- ✅ Admin bisa login
- ✅ Admin bisa buat session
- ✅ Admin bisa generate QR
- ✅ Mahasiswa bisa registrasi
- ✅ Mahasiswa bisa scan QR

### 3. Siapkan Akun Admin
- **Email:** upp.pkkmb@gmail.com
- **Password:** [password yang sudah Anda set]
- **Akses:** Admin Dashboard untuk kontrol penuh

---

## 👥 ALUR UNTUK MAHASISWA (MABA)

### Langkah 1: REGISTRASI (H-1 atau Hari H)
1. Buka website: **[URL website Anda]**
2. Klik **"Daftar Akun"**
3. Isi form:
   - Email (bebas, bisa Gmail/Yahoo/dll)
   - Password (bebas, minimal 6 karakter, contoh: `pkkmb123`)
   - NIM
   - Nama Lengkap
   - Fakultas
   - Program Studi
4. Klik **"Daftar"**
5. Status awal: **PENDING** (menunggu verifikasi admin)

### Langkah 2: VERIFIKASI ADMIN
- Admin akan **verifikasi dan ubah status** dari PENDING → **ACTIVE**
- Setelah ACTIVE, mahasiswa bisa scan QR

### Langkah 3: LOGIN
1. Buka website
2. Klik **"Login"**
3. Masukkan email dan password yang tadi didaftarkan
4. Klik **"Masuk"**

### Langkah 4: SCAN QR (Saat Event Berlangsung)
1. Di dashboard mahasiswa, klik tombol **"Scan QR Code"**
2. Izinkan akses kamera
3. Arahkan kamera ke QR code yang ditampilkan admin
4. Tunggu konfirmasi **"Absensi berhasil!"**

### Langkah 5: CEK RIWAYAT ABSENSI
- Di dashboard mahasiswa bisa lihat status:
  - ✅ **HADIR** (sudah scan)
  - ❌ **ALPHA** (tidak scan)
  - ⏳ **BELUM ABSEN** (sesi belum ditutup)

---

## 🛠️ ALUR UNTUK ADMIN

### Persiapan H-1:

#### 1. LOGIN ADMIN
- Buka website → Login
- Email: `upp.pkkmb@gmail.com`
- Masuk ke **Admin Dashboard**

#### 2. VERIFIKASI MAHASISWA YANG SUDAH DAFTAR
- Tab **"Kelola Mahasiswa"**
- Lihat daftar mahasiswa dengan status **PENDING**
- Klik tombol **"Verifikasi"** pada setiap mahasiswa
- Ubah status jadi **ACTIVE** (agar bisa scan QR)
- Verifikasi semua mahasiswa yang valid

#### 3. BUAT SESI ABSENSI UNTUK 3 HARI
**Hari 1:**
- Tab **"Sesi Absensi"** → Klik **"Buat Sesi Baru"**
- Nama Kegiatan: `PKKMB Hari Ke-1`
- Hari Ke: `1`
- Tanggal: [tanggal hari 1]
- Jam Mulai: contoh `08:00`
- Jam Selesai: contoh `16:00`
- Klik **"Buat Sesi"**

**Hari 2 & 3:** Ulangi untuk hari ke-2 dan ke-3

---

### Pelaksanaan Saat Event (Setiap Hari):

#### PAGI HARI (Sebelum Acara Dimulai):

**1. BUKA SESI ABSENSI**
- Login admin
- Tab **"Sesi Absensi"**
- Cari sesi hari ini (status: **SCHEDULED**)
- Klik tombol **"Buka Sesi"**
- Status berubah: SCHEDULED → **OPEN**

**2. GENERATE & TAMPILKAN QR CODE**
- Klik tombol **"Lihat QR Code"**
- QR code muncul di layar
- **PROYEKSIKAN QR CODE** ke layar besar (proyektor/TV)
- Atau **PRINT QR CODE** dan tempelkan di lokasi strategis

**3. INSTRUKSIKAN MAHASISWA**
Umumkan:
> "Silakan buka website [URL], login, lalu klik tombol 'Scan QR Code' dan arahkan ke layar untuk melakukan absensi."

#### SIANG/SORE HARI (Setelah Acara Selesai):

**4. TUTUP SESI ABSENSI**
- Tab **"Sesi Absensi"**
- Klik tombol **"Tutup Sesi"**
- Status berubah: OPEN → **CLOSED**
- Sistem otomatis menandai mahasiswa yang tidak scan sebagai **ALPHA**

**5. CEK REKAP ABSENSI**
- Tab **"Monitoring"** (jika sudah ada)
- Atau cek di tab **"Kelola Mahasiswa"** untuk lihat status per mahasiswa

---

## ⚠️ TROUBLESHOOTING

### Mahasiswa Tidak Bisa Registrasi
**Penyebab:** Rate limit, email sudah terdaftar, atau koneksi lemah
**Solusi:**
- Cek rate limit di Supabase sudah dinaikkan
- Pastikan email belum pernah dipakai
- Cek koneksi internet

### Mahasiswa Tidak Bisa Scan QR
**Penyebab:** Status belum ACTIVE, sesi belum dibuka, atau kamera tidak diizinkan
**Solusi:**
- Admin verifikasi status mahasiswa → ACTIVE
- Admin pastikan sesi sudah **OPEN**
- Mahasiswa izinkan akses kamera di browser

### QR Code Tidak Valid
**Penyebab:** QR code kadaluarsa atau sesi sudah ditutup
**Solusi:**
- Pastikan sesi masih **OPEN**
- Generate ulang QR code jika perlu

### Mahasiswa Sudah Scan Tapi Masih ALPHA
**Penyebab:** Scan dilakukan di luar jam sesi atau sesi belum dibuka
**Solusi:**
- Pastikan scan dilakukan saat sesi **OPEN**
- Pastikan waktu device sesuai (tidak maju/mundur)

---

## 📊 TIPS PELAKSANAAN

### Untuk Admin:
1. **Buka sesi 15 menit sebelum acara** dimulai
2. **Proyeksikan QR code** dengan jelas dan cukup besar
3. **Sediakan QR code backup** (print) jika proyektor bermasalah
4. **Monitoring real-time** siapa yang sudah/belum absen
5. **Tutup sesi** setelah acara selesai atau batas waktu habis

### Untuk Mahasiswa:
1. **Registrasi H-1** agar tidak numpuk saat hari H
2. **Login dulu** sebelum acara dimulai
3. **Pastikan internet stabil** saat scan
4. **Izinkan akses kamera** saat diminta browser
5. **Scan sekali saja**, jangan berulang kali

---

## 🎯 CHECKLIST EVENT

### H-1 (Persiapan):
- [ ] Rate limit Supabase sudah dinaikkan (2000/hour)
- [ ] Admin bisa login
- [ ] 3 sesi absensi sudah dibuat (Hari 1, 2, 3)
- [ ] Mahasiswa bisa registrasi (test)
- [ ] Mahasiswa yang registrasi sudah diverifikasi → ACTIVE
- [ ] QR scanner sudah ditest (berfungsi)
- [ ] Proyektor/TV untuk QR code sudah disiapkan

### Hari H (Setiap Hari):
- [ ] Admin buka sesi absensi pagi hari
- [ ] QR code sudah ditampilkan/diproyeksikan
- [ ] Mahasiswa diarahkan untuk scan
- [ ] Monitoring absensi berjalan
- [ ] Admin tutup sesi setelah acara selesai
- [ ] Rekap absensi dicek

### Setelah Event:
- [ ] Export data absensi (jika ada fitur export)
- [ ] Backup database
- [ ] Evaluasi sistem

---

## 📞 KONTAK SUPPORT

Jika ada masalah teknis:
- Admin: [kontak admin]
- IT Support: [kontak IT]

---

**Good luck untuk event PKKMB 2026! 🎉**
