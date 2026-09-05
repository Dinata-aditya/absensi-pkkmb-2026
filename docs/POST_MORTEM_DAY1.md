# 🚨 POST-MORTEM & FIXES - PKKMB Day 1

**Date**: 5 September 2026  
**Event**: PKKMB 2026 - Day 1  
**Attendance Method**: Manual (system issues)

---

## 📊 Issues Reported

| # | Issue | Impact | Users Affected |
|---|-------|--------|----------------|
| 1 | Tidak bisa login | HIGH | Beberapa maba |
| 2 | Kamera tidak bisa scan | HIGH | Multiple users |
| 3 | Kamera ter-zoom (QR tidak terbaca) | HIGH | Multiple users |
| 4 | Permission kamera berulang | MEDIUM | Some users |

**Result**: Absensi manual dilakukan untuk semua peserta

---

## 🔍 Root Cause Analysis

### Issue 1: Login Gagal

**Penyebab Kemungkinan**:
- `user_roles` record missing untuk beberapa mahasiswa
- Race condition `getUserRole()` di koneksi lambat (walaupun sudah ada retry)
- Banyak user concurrent → Supabase rate limit

**Fix Immediate** (SQL):
```sql
-- Cek mahasiswa tanpa role
SELECT s.nim, s.nama_lengkap, s.user_id
FROM students s
LEFT JOIN user_roles ur ON ur.user_id = s.user_id
WHERE ur.role IS NULL;

-- Auto-fix: insert missing roles
INSERT INTO user_roles (user_id, role)
SELECT s.user_id, ''MAHASISWA''
FROM students s
LEFT JOIN user_roles ur ON ur.user_id = s.user_id
WHERE ur.role IS NULL;
```

**Status**: ⚠️ **RUN THIS SQL BEFORE DAY 2**

---

### Issue 2 & 3: Kamera Tidak Bisa Scan / Ter-Zoom

**Root Cause**:
- `html5-qrcode` library compatibility issues dengan berbagai HP
- `facingMode: "environment"` tidak reliable di beberapa browser
- Zoom issue: library tidak handle camera constraints properly
- Permission berulang: browser cache issue

**Current Code Problem**:
```javascript
// Config terlalu strict
const config = {
    qrbox: { width: 320, height: 320 }, // Fixed size → zoom di layar kecil
    aspectRatio: 1.0 // Terlalu rigid
};
```

**Fix Needed**:
1. Dynamic QR box size (responsive)
2. Camera enumeration (pilih camera by ID, bukan facingMode)
3. Fallback mechanism
4. Manual input button

**Status**: ⚠️ **CODE FIX NEEDED** (file: `public/js/scanner.js`)

---

### Issue 4: Permission Berulang

**Root Cause**:
- Browser tidak cache permission grant
- Page reload → permission hilang
- iOS Safari: permission reset setiap session

**Workaround**:
- User harus allow permission setiap buka scanner
- Tidak ada fix code-level untuk ini (browser behavior)

---

## ✅ Quick Fixes untuk Day 2

### Fix 1: Insert Missing Roles (5 menit)

**Jalankan SQL di Supabase** (SQL Editor):

```sql
-- Check dulu berapa yang missing
SELECT COUNT(*) as missing_roles
FROM students s
LEFT JOIN user_roles ur ON ur.user_id = s.user_id
WHERE ur.role IS NULL;

-- Kalau ada yang NULL, insert semua
INSERT INTO user_roles (user_id, role)
SELECT s.user_id, ''MAHASISWA''
FROM students s
LEFT JOIN user_roles ur ON ur.user_id = s.user_id
WHERE ur.role IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_mahasiswa_with_role
FROM students s
INNER JOIN user_roles ur ON ur.user_id = s.user_id
WHERE ur.role = ''MAHASISWA'';
```

---

### Fix 2: Improve Scanner Code (30 menit)

**Changes Needed in `public/js/scanner.js`**:

1. **Add Camera Enumeration**:
```javascript
// Get all cameras first
const devices = await navigator.mediaDevices.enumerateDevices();
const cameras = devices.filter(d => d.kind === ''videoinput'');

// Find back camera
const backCamera = cameras.find(c => 
    c.label.includes(''back'') || 
    c.label.includes(''rear'')
);

// Use camera ID instead of facingMode
const cameraId = backCamera ? backCamera.deviceId : cameras[0].deviceId;
html5QrcodeScanner.start(cameraId, config, ...);
```

