// Supabase Library Loader with Fallback and Retry
// This script MUST load before config.js

(function() {
    'use strict';
    
    const CDN_PRIMARY = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    const CDN_FALLBACK = 'https://unpkg.com/@supabase/supabase-js@2';
    const MAX_WAIT_TIME = 10000; // 10 seconds
    const CHECK_INTERVAL = 100; // Check every 100ms
    
    let attempts = 0;
    const maxAttempts = MAX_WAIT_TIME / CHECK_INTERVAL;
    
    /**
     * Wait for Supabase library to be available
     * @returns {Promise<boolean>}
     */
    function waitForSupabase() {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                    clearInterval(checkInterval);
                    console.log('? Supabase library loaded successfully (attempt ' + attempts + ')');
                    resolve(true);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('? Supabase library failed to load after ' + (MAX_WAIT_TIME/1000) + ' seconds');
                    reject(new Error('Timeout waiting for Supabase library'));
                    return;
                }
            }, CHECK_INTERVAL);
        });
    }
    
    /**
     * Load fallback CDN if primary fails
     */
    function loadFallbackCDN() {
        return new Promise((resolve, reject) => {
            console.warn('? Loading fallback CDN:', CDN_FALLBACK);
            
            const script = document.createElement('script');
            script.src = CDN_FALLBACK;
            script.async = false;
            
            script.onload = () => {
                console.log('? Fallback CDN loaded');
                resolve(true);
            };
            
            script.onerror = () => {
                console.error('? Fallback CDN also failed');
                reject(new Error('Both primary and fallback CDN failed'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Show loading indicator
     */
    function showLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'supabase-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #1a6b3c;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p style="color: #1a6b3c; font-size: 16px; margin: 0;">Memuat sistem...</p>
                <p style="color: #666; font-size: 12px; margin-top: 8px;">Mohon tunggu sebentar</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loadingDiv);
    }
    
    /**
     * Hide loading indicator
     */
    function hideLoadingIndicator() {
        const loadingDiv = document.getElementById('supabase-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    /**
     * Show error message to user
     */
    function showErrorMessage() {
        hideLoadingIndicator();
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
            max-width: 400px;
            text-align: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        errorDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">??</div>
            <h3 style="margin: 0 0 16px 0; color: #dc2626;">Gagal Memuat Sistem</h3>
            <p style="color: #666; margin-bottom: 24px; line-height: 1.5;">
                Koneksi internet Anda terlalu lambat atau tidak stabil.<br>
                Sistem tidak dapat dimuat.
            </p>
            <div style="margin-bottom: 16px;">
                <button onclick="location.reload()" style="
                    background: #1a6b3c;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    margin-bottom: 8px;
                ">?? Coba Lagi</button>
            </div>
            <p style="color: #999; font-size: 12px; margin: 0;">
                Pastikan koneksi internet stabil dan coba lagi.<br>
                Jika masih gagal, hubungi panitia.
            </p>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    /**
     * Initialize: Wait for Supabase or load fallback
     */
    async function initialize() {
        // Show loading indicator
        if (document.body) {
            showLoadingIndicator();
        } else {
            // Wait for body to exist
            await new Promise(resolve => {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', resolve);
                } else {
                    resolve();
                }
            });
            showLoadingIndicator();
        }
        
        try {
            // Try to wait for primary CDN
            await waitForSupabase();
            hideLoadingIndicator();
            
            // Mark as ready
            window.supabaseReady = true;
            window.dispatchEvent(new Event('supabase:ready'));
            
        } catch (primaryError) {
            console.warn('Primary CDN failed, trying fallback...');
            
            try {
                // Load and wait for fallback CDN
                await loadFallbackCDN();
                await waitForSupabase();
                hideLoadingIndicator();
                
                // Mark as ready
                window.supabaseReady = true;
                window.dispatchEvent(new Event('supabase:ready'));
                
            } catch (fallbackError) {
                console.error('All CDN loading attempts failed:', fallbackError);
                showErrorMessage();
                
                // Mark as failed
                window.supabaseReady = false;
                window.supabaseError = fallbackError;
                window.dispatchEvent(new Event('supabase:error'));
            }
        }
    }
    
    // Start initialization
    initialize();
    
})();

console.log('? Supabase loader initialized');
