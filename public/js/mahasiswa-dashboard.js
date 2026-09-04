// Mahasiswa Dashboard Logic

let studentData = null;
let attendanceData = [];

// Protect page - only MAHASISWA can access
(async function() {
    const auth = await protectPage('MAHASISWA');
    
    if (!auth) {
        return; // Will redirect automatically
    }
    
    await loadDashboard();
})();

// Load dashboard data
async function loadDashboard() {
    try {
        const session = await checkAuth();
        if (!session) return;
        
        // Get student data
        studentData = await getStudentData(session.user.id);
        
        if (!studentData) {
            throw new Error('Data mahasiswa tidak ditemukan');
        }
        
        // Display student info
        displayStudentInfo();
        
        // Display status
        displayStatus();
        
        // Load attendance history
        await loadAttendanceHistory();
        
        // Cek kelayakan sertifikat
        await cekDanTampilkanSertifikat();
        
        // Show dashboard
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';
        
    } catch (error) {
        console.error('Load dashboard error:', error);
        alert('Gagal memuat dashboard: ' + error.message);
    }
}

// Display student information
function displayStudentInfo() {
    document.getElementById('studentName').textContent = studentData.nama_lengkap;
    document.getElementById('studentNim').textContent = studentData.nim;
    document.getElementById('studentFakultas').textContent = studentData.faculties?.nama || '-';
    document.getElementById('studentProdi').textContent = studentData.study_programs?.nama || '-';
}

// Display status - semua mahasiswa ACTIVE
function displayStatus() {
    const statusSection = document.getElementById('statusSection');
    const scanSection   = document.getElementById('scanSection');

    // Sembunyikan status card, langsung tampilkan scan section
    statusSection.closest('.card').style.display = 'none';
    scanSection.style.display = 'block';
}

// Load attendance history
async function loadAttendanceHistory() {
    try {
        // Get all attendance sessions
        const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('*')
            .order('hari_ke');
        
        if (sessionsError) throw sessionsError;
        
        // Get student's attendances
        const { data: attendances, error: attendancesError } = await supabase
            .from('attendances')
            .select('*')
            .eq('student_id', studentData.id);
        
        if (attendancesError) throw attendancesError;
        
        attendanceData = attendances || [];
        
        // Display attendance history
        displayAttendanceHistory(sessions || []);
        
    } catch (error) {
        console.error('Load attendance error:', error);
        document.getElementById('attendanceHistory').innerHTML = `
            <p style="text-align: center; color: var(--gray-500);">
                Gagal memuat riwayat absensi
            </p>
        `;
    }
}

