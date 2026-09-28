class AppNavBar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <header class="navbar-wrapper">
            <nav class="navbar" aria-label="Main Navigation">
                <a href="index.html" class="nav-brand" aria-label="Underrated Developer Home">
                    <img src="assets/favicons/official_logo_branding_transparent.png" alt="Underrated Developer Logo" class="brand-logo-img">
                    <div class="brand-text-col">
                        <span class="brand-name">Underrated Developer</span>
                        <span class="brand-sub">Team 4FrndTech • Naveen &amp; Santhosh Paul</span>
                    </div>
                </a>

                <div class="nav-menu" id="nav-menu">
                    <a href="index.html" class="nav-item">Home</a>
                    <a href="blog.html" class="nav-item">Articles</a>
                    <a href="author.html" class="nav-item">About</a>
                    <a href="support.html" class="nav-item">Contact</a>
                </div>

                <div class="nav-meta-actions">
                    <button class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle dark/white theme" title="Toggle dark/light theme">
                        <span class="material-symbols-outlined theme-icon-sun">light_mode</span>
                        <span class="material-symbols-outlined theme-icon-moon">dark_mode</span>
                    </button>
                    <a href="https://github.com/Naveen-beginner" target="_blank" rel="noopener" class="nav-icon-link" aria-label="GitHub Profile" title="GitHub">
                        <i class="fa-brands fa-github"></i>
                    </a>
                    <a href="https://play.google.com/store/apps/dev?id=8374043554473360551" target="_blank" rel="noopener" class="nav-icon-link" aria-label="Play Store Developer" title="Google Play Store">
                        <i class="fa-brands fa-google-play"></i>
                    </a>
                    <button class="nav-mobile-toggle" id="nav-mobile-toggle" aria-label="Toggle navigation">
                        <span class="material-symbols-outlined" id="nav-menu-icon">menu</span>
                    </button>
                </div>
            </nav>
        </header>
        `;

        const toggleBtn = this.querySelector("#nav-mobile-toggle");
        const navMenu = this.querySelector("#nav-menu");
        const menuIcon = this.querySelector("#nav-menu-icon");

        if (toggleBtn && navMenu) {
            toggleBtn.addEventListener('click', () => {
                const isOpen = navMenu.classList.toggle('active');
                menuIcon.textContent = isOpen ? 'close' : 'menu';
            });
        }

        const themeBtn = this.querySelector("#theme-toggle-btn");
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const nextTheme = isDark ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', nextTheme);
                localStorage.setItem('ud-theme', nextTheme);
            });
        }

        // Highlight active link
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        this.querySelectorAll('.nav-item').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
}

customElements.define('app-navbar', AppNavBar);