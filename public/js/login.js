// Login Page Logic

/**
 * Wait until window._supabaseReady is true (set by supabase-loader.js)
 * Polls every 100ms, gives up after 15s
 */
function waitForSupabaseClient() {
    return new Promise((resolve, reject) => {
        if (window._supabaseReady) { resolve(); return; }
        const start = Date.now();
        const t = setInterval(() => {
            if (window._supabaseReady) {
                clearInterval(t);
                resolve();
            } else if (window._supabaseLoadFailed || Date.now() - start > 15000) {
                clearInterval(t);
                reject(new Error('Supabase tidak dapat dimuat'));
            }
        }, 100);
    });
}

// ── Auto-redirect if already logged in ──────────────────────────────────────
// Only run ONCE when the page first loads (not in a loop)
(async function checkExistingSession() {
    try {
        await waitForSupabaseClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return; // not logged in → stay on login page

        // User already has a session — get role and redirect
        const role = await getUserRole(session.user.id);
        if (role) {
            redirectBasedOnRole(role);
        }
        // If role is null (missing user_roles row), stay on login page
        // so the user can login again instead of looping forever
    } catch (e) {
        // Ignore — if supabase fails to load, user just sees the form
        console.warn('[login] session check skipped:', e.message);
    }
})();

// ── Form submission ──────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.getElementById('alertContainer').innerHTML = '';

    const nimOrEmail = document.getElementById('nim').value.trim();
    const password   = document.getElementById('password').value;

    if (!nimOrEmail) { showFieldError('nim', 'NIM atau Email wajib diisi'); return; }
    if (!password)   { showFieldError('password', 'Password wajib diisi');  return; }

    // Show loading state
    const submitBtn     = document.getElementById('submitBtn');
    const submitText    = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    submitBtn.disabled          = true;
    submitText.style.display    = 'none';
    submitSpinner.style.display = 'inline-block';

    try {
        // Make sure client is ready
        await waitForSupabaseClient();

        let email = '';
        const isEmail = nimOrEmail.includes('@');

        if (isEmail) {
            email = nimOrEmail;
        } else {
            // Look up email by NIM
            const { data: emailData, error: nimError } = await supabase
                .rpc('get_email_for_login', { p_nim: nimOrEmail });

            if (nimError || !emailData) {
                throw new Error('NIM tidak ditemukan. Pastikan NIM yang Anda masukkan benar.');
            }
            email = emailData;
        }

        // Sign in
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

        // Small delay to let Supabase session settle on slow connections
        await new Promise(r => setTimeout(r, 600));

        // Retry getUserRole up to 3x (slow mobile connections)
        let role = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            role = await getUserRole(authData.user.id);
            if (role) break;
            if (attempt < 3) await new Promise(r => setTimeout(r, 700 * attempt));
        }

        if (!role) {
            throw new Error(
                'Akun ditemukan tapi data role belum tersedia.\n' +
                'Silakan coba lagi dalam beberapa detik. Jika masih gagal, hubungi panitia.'
            );
        }

        showAlert('Login berhasil! Mengarahkan...', 'success');
        await new Promise(r => setTimeout(r, 400));
        redirectBasedOnRole(role);

    } catch (error) {
        console.error('[login] error:', error);
        showAlert(error.message || 'Login gagal. Silakan coba lagi.', 'danger');
        submitBtn.disabled          = false;
        submitText.style.display    = 'inline';
        submitSpinner.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const span  = document.getElementById(fieldName + 'Error');
    if (field) field.classList.add('error');
    if (span)  span.textContent = message;
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const el = document.createElement('div');
    el.className   = `alert alert-${type}`;
    el.textContent = message;
    container.innerHTML = '';
    container.appendChild(el);
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

console.log('[login] loaded');