// Display attendance history
function displayAttendanceHistory(sessions) {
    const container = document.getElementById('attendanceHistory');
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--gray-500); padding: var(--spacing-xl);">
                Belum ada sesi absensi yang dibuat
            </p>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    sessions.forEach(session => {
        // Find attendance for this session
        const attendance = attendanceData.find(a => a.session_id === session.id);
        
        let statusBadge = '';
        let statusText = '';
        
        if (attendance) {
            if (attendance.status === 'HADIR') {
                statusBadge = '<span class="badge badge-success">✓ HADIR</span>';
                statusText = `<small style="color: var(--gray-600);">Scan: ${formatDateTime(attendance.scan_time)}</small>`;
            } else if (attendance.status === 'ALPHA') {
                statusBadge = '<span class="badge badge-danger">✗ ALPHA</span>';
                statusText = '<small style="color: var(--gray-600);">Tidak hadir</small>';
            }
        } else {
            // No attendance record
            if (session.status === 'CLOSED') {
                statusBadge = '<span class="badge badge-danger">✗ ALPHA</span>';
                statusText = '<small style="color: var(--gray-600);">Tidak hadir</small>';
            } else if (session.status === 'OPEN') {
                statusBadge = '<span class="badge badge-warning">○ BELUM ABSEN</span>';
                statusText = '<small style="color: var(--gray-600);">Sesi sedang berlangsung</small>';
            } else {
                statusBadge = '<span class="badge badge-secondary">○ BELUM ABSEN</span>';
                statusText = '<small style="color: var(--gray-600);">Sesi belum dibuka</small>';
            }
        }
        
        const card = document.createElement('div');
        card.className = 'attendance-day-card';
        card.innerHTML = `
            <div class="day-number">${session.hari_ke}</div>
            <div class="day-info">
                <div class="day-title">${session.nama_kegiatan}</div>
                <div class="day-date">${formatDate(session.tanggal)} • ${session.jam_mulai ? session.jam_mulai.slice(0,5) : '-'}</div>
                ${statusText}
            </div>
            <div>
                ${statusBadge}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Open scanner
function openScanner() {
    if (studentData.status !== 'ACTIVE') {
        alert('Akun Anda belum aktif. Tidak dapat melakukan absensi.');
        return;
    }
    
    // Redirect to scanner page
    window.location.href = 'scanner.html';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Format date time
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', dateOptions) + ' ' + date.toLocaleTimeString('id-ID', timeOptions);
}

console.log('✓ Mahasiswa dashboard loaded');

// ══════════════════════════════════════════════
// SERTIFIKAT — cek kelayakan & download
// ══════════════════════════════════════════════

async function cekDanTampilkanSertifikat() {
    try {
        // Cek setting sertifikat_aktif dari admin
        let sertifAktif = false;
        try {
            const { data: setting } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'sertifikat_aktif')
                .single();
            sertifAktif = setting?.value === 'true';
        } catch (e) {
            console.warn('Settings table not found, defaulting sertifAktif to false');
        }

        // Ambil semua sesi
        const { data: sessions } = await supabase
            .from('attendance_sessions')
            .select('id, hari_ke, status')
            .order('hari_ke');

        if (!sessions || sessions.length === 0) return;

        // Ambil absensi mahasiswa ini
        const { data: atts } = await supabase
            .from('attendances')
            .select('session_id, status')
            .eq('student_id', studentData.id);

        const hadirSet = new Set((atts || [])
            .filter(a => a.status === 'HADIR')
            .map(a => a.session_id));

        // Hitung total kehadiran
        const totalSesi = sessions.length;
        const totalHadir = hadirSet.size;
        
        // Syarat: minimal 4 dari 5 absensi (80%)
        const minimalHadir = 4;
        const layak = totalHadir >= minimalHadir;

        // Deskripsi untuk ditampilkan
        const deskripsi = `${totalHadir} dari ${totalSesi} absensi`;

        // Sisipkan kartu sertifikat ke dashboard-grid setelah kartu riwayat absensi
        const attCard = document.getElementById('attendanceHistory').closest('.card');
        const grid    = attCard?.closest('.dashboard-grid') || document.querySelector('.dashboard-grid');

        if (!grid) {
            console.error('dashboard-grid not found');
            return;
        }

        // Hapus section sertifikat lama kalau ada
        const existing = document.getElementById('sertifSection');
        if (existing) existing.remove();

        const sertifSection = document.createElement('div');
        sertifSection.className = 'card';
        sertifSection.id = 'sertifSection';

        if (!sertifAktif) {
            // Sertifikat belum diaktifkan admin — tampilkan info saja
            sertifSection.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">Sertifikat Kehadiran</h3>
                </div>
                <div class="card-body" style="text-align:center;padding:2rem;">
                    <div style="width:72px;height:72px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                    </div>
                    <h3 style="margin-bottom:.5rem;color:#6b7280;">Sertifikat Belum Dibuka</h3>
                    <p style="color:#9ca3af;font-size:.875rem;">
                        Sertifikat akan tersedia setelah panitia mengaktifkan fitur ini.<br>
                        Silakan cek kembali setelah PKKMB selesai.
                    </p>
                </div>
            `;
        } else if (layak) {
            // Layak dan sertifikat sudah diaktifkan
            sertifSection.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">Sertifikat Kehadiran</h3>
                </div>
                <div class="card-body" style="text-align:center;padding:2rem;">
                    <div style="width:72px;height:72px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                    </div>
                    <h3 style="margin-bottom:.5rem;color:#065f46;">Selamat! Anda Berhak Mendapat Sertifikat</h3>
                    <p style="color:#6b7280;font-size:.875rem;margin-bottom:.5rem;">
                        Anda telah hadir <strong>${totalHadir} dari ${totalSesi} absensi</strong> kegiatan PKKMB 2026.
                    </p>
                    <p style="color:#059669;font-size:.8125rem;margin-bottom:1.5rem;">
                        ✓ Memenuhi syarat minimal 4 kehadiran
                    </p>
                    <button class="btn btn-primary btn-lg" onclick="downloadSertifikat()">
                        Download Sertifikat
                    </button>
                </div>
            `;
        } else {
            // Tidak layak meski sertifikat sudah diaktifkan
            sertifSection.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">Sertifikat Kehadiran</h3>
                </div>
                <div class="card-body" style="text-align:center;padding:2rem;">
                    <div style="width:72px;height:72px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                    </div>
                    <h3 style="margin-bottom:.5rem;color:#92400e;">Sertifikat Tidak Tersedia</h3>
                    <p style="color:#6b7280;font-size:.875rem;margin-bottom:.75rem;">
                        Untuk mendapat sertifikat, Anda harus hadir minimal <strong>4 dari 5 absensi</strong>.
                    </p>
                    <p style="font-size:.9375rem;font-weight:600;color:#374151;">Kehadiran Anda: ${totalHadir}/${totalSesi} absensi</p>
                    <p style="font-size:.8125rem;color:#9ca3af;margin-top:.5rem;">
                        Kurang ${minimalHadir - totalHadir} absensi lagi
                    </p>
                </div>
            `;
        }

        // Tambahkan ke grid
        grid.appendChild(sertifSection);

    } catch (err) {
        console.error('Cek sertifikat error:', err);
    }
}

