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

// Start QR scanner
function startScanner() {
    html5QrcodeScanner = new Html5Qrcode("qr-reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    // Start scanning
    html5QrcodeScanner.start(
        { facingMode: "environment" }, // Use back camera
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error('Scanner start error:', err);
        
        // Try with front camera if back camera fails
        html5QrcodeScanner.start(
            { facingMode: "user" },
            config,
            onScanSuccess,
            onScanFailure
        ).catch(err2 => {
            console.error('Scanner start error (front camera):', err2);
            showResult(false, 'Gagal Membuka Kamera', 'Pastikan Anda memberikan izin akses kamera.');
        });
    });
}

// On scan success
async function onScanSuccess(decodedText, decodedResult) {
    if (!isScanning) return;
    
    isScanning = false;
    
    // Stop scanner
    html5QrcodeScanner.stop();
    
    try {
        // Parse QR data
        const qrData = JSON.parse(decodedText);
        
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
        
        if (error) {
            throw error;
        }
        
        // Check response
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
        
        let errorMessage = 'Terjadi kesalahan saat memproses QR Code';
        
        if (error.message) {
            errorMessage = error.message;
        } else if (error instanceof SyntaxError) {
            errorMessage = 'QR Code tidak valid atau format salah';
        }
        
        showResult(false, 'Scan Gagal', errorMessage);
    }
}

// On scan failure (not an error, just no QR detected)
function onScanFailure(error) {
    // Silently ignore - this is called frequently when no QR is detected
}

// Show result
function showResult(success, title, message) {
    const container = document.getElementById('resultContainer');
    const icon = document.getElementById('resultIcon');
    const titleEl = document.getElementById('resultTitle');
    const messageEl = document.getElementById('resultMessage');
    
    if (success === null) {
        // Loading state
        icon.className = 'result-icon';
        icon.style.backgroundColor = '#dbeafe';
        icon.style.color = '#1e40af';
        icon.innerHTML = '<div class="spinner spinner-primary" style="width: 40px; height: 40px;"></div>';
    } else if (success) {
        // Success
        icon.className = 'result-icon result-success';
        icon.textContent = '✓';
    } else {
        // Error
        icon.className = 'result-icon result-error';
        icon.textContent = '✗';
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    messageEl.style.whiteSpace = 'pre-line'; // Allow line breaks
    
    container.classList.add('show');
}

// Close result and return to dashboard
function closeResult() {
    window.location.href = 'mahasiswa-dashboard.html';
}

// Format date time
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', dateOptions) + ' ' + date.toLocaleTimeString('id-ID', timeOptions);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().catch(err => {
            console.error('Scanner stop error:', err);
        });
    }
});

console.log('✓ Scanner loaded');
