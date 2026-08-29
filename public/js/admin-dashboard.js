// Admin Dashboard — clean rewrite

let allStudents   = [];
let filteredStudents = [];
let allFaculties  = [];
let allProdi      = [];
let allSessions   = [];
let currentStudent = null;
let currentSession = null;

// ── Init ──────────────────────────────────────────
(async function () {
    const auth = await protectPage('ADMIN');
    if (!auth) return;
    await loadAll();
})();

async function loadAll() {
    const [facErr, proErr, stuErr, sesErr] = await Promise.all([
        loadFaculties(),
        loadProdi(),
        loadStudents(),
        loadSessions()
    ]);
    loadStatistik();
}

// ── Loaders ──────────────────────────────────────
async function loadFaculties() {
    const { data, error } = await supabase.from('faculties').select('*').order('nama');
    if (error) return error;
    allFaculties = data || [];
    populateFacultyFilter();
}

async function loadProdi() {
    const { data, error } = await supabase.from('study_programs').select('*').order('nama');
    if (error) return error;
    allProdi = data || [];
    populateProdiFilter();
}

async function loadStudents() {
    const { data, error } = await supabase
        .from('students')
        .select('*, faculties:fakultas_id(id,nama), study_programs:prodi_id(id,nama)')
        .order('nama_lengkap');
    if (error) return error;
    allStudents = data || [];
    filteredStudents = [...allStudents];
    renderMahasiswaTable();
}

async function loadSessions() {
    const { data, error } = await supabase
        .from('attendance_sessions').select('*').order('hari_ke');
    if (error) return error;
    allSessions = data || [];
    renderSessionsGrid();
    populateSesiDropdowns();
}

// ── Tab switching ─────────────────────────────────
function switchTab(name, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page' + capitalize(name)).classList.add('active');

    if (name === 'statistik') loadStatistik();
    if (name === 'sesi')      loadSessions();
    if (name === 'absensi')   loadSessions().then(() => populateSesiDropdowns());
    if (name === 'laporan')   populateSesiDropdowns();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Modal helpers ─────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('open');
});

// ═════════════════════════════════════════════════
// TAB: STATISTIK
// ═════════════════════════════════════════════════
async function loadStatistik() {
    const [{ count: totalMhs }, { data: sessions }, { data: attendances }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('attendance_sessions').select('*').order('hari_ke'),
        supabase.from('attendances').select('session_id, status')
    ]);

    const sessions_ = sessions || [];
    const att_      = attendances || [];
    const hadir     = att_.filter(a => a.status === 'HADIR').length;
    const alpha     = att_.filter(a => a.status === 'ALPHA').length;
    const rataRata  = sessions_.length && totalMhs
        ? ((hadir / (totalMhs * sessions_.length)) * 100).toFixed(1)
        : 0;

    document.getElementById('statOverall').innerHTML = `
        <div class="summary-card">
            <div class="label">Total Mahasiswa</div>
            <div class="value">${totalMhs ?? 0}</div>
        </div>
        <div class="summary-card">
            <div class="label">Total Sesi</div>
            <div class="value">${sessions_.length}</div>
        </div>
        <div class="summary-card green">
            <div class="label">Total Hadir</div>
            <div class="value">${hadir}</div>
        </div>
        <div class="summary-card red">
            <div class="label">Total Alpha</div>
            <div class="value">${alpha}</div>
        </div>
        <div class="summary-card">
            <div class="label">Rata-rata Kehadiran</div>
            <div class="value">${rataRata}%</div>
        </div>
    `;

    // Per hari
    const byDay = {};
    sessions_.forEach(s => {
        if (!byDay[s.hari_ke]) byDay[s.hari_ke] = [];
        byDay[s.hari_ke].push(s);
    });

    let html = '';
    Object.entries(byDay).sort((a,b) => a[0]-b[0]).forEach(([hari, sess]) => {
        const ids = sess.map(s => s.id);
        const dayAtt   = att_.filter(a => ids.includes(a.session_id));
        const dayHadir = dayAtt.filter(a => a.status === 'HADIR').length;
        const dayAlpha = dayAtt.filter(a => a.status === 'ALPHA').length;
        const pct      = totalMhs ? ((dayHadir / totalMhs) * 100).toFixed(1) : 0;

        html += `
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:1rem 1.25rem;margin-bottom:.75rem;">
            <div style="font-weight:600;margin-bottom:.75rem;color:#111;">Hari Ke-${hari}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem;font-size:.875rem;">
                <div><div style="color:#6b7280">Hadir</div><div style="font-size:1.5rem;font-weight:700;color:#10b981">${dayHadir}</div></div>
                <div><div style="color:#6b7280">Alpha</div><div style="font-size:1.5rem;font-weight:700;color:#ef4444">${dayAlpha}</div></div>
                <div><div style="color:#6b7280">Kehadiran</div><div style="font-size:1.5rem;font-weight:700;color:#111">${pct}%</div></div>
                <div><div style="color:#6b7280">Sesi</div><div style="font-size:.875rem;color:#374151;margin-top:.25rem">${sess.map(s=>s.nama_kegiatan).join(', ')}</div></div>
            </div>
        </div>`;
    });

    document.getElementById('statPerHari').innerHTML = html || '<div class="empty">Belum ada data sesi</div>';
}

