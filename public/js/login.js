// Login Page Logic

// Check if already logged in
(async function() {
    const session = await checkAuth();
    if (session) {
        const role = await getUserRole(session.user.id);
        if (role) redirectBasedOnRole(role);
    }
})();

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.getElementById('alertContainer').innerHTML = '';

    const nimOrEmail = document.getElementById('nim').value.trim();
    const password   = document.getElementById('password').value;

    if (!nimOrEmail) {
        showFieldError('nim', 'NIM atau Email wajib diisi');
        return;
    }
    if (!password) {
        showFieldError('password', 'Password wajib diisi');
        return;
    }

    // Show loading
    const submitBtn     = document.getElementById('submitBtn');
    const submitText    = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    submitBtn.disabled  = true;
    submitText.style.display  = 'none';
    submitSpinner.style.display = 'inline-block';

    try {
        let email = '';

        // Deteksi: kalau ada @ berarti email (admin), kalau tidak berarti NIM (mahasiswa)
        const isEmail = nimOrEmail.includes('@');

        if (isEmail) {
            // Admin login langsung pakai email
            email = nimOrEmail;
        } else {
            // Mahasiswa — cari email berdasarkan NIM (pakai fungsi khusus login)
            const { data: emailData, error: nimError } = await supabase
                .rpc('get_email_for_login', { p_nim: nimOrEmail });

            if (nimError || !emailData) {
                throw new Error('NIM tidak ditemukan. Pastikan NIM yang Anda masukkan benar.');
            }
            email = emailData;
        }

        // Login dengan email + password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            if (authError.message.includes('Invalid login credentials')) {
                throw new Error(isEmail ? 'Email atau password salah' : 'NIM atau password salah');
            }
            throw authError;
        }

        if (!authData.user) throw new Error('Login gagal. Silakan coba lagi.');

        const role = await getUserRole(authData.user.id);
        if (!role) throw new Error('Role pengguna tidak ditemukan. Hubungi administrator.');

        showAlert('Login berhasil! Mengarahkan...', 'success');
        await new Promise(resolve => setTimeout(resolve, 500));
        redirectBasedOnRole(role);

    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login gagal. Silakan coba lagi.', 'danger');
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitSpinner.style.display = 'none';
    }
});

function showFieldError(fieldName, message) {
    const field     = document.getElementById(fieldName);
    const errorSpan = document.getElementById(fieldName + 'Error');
    if (field) field.classList.add('error');
    if (errorSpan) errorSpan.textContent = message;
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

console.log('✓ Login page loaded');
