// Registration Page Logic

let facultiesData = [];
let studyProgramsData = [];
let isSubmitting = false;

// Wait for Supabase to be initialized
(async function init() {
    // Wait for supabase to be defined
    let retries = 0;
    while (typeof supabase === 'undefined' && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }
    
    if (typeof supabase === 'undefined') {
        console.error('Supabase failed to initialize');
        alert('Gagal menghubungi server. Silakan refresh halaman.');
        return;
    }
    
    // Check if already logged in
    const session = await checkAuth();
    if (session) {
        const role = await getUserRole(session.user.id);
        if (role) {
            redirectBasedOnRole(role);
            return;
        }
    }
    
    // Load faculties and programs
    await loadFacultiesAndPrograms();
})();

// Load faculties and study programs
async function loadFacultiesAndPrograms() {
    try {
        // Load faculties
        const { data: faculties, error: facultiesError } = await supabase
            .from('faculties')
            .select('*')
            .order('nama');
        
        if (facultiesError) throw facultiesError;
        
        facultiesData = faculties;
        
        // Populate fakultas dropdown
        const fakultasSelect = document.getElementById('fakultas');
        fakultasSelect.innerHTML = '<option value="">-- Pilih Fakultas --</option>';
        
        faculties.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty.id;
            option.textContent = faculty.nama;
            fakultasSelect.appendChild(option);
        });
        
        // Load all study programs
        const { data: programs, error: programsError } = await supabase
            .from('study_programs')
            .select('*')
            .order('nama');
        
        if (programsError) throw programsError;
        
        studyProgramsData = programs;
        
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('Gagal memuat data fakultas dan program studi. Silakan refresh halaman.', 'danger');
    }
}

// Handle fakultas change - filter prodi
document.getElementById('fakultas').addEventListener('change', function() {
    const fakultasId = this.value;
    const prodiSelect = document.getElementById('prodi');
    
    if (!fakultasId) {
        prodiSelect.innerHTML = '<option value="">-- Pilih Fakultas Terlebih Dahulu --</option>';
        prodiSelect.disabled = true;
        return;
    }
    
    // Filter study programs by selected faculty
    const filteredPrograms = studyProgramsData.filter(p => p.faculty_id === fakultasId);
    
    prodiSelect.innerHTML = '<option value="">-- Pilih Program Studi --</option>';
    filteredPrograms.forEach(program => {
        const option = document.createElement('option');
        option.value = program.id;
        option.textContent = program.nama;
        prodiSelect.appendChild(option);
    });
    
    prodiSelect.disabled = false;
});

// Form validation
function validateForm() {
    let isValid = true;
    
    // Clear all errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
    
    // Email
    const email = document.getElementById('email').value.trim();
    if (!email) {
        showFieldError('email', 'Email wajib diisi');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Format email tidak valid');
        isValid = false;
    }
    
    // Password
    const password = document.getElementById('password').value;
    if (!password) {
        showFieldError('password', 'Password wajib diisi');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('password', 'Password minimal 6 karakter');
        isValid = false;
    }
    
    // Confirm Password
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Konfirmasi password wajib diisi');
        isValid = false;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Password tidak cocok');
        isValid = false;
    }
    
    // NIM
    const nim = document.getElementById('nim').value.trim();
    if (!nim) {
        showFieldError('nim', 'NIM wajib diisi');
        isValid = false;
    } else if (!/^[0-9]+$/.test(nim)) {
        showFieldError('nim', 'NIM hanya boleh berisi angka');
        isValid = false;
    }
    
    // Nama
    const nama = document.getElementById('namaLengkap').value.trim();
    if (!nama) {
        showFieldError('nama', 'Nama lengkap wajib diisi');
        isValid = false;
    }
    
    // Fakultas
    const fakultas = document.getElementById('fakultas').value;
    if (!fakultas) {
        showFieldError('fakultas', 'Fakultas wajib dipilih');
        isValid = false;
    }
    
    // Prodi
    const prodi = document.getElementById('prodi').value;
    if (!prodi) {
        showFieldError('prodi', 'Program studi wajib dipilih');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorSpan = document.getElementById(fieldName + 'Error');
    
    if (field) field.classList.add('error');
    if (errorSpan) errorSpan.textContent = message;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Utility: Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for database operations
async function retryOperation(operation, maxRetries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
            
            // Don't retry on validation errors or duplicates
            if (error.message.includes('sudah terdaftar') || 
                error.message.includes('unique') ||
                error.code === '23505') {
                throw error;
            }
            
            // Last attempt, throw error
            if (attempt === maxRetries) {
                throw new Error(`Gagal setelah ${maxRetries} percobaan. Silakan coba lagi dalam beberapa saat.`);
            }
            
            // Wait before retry with exponential backoff
            const waitTime = delayMs * attempt;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await sleep(waitTime);
        }
    }
}

