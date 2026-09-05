// QR Code Scanner Logic

let html5QrcodeScanner = null;
let isScanning = true;

// Protect page - only MAHASISWA can access
(async function() {
    const auth = await protectPage('MAHASISWA');
    
    if (!auth) {
        return; // Will redirect automatically
    }
    
    // Check if student is ACTIVE
    const studentData = await getStudentData(auth.session.user.id);
    
    if (!studentData) {
        alert('Data mahasiswa tidak ditemukan');
        window.location.href = 'mahasiswa-dashboard.html';
        return;
    }
    
    if (studentData.status !== 'ACTIVE') {
        alert('Akun Anda belum aktif. Tidak dapat melakukan absensi.');
        window.location.href = 'mahasiswa-dashboard.html';
        return;
    }
    
    // Start scanner
    startScanner();
})();

// Detect if device is low-end (small screen or low memory)
function isLowEndDevice() {
    const screenW = window.screen.width;
    const ram = navigator.deviceMemory; // GB, undefined if not supported
    return screenW <= 400 || (ram !== undefined && ram <= 2);
}

// Start QR scanner
function startScanner() {
    html5QrcodeScanner = new Html5Qrcode("qr-reader");

    const lowEnd = isLowEndDevice();

    // Lower fps and qrbox for old/low-end devices to prevent freeze
    const config = {
        fps: lowEnd ? 5 : 10,
        qrbox: lowEnd
            ? { width: 200, height: 200 }   // smaller box for small screens
            : { width: 280, height: 280 },  // reduced from 320 for all devices
        // Do NOT force aspectRatio — many old cameras crash with it
    };

    // Try back camera first
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.warn('Back camera failed, trying any camera:', err);

        // Try without specifying camera (let browser pick)
        html5QrcodeScanner.start(
            { facingMode: "environment", advanced: [{ facingMode: "environment" }] },
            config,
            onScanSuccess,
            onScanFailure
        ).catch(err2 => {
            console.warn('Retrying with front camera:', err2);

            // Last resort: front camera
            html5QrcodeScanner.start(
                { facingMode: "user" },
                config,
                onScanSuccess,
                onScanFailure
            ).catch(err3 => {
                console.error('All camera attempts failed:', err3);
                showResult(false, 'Kamera Tidak Bisa Dibuka',
                    'Pastikan browser diberi izin akses kamera.\n\n' +
                    'Coba:\n1. Refresh halaman ini\n2. Buka di browser Chrome\n3. Izinkan akses kamera di pengaturan browser');
            });
        });
    });
}

// On scan success
async function onScanSuccess(decodedText, decodedResult) {
    if (!isScanning) return;
    
    isScanning = false;
    
    // Stop scanner
    try { html5QrcodeScanner.stop(); } catch(e) {}
    
    try {
        // Parse QR data
        let qrData;
        try {
            qrData = JSON.parse(decodedText);
        } catch(e) {
            throw new Error('QR Code tidak valid atau format salah');
        }
        
        if (!qrData.session_id || !qrData.token) {
            throw new Error('QR Code tidak valid');
        }
        
        // Show loading
        showResult(null, 'Memproses...', 'Mohon tunggu sebentar');
        
        // Call RPC to validate and record attendance
        const { data, error } = await supabase.rpc('validate_and_record_attendance', {
            p_session_id: qrData.session_id,
            p_token: qrData.token
        });
        
        if (error) throw error;
        
        if (data && data.success) {
            const attendanceData = data.data;
            showResult(
                true,
                'Absensi Berhasil!',
                `${attendanceData.session_name}\nHari ke-${attendanceData.hari_ke}\n\nWaktu: ${formatDateTime(attendanceData.scan_time)}`
            );
        } else {
            showResult(false, 'Absensi Gagal', data.message || 'Terjadi kesalahan');
        }
        
    } catch (error) {
        console.error('Scan processing error:', error);
        showResult(false, 'Scan Gagal', error.message || 'Terjadi kesalahan saat memproses QR Code');
    }
}

// On scan failure (not an error, just no QR detected yet — called frequently)
function onScanFailure(error) {
    // Silently ignore
}

// Show result
function showResult(success, title, message) {
    const container = document.getElementById('resultContainer');
    const icon      = document.getElementById('resultIcon');
    const titleEl   = document.getElementById('resultTitle');
    const messageEl = document.getElementById('resultMessage');
    
    if (success === null) {
        icon.className = 'result-icon';
        icon.style.backgroundColor = '#dbeafe';
        icon.style.color = '#1e40af';
        icon.innerHTML = '<div class="spinner spinner-primary" style="width:40px;height:40px;"></div>';
    } else if (success) {
        icon.className = 'result-icon result-success';
        icon.textContent = '✓';
    } else {
        icon.className = 'result-icon result-error';
        icon.textContent = '✗';
    }
    
    titleEl.textContent  = title;
    messageEl.textContent = message;
    messageEl.style.whiteSpace = 'pre-line';
    
    container.classList.add('show');
}

// Close result and return to dashboard
function closeResult() {
    window.location.href = 'mahasiswa-dashboard.html';
}

// Format date time
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('id-ID', { year:'numeric', month:'short', day:'numeric' })
         + ' ' + date.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().catch(() => {});
    }
});

console.log('[scanner] loaded, low-end device:', isLowEndDevice());
