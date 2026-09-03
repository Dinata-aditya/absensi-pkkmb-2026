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

        // Hitung hadir per hari
        const hadirPerHari = {};
        sessions.forEach(s => {
            if (!hadirPerHari[s.hari_ke]) hadirPerHari[s.hari_ke] = 0;
            if (hadirSet.has(s.id)) hadirPerHari[s.hari_ke]++;
        });

        // Semua hari yang punya sesi
        const semuaHari = [...new Set(sessions.map(s => s.hari_ke))].sort();

        // Syarat: hadir minimal 2 sesi di SETIAP hari
        const layak = semuaHari.length >= 2 &&
            semuaHari.every(h => (hadirPerHari[h] || 0) >= 2);

        const totalHari = semuaHari.length;
        const hariLolos = semuaHari.filter(h => (hadirPerHari[h] || 0) >= 2).length;
        const deskripsi = semuaHari.map(h =>
            `Hari ${h}: ${hadirPerHari[h] || 0}/2 sesi`
        ).join(' &nbsp;|&nbsp; ');

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
                    <p style="color:#6b7280;font-size:.875rem;margin-bottom:1.5rem;">
                        Anda telah hadir di semua hari kegiatan PKKMB 2026.
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
                        Sertifikat diberikan jika hadir minimal 2 sesi di setiap hari kegiatan.
                    </p>
                    <p style="font-size:.875rem;color:#374151;">${deskripsi}</p>
                    <p style="font-size:.8125rem;color:#9ca3af;margin-top:.5rem;">
                        Progress: ${hariLolos}/${totalHari} hari terpenuhi
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

        // No seri: 3 digit terakhir NIM, misal 2636062 → 062/PKKMB/09.2026
        const noSertif = `${nim.slice(-3)}/PKKMB/09.2026`;

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

        // ── No. Sertifikat ──────────────────────────
        ctx.fillStyle = '#555555';
        ctx.font      = `normal ${Math.round(W * 0.016)}px 'Times New Roman', serif`;
        ctx.fillText(`No. ${noSertif}`, W / 2, Math.round(H * 0.408));

        // ── Nama Mahasiswa (auto-fit font size) ─────
        // Maksimum lebar nama = 60% dari lebar canvas
        const maxNameWidth = W * 0.60;
        let nameFontSize   = Math.round(W * 0.042); // mulai dari ukuran normal
        ctx.font = `bold ${nameFontSize}px 'Times New Roman', serif`;
        // Kurangi font size sampai nama muat
        while (ctx.measureText(nama).width > maxNameWidth && nameFontSize > 20) {
            nameFontSize -= 2;
            ctx.font = `bold ${nameFontSize}px 'Times New Roman', serif`;
        }
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(nama, W / 2, Math.round(H * 0.565));

        // ── Garis bawah nama ────────────────────────
        const nameWidth  = ctx.measureText(nama).width;
        const lineY      = Math.round(H * 0.575);
        const lineMargin = Math.round(W * 0.02);
        ctx.beginPath();
        ctx.moveTo(W / 2 - nameWidth / 2 - lineMargin, lineY);
        ctx.lineTo(W / 2 + nameWidth / 2 + lineMargin, lineY);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // ── NIM ─────────────────────────────────────
        ctx.fillStyle = '#222222';
        ctx.font      = `normal ${Math.round(W * 0.020)}px Arial, sans-serif`;
        ctx.fillText(`NIM : ${nim}`, W / 2, Math.round(H * 0.618));

        // ── Prodi ───────────────────────────────────
        ctx.font      = `bold ${Math.round(W * 0.020)}px Arial, sans-serif`;
        ctx.fillStyle = '#111111';
        ctx.fillText(`PRODI : ${prodi}`, W / 2, Math.round(H * 0.650));

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

