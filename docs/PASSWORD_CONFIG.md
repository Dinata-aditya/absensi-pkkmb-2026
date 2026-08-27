# Konfigurasi Password Settings

## Ubah Minimal Password Length di Supabase

Karena aplikasi ini hanya untuk event 3 hari, kita tidak memerlukan password yang terlalu kompleks.

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Login ke akun Anda

2. **Pilih Project Anda**
   - Klik project: `ofrzlwmyxyquvnxfjuyw`

3. **Masuk ke Authentication Settings**
   - Sidebar kiri → **Authentication**
   - Tab → **Policies** atau **Settings**

4. **Ubah Password Requirements**
   - Cari bagian "**Password Requirements**" atau "**Auth Settings**"
   - Ubah "**Minimum password length**" dari `6` atau `8` → **`1`** (atau minimal yang diinginkan)
   - Matikan "**Require uppercase letters**" (jika ada)
   - Matikan "**Require special characters**" (jika ada)

5. **Save Changes**
   - Klik **Save** atau **Update**

### Catatan:

- Supabase default minimal password adalah **6 karakter**
- Setelah diubah, user bisa membuat password sesederhana `123`, `abc`, dll
- Ini **AMAN** untuk event jangka pendek karena:
  - Data tidak sensitif (hanya absensi)
  - Event hanya 3 hari
  - Admin akan verifikasi manual
  - Tidak ada data pribadi yang sensitif

### Alternatif (jika setting tidak bisa diubah):

Jika Supabase tidak memperbolehkan minimal password < 6 karakter, maka:
- Biarkan minimal **6 karakter**
- Hapus validasi 8 karakter di `register.js` ✅ (sudah dilakukan)
- User bisa pakai password sederhana seperti: `123456`, `abcdef`, `pkkmb1`
