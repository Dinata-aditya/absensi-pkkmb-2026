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

// Display status
function displayStatus() {
    const statusSection = document.getElementById('statusSection');
    const scanSection = document.getElementById('scanSection');
    
    let statusHTML = '';
    let iconClass = '';
    let icon = '';
    let title = '';
    let message = '';
    
    switch (studentData.status) {
        case 'PENDING':
            iconClass = 'status-pending';
            icon = '⏳';
            title = 'Menunggu Verifikasi';
            message = 'Akun Anda sedang dalam proses verifikasi oleh admin. Anda belum dapat melakukan absensi. Silakan hubungi panitia jika sudah lebih dari 1x24 jam.';
            break;
            
        case 'ACTIVE':
            iconClass = 'status-active';
            icon = '✓';
            title = 'Akun Aktif';
            message = 'Akun Anda sudah aktif! Anda dapat melakukan absensi dengan scan QR Code yang tersedia di lokasi kegiatan.';
            scanSection.style.display = 'block';
            break;
            
        case 'NEEDS_REVISION':
            iconClass = 'status-pending';
            icon = '⚠️';
            title = 'Perlu Revisi';
            message = 'Data Anda memerlukan revisi. Silakan hubungi panitia untuk informasi lebih lanjut.';
            break;
            
        case 'INACTIVE':
            iconClass = 'status-inactive';
            icon = '✗';
            title = 'Akun Nonaktif';
            message = 'Akun Anda tidak aktif. Silakan hubungi panitia untuk informasi lebih lanjut.';
            break;
            
        default:
            iconClass = 'status-pending';
            icon = '?';
            title = 'Status Tidak Diketahui';
            message = 'Status akun tidak diketahui. Hubungi panitia.';
    }
    
    statusHTML = `
        <div class="status-icon ${iconClass}">${icon}</div>
        <h3>${title}</h3>
        <p style="color: var(--gray-600); max-width: 500px; margin: var(--spacing-md) auto 0;">
            ${message}
        </p>
    `;
    
    statusSection.innerHTML = statusHTML;
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
        const { data: setting } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'sertifikat_aktif')
            .single();

        const sertifAktif = setting?.value === 'true';

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

        // Sisipkan kartu sertifikat setelah kartu riwayat absensi
        const container = document.getElementById('attendanceHistory').closest('.card');
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

        container.insertAdjacentElement('afterend', sertifSection);

    } catch (err) {
        console.error('Cek sertifikat error:', err);
    }
}

// ── Download sertifikat ──────────────────────────
async function downloadSertifikat() {
    try {
        // Ambil info event (sesi pertama untuk tanggal)
        const { data: sessions } = await supabase
            .from('attendance_sessions')
            .select('tanggal, hari_ke')
            .order('hari_ke');

        const tglMulai = sessions?.[0]?.tanggal
            ? new Date(sessions[0].tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })
            : '-';
        const tglAkhir = sessions?.length > 1
            ? new Date(sessions[sessions.length-1].tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })
            : tglMulai;

        const nama     = studentData.nama_lengkap;
        const nim      = studentData.nim;
        const prodi    = studentData.study_programs?.nama || '-';
        const fakultas = studentData.faculties?.nama || '-';
        const nomorSertif = `PKKMB-2026-${nim}`;

        // Buat window print
        const w = window.open('', '', 'width=1000,height=720');
        w.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Sertifikat – ${nama}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Times New Roman', Times, serif;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 1rem;
    }
    .cert {
        width: 297mm;
        min-height: 210mm;
        border: 12px double #10b981;
        padding: 2.5rem 3rem;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .cert::before {
        content: '';
        position: absolute;
        inset: 6px;
        border: 2px solid #10b981;
        pointer-events: none;
    }
    .logo-row {
        display: flex;
        justify-content: center;
        gap: 2.5rem;
        margin-bottom: 1.25rem;
    }
    .logo-row img {
        height: 80px;
        width: 80px;
        object-fit: contain;
    }
    .univ-name {
        font-size: 13pt;
        font-weight: 700;
        letter-spacing: .5px;
        margin-bottom: .2rem;
        color: #111;
    }
    .divider {
        width: 80%;
        border: none;
        border-top: 2.5px solid #10b981;
        margin: .75rem 0;
    }
    .cert-title {
        font-size: 28pt;
        font-weight: 700;
        color: #10b981;
        letter-spacing: 2px;
        margin-bottom: .25rem;
    }
    .cert-subtitle {
        font-size: 13pt;
        color: #374151;
        margin-bottom: 1.5rem;
    }
    .diberikan {
        font-size: 11pt;
        color: #6b7280;
        margin-bottom: .5rem;
    }
    .nama-penerima {
        font-size: 26pt;
        font-weight: 700;
        color: #111;
        font-style: italic;
        border-bottom: 2px solid #10b981;
        padding-bottom: .3rem;
        margin-bottom: .75rem;
        min-width: 400px;
    }
    .info-row {
        font-size: 11pt;
        color: #374151;
        margin-bottom: .3rem;
    }
    .info-row span { font-weight: 600; }
    .body-text {
        font-size: 11pt;
        color: #374151;
        max-width: 580px;
        line-height: 1.6;
        margin: 1rem 0 1.5rem;
    }
    .sign-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-top: auto;
        padding-top: 1.5rem;
    }
    .sign-box {
        text-align: center;
        min-width: 180px;
    }
    .sign-space { height: 55px; }
    .sign-name {
        font-size: 10pt;
        color: #374151;
        border-top: 1px solid #374151;
        padding-top: .3rem;
    }
    .nomor {
        font-size: 9pt;
        color: #9ca3af;
        margin-bottom: 1rem;
    }
    @media print {
        body { padding: 0; }
        .cert { width: 100%; min-height: 100vh; }
    }
