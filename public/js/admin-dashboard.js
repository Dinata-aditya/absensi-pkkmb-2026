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