// Handle form submission
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
        console.log('Already submitting, please wait...');
        return;
    }
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const nim = document.getElementById('nim').value.trim();
    const namaLengkap = document.getElementById('namaLengkap').value.trim();
    const fakultasId = document.getElementById('fakultas').value;
    const prodiId = document.getElementById('prodi').value;
    
    // Show loading
    isSubmitting = true;
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    submitBtn.disabled = true;
    submitText.textContent = 'Sedang memproses...';
    submitSpinner.style.display = 'inline-block';
    
    try {
        // 1. Create user in Supabase Auth with retry
        const authData = await retryOperation(async () => {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        nim: nim,
                        nama_lengkap: namaLengkap
                    }
                }
            });
            
            if (error) {
                // Check for specific errors
                if (error.message.includes('already registered') || error.message.includes('already exists')) {
                    throw new Error('Email sudah terdaftar. Gunakan email lain atau login.');
                }
                throw error;
            }
            
            if (!data.user) {
                throw new Error('Gagal membuat akun. Silakan coba lagi.');
            }
            
            return data;
        });
        
        const userId = authData.user.id;
        
        // Small delay to ensure auth propagation
        await sleep(500);
        
        // 2. Insert into user_roles table with retry
        await retryOperation(async () => {
            const { error } = await supabase
                .from('user_roles')
                .insert({
                    user_id: userId,
                    role: 'MAHASISWA'
                });
            
            if (error) {
                console.error('Role insert error:', error);
                throw new Error('Gagal menyimpan role pengguna');
            }
        });
        
        // 3. Insert into students table with retry
        await retryOperation(async () => {
            const { error } = await supabase
                .from('students')
                .insert({
                    user_id: userId,
                    nim: nim,
                    nama_lengkap: namaLengkap,
                    fakultas_id: fakultasId,
                    prodi_id: prodiId,
                    status: 'ACTIVE'
                });
            
            if (error) {
                console.error('Student insert error:', error);
                
                // Check for duplicate NIM
                if (error.message.includes('unique') || error.code === '23505') {
                    throw new Error('NIM sudah terdaftar. Gunakan NIM yang berbeda.');
                }
                
                throw new Error('Gagal menyimpan data mahasiswa');
            }
        });
        
        // Success!
        submitText.textContent = 'Berhasil! Mengalihkan...';
        submitSpinner.style.display = 'none';
        
        showAlert('✓ Registrasi berhasil! Anda sudah bisa login dan melakukan absensi.', 'success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // User-friendly error messages
        let errorMessage = 'Gagal melakukan registrasi. ';
        
        if (error.message.includes('sudah terdaftar')) {
            errorMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage += 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
        } else if (error.message.includes('percobaan')) {
            errorMessage += error.message + ' Server sedang sibuk.';
        } else {
            errorMessage += error.message || 'Silakan coba lagi dalam beberapa saat.';
        }
        
        showAlert(errorMessage, 'danger');
        
        // Re-enable button
        isSubmitting = false;
        submitBtn.disabled = false;
        submitText.textContent = 'Daftar Sekarang';
        submitSpinner.style.display = 'none';
    }
});

// Show alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Scroll to alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

console.log('✓ Register.js loaded (with retry mechanism)');
