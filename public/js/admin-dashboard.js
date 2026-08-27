// Admin Dashboard Logic

let allStudents = [];
let filteredStudents = [];
let faculties = [];
let studyPrograms = [];
let currentStudent = null;
let currentTab = 'mahasiswa';
let allSessions = [];
let currentSession = null;

// Protect page - only ADMIN can access
(async function() {
    const auth = await protectPage('ADMIN');
    
    if (!auth) {
        return; // Will redirect automatically
    }
    
    await loadDashboard();
})();

// Load dashboard data
async function loadDashboard() {
    try {
        // Load faculties
        const { data: facultiesData, error: facultiesError } = await supabase
            .from('faculties')
            .select('*')
            .order('nama');
        
        if (facultiesError) throw facultiesError;
        faculties = facultiesData || [];
        
        // Load study programs
        const { data: programsData, error: programsError } = await supabase
            .from('study_programs')
            .select('*')
            .order('nama');
        
        if (programsError) throw programsError;
        studyPrograms = programsData || [];
        
        // Load students
        await loadStudents();
        
        // Load sessions for statistics
        await loadSessions();
        
        // Load statistics
        await loadStatistics();
        
        // Populate filter dropdowns
        populateFilters();
        
        // Show content
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('tabMahasiswa').classList.add('active');
        
    } catch (error) {
        console.error('Load dashboard error:', error);
        alert('Gagal memuat dashboard: ' + error.message);
    }
}

// Load students
async function loadStudents() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                faculties:fakultas_id(id, nama),
                study_programs:prodi_id(id, nama)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allStudents = data || [];
        filteredStudents = [...allStudents];
        
        // Update stats
        updateStats();
        
        // Display students
        displayStudents();
        
    } catch (error) {
        console.error('Load students error:', error);
        throw error;
    }
}

// Update statistics
function updateStats() {
    const total = allStudents.length;
    const pending = allStudents.filter(s => s.status === 'PENDING').length;
    const active = allStudents.filter(s => s.status === 'ACTIVE').length;
    const inactive = allStudents.filter(s => s.status === 'INACTIVE').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statInactive').textContent = inactive;
}

// Populate filter dropdowns
function populateFilters() {
    // Fakultas
    const filterFakultas = document.getElementById('filterFakultas');
    filterFakultas.innerHTML = '<option value="">Semua Fakultas</option>';
    faculties.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.nama;
        filterFakultas.appendChild(option);
    });
    
    // Prodi
    const filterProdi = document.getElementById('filterProdi');
    filterProdi.innerHTML = '<option value="">Semua Program Studi</option>';
    studyPrograms.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nama;
        filterProdi.appendChild(option);
    });
}

// Apply filters
function applyFilters() {
    const fakultasFilter = document.getElementById('filterFakultas').value;
    const prodiFilter = document.getElementById('filterProdi').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const searchFilter = document.getElementById('filterSearch').value.toLowerCase();
    
    filteredStudents = allStudents.filter(student => {
        // Fakultas filter
        if (fakultasFilter && student.fakultas_id !== fakultasFilter) return false;
        
        // Prodi filter
        if (prodiFilter && student.prodi_id !== prodiFilter) return false;
        
        // Status filter
        if (statusFilter && student.status !== statusFilter) return false;
        
        // Search filter
        if (searchFilter) {
            const nimMatch = student.nim.toLowerCase().includes(searchFilter);
            const namaMatch = student.nama_lengkap.toLowerCase().includes(searchFilter);
            if (!nimMatch && !namaMatch) return false;
        }
        
        return true;
    });
    
    displayStudents();
}

