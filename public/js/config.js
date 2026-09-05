// config.js
// Supabase client is initialized in supabase-loader.js
// This file is kept for backward compatibility and constants only

const SUPABASE_CONFIG = {
    url: 'https://ofrzlwmyxyquvnxfjuyw.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnpsd215eHlxdXZueGZqdXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDQxMTAsImV4cCI6MjEwMzQyMDExMH0.ORFaKnUFoV1stsGuSElWmoRr-KP3ixg8oLUBpr9nuQ4'
};

// window.supabase is already an initialized client by the time this runs
// (supabase-loader.js runs first and handles everything)
console.log('[config] loaded');
