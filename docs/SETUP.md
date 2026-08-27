# Setup Guide - Sistem Absensi PKKMB 2026

## Prerequisites

1. Akun Supabase (gratis di https://supabase.com)
2. Browser modern (Chrome, Firefox, Safari, Edge)
3. Text editor (VS Code, Sublime, atau sejenisnya)
4. Hosting untuk file HTML/CSS/JS (ac.id atau sejenisnya)

## Step 1: Setup Supabase Project

1. Login ke https://supabase.com/dashboard
2. Klik "New Project"
3. Isi detail project:
   - Name: `absensi-pkkmb-2026`
   - Database Password: (simpan password ini dengan aman)
   - Region: Southeast Asia (Singapore) untuk latency terbaik
4. Tunggu ~2 menit sampai project selesai dibuat

## Step 2: Run Database Migration

1. Buka Supabase Dashboard → Project Settings → API
2. Copy **Project URL** dan **anon/public key**
3. Buka Supabase Dashboard → SQL Editor
4. Klik "New Query"
5. Copy isi file `sql/001_initial_schema.sql` ke SQL Editor
6. Klik "Run" atau tekan Ctrl+Enter
7. Verifikasi output menampilkan:
   ```
   ✓ Database schema created successfully
   ✓ Faculties inserted: 7
   ✓ Study programs inserted: 19
   ```

## Step 3: Configure Frontend

1. Buka file `public/js/config.js`
2. Replace dengan credentials Supabase Anda:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'https://YOUR_PROJECT_URL.supabase.co',
       anonKey: 'YOUR_ANON_KEY'
   };
   ```

## Step 4: Test Locally

### Option A: Live Server (VS Code)
1. Install extension "Live Server" di VS Code
2. Right-click pada `public/index.html`
3. Pilih "Open with Live Server"
4. Browser akan membuka http://localhost:5500

### Option B: Python HTTP Server
```bash
cd public
python -m http.server 8000
```
Buka browser ke http://localhost:8000

### Option C: Node HTTP Server
```bash
npx http-server public -p 8000
```
Buka browser ke http://localhost:8000

## Step 5: Verify Setup

1. Buka `index.html` di browser
2. Buka browser console (F12)
3. Verifikasi muncul:
   ```
   ✓ Supabase client initialized
   Project URL: https://xxxxx.supabase.co
   ✓ Auth utilities loaded
   ```
4. Jika tidak ada error, setup berhasil!

## Next Steps

Lanjutkan ke migration berikutnya:
- `sql/002_seed_admin.sql` - Create admin account
- `sql/003_rls_policies.sql` - Setup Row Level Security
- `sql/004_attendance_rpc.sql` - Create RPC functions

## Troubleshooting

### Error: "Invalid API Key"
- Pastikan anon key di `config.js` benar
- Jangan gunakan service_role key di frontend

### Error: "Connection refused"
- Pastikan Supabase project sudah selesai setup
- Check Project URL benar di config.js

### Database schema error
- Drop semua tables di Supabase SQL Editor
- Run migration lagi dari awal

### CORS error
- Pastikan testing menggunakan http-server, bukan file://
- Atau deploy ke hosting yang proper

## Support

Jika ada masalah, check:
1. Supabase Dashboard → Logs untuk error messages
2. Browser Console (F12) untuk JavaScript errors
3. Network tab untuk API call failures
