// Supabase Library Loader with Fallback
// Ensures Supabase CDN is loaded before other scripts use it

(function () {
    'use strict';

    const CDN_FALLBACK = 'https://unpkg.com/@supabase/supabase-js@2';
    const TIMEOUT_MS   = 12000; // 12 seconds max wait
    const POLL_MS      = 80;    // check every 80ms

    function isLibraryReady() {
        return typeof window.supabase !== 'undefined' &&
               typeof window.supabase.createClient === 'function';
    }

    function showLoadingOverlay() {
        // Only add if body exists and overlay not already present
        if (!document.body || document.getElementById('_sb_loading')) return;

        const el = document.createElement('div');
        el.id = '_sb_loading';
        el.innerHTML = [
            '<div style="',
                'position:fixed;top:0;left:0;width:100%;height:100%;',
                'background:rgba(255,255,255,.96);',
                'display:flex;flex-direction:column;align-items:center;justify-content:center;',
                'z-index:99999;font-family:system-ui,sans-serif;',
            '">',
                '<div style="',
                    'width:44px;height:44px;border:4px solid #e5e7eb;',
                    'border-top-color:#1a6b3c;border-radius:50%;',
                    'animation:_sbspin 0.9s linear infinite;margin-bottom:16px;',
                '"></div>',
                '<p style="color:#1a6b3c;font-size:15px;margin:0;">Memuat sistem...</p>',
                '<p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">Mohon tunggu sebentar</p>',
                '<style>@keyframes _sbspin{to{transform:rotate(360deg)}}</style>',
            '</div>'
        ].join('');
        document.body.appendChild(el);
    }

    function hideLoadingOverlay() {
        const el = document.getElementById('_sb_loading');
        if (el) el.remove();
    }

    function showFatalError() {
        hideLoadingOverlay();
        const el = document.createElement('div');
        el.style.cssText = [
            'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
            'background:#fff;padding:28px 24px;border-radius:12px;',
            'box-shadow:0 4px 24px rgba(0,0,0,.15);max-width:360px;width:90%;',
            'text-align:center;z-index:99999;font-family:system-ui,sans-serif;'
        ].join('');
        el.innerHTML = [
            '<div style="font-size:44px;margin-bottom:12px;">&#9888;&#65039;</div>',
            '<h3 style="margin:0 0 12px;color:#dc2626;font-size:17px;">Gagal Memuat Sistem</h3>',
            '<p style="color:#6b7280;margin-bottom:20px;font-size:14px;line-height:1.5;">',
                'Koneksi internet tidak stabil.<br>Silakan coba lagi.',
            '</p>',
            '<button onclick="location.reload()" style="',
                'background:#1a6b3c;color:#fff;border:none;',
                'padding:12px 24px;border-radius:8px;font-size:14px;',
                'font-weight:600;cursor:pointer;width:100%;',
            '">&#128260; Coba Lagi</button>'
        ].join('');
        document.body.appendChild(el);
    }

    async function waitForLibrary() {
        const start = Date.now();
        return new Promise((resolve, reject) => {
            if (isLibraryReady()) { resolve(); return; }
            const timer = setInterval(() => {
                if (isLibraryReady()) {
                    clearInterval(timer);
                    resolve();
                } else if (Date.now() - start > TIMEOUT_MS) {
                    clearInterval(timer);
                    reject(new Error('Timeout'));
                }
            }, POLL_MS);
        });
    }

    async function loadFallbackScript() {
        return new Promise((resolve, reject) => {
            console.warn('[supabase-loader] Primary CDN slow, loading fallback...');
            const s = document.createElement('script');
            s.src = CDN_FALLBACK;
            s.onload  = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function init() {
        // Wait for body to mount
        if (!document.body) {
            await new Promise(r => {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', r);
                } else { r(); }
            });
        }

        showLoadingOverlay();

        try {
            await waitForLibrary();
        } catch (_) {
            // Primary CDN timed out — try fallback
            try {
                await loadFallbackScript();
                await waitForLibrary();
            } catch (e) {
                console.error('[supabase-loader] All CDN attempts failed');
                showFatalError();
                window._supabaseLoadFailed = true;
                return;
            }
        }

        // Library is ready — initialize client immediately here
        // so ALL subsequent scripts see window.supabase as the client, not the lib
        const SUPABASE_URL  = 'https://ofrzlwmyxyquvnxfjuyw.supabase.co';
        const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcnpsd215eHlxdXZueGZqdXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDQxMTAsImV4cCI6MjEwMzQyMDExMH0.ORFaKnUFoV1stsGuSElWmoRr-KP3ixg8oLUBpr9nuQ4';

        try {
            window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('[supabase-loader] Client initialized');
        } catch (e) {
            console.error('[supabase-loader] createClient failed:', e);
            showFatalError();
            window._supabaseLoadFailed = true;
            return;
        }

        // Mark as ready
        window._supabaseReady = true;
        hideLoadingOverlay();
        console.log('[supabase-loader] Ready');
    }

    init();
})();
