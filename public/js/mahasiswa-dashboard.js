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
                <div class="day-date">${formatDate(session.tanggal)} • ${session.jam_mulai} - ${session.jam_selesai}</div>
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