// ═════════════════════════════════════════════════
// TAB: MAHASISWA
// ═════════════════════════════════════════════════
function populateFacultyFilter() {
    const sel = document.getElementById('fFakultas');
    sel.innerHTML = '<option value="">Semua Fakultas</option>';
    allFaculties.forEach(f => {
        sel.innerHTML += `<option value="${f.id}">${f.nama}</option>`;
    });
}

function populateProdiFilter() {
    const sel = document.getElementById('fProdi');
    sel.innerHTML = '<option value="">Semua Prodi</option>';
    allProdi.forEach(p => {
        sel.innerHTML += `<option value="${p.id}">${p.nama}</option>`;
    });
}

function filterMahasiswa() {
    const fak    = document.getElementById('fFakultas').value;
    const prodi  = document.getElementById('fProdi').value;
    const status = document.getElementById('fStatus').value;
    const cari   = document.getElementById('fCari').value.toLowerCase();

    filteredStudents = allStudents.filter(s => {
        if (fak    && s.fakultas_id !== fak)    return false;
        if (prodi  && s.prodi_id    !== prodi)   return false;
        if (status && s.status      !== status)  return false;
        if (cari   && !s.nim.toLowerCase().includes(cari) && !s.nama_lengkap.toLowerCase().includes(cari)) return false;
        return true;
    });
    renderMahasiswaTable();
}

