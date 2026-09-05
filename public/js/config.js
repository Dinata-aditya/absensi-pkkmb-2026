// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://ofrzlwmyxyquvnxfjuyw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnpsd215eHlxdXZueGZqdXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDQxMTAsImV4cCI6MjEwMzQyMDExMH0.ORFaKnUFoV1stsGuSElWmoRr-KP3ixg8oLUBpr9nuQ4'
};

/**
 * Initialize Supabase Client
 * This function is called after supabase library is confirmed loaded
 */
function initializeSupabaseClient() {
    if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
        console.error('? Supabase library not available');
        return false;
    }
    
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        // Make it available as 'supabase' globally for backward compatibility
        window.supabase = window.supabaseClient;
        
        console.log('? Supabase client initialized successfully');
        console.log('  Project URL:', SUPABASE_CONFIG.url);
        return true;
        
    } catch (error) {
        console.error('? Failed to initialize Supabase client:', error);
        return false;
    }
}

// Wait for supabase:ready event before initializing
if (window.supabaseReady) {
    // Already ready
    initializeSupabaseClient();
} else {
    // Wait for ready event
    window.addEventListener('supabase:ready', function() {
        initializeSupabaseClient();
    });
    
    // Handle error case
    window.addEventListener('supabase:error', function() {
        console.error('? Supabase library failed to load');
    });
}

console.log('? Config module loaded');
