// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://ofrzlwmyxyquvnxfjuyw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnpsd215eHlxdXZueGZqdXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDQxMTAsImV4cCI6MjEwMzQyMDExMH0.ORFaKnUFoV1stsGuSElWmoRr-KP3ixg8oLUBpr9nuQ4'
};

// Initialize Supabase Client on window object to avoid duplicate declaration
if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    
    // Make it available as 'supabase' globally
    window.supabase = window.supabaseClient;
    
    console.log('✓ Supabase client initialized');
    console.log('Project URL:', SUPABASE_CONFIG.url);
} else {
    console.error('Supabase library not loaded');
}