function renderMahasiswaTable() {
    const tbody = document.getElementById('tblMahasiswa');
    document.getElementById('mhsCount').textContent = `${filteredStudents.length} mahasiswa`;

    if (!filteredStudents.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty">Tidak ada data</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredStudents.map(s => `
        <tr>
            <td>${s.nim}</td>
            <td>${s.nama_lengkap}</td>
            <td>${s.faculties?.nama || '-'}</td>
            <td>${s.study_programs?.nama || '-'}</td>
            <td>${statusBadge(s.status)}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="bukaModalStatusMhs('${s.id}')">Ubah Status</button>
            </td>
        </tr>
    `).join('');
}

function statusBadge(status) {
    const map = {
        ACTIVE:   ['badge-green',  'Aktif'],
        PENDING:  ['badge-yellow', 'Pending'],
        INACTIVE: ['badge-gray',   'Tidak Aktif'],
    };
    const [cls, label] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${label}</span>`;
}

// Update student status
function bukaModalStatusMhs(studentId) {
    currentStudent = allStudents.find(s => s.id === studentId);
    if (!currentStudent) return;

    document.getElementById('mhsInfoBox').innerHTML = `
        <div><strong>${currentStudent.nama_lengkap}</strong></div>
        <div style="color:#6b7280">NIM ${currentStudent.nim} &middot; ${currentStudent.study_programs?.nama || '-'}</div>
    `;
    document.getElementById('mhsStatusBaru').value = currentStudent.status;
    openModal('modalStatusMhs');
}

async function simpanStatusMhs() {
    if (!currentStudent) return;
    const newStatus = document.getElementById('mhsStatusBaru').value;

    const { error } = await supabase
        .from('students').update({ status: newStatus }).eq('id', currentStudent.id);

    if (error) { alert('Gagal: ' + error.message); return; }

    closeModal('modalStatusMhs');
    await loadStudents();
}

// ═════════════════════════════════════════════════
// TAB: ABSENSI PER PRODI
// ═════════════════════════════════════════════════
async function loadAbsensiPerProdi() {
    const sessionId = document.getElementById('absensiSesiFilter').value;
    const container = document.getElementById('absensiProdiContainer');

    if (!sessionId) {
        container.innerHTML = '<div class="empty">Pilih sesi untuk melihat data absensi per prodi</div>';
        return;
    }

    container.innerHTML = '<div class="empty">Memuat data…</div>';

    // Get all attendances for this session
    const { data: atts, error } = await supabase
        .from('attendances')
        .select(`
            id, status, scan_time,
            students ( id, nim, nama_lengkap,
                faculties:fakultas_id(nama),
                study_programs:prodi_id(id, nama)
            )
        `)
        .eq('session_id', sessionId)
        .order('scan_time');

    if (error) { container.innerHTML = `<div class="empty">Error: ${error.message}</div>`; return; }

    // Get all active students
    const { data: allMhs } = await supabase
        .from('students')
        .select('id, nim, nama_lengkap, faculties:fakultas_id(nama), study_programs:prodi_id(id,nama)')
        .eq('status', 'ACTIVE')
        .order('nama_lengkap');

    const mhsList = allMhs || [];
    const attList = atts   || [];

    // Build attendance map: student_id -> attendance
    const attMap = {};
    attList.forEach(a => { if (a.students) attMap[a.students.id] = a; });

    // Group by prodi
    const byProdi = {};
    mhsList.forEach(mhs => {
        const prodiId   = mhs.study_programs?.id   || 'unknown';
        const prodiNama = mhs.study_programs?.nama  || 'Prodi Tidak Diketahui';
        const fakNama   = mhs.faculties?.nama        || '-';
        if (!byProdi[prodiId]) byProdi[prodiId] = { nama: prodiNama, fakNama, list: [] };
        byProdi[prodiId].list.push(mhs);
    });

    // Render
    let html = '';
    Object.entries(byProdi).sort((a,b) => a[1].nama.localeCompare(b[1].nama)).forEach(([prodiId, prodi]) => {
        const total  = prodi.list.length;
        const hadir  = prodi.list.filter(m => attMap[m.id]?.status === 'HADIR').length;
        const alpha  = prodi.list.filter(m => attMap[m.id]?.status === 'ALPHA').length;
        const belum  = total - hadir - alpha;

        const rows = prodi.list.map(mhs => {
            const att = attMap[mhs.id];
            const statusLabel = att
                ? (att.status === 'HADIR'
                    ? `<span class="badge badge-green">Hadir</span>`
                    : `<span class="badge badge-red">Alpha</span>`)
                : `<span class="badge badge-yellow">Belum</span>`;

            const toggleBtn = att
                ? (att.status === 'HADIR'
                    ? `<button class="btn btn-ghost btn-sm" onclick="ubahStatusAbsensi('${att.id}','ALPHA','${sessionId}')">Set Alpha</button>`
                    : `<button class="btn btn-ghost btn-sm" style="color:#10b981" onclick="ubahStatusAbsensi('${att.id}','HADIR','${sessionId}')">Set Hadir</button>`)
                : `<button class="btn btn-ghost btn-sm" style="color:#10b981" onclick="manualHadir('${mhs.id}','${sessionId}')">Tandai Hadir</button>`;

            const waktu = att ? formatDT(att.scan_time) : '-';

            return `
                <tr>
                    <td>${mhs.nim}</td>
                    <td>${mhs.nama_lengkap}</td>
                    <td>${statusLabel}</td>
                    <td>${waktu}</td>
                    <td>${toggleBtn}</td>
                </tr>`;
        }).join('');

        html += `
        <div class="prodi-block">
            <div class="prodi-head" onclick="toggleProdi(this)">
                <div>
                    <h3>${prodi.nama}</h3>
                    <div style="font-size:.8125rem;color:#6b7280;margin-top:.2rem">${prodi.fakNama}</div>
                </div>
                <div class="meta">
                    <span class="badge badge-green">${hadir} Hadir</span>
                    <span class="badge badge-red">${alpha} Alpha</span>
                    <span class="badge badge-yellow">${belum} Belum</span>
                    <span style="font-size:.8125rem;color:#9ca3af">▼</span>
                </div>
            </div>
            <div class="prodi-body">
                <div class="tbl-wrap" style="border:none;border-radius:0;">
                    <table>
                        <thead>
                            <tr><th>NIM</th><th>Nama</th><th>Status</th><th>Waktu Scan</th><th></th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html || '<div class="empty">Tidak ada data mahasiswa</div>';
}

function toggleProdi(head) {
    const body = head.nextElementSibling;
    body.classList.toggle('open');
    const arrow = head.querySelector('span[style]');
    if (arrow) arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
}

async function ubahStatusAbsensi(attId, newStatus, sessionId) {
    const { error } = await supabase
        .from('attendances')
        .update({ status: newStatus })
        .eq('id', attId);

    if (error) { alert('Gagal: ' + error.message); return; }
    loadAbsensiPerProdi();
    loadStatistik();
}

async function manualHadir(studentId, sessionId) {
    // Insert new attendance record as HADIR
    const { error } = await supabase
        .from('attendances')
        .insert({ student_id: studentId, session_id: sessionId, status: 'HADIR', scan_time: new Date().toISOString() });

    if (error) { alert('Gagal: ' + error.message); return; }
    loadAbsensiPerProdi();
    loadStatistik();
}

// ═════════════════════════════════════════════════
// TAB: SESI
// ═════════════════════════════════════════════════
function renderSessionsGrid() {
    const grid = document.getElementById('sessionsGrid');
    if (!allSessions.length) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Belum ada sesi. Klik Buat Sesi untuk memulai.</div>';
        return;
    }

    const statusMap = {
        SCHEDULED: ['badge-blue',  'Terjadwal'],
        OPEN:      ['badge-green', 'Buka'],
        CLOSED:    ['badge-gray',  'Tutup'],
    };

    grid.innerHTML = allSessions.map(s => {
        const [badgeCls, badgeLabel] = statusMap[s.status] || ['badge-gray', s.status];

        const actionBtn = s.status === 'SCHEDULED'
            ? `<button class="btn btn-primary btn-sm" onclick="bukaSesi('${s.id}')">Buka Sesi</button>`
            : s.status === 'OPEN'
            ? `<button class="btn btn-danger btn-sm" onclick="tutupSesi('${s.id}')">Tutup Sesi</button>`
            : '';

        return `
        <div class="session-card">
            <div class="session-card-head">
                <h3>${s.nama_kegiatan}</h3>
                <span class="badge ${badgeCls}">${badgeLabel}</span>
            </div>
            <div class="session-card-body">
                <div class="row"><span>Hari ke-${s.hari_ke}</span></div>
                <div class="row"><span>${fmtDate(s.tanggal)}</span></div>
                <div class="row"><span>${s.jam_mulai} – ${s.jam_selesai}</span></div>
            </div>
            <div class="session-card-foot">
                <button class="btn btn-outline btn-sm" onclick="lihatQR('${s.id}')">QR Code</button>
                ${actionBtn}
                <button class="btn btn-ghost btn-sm" onclick="bukaEditSesi('${s.id}')">Edit</button>
                <button class="btn btn-ghost btn-sm" style="color:#ef4444;margin-left:auto" onclick="hapusSesi('${s.id}')">Hapus</button>
            </div>
        </div>`;
    }).join('');
}

function populateSesiDropdowns() {
    const opts = allSessions.map(s =>
        `<option value="${s.id}">${s.nama_kegiatan} – Hari ${s.hari_ke} (${s.status})</option>`
    ).join('');

    const absensiSel = document.getElementById('absensiSesiFilter');
    const laporanSel = document.getElementById('laporanSesi');
    const saved = absensiSel.value;

    absensiSel.innerHTML = '<option value="">-- Pilih Sesi --</option>' + opts;
    laporanSel.innerHTML = '<option value="">-- Pilih Sesi --</option><option value="all">Semua Sesi</option>' + opts;

    if (saved) absensiSel.value = saved;
}

// Buat sesi
async function buatSesi() {
    const nama    = document.getElementById('snNama').value.trim();
    const hari    = document.getElementById('snHari').value;
    const tanggal = document.getElementById('snTanggal').value;
    const mulai   = document.getElementById('snMulai').value;
    const selesai = document.getElementById('snSelesai').value;

    if (!nama || !tanggal) { alert('Nama kegiatan dan tanggal wajib diisi'); return; }

    const btn = document.getElementById('btnBuatSesi');
    btn.disabled = true;

    const { error } = await supabase.from('attendance_sessions').insert({
        nama_kegiatan: nama,
        hari_ke: parseInt(hari),
        tanggal, jam_mulai: mulai, jam_selesai: selesai,
        qr_token: generateUUID(),
        status: 'SCHEDULED'
    });

    btn.disabled = false;

    if (error) { alert('Gagal: ' + error.message); return; }
    closeModal('modalBuatSesi');
    document.getElementById('snNama').value = '';
    await loadSessions();
}

// Buka / Tutup sesi
async function bukaSesi(id) {
    if (!confirm('Buka sesi? Mahasiswa dapat melakukan absensi.')) return;
    const { error } = await supabase.from('attendance_sessions').update({ status: 'OPEN' }).eq('id', id);
    if (error) { alert('Gagal: ' + error.message); return; }
    await loadSessions();
}

async function tutupSesi(id) {
    const ses = allSessions.find(s => s.id === id);
    if (!confirm(`Tutup sesi "${ses?.nama_kegiatan}"? Mahasiswa yang belum absen akan menjadi ALPHA.`)) return;

    const { error: e1 } = await supabase.from('attendance_sessions').update({ status: 'CLOSED' }).eq('id', id);
    if (e1) { alert('Gagal: ' + e1.message); return; }

    const { error: e2 } = await supabase.rpc('finalize_attendance', { p_session_id: id });
    if (e2) console.warn('finalize_attendance:', e2.message);

    await loadSessions();
    await loadStatistik();
}

// Edit sesi
function bukaEditSesi(id) {
    const s = allSessions.find(x => x.id === id);
    if (!s) return;
    document.getElementById('esSesiId').value  = s.id;
    document.getElementById('esNama').value    = s.nama_kegiatan;
    document.getElementById('esHari').value    = s.hari_ke;
    document.getElementById('esTanggal').value = s.tanggal;
    document.getElementById('esMulai').value   = s.jam_mulai;
    document.getElementById('esSelesai').value = s.jam_selesai;
    openModal('modalEditSesi');
}

async function simpanEditSesi() {
    const id      = document.getElementById('esSesiId').value;
    const nama    = document.getElementById('esNama').value.trim();
    const hari    = parseInt(document.getElementById('esHari').value);
    const tanggal = document.getElementById('esTanggal').value;
    const mulai   = document.getElementById('esMulai').value;
    const selesai = document.getElementById('esSelesai').value;

    const btn = document.getElementById('btnSimpanSesi');
    btn.disabled = true;

    const { error } = await supabase.from('attendance_sessions')
        .update({ nama_kegiatan: nama, hari_ke: hari, tanggal, jam_mulai: mulai, jam_selesai: selesai })
        .eq('id', id);

    btn.disabled = false;

    if (error) { alert('Gagal: ' + error.message); return; }
    closeModal('modalEditSesi');
    await loadSessions();
}

// Hapus sesi
async function hapusSesi(id) {
    const s = allSessions.find(x => x.id === id);
    if (!confirm(`Hapus sesi "${s?.nama_kegiatan}"? Semua data absensi akan ikut terhapus.`)) return;

    const { error } = await supabase.from('attendance_sessions').delete().eq('id', id);
    if (error) { alert('Gagal: ' + error.message); return; }
    await loadSessions();
}

// QR Code
function lihatQR(id) {
    const s = allSessions.find(x => x.id === id);
    if (!s) return;
    currentSession = s;

    document.getElementById('qrTitle').textContent = s.nama_kegiatan;
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';

    new QRCode(container, {
        text: JSON.stringify({ session_id: s.id, token: s.qr_token, hari_ke: s.hari_ke }),
        width: 280, height: 280,
        colorDark: '#000', colorLight: '#fff',
        correctLevel: QRCode.CorrectLevel.H
    });

    openModal('modalQR');
}

function downloadQR() {
    if (!currentSession) return;
    const canvas = document.querySelector('#qrCodeContainer canvas');
    const img    = document.querySelector('#qrCodeContainer img');
    const url    = canvas ? canvas.toDataURL('image/png') : img?.src;
    if (!url) { alert('QR belum di-generate'); return; }

    const a = document.createElement('a');
    a.href     = url;
    a.download = `QR_${currentSession.nama_kegiatan.replace(/\s+/g,'_')}.png`;
    a.click();
}

function printQR() {
    if (!currentSession) return;
    const canvas = document.querySelector('#qrCodeContainer canvas');
    const img    = document.querySelector('#qrCodeContainer img');
    const url    = canvas ? canvas.toDataURL('image/png') : img?.src;
    if (!url) return;

    const w = window.open('','','width=600,height=700');
    w.document.write(`<!DOCTYPE html><html><head><title>QR – ${currentSession.nama_kegiatan}</title>
    <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;padding:2rem;}
    h2{color:#10b981;} img{border:1px solid #e5e7eb;padding:1rem;} p{color:#6b7280;font-size:.9rem;}</style></head>
    <body>
    <h1>Absensi PKKMB 2026</h1>
    <h2>${currentSession.nama_kegiatan}</h2>
    <p>Hari ke-${currentSession.hari_ke} &nbsp;|&nbsp; ${fmtDate(currentSession.tanggal)}</p>
    <p>${currentSession.jam_mulai} – ${currentSession.jam_selesai}</p>
    <img src="${url}">
    <p>Scan QR code untuk absensi</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 300);
}

// ═════════════════════════════════════════════════
// TAB: LAPORAN
// ═════════════════════════════════════════════════
async function getExportData(sessionId) {
    let q = supabase.from('attendances').select(`
        id, status, scan_time,
        students(nim, nama_lengkap, faculties:fakultas_id(nama), study_programs:prodi_id(nama)),
        attendance_sessions(nama_kegiatan, hari_ke, tanggal)
    `).order('scan_time');

    if (sessionId !== 'all') q = q.eq('session_id', sessionId);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

async function exportToExcel() {
    const sid = document.getElementById('laporanSesi').value;
    if (!sid) { alert('Pilih sesi terlebih dahulu'); return; }

    const btn = document.getElementById('btnExcelBtn');
    btn.disabled = true; btn.textContent = 'Mengunduh…';

    try {
        const rows = await getExportData(sid);
        if (!rows.length) { alert('Tidak ada data'); return; }

        const data = rows.map((r, i) => ({
            No: i+1,
            NIM: r.students.nim,
            Nama: r.students.nama_lengkap,
            Fakultas: r.students.faculties?.nama || '-',
            'Program Studi': r.students.study_programs?.nama || '-',
            Sesi: r.attendance_sessions.nama_kegiatan,
            'Hari Ke': r.attendance_sessions.hari_ke,
            Tanggal: fmtDate(r.attendance_sessions.tanggal),
            Status: r.status,
            'Waktu Scan': formatDT(r.scan_time)
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [5,12,25,30,30,25,8,14,10,18].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, 'Absensi');

        const name = sid === 'all' ? 'Semua_Sesi' : (allSessions.find(s=>s.id===sid)?.nama_kegiatan.replace(/\s+/g,'_') || 'Absensi');
        XLSX.writeFile(wb, `Laporan_${name}_${today()}.xlsx`);
        document.getElementById('exportMsg').textContent = `Berhasil export ${rows.length} data`;
    } catch(e) { alert('Gagal: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = 'Export Excel'; }
}

async function exportToCSV() {
    const sid = document.getElementById('laporanSesi').value;
    if (!sid) { alert('Pilih sesi terlebih dahulu'); return; }

    const btn = document.getElementById('btnCsvBtn');
    btn.disabled = true; btn.textContent = 'Mengunduh…';

    try {
        const rows = await getExportData(sid);
        if (!rows.length) { alert('Tidak ada data'); return; }

        const headers = ['No','NIM','Nama','Fakultas','Program Studi','Sesi','Hari Ke','Tanggal','Status','Waktu Scan'];
        const lines = rows.map((r,i) => [
            i+1, r.students.nim, r.students.nama_lengkap,
            r.students.faculties?.nama||'-', r.students.study_programs?.nama||'-',
            r.attendance_sessions.nama_kegiatan, r.attendance_sessions.hari_ke,
            fmtDate(r.attendance_sessions.tanggal), r.status, formatDT(r.scan_time)
        ].map(c => `"${c}"`).join(','));

        const csv  = [headers.join(','), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const name = sid === 'all' ? 'Semua_Sesi' : (allSessions.find(s=>s.id===sid)?.nama_kegiatan.replace(/\s+/g,'_') || 'Absensi');
        a.href = url; a.download = `Laporan_${name}_${today()}.csv`; a.click();
        document.getElementById('exportMsg').textContent = `Berhasil export ${rows.length} data`;
    } catch(e) { alert('Gagal: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = 'Export CSV'; }
}

// ═════════════════════════════════════════════════
// UTILS
// ═════════════════════════════════════════════════
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random()*16|0;
        return (c==='x' ? r : (r&0x3|0x8)).toString(16);
    });
}

function fmtDate(str) {
    if (!str) return '-';
    return new Date(str).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
}

function formatDT(str) {
    if (!str) return '-';
    return new Date(str).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function today() {
    return new Date().toISOString().split('T')[0];
}


// ═════════════════════════════════════════════════
// CETAK LEMBAR ABSENSI (FORMAT FORMAL PER PRODI)
// ═════════════════════════════════════════════════
async function cetakLembarAbsensi() {
    const sid = document.getElementById('laporanSesi').value;
    if (!sid || sid === 'all') {
        alert('Pilih satu sesi terlebih dahulu (tidak bisa Semua Sesi)');
        return;
    }

    const btn = document.getElementById('btnPdfBtn');
    btn.disabled = true;
    btn.textContent = 'Memuat…';

    try {
        const session = allSessions.find(s => s.id === sid);
        if (!session) throw new Error('Sesi tidak ditemukan');

        // Ambil semua mahasiswa aktif + data prodi/fakultas
        const { data: mhsList, error: mhsErr } = await supabase
            .from('students')
            .select('id, nim, nama_lengkap, phone, faculties:fakultas_id(nama), study_programs:prodi_id(id, nama)')
            .eq('status', 'ACTIVE')
            .order('nama_lengkap');

        if (mhsErr) throw mhsErr;

        // Ambil data absensi sesi ini
        const { data: atts, error: attErr } = await supabase
            .from('attendances')
            .select('student_id, status')
            .eq('session_id', sid);

        if (attErr) throw attErr;

        // Map student_id → status
        const attMap = {};
        (atts || []).forEach(a => { attMap[a.student_id] = a.status; });

        // Group mahasiswa per prodi
        const byProdi = {};
        (mhsList || []).forEach(m => {
            const key  = m.study_programs?.id   || 'lainnya';
            const nama = m.study_programs?.nama  || 'Lainnya';
            const fak  = m.faculties?.nama        || '';
            if (!byProdi[key]) byProdi[key] = { nama, fak, list: [] };
            byProdi[key].list.push(m);
        });

        // Format tanggal & waktu
        const tglLong  = new Date(session.tanggal).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        const waktu = `${session.jam_mulai} s/d ${session.jam_selesai}`;

        // Bangun halaman HTML untuk setiap prodi
        let pages = '';
        Object.values(byProdi)
            .sort((a, b) => a.nama.localeCompare(b.nama))
            .forEach((prodi, pi) => {

            const rows = prodi.list.map((m, i) => {
                const status = attMap[m.id];
                const statusCell = status === 'HADIR'
                    ? `<span style="color:#16a34a;font-weight:600;">✓ Hadir</span>`
                    : status === 'ALPHA'
                    ? `<span style="color:#dc2626;">Alpha</span>`
                    : `<span style="color:#9ca3af;">-</span>`;

                return `
                <tr>
                    <td style="text-align:center">${i + 1}</td>
                    <td>${m.nama_lengkap}</td>
                    <td>${m.nim}</td>
                    <td>${m.phone || '-'}</td>
                    <td style="text-align:center">${statusCell}</td>
                    <td></td>
                </tr>`;
            }).join('');

            pages += `
            <div class="page-break">
                <!-- HEADER -->
                <div class="header">
                    <div class="logo-row">
                        <img src="img/logo-univ.png" class="logo" onerror="this.style.display='none'" alt="">
                        <img src="img/logo-pkkmb.png" class="logo" onerror="this.style.display='none'" alt="">
                    </div>
                    <h1>ABSENSI KEHADIRAN</h1>
                    <h2>PKKMB UNIVERSITAS PASIR PENGARAIAN 2026</h2>
                    <h3>${session.nama_kegiatan.toUpperCase()}</h3>
                </div>

                <div class="info-table">
                    <table>
                        <tr>
                            <td style="width:130px">Fakultas</td>
                            <td>: ${prodi.fak || '-'}</td>
                        </tr>
                        <tr>
                            <td>Program Studi</td>
                            <td>: <strong>${prodi.nama}</strong></td>
                        </tr>
                        <tr>
                            <td>Hari / Tanggal</td>
                            <td>: ${tglLong}</td>
                        </tr>
                        <tr>
                            <td>Waktu</td>
                            <td>: ${waktu}</td>
                        </tr>
                        <tr>
                            <td>Jumlah Mahasiswa</td>
                            <td>: ${prodi.list.length} orang</td>
                        </tr>
                    </table>
                </div>

                <!-- TABEL ABSENSI -->
                <table class="abs-table">
                    <thead>
                        <tr>
                            <th style="width:45px">NO</th>
                            <th>NAMA LENGKAP</th>
                            <th style="width:120px">NIM</th>
                            <th style="width:130px">NO. HP</th>
                            <th style="width:80px">STATUS</th>
                            <th style="width:90px">PARAF</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>

                <!-- FOOTER TTD -->
                <div class="sign-row">
                    <div class="sign-box">
                        <div>Panitia PKKMB 2026</div>
                        <div class="sign-line"></div>
                        <div>( _________________________ )</div>
                    </div>
                    <div class="sign-box" style="text-align:right">
                        <div>Pasir Pengaraian, ${tglLong}</div>
                        <div>Mengetahui,</div>
                        <div class="sign-line"></div>
                        <div>( _________________________ )</div>
                    </div>
                </div>
            </div>`;
        });

        // Buka print window
        const w = window.open('', '', 'width=900,height=700');
        w.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Lembar Absensi – ${session.nama_kegiatan}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; }

    .page-break { page-break-after: always; padding: 2cm 2.5cm; }
    .page-break:last-child { page-break-after: avoid; }

    /* Header */
    .header { text-align: center; margin-bottom: 1.5rem; border-bottom: 3px solid #000; padding-bottom: 1rem; }
    .logo-row { display: flex; justify-content: center; gap: 2rem; margin-bottom: .75rem; }
    .logo { height: 70px; width: 70px; object-fit: contain; }
    .header h1 { font-size: 14pt; font-weight: 700; letter-spacing: 1px; margin-bottom: .3rem; }
    .header h2 { font-size: 13pt; font-weight: 700; margin-bottom: .3rem; }
    .header h3 { font-size: 12pt; font-weight: 700; }

    /* Info table */
    .info-table { margin-bottom: 1.25rem; }
    .info-table table { border-collapse: collapse; font-size: 11pt; }
    .info-table td { padding: .2rem .5rem; vertical-align: top; }

    /* Attendance table */
    .abs-table { width: 100%; border-collapse: collapse; font-size: 11pt; margin-bottom: 2rem; }
    .abs-table th {
        border: 1.5px solid #000;
        padding: .45rem .6rem;
        text-align: left;
        font-weight: 700;
        background: #f0f0f0;
    }
    .abs-table td {
        border: 1px solid #000;
        padding: .5rem .6rem;
        min-height: 28px;
    }
    .abs-table tbody tr:nth-child(even) { background: #fafafa; }

    /* Signature row */
    .sign-row { display: flex; justify-content: space-between; margin-top: 2rem; font-size: 11pt; }
    .sign-box { }
    .sign-line { height: 50px; }

    @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page-break { padding: 1.5cm 2cm; }
    }
</style>
</head>
<body>${pages}</body>
</html>`);

        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 600);

        document.getElementById('exportMsg').textContent = `Lembar absensi untuk ${Object.keys(byProdi).length} prodi siap dicetak`;

    } catch (e) {
        console.error(e);
        alert('Gagal: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Cetak Lembar Absensi';
    }
}
