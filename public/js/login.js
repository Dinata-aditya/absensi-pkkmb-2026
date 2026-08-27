// Login Page Logic

// Check if already logged in
(async function() {
    const session = await checkAuth();
    if (session) {
        console.log('Already logged in, checking role...');
        const role = await getUserRole(session.user.id);
        if (role) {
            redirectBasedOnRole(role);
        }
    }
})();

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    document.getElementById('alertContainer').innerHTML = '';
    
    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email) {
        showFieldError('email', 'Email wajib diisi');
        return;
    }
    
    if (!password) {
        showFieldError('password', 'Password wajib diisi');
        return;
    }
    
    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitSpinner.style.display = 'inline-block';
    
    try {
        // Attempt login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            // Handle specific errors
            if (authError.message.includes('Invalid login credentials')) {
                throw new Error('Email atau password salah');
            }
            if (authError.message.includes('Email not confirmed')) {
                throw new Error('Email belum diverifikasi. Cek inbox email Anda.');
            }
            throw authError;
        }
        
        if (!authData.user) {
            throw new Error('Login gagal. Silakan coba lagi.');
        }
        
        // Get user role
        const userId = authData.user.id;
        const role = await getUserRole(userId);
        
        if (!role) {
            throw new Error('Role pengguna tidak ditemukan. Hubungi administrator.');
        }
        
        // Success - show message
        showAlert('Login berhasil! Mengarahkan...', 'success');
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect based on role
        redirectBasedOnRole(role);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login gagal. Silakan coba lagi.', 'danger');
        
        // Re-enable button
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitSpinner.style.display = 'none';
    }
});

// Show field error
function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorSpan = document.getElementById(fieldName + 'Error');
    
    if (field) field.classList.add('error');
    if (errorSpan) errorSpan.textContent = message;
}

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

// Enter key submit
document.getElementById('email').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('password').focus();
    }
});

console.log('✓ Login page loaded');
