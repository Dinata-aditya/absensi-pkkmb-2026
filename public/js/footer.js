// Global Footer
(function() {
    const footer = document.createElement('div');
    footer.style.cssText = `
        text-align: center;
        padding: 1rem;
        font-size: .75rem;
        color: rgba(255,255,255,0.7);
        margin-top: 2rem;
    `;
    footer.innerHTML = `
        Developed by 
        <a href="https://sisteminformasi.dinata.dev" target="_blank" 
           style="color:rgba(255,255,255,0.9);text-decoration:none;font-weight:600;">
            sisteminformasi.Dinata.dev
        </a>
    `;
    document.body.appendChild(footer);
})();