// Display students in table
function displayStudents() {
    const tbody = document.getElementById('studentsTableBody');
    
    if (filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: var(--spacing-xl); color: var(--gray-500);">
                    Tidak ada mahasiswa yang sesuai filter
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    filteredStudents.forEach(student => {
        const row = document.createElement('tr');
        
        // Status badge
        let statusBadge = '';
        switch (student.status) {
            case 'PENDING':
                statusBadge = '<span class="badge badge-warning">Pending</span>';
                break;
            case 'ACTIVE':
                statusBadge = '<span class="badge badge-success">Active</span>';
                break;
            case 'NEEDS_REVISION':
                statusBadge = '<span class="badge badge-warning">Needs Revision</span>';
                break;
            case 'INACTIVE':
                statusBadge = '<span class="badge badge-danger">Inactive</span>';
                break;
        }
        
        row.innerHTML = `
            <td>${student.nim}</td>
            <td>${student.nama_lengkap}</td>
            <td>${student.faculties?.nama || '-'}</td>
            <td>${student.study_programs?.nama || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="openUpdateStatusModal('${student.id}')">
                        Update Status
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Switch tab
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.admin-nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const tabMap = {
        'mahasiswa': 'tabMahasiswa',
        'sesi': 'tabSesi',
        'monitoring': 'tabMonitoring',
        'laporan': 'tabLaporan'
    };
    
    const targetTab = document.getElementById(tabMap[tab]);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Load sessions if switching to sesi tab
    if (tab === 'sesi') {
        loadSessions();
    }
    
    // Initialize monitoring if switching to monitoring tab
    if (tab === 'monitoring') {
        refreshMonitoring();
    }
    
    // Initialize laporan if switching to laporan tab
    if (tab === 'laporan') {
        loadSessions().then(() => {
            initLaporanTab();
        });
    }
}

// Load sessions
async function loadSessions() {
    try {
        const { data, error } = await supabase
            .from('attendance_sessions')
            .select('*')
            .order('hari_ke');
        
        if (error) throw error;
        
        allSessions = data || [];
        displaySessions();
        
    } catch (error) {
        console.error('Load sessions error:', error);
        alert('Gagal memuat sesi: ' + error.message);
    }
}

// Display sessions
function displaySessions() {
    const container = document.getElementById('sessionsList');
    
    if (allSessions.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-2xl); color: var(--gray-500);">
                <p>Belum ada sesi absensi yang dibuat.</p>
                <p style="font-size: var(--font-size-sm);">Klik tombol "Buat Sesi Absensi Baru" untuk membuat sesi pertama.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    allSessions.forEach(session => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Status badge
        let statusBadge = '';
        let statusColor = '';
        switch (session.status) {
            case 'SCHEDULED':
                statusBadge = 'SCHEDULED';
                statusColor = 'secondary';
                break;
            case 'OPEN':
                statusBadge = 'OPEN';
                statusColor = 'success';
                break;
            case 'CLOSED':
                statusBadge = 'CLOSED';
                statusColor = 'danger';
                break;
        }
        
        // Action buttons based on status
        let actionButtons = '';
        if (session.status === 'SCHEDULED') {
            actionButtons = `
                <button class="btn btn-success btn-sm" onclick="openSession('${session.id}')">
                    Buka Sesi
                </button>
            `;
        } else if (session.status === 'OPEN') {
            actionButtons = `
                <button class="btn btn-danger btn-sm" onclick="closeSession('${session.id}')">
                    Tutup Sesi
                </button>
            `;
        }
        
        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 class="card-title" style="margin: 0;">${session.nama_kegiatan}</h3>
                <span class="badge badge-${statusColor}">${statusBadge}</span>
            </div>
            <div class="card-body">
                <div style="display: grid; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg);">
                    <div><strong>Hari:</strong> Hari ke-${session.hari_ke}</div>
                    <div><strong>Tanggal:</strong> ${formatDate(session.tanggal)}</div>
                    <div><strong>Jam:</strong> ${session.jam_mulai} - ${session.jam_selesai}</div>
                </div>
                
                <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap;">
                    <button class="btn btn-primary btn-sm" onclick="showQRCode('${session.id}')">
                        📱 Lihat QR Code
                    </button>
                    ${actionButtons}
                    <button class="btn btn-outline btn-sm" onclick="openEditSessionModal('${session.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="deleteSession('${session.id}')" style="margin-left: auto; color: var(--danger-color); border-color: var(--danger-color);">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Open create session modal
function openCreateSessionModal() {
    // Set today as default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDate').value = today;
    
    // Clear form
    document.getElementById('formCreateSession').reset();
    document.getElementById('sessionStart').value = '07:00';
    document.getElementById('sessionEnd').value = '17:00';
    
    // Show modal
    document.getElementById('modalCreateSession').classList.add('active');
}

// Create session
async function createSession() {
    const form = document.getElementById('formCreateSession');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const name = document.getElementById('sessionName').value.trim();
    const hari = parseInt(document.getElementById('sessionHari').value);
    const date = document.getElementById('sessionDate').value;
    const start = document.getElementById('sessionStart').value;
    const end = document.getElementById('sessionEnd').value;
    
    // Show loading
    const btn = document.getElementById('btnCreateSession');
    const text = document.getElementById('createSessionText');
    const spinner = document.getElementById('createSessionSpinner');
    
    btn.disabled = true;
    text.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {
        // Generate unique QR token
        const qrToken = generateUUID();
        
        // Insert session
        const { data, error } = await supabase
            .from('attendance_sessions')
            .insert({
                nama_kegiatan: name,
                hari_ke: hari,
                tanggal: date,
                jam_mulai: start,
                jam_selesai: end,
                qr_token: qrToken,
                status: 'SCHEDULED'
            })
            .select()
            .single();
        
        if (error) {
            if (error.code === '23505') {
                throw new Error('Hari ke-' + hari + ' sudah ada. Gunakan hari yang berbeda.');
            }
            throw error;
        }
        
        // Reload sessions
        await loadSessions();
        
        // Close modal
        closeModal('modalCreateSession');
        
        alert('Sesi berhasil dibuat!');
        
    } catch (error) {
        console.error('Create session error:', error);
        alert('Gagal membuat sesi: ' + error.message);
    } finally {
        btn.disabled = false;
        text.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Show QR Code
function showQRCode(sessionId) {
    const session = allSessions.find(s => s.id === sessionId);
    
    if (!session) {
        alert('Sesi tidak ditemukan');
        return;
    }
    
    currentSession = session;
    
    // Set modal title
    document.getElementById('qrModalTitle').textContent = session.nama_kegiatan + ' - QR Code';
    
    // Clear previous QR
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';
    
    // Create QR data payload
    const qrData = JSON.stringify({
        session_id: session.id,
        token: session.qr_token,
        hari_ke: session.hari_ke
    });
    
    // Generate QR Code
    new QRCode(container, {
        text: qrData,
        width: 300,
        height: 300,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Show modal
    document.getElementById('modalQRCode').classList.add('active');
}

// Print QR
function printQR() {
    if (!currentSession) return;
    
    // Create print window
    const printWindow = window.open('', '', 'width=800,height=600');
    const qrCanvas = document.querySelector('#qrCodeContainer canvas');
    const qrImage = qrCanvas.toDataURL('image/png');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Code - ${currentSession.nama_kegiatan}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                h1 {
                    margin-bottom: 10px;
                }
                h2 {
                    color: #10b981;
                    margin-top: 0;
                }
                .info {
                    text-align: center;
                    margin: 20px 0;
                }
                img {
                    border: 2px solid #e5e7eb;
                    padding: 20px;
                    background: white;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 14px;
                    color: #6b7280;
                }
            </style>
        </head>
        <body>
            <h1>QR CODE ABSENSI PKKMB 2026</h1>
            <h2>${currentSession.nama_kegiatan}</h2>
            <div class="info">
                <p><strong>Hari ke-${currentSession.hari_ke}</strong></p>
                <p>${formatDate(currentSession.tanggal)}</p>
                <p>${currentSession.jam_mulai} - ${currentSession.jam_selesai}</p>
            </div>
            <img src="${qrImage}" alt="QR Code">
            <div class="footer">
                <p>Scan QR code ini untuk melakukan absensi</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Open session
async function openSession(sessionId) {
    if (!confirm('Buka sesi absensi? Mahasiswa akan dapat melakukan scan QR setelah sesi dibuka.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('attendance_sessions')
            .update({ status: 'OPEN' })
            .eq('id', sessionId);
        
        if (error) throw error;
        
        // Reload sessions
        await loadSessions();
        
        alert('Sesi berhasil dibuka! Mahasiswa sekarang dapat melakukan absensi.');
        
    } catch (error) {
        console.error('Open session error:', error);
        alert('Gagal membuka sesi: ' + error.message);
    }
}

// Close session
async function closeSession(sessionId) {
    const session = allSessions.find(s => s.id === sessionId);
    
    if (!session) {
        alert('Sesi tidak ditemukan');
        return;
    }
    
    if (!confirm(`Tutup sesi "${session.nama_kegiatan}"?\n\nSetelah ditutup:\n- Mahasiswa tidak bisa absen lagi\n- Mahasiswa yang belum absen akan menjadi ALPHA\n- Status akan difinalisasi`)) {
        return;
    }
    
    try {
        // Close session
        const { error: updateError } = await supabase
            .from('attendance_sessions')
            .update({ status: 'CLOSED' })
            .eq('id', sessionId);
        
        if (updateError) throw updateError;
        
        // Call RPC to finalize attendance (mark absent students as ALPHA)
        const { data, error: rpcError } = await supabase
            .rpc('finalize_attendance', { p_session_id: sessionId });
        
        if (rpcError) throw rpcError;
        
        // Reload sessions
        await loadSessions();
        
        // Show summary
        if (data && data.success) {
            const summary = data.data;
            alert(`Sesi berhasil ditutup dan difinalisasi!\n\n` +
                  `Total Mahasiswa: ${summary.total_students}\n` +
                  `Hadir: ${summary.total_present}\n` +
                  `Alpha: ${summary.total_alpha}`);
        } else {
            alert('Sesi berhasil ditutup!');
        }
        
    } catch (error) {
        console.error('Close session error:', error);
        alert('Gagal menutup sesi: ' + error.message);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Open update status modal
function openUpdateStatusModal(studentId) {
    currentStudent = allStudents.find(s => s.id === studentId);
    
    if (!currentStudent) {
        alert('Mahasiswa tidak ditemukan');
        return;
    }
    
    // Display student info
    const modalStudentInfo = document.getElementById('modalStudentInfo');
    modalStudentInfo.innerHTML = `
        <div><strong>NIM:</strong> ${currentStudent.nim}</div>
        <div><strong>Nama:</strong> ${currentStudent.nama_lengkap}</div>
        <div><strong>Fakultas:</strong> ${currentStudent.faculties?.nama || '-'}</div>
        <div><strong>Program Studi:</strong> ${currentStudent.study_programs?.nama || '-'}</div>
        <div><strong>Status Saat Ini:</strong> <span class="badge badge-secondary">${currentStudent.status}</span></div>
    `;
    
    // Set current status in dropdown
    document.getElementById('modalStatus').value = currentStudent.status;
    
    // Show modal
    document.getElementById('modalUpdateStatus').classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    currentStudent = null;
}

// Save status
async function saveStatus() {
    if (!currentStudent) {
        alert('Tidak ada mahasiswa yang dipilih');
        return;
    }
    
    const newStatus = document.getElementById('modalStatus').value;
    
    if (newStatus === currentStudent.status) {
        alert('Status tidak berubah');
        return;
    }
    
    // Show loading
    const btnSaveStatus = document.getElementById('btnSaveStatus');
    const saveStatusText = document.getElementById('saveStatusText');
    const saveStatusSpinner = document.getElementById('saveStatusSpinner');
    
    btnSaveStatus.disabled = true;
    saveStatusText.style.display = 'none';
    saveStatusSpinner.style.display = 'inline-block';
    
    try {
        // Update student status
        const { error } = await supabase
            .from('students')
            .update({ status: newStatus })
            .eq('id', currentStudent.id);
        
        if (error) throw error;
        
        // Update local data
        const studentIndex = allStudents.findIndex(s => s.id === currentStudent.id);
        if (studentIndex !== -1) {
            allStudents[studentIndex].status = newStatus;
        }
        
        // Reapply filters and update display
        applyFilters();
        updateStats();
        
        // Close modal
        closeModal('modalUpdateStatus');
        
        alert('Status berhasil diupdate!');
        
    } catch (error) {
        console.error('Update status error:', error);
        alert('Gagal update status: ' + error.message);
    } finally {
        // Re-enable button
        btnSaveStatus.disabled = false;
        saveStatusText.style.display = 'inline';
        saveStatusSpinner.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

console.log('✓ Admin dashboard loaded');


// Delete session
async function deleteSession(sessionId) {
    const session = allSessions.find(s => s.id === sessionId);
    
    if (!session) {
        alert('Sesi tidak ditemukan');
        return;
    }
    
    // Confirm deletion
    const confirmMsg = `Apakah Anda yakin ingin menghapus sesi "${session.nama_kegiatan}"?\n\nSemua data absensi untuk sesi ini juga akan terhapus.`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        // Delete session (attendances will be deleted automatically due to CASCADE)
        const { error } = await supabase
            .from('attendance_sessions')
            .delete()
            .eq('id', sessionId);
        
        if (error) throw error;
        
        alert('Sesi berhasil dihapus!');
        
        // Reload sessions
        await loadSessions();
        
    } catch (error) {
        console.error('Delete session error:', error);
        alert('Gagal menghapus sesi: ' + error.message);
    }
}


// Refresh monitoring
async function refreshMonitoring() {
    // Reload sessions for dropdown
    await loadSessions();
    
    // Populate session filter
    const filter = document.getElementById('monitoringSessionFilter');
    filter.innerHTML = '<option value="">-- Pilih Sesi --</option>';
    
    allSessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.id;
        option.textContent = `${session.nama_kegiatan} - Hari ke-${session.hari_ke} (${session.status})`;
        filter.appendChild(option);
    });
    
    // If a session was previously selected, load its data
    if (filter.value) {
        await loadMonitoringData();
    }
}

// Load monitoring data
async function loadMonitoringData() {
    const sessionId = document.getElementById('monitoringSessionFilter').value;
    
    if (!sessionId) {
        document.getElementById('monitoringStats').innerHTML = '';
        document.getElementById('monitoringTableContainer').innerHTML = `
            <p style="text-align: center; color: var(--gray-500); padding: var(--spacing-2xl);">
                Pilih sesi untuk melihat data absensi
            </p>
        `;
        return;
    }
    
    try {
        // Get session info
        const session = allSessions.find(s => s.id === sessionId);
        
        // Get attendance data with student info
        const { data: attendances, error } = await supabase
            .from('attendances')
            .select(`
                id,
                status,
                scan_time,
                students (
                    nim,
                    nama_lengkap,
                    faculties:fakultas_id (nama),
                    study_programs:prodi_id (nama)
                )
            `)
            .eq('session_id', sessionId)
            .order('scan_time', { ascending: false });
        
        if (error) throw error;
        
        // Get total active students
        const { count: totalStudents, error: countError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');
        
        if (countError) throw countError;
        
        // Calculate stats
        const totalHadir = attendances.filter(a => a.status === 'HADIR').length;
        const totalAlpha = attendances.filter(a => a.status === 'ALPHA').length;
        const belumAbsen = totalStudents - attendances.length;
        const persentaseHadir = totalStudents > 0 ? ((totalHadir / totalStudents) * 100).toFixed(1) : 0;
        
        // Display stats
        displayMonitoringStats({
            total: totalStudents,
            hadir: totalHadir,
            alpha: totalAlpha,
            belumAbsen: belumAbsen,
            persentase: persentaseHadir
        });
        
        // Display table
        displayMonitoringTable(attendances);
        
    } catch (error) {
        console.error('Load monitoring data error:', error);
        alert('Gagal memuat data monitoring: ' + error.message);
    }
}

// Display monitoring stats
function displayMonitoringStats(stats) {
    const container = document.getElementById('monitoringStats');
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Mahasiswa</div>
            <div class="stat-value">${stats.total}</div>
        </div>
        
        <div class="stat-card" style="background-color: var(--success-color); color: white;">
            <div class="stat-label">Hadir</div>
            <div class="stat-value">${stats.hadir}</div>
            <div class="stat-label">${stats.persentase}%</div>
        </div>
        
        <div class="stat-card" style="background-color: var(--danger-color); color: white;">
            <div class="stat-label">Alpha</div>
            <div class="stat-value">${stats.alpha}</div>
        </div>
        
        <div class="stat-card" style="background-color: var(--warning-color); color: white;">
            <div class="stat-label">Belum Absen</div>
            <div class="stat-value">${stats.belumAbsen}</div>
        </div>
    `;
}

// Display monitoring table
function displayMonitoringTable(attendances) {
    const container = document.getElementById('monitoringTableContainer');
    
    if (attendances.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--gray-500); padding: var(--spacing-2xl);">
                Belum ada data absensi untuk sesi ini
            </p>
        `;
        return;
    }
    
    const table = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>NIM</th>
                        <th>Nama</th>
                        <th>Fakultas</th>
                        <th>Prodi</th>
                        <th>Status</th>
                        <th>Waktu Scan</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendances.map(att => `
                        <tr>
                            <td>${att.students.nim}</td>
                            <td>${att.students.nama_lengkap}</td>
                            <td>${att.students.faculties?.nama || '-'}</td>
                            <td>${att.students.study_programs?.nama || '-'}</td>
                            <td>
                                <span class="badge badge-${att.status === 'HADIR' ? 'success' : 'danger'}">
                                    ${att.status}
                                </span>
                            </td>
                            <td>${formatDateTime(att.scan_time)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = table;
}

// Format date time for display
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}


// ====================================
// LAPORAN / EXPORT FUNCTIONS
// ====================================

// Initialize laporan tab
function initLaporanTab() {
    const filter = document.getElementById('laporanSessionFilter');
    filter.innerHTML = '<option value="">-- Pilih Sesi --</option><option value="all">Semua Sesi (Gabungan)</option>';
    
    allSessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.id;
        option.textContent = `${session.nama_kegiatan} - Hari ke-${session.hari_ke} (${formatDate(session.tanggal)})`;
        filter.appendChild(option);
    });
}

// Get attendance data for export
async function getAttendanceDataForExport(sessionId) {
    try {
        let query = supabase
            .from('attendances')
            .select(`
                id,
                status,
                scan_time,
                students (
                    nim,
                    nama_lengkap,
                    faculties:fakultas_id (nama),
                    study_programs:prodi_id (nama)
                ),
                attendance_sessions (
                    nama_kegiatan,
                    hari_ke,
                    tanggal
                )
            `)
            .order('scan_time', { ascending: true });
        
        // Filter by session if not "all"
        if (sessionId && sessionId !== 'all') {
            query = query.eq('session_id', sessionId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        console.error('Get attendance data error:', error);
        throw error;
    }
}

// Export to Excel
async function exportToExcel() {
    const sessionId = document.getElementById('laporanSessionFilter').value;
    
    if (!sessionId) {
        alert('Pilih sesi terlebih dahulu');
        return;
    }
    
    const btn = document.getElementById('btnExportExcel');
    btn.disabled = true;
    btn.textContent = '⏳ Mengunduh...';
    
    try {
        // Get data
        const attendances = await getAttendanceDataForExport(sessionId);
        
        if (attendances.length === 0) {
            alert('Tidak ada data absensi untuk sesi ini');
            return;
        }
        
        // Prepare data for Excel
        const excelData = attendances.map((att, index) => ({
            'No': index + 1,
            'NIM': att.students.nim,
            'Nama Lengkap': att.students.nama_lengkap,
            'Fakultas': att.students.faculties?.nama || '-',
            'Program Studi': att.students.study_programs?.nama || '-',
            'Sesi': att.attendance_sessions.nama_kegiatan,
            'Hari Ke': att.attendance_sessions.hari_ke,
            'Tanggal': formatDate(att.attendance_sessions.tanggal),
            'Status': att.status,
            'Waktu Scan': formatDateTime(att.scan_time)
        }));
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 5 },  // No
            { wch: 12 }, // NIM
            { wch: 25 }, // Nama
            { wch: 30 }, // Fakultas
            { wch: 30 }, // Prodi
            { wch: 25 }, // Sesi
            { wch: 10 }, // Hari Ke
            { wch: 12 }, // Tanggal
            { wch: 10 }, // Status
            { wch: 18 }  // Waktu Scan
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
        
        // Generate filename
        const sessionName = sessionId === 'all' ? 'Semua_Sesi' : allSessions.find(s => s.id === sessionId)?.nama_kegiatan.replace(/\s/g, '_') || 'Absensi';
        const filename = `Laporan_Absensi_${sessionName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, filename);
        
        document.getElementById('exportInfo').innerHTML = `<p style="color: var(--success-color);">✅ Berhasil export ${attendances.length} data ke Excel!</p>`;
        
    } catch (error) {
        console.error('Export Excel error:', error);
        alert('Gagal export ke Excel: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '📊 Export ke Excel';
    }
}

// Export to CSV
async function exportToCSV() {
    const sessionId = document.getElementById('laporanSessionFilter').value;
    
    if (!sessionId) {
        alert('Pilih sesi terlebih dahulu');
        return;
    }
    
    const btn = document.getElementById('btnExportCSV');
    btn.disabled = true;
    btn.textContent = '⏳ Mengunduh...';
    
    try {
        // Get data
        const attendances = await getAttendanceDataForExport(sessionId);
        
        if (attendances.length === 0) {
            alert('Tidak ada data absensi untuk sesi ini');
            return;
        }
        
        // Prepare CSV content
        const headers = ['No', 'NIM', 'Nama Lengkap', 'Fakultas', 'Program Studi', 'Sesi', 'Hari Ke', 'Tanggal', 'Status', 'Waktu Scan'];
        const rows = attendances.map((att, index) => [
            index + 1,
            att.students.nim,
            att.students.nama_lengkap,
            att.students.faculties?.nama || '-',
            att.students.study_programs?.nama || '-',
            att.attendance_sessions.nama_kegiatan,
            att.attendance_sessions.hari_ke,
            formatDate(att.attendance_sessions.tanggal),
            att.status,
            formatDateTime(att.scan_time)
        ]);
        
        // Create CSV string
        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const sessionName = sessionId === 'all' ? 'Semua_Sesi' : allSessions.find(s => s.id === sessionId)?.nama_kegiatan.replace(/\s/g, '_') || 'Absensi';
        const filename = `Laporan_Absensi_${sessionName}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        document.getElementById('exportInfo').innerHTML = `<p style="color: var(--success-color);">✅ Berhasil export ${attendances.length} data ke CSV!</p>`;
        
    } catch (error) {
        console.error('Export CSV error:', error);
        alert('Gagal export ke CSV: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '📄 Export ke CSV';
    }
}


// ====================================
// EDIT SESSION FUNCTIONS
// ====================================

// Open edit session modal
function openEditSessionModal(sessionId) {
    const session = allSessions.find(s => s.id === sessionId);
    
    if (!session) {
        alert('Sesi tidak ditemukan');
        return;
    }
    
    // Populate form
    document.getElementById('editSessionId').value = session.id;
    document.getElementById('editSessionName').value = session.nama_kegiatan;
    document.getElementById('editSessionHari').value = session.hari_ke;
    document.getElementById('editSessionDate').value = session.tanggal;
    document.getElementById('editSessionStart').value = session.jam_mulai;
    document.getElementById('editSessionEnd').value = session.jam_selesai;
    
    // Show modal
    document.getElementById('modalEditSession').classList.add('active');
}

// Update session
async function updateSession() {
    const form = document.getElementById('formEditSession');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const sessionId = document.getElementById('editSessionId').value;
    const name = document.getElementById('editSessionName').value.trim();
    const hari = parseInt(document.getElementById('editSessionHari').value);
    const date = document.getElementById('editSessionDate').value;
    const start = document.getElementById('editSessionStart').value;
    const end = document.getElementById('editSessionEnd').value;
    
    // Show loading
    const btn = document.getElementById('btnUpdateSession');
    const text = document.getElementById('updateSessionText');
    const spinner = document.getElementById('updateSessionSpinner');
    
    btn.disabled = true;
    text.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {
        // Update session
        const { error } = await supabase
            .from('attendance_sessions')
            .update({
                nama_kegiatan: name,
                hari_ke: hari,
                tanggal: date,
                jam_mulai: start,
                jam_selesai: end
            })
            .eq('id', sessionId);
        
        if (error) throw error;
        
        alert('Sesi berhasil diupdate!');
        
        // Close modal
        closeModal('modalEditSession');
        
        // Reload sessions
        await loadSessions();
        
    } catch (error) {
        console.error('Update session error:', error);
        alert('Gagal update sesi: ' + error.message);
    } finally {
        btn.disabled = false;
        text.style.display = 'inline';
        spinner.style.display = 'none';
    }
}


// ====================================
// DOWNLOAD QR CODE FUNCTION
// ====================================

// Download QR Code as PNG
function downloadQR() {
    if (!currentSession) {
        alert('QR Code tidak tersedia');
        return;
    }
    
    try {
        // Get the QR code canvas or img element
        const qrContainer = document.getElementById('qrCodeContainer');
        const canvas = qrContainer.querySelector('canvas');
        const img = qrContainer.querySelector('img');
        
        let imageUrl;
        
        if (canvas) {
            // If QRCode.js created a canvas, use it directly
            imageUrl = canvas.toDataURL('image/png');
        } else if (img) {
            // If QRCode.js created an img element
            imageUrl = img.src;
        } else {
            alert('QR Code belum di-generate');
            return;
        }
        
        // Create download link
        const link = document.createElement('a');
        const filename = `QR_${currentSession.nama_kegiatan.replace(/\s/g, '_')}_Hari${currentSession.hari_ke}.png`;
        
        link.href = imageUrl;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        alert(`✅ QR Code berhasil diunduh sebagai ${filename}`);
        
    } catch (error) {
        console.error('Download QR error:', error);
        alert('Gagal mengunduh QR Code: ' + error.message);
    }
}


// ====================================
// STATISTICS DASHBOARD FUNCTIONS
// ====================================

// Load and display statistics
async function loadStatistics() {
    try {
        // Get total active students
        const { count: totalStudents, error: countError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');
        
        if (countError) throw countError;
        
        // Get all sessions
        const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('*')
            .order('hari_ke');
        
        if (sessionsError) throw sessionsError;
        
        // Get all attendances
        const { data: attendances, error: attendancesError } = await supabase
            .from('attendances')
            .select('session_id, status');
        
        if (attendancesError) throw attendancesError;
        
        // Calculate overall stats
        const totalSessions = sessions.length;
        const totalAttendances = attendances.length;
        const totalHadir = attendances.filter(a => a.status === 'HADIR').length;
        const totalAlpha = attendances.filter(a => a.status === 'ALPHA').length;
        const averageAttendance = totalSessions > 0 ? ((totalHadir / (totalStudents * totalSessions)) * 100).toFixed(1) : 0;
        
        // Display overall stats
        displayOverallStats({
            totalStudents,
            totalSessions,
            totalHadir,
            totalAlpha,
            averageAttendance
        });
        
        // Calculate per-day stats
        const perDayData = [];
        
        // Group sessions by hari_ke
        const sessionsByDay = {};
        sessions.forEach(session => {
            if (!sessionsByDay[session.hari_ke]) {
                sessionsByDay[session.hari_ke] = [];
            }
            sessionsByDay[session.hari_ke].push(session);
        });
        
        // Calculate stats for each day
        for (const [hariKe, daySessions] of Object.entries(sessionsByDay)) {
            const sessionIds = daySessions.map(s => s.id);
            const dayAttendances = attendances.filter(a => sessionIds.includes(a.session_id));
            const dayHadir = dayAttendances.filter(a => a.status === 'HADIR').length;
            const dayAlpha = dayAttendances.filter(a => a.status === 'ALPHA').length;
            const dayPercentage = totalStudents > 0 ? ((dayHadir / totalStudents) * 100).toFixed(1) : 0;
            
            perDayData.push({
                hariKe: parseInt(hariKe),
                sessions: daySessions,
                totalAbsensi: dayAttendances.length,
                hadir: dayHadir,
                alpha: dayAlpha,
                percentage: dayPercentage
            });
        }
        
        // Sort by hari_ke
        perDayData.sort((a, b) => a.hariKe - b.hariKe);
        
        // Display per-day stats
        displayPerDayStats(perDayData, totalStudents);
        
    } catch (error) {
        console.error('Load statistics error:', error);
        document.getElementById('overallStats').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--danger-color);">
                Gagal memuat statistik: ${error.message}
            </div>
        `;
    }
}

// Display overall statistics
function displayOverallStats(stats) {
    const container = document.getElementById('overallStats');
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Mahasiswa</div>
            <div class="stat-value">${stats.totalStudents}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-label">Total Sesi</div>
            <div class="stat-value">${stats.totalSessions}</div>
        </div>
        
        <div class="stat-card" style="background-color: var(--success-color); color: white;">
            <div class="stat-label">Total Hadir</div>
            <div class="stat-value">${stats.totalHadir}</div>
        </div>
        
        <div class="stat-card" style="background-color: var(--danger-color); color: white;">
            <div class="stat-label">Total Alpha</div>
            <div class="stat-value">${stats.totalAlpha}</div>
        </div>
        
        <div class="stat-card" style="background-color: var(--primary-color); color: white;">
            <div class="stat-label">Rata-rata Kehadiran</div>
            <div class="stat-value">${stats.averageAttendance}%</div>
        </div>
    `;
}

// Display per-day statistics
function displayPerDayStats(perDayData, totalStudents) {
    const container = document.getElementById('perDayStats');
    
    if (perDayData.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--gray-500); padding: var(--spacing-lg);">
                Belum ada data kehadiran
            </p>
        `;
        return;
    }
    
    const statsHtml = perDayData.map(day => `
        <div class="card" style="margin-bottom: var(--spacing-md);">
            <div class="card-header" style="background-color: var(--gray-50);">
                <h4 style="margin: 0; color: var(--primary-color);">Hari Ke-${day.hariKe}</h4>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                    <div>
                        <div style="font-size: var(--font-size-sm); color: var(--gray-600);">Jumlah Sesi</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 600;">${day.sessions.length}</div>
                    </div>
                    <div>
                        <div style="font-size: var(--font-size-sm); color: var(--gray-600);">Total Absensi</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 600;">${day.totalAbsensi}</div>
                    </div>
                    <div>
                        <div style="font-size: var(--font-size-sm); color: var(--gray-600);">Hadir</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 600; color: var(--success-color);">${day.hadir}</div>
                    </div>
                    <div>
                        <div style="font-size: var(--font-size-sm); color: var(--gray-600);">Alpha</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 600; color: var(--danger-color);">${day.alpha}</div>
                    </div>
                    <div>
                        <div style="font-size: var(--font-size-sm); color: var(--gray-600);">Persentase Hadir</div>
                        <div style="font-size: var(--font-size-xl); font-weight: 600; color: var(--primary-color);">${day.percentage}%</div>
                    </div>
                </div>
                
                <div style="font-size: var(--font-size-sm); color: var(--gray-600);">
                    <strong>Sesi:</strong> ${day.sessions.map(s => s.nama_kegiatan).join(', ')}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = statsHtml;
}

// Refresh statistics
async function refreshStatistics() {
    await loadSessions();
    await loadStatistics();
}
