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

    const nim      = document.getElementById('nim').value.trim();
    const password = document.getElementById('password').value;

    if (!nim) {
        showFieldError('nim', 'NIM wajib diisi');
        return;
    }
    if (!password) {
        showFieldError('password', 'Password wajib diisi');
        return;
    }

    // Show loading
    const submitBtn    = document.getElementById('submitBtn');
    const submitText   = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitSpinner.style.display = 'inline-block';

    try {
        // Step 1: Cari email berdasarkan NIM
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('user_id, nim, status')
            .eq('nim', nim)
            .single();

        if (studentError || !studentData) {
            throw new Error('NIM tidak ditemukan. Pastikan NIM yang Anda masukkan benar.');
        }

        // Ambil email dari auth.users via user_id — pakai tabel students join users
        const { data: userData, error: userError } = await supabase
            .from('students')
            .select(`
                nim,
                status,
                user_id
            `)
            .eq('nim', nim)
            .single();

        if (userError) throw new Error('Gagal mengambil data pengguna');

        // Ambil email lewat RPC (karena auth.users tidak bisa diakses langsung)
        const { data: emailData, error: emailError } = await supabase
            .rpc('get_email_by_nim', { p_nim: nim });

        if (emailError || !emailData) {
            throw new Error('Gagal mengambil data akun. Hubungi panitia.');
        }

        // Step 2: Login dengan email + password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailData,
            password: password
        });

        if (authError) {
            if (authError.message.includes('Invalid login credentials')) {
                throw new Error('NIM atau password salah');
            }
            throw authError;
        }

        if (!authData.user) throw new Error('Login gagal. Silakan coba lagi.');

        // Get role
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