// ── Download sertifikat ──────────────────────────
async function downloadSertifikat() {
    const btn = document.querySelector('#sertifSection button');
    if (btn) { btn.disabled = true; btn.textContent = 'Membuat sertifikat...'; }

    try {
        const nama  = studentData.nama_lengkap.toUpperCase();
        const nim   = studentData.nim;
        const prodi = (studentData.study_programs?.nama || '-').toUpperCase();

        // No seri: 3 digit terakhir NIM, format: 000/PKKMB/UPP/IX/2026
        const noSertif = `${nim.slice(-3)}/PKKMB/UPP/IX/2026`;

        // Load font Carlito (pengganti Calibri, metric-compatible) dari Google Fonts
        // Carlito dibuat sebagai drop-in replacement Calibri oleh Google
        try {
            if (!document.fonts.check('16px Carlito')) {
                const fontNormal = new FontFace('Carlito', 'url(https://fonts.gstatic.com/s/carlito/v3/3Jn9SDPw3m-pk039PDK.woff2)');
                const fontBold   = new FontFace('Carlito', 'url(https://fonts.gstatic.com/s/carlito/v3/3Jn4SDPw3m-pk039BIykaQ.woff2)', { weight: '700' });
                await Promise.all([
                    fontNormal.load().then(f => document.fonts.add(f)),
                    fontBold.load().then(f => document.fonts.add(f))
                ]);
            }
        } catch(e) { console.warn('Font Carlito gagal dimuat, fallback ke Arial:', e); }

        // Load gambar template
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            img.onload  = resolve;
            img.onerror = reject;
            img.src = 'img/seritifikat.asli.png?' + Date.now();
        });

        // Buat canvas sesuai ukuran gambar
        const canvas  = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        const W   = canvas.width;
        const H   = canvas.height;

        // Gambar template sebagai background
        ctx.drawImage(img, 0, 0);

        ctx.textAlign = 'center';

        // Font Carlito (pengganti Calibri, fallback Arial)
        const fontCalibri = "Carlito, Calibri, Arial, sans-serif";

        // ── Helper: auto-fit text dalam batas maxWidth ──
        function fitText(text, fontStyle, sizePx, maxWidth) {
            let size = sizePx;
            ctx.font = `${fontStyle} ${size}px ${fontCalibri}`;
            while (ctx.measureText(text).width > maxWidth && size > 8) {
                size -= 1;
                ctx.font = `${fontStyle} ${size}px ${fontCalibri}`;
            }
            return size;
        }

        // Area aman untuk teks (70% dari lebar canvas)
        const safeWidth = W * 0.60;

        // Skala font proporsional terhadap ukuran canvas
        // Gambar referensi ~2480px lebar → scale factor
        const scale = W / 2480;
        const px12  = Math.round(12 * scale * 3.78); // 12pt → px (1pt = 1.333px di 96dpi, tapi canvas pakai px)
        const px28  = Math.round(28 * scale * 3.78);

        // ── No. Sertifikat (font 12, Calibri) ───────
        ctx.fillStyle = '#444444';
        ctx.font      = `normal ${px12}px ${fontCalibri}`;
        ctx.fillText(`No. ${noSertif}`, W / 2, Math.round(H * 0.408));

        // ── Nama Mahasiswa (font 28 bold, Calibri, auto-fit jika nama panjang) ──
        // fitText akan kurangi ukuran font otomatis sampai muat dalam safeWidth
        const nameFontSize = fitText(nama, 'bold', px28, safeWidth);
        // ctx.font sudah di-set oleh fitText, langsung fillText
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(nama, W / 2, Math.round(H * 0.548));

        // ── Garis bawah nama ────────────────────────
        // Ukur lebar nama SETELAH font di-set oleh fitText
        const nameW   = ctx.measureText(nama).width;
        const lineY   = Math.round(H * 0.562);
        const linePad = Math.round(W * 0.08);
        ctx.beginPath();
        ctx.moveTo(W / 2 - nameW / 2 - linePad, lineY);
        ctx.lineTo(W / 2 + nameW / 2 + linePad, lineY);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth   = Math.max(1, Math.round(1.5 * scale));
        ctx.stroke();

        // ── NIM (font 12, Calibri) ───────────────────
        ctx.fillStyle = '#222222';
        ctx.font      = `normal ${px12}px ${fontCalibri}`;
        ctx.fillText(`NIM : ${nim}`, W / 2, Math.round(H * 0.610));

        // ── Prodi (font 12, Calibri, auto-fit) ───────
        const prodiText = `PRODI : ${prodi}`;
        fitText(prodiText, 'normal', px12, safeWidth);
        ctx.fillStyle = '#222222';
        ctx.fillText(prodiText, W / 2, Math.round(H * 0.642));

        // Download sebagai PNG
        const link    = document.createElement('a');
        link.download = `Sertifikat_PKKMB_${nim}.png`;
        link.href     = canvas.toDataURL('image/png', 1.0);
        link.click();

    } catch (err) {
        console.error('Download sertifikat error:', err);
        alert('Gagal membuat sertifikat: ' + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Download Sertifikat'; }
    }
}