</style>
</head>
<body>
<div class="cert">
    <div class="logo-row">
        <img src="img/logo-univ.png" alt="Logo UPP" onerror="this.style.display='none'">
        <img src="img/logo-pkkmb.png" alt="Logo PKKMB" onerror="this.style.display='none'">
    </div>

    <div class="univ-name">UNIVERSITAS PASIR PENGARAIAN</div>
    <div style="font-size:10pt;color:#6b7280;margin-bottom:.5rem;">Panitia PKKMB 2026</div>
    <hr class="divider">

    <div class="cert-title">SERTIFIKAT</div>
    <div class="cert-subtitle">KEHADIRAN PKKMB 2026</div>

    <div class="nomor">No: ${nomorSertif}</div>

    <div class="diberikan">Diberikan kepada:</div>
    <div class="nama-penerima">${nama}</div>

    <div class="info-row">NIM: <span>${nim}</span></div>
    <div class="info-row">Program Studi: <span>${prodi}</span></div>
    <div class="info-row">Fakultas: <span>${fakultas}</span></div>

    <div class="body-text">
        Telah mengikuti seluruh rangkaian kegiatan
        <strong>Pengenalan Kehidupan Kampus Mahasiswa Baru (PKKMB) 2026</strong>
        Universitas Pasir Pengaraian yang dilaksanakan pada
        <strong>${tglMulai} – ${tglAkhir}</strong>
        dengan kehadiran penuh.
    </div>

    <div class="sign-row">
        <div class="sign-box">
            <div style="font-size:10pt;color:#6b7280;margin-bottom:.3rem;">Pasir Pengaraian, ${tglAkhir}</div>
            <div style="font-size:10pt;color:#374151;margin-bottom:.3rem;">Ketua Panitia PKKMB 2026</div>
            <div class="sign-space"></div>
            <div class="sign-name">( _________________________ )</div>
        </div>
        <div class="sign-box">
            <div style="font-size:10pt;color:#6b7280;margin-bottom:.3rem;">Mengetahui,</div>
            <div style="font-size:10pt;color:#374151;margin-bottom:.3rem;">Wakil Rektor Bidang Kemahasiswaan</div>
            <div class="sign-space"></div>
            <div class="sign-name">( _________________________ )</div>
        </div>
    </div>
</div>
</body>
</html>`);

        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 500);

    } catch (err) {
        console.error('Download sertifikat error:', err);
        alert('Gagal membuka sertifikat: ' + err.message);
    }
}
