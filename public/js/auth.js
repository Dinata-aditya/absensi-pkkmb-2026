// Authentication Utilities

/**
 * Wait for Supabase client (initialized by supabase-loader.js)
 */
function _waitForClient() {
    return new Promise((resolve, reject) => {
        if (window._supabaseReady) { resolve(); return; }
        const start = Date.now();
        const t = setInterval(() => {
            if (window._supabaseReady) {
                clearInterval(t); resolve();
            } else if (window._supabaseLoadFailed || Date.now() - start > 15000) {
                clearInterval(t); reject(new Error('Supabase client not ready'));
            }
        }, 100);
    });
}

/**
 * Check if user is authenticated
 * @returns {Promise<Object|null>} Session object or null
 */
async function checkAuth() {
    try {
        await _waitForClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Auth check error:', error);
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Auth check failed:', error);
        return null;
    }
}

/**
 * Get user role from database
 * @param {string} userId - User ID from auth
 * @returns {Promise<string|null>} Role (ADMIN or MAHASISWA) or null
 */
async function getUserRole(userId) {
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();
        
        if (error) {
            console.error('Get role error:', error);
            return null;
        }
        
        return data?.role || null;
    } catch (error) {
        console.error('Get role failed:', error);
        return null;
    }
}

/**
 * Get student data
 * @param {string} userId - User ID from auth
 * @returns {Promise<Object|null>} Student data or null
 */
async function getStudentData(userId) {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                faculties:fakultas_id(id, nama),
                study_programs:prodi_id(id, nama)
            `)
            .eq('user_id', userId)
            .single();
        
        if (error) {
            console.error('Get student data error:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Get student data failed:', error);
        return null;
    }
}

/**
 * Redirect user based on their role
 * @param {string} role - User role (ADMIN or MAHASISWA)
 */
function redirectBasedOnRole(role) {
    if (role === 'ADMIN') {
        window.location.href = 'admin-dashboard.html';
    } else if (role === 'MAHASISWA') {
        window.location.href = 'mahasiswa-dashboard.html';
    } else {
        console.error('Unknown role:', role);
        showError('Role tidak dikenali');
    }
}

/**
 * Protect page - require authentication
 * @param {string} requiredRole - Required role (optional, null = any authenticated user)
 * @returns {Promise<Object>} User session and data
 */
async function protectPage(requiredRole = null) {
    const session = await checkAuth();
    
    if (!session) {
        console.log('Not authenticated, redirecting to login');
        window.location.href = 'login.html';
        return null;
    }
    
    const role = await getUserRole(session.user.id);
    
    if (!role) {
        console.error('User role not found');
        showError('Role pengguna tidak ditemukan');
        await logout();
        return null;
    }
    
    // Check if required role matches
    if (requiredRole && role !== requiredRole) {
        console.error('Insufficient permissions');
        showError('Anda tidak memiliki akses ke halaman ini');
        redirectBasedOnRole(role);
        return null;
    }
    
    return { session, role };
}

/**
 * Logout user
 */
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            showError('Gagal logout: ' + error.message);
            return;
        }
        
        console.log('Logged out successfully');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
        showError('Gagal logout');
    }
}

/**
 * Show error message (utility)
 * @param {string} message - Error message to display
 */
function showError(message) {
    alert(message);
}

console.log('✓ Auth utilities loaded');