2. **Dynamic QR Box**:
```javascript
qrbox: function(viewfinderWidth, viewfinderHeight) {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdge * 0.7);
    return {
        width: Math.min(qrboxSize, 300),
        height: Math.min(qrboxSize, 300)
    };
}
```

3. **Manual Input Fallback**:
```javascript
// Jika scanner gagal, tampilkan button
<button onclick="manualAbsen()">Hubungi Panitia untuk Absen Manual</button>
```

---

### Fix 3: Admin Manual Attendance Feature (20 menit)

**Add "Tandai Hadir" Bulk** di admin dashboard:

1. Admin bisa input list NIM secara manual
2. Bulk mark as present untuk session
3. Upload Excel/CSV dengan NIM list

**Status**: ⚠️ **RECOMMENDED untuk Day 2+**

---

## 📝 Workaround untuk Day 2 (Tanpa Code Change)

### Plan A: Scanner dengan Troubleshooting

**Instruksi untuk Panitia**:

1. **Sebelum Event** → Test 5-10 HP berbeda untuk QR scan
2. **Jika Kamera Gagal** → Suruh user:
   - Close browser completely
   - Buka lagi scanner page
   - Allow camera permission
   - Jika masih gagal → absen manual

3. **Jika Kamera Zoom** → Suruh user:
   - Pinch zoom out di layar
   - Atau ganti HP/browser lain

### Plan B: Hybrid Manual + Scanner

**Setup**:
- Scanner QR tetap jalan
- Siapkan 2-3 panitia dengan Excel/Google Sheets
- Mahasiswa yang gagal scan → manual input NIM di Excel
- Setelah event → admin input manual ke sistem

### Plan C: Full Manual (Backup)

**Jika scanner masih banyak issue**:
- Cetak daftar hadir Excel per prodi
- Mahasiswa tanda tangan manual
- Panitia input manual ke sistem setelah event

---

## 🎯 Recommendation untuk Day 2

### **Prioritas TINGGI** (Sekarang!):

1. ✅ **Jalankan SQL fix missing roles** (5 menit)
2. ✅ **Test scanner di 10 HP berbeda** (30 menit)
3. ✅ **Siapkan Excel manual backup** (10 menit)

### **Prioritas MEDIUM** (Kalau ada waktu):

4. ⚠️ **Fix scanner code** (30 menit + test + deploy)
5. ⚠️ **Add admin bulk "Tandai Hadir"** (1 jam)

### **Prioritas LOW** (Post-event):

6. 📝 **Add detailed error logging** untuk analytics
7. 📝 **Performance monitoring** Supabase queries

---

## 📞 Communication Plan Day 2

### **Template Pesan untuk Panitia**:

```
🎓 PKKMB DAY 2 - ABSENSI NOTICE

Bagi maba yang mengalami kendala:

✅ Login Gagal:
- Refresh browser
- Logout lalu login lagi
- Hubungi panitia jika masih gagal

✅ Kamera Tidak Bisa Scan:
- Pastikan izin kamera diaktifkan
- Close browser lalu buka lagi
- Jika masih gagal → LAPORKAN KE PANITIA untuk absen manual

✅ Kamera Ter-Zoom:
- Pinch zoom out di layar
- Atau gunakan browser/HP lain

Terima kasih!
```

---

## 💡 Lessons Learned

### **What Went Wrong**:
1. ❌ Tidak test scanner di real devices sebelum production
2. ❌ Tidak ada fallback/backup plan yang jelas
3. ❌ Login retry belum di-test di load tinggi

### **What Went Right**:
1. ✅ Database RLS working (no security issues)
2. ✅ Manual absensi bisa dilakukan (fallback worked)
3. ✅ Admin dashboard stable

### **For Next Event**:
1. ✅ Test di 20+ HP berbeda (Android & iPhone)
2. ✅ Load testing dengan 100+ concurrent users
3. ✅ Pre-event dry run dengan 50 maba
4. ✅ Always have manual backup ready

---

**Created**: 5 September 2026  
**Next Review**: After Day 2  
**Action Owner**: Admin/Developer
