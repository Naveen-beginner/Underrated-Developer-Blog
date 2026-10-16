class AppNavBar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <header class="navbar-wrapper">
            <nav class="navbar" aria-label="Main Navigation">
                <a href="/" class="nav-brand" aria-label="Underrated Developer Home">
                    <img src="assets/favicons/official_logo_branding_transparent.png" alt="Underrated Developer Logo" class="brand-logo-img" width="48" height="48">
                    <div class="brand-text-col">
                        <span class="brand-name">Underrated Developer</span>
                        <span class="brand-sub">Team 4FrndTech • Naveen &amp; Santhosh Paul</span>
                    </div>
                </a>

                <!-- Backdrop Overlay for Mobile Sidebar Drawer -->
                <div class="nav-backdrop" id="nav-backdrop" aria-hidden="true"></div>

                <!-- Navigation (Desktop Inline / Mobile Slide-Out Sidebar) -->
                <div class="nav-menu" id="nav-menu" role="dialog" aria-label="Navigation Menu" aria-modal="true">
                    <div class="sidebar-header">
                        <div class="sidebar-brand">
                            <img src="assets/favicons/official_logo_branding_transparent.png" alt="Underrated Developer Logo" class="sidebar-logo-img" width="44" height="44">
                            <div class="sidebar-brand-text">
                                <span class="sidebar-brand-name">Underrated Dev</span>
                                <span class="sidebar-brand-sub">Team 4FrndTech</span>
                            </div>
                        </div>
                        <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close navigation menu" title="Close menu">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div class="sidebar-links">
                        <a href="/" class="nav-item">
                            <span class="material-symbols-outlined nav-item-icon">home</span>
                            <span class="nav-item-text">Home</span>
                        </a>
                        <a href="/blog" class="nav-item">
                            <span class="material-symbols-outlined nav-item-icon">menu_book</span>
                            <span class="nav-item-text">Articles</span>
                        </a>
                        <a href="/author" class="nav-item">
                            <span class="material-symbols-outlined nav-item-icon">badge</span>
                            <span class="nav-item-text">About</span>
                        </a>
                        <a href="/support" class="nav-item">
                            <span class="material-symbols-outlined nav-item-icon">mail</span>
                            <span class="nav-item-text">Contact</span>
                        </a>
                    </div>

                    <div class="sidebar-footer">
                        <div class="sidebar-theme-row">
                            <span class="sidebar-footer-label">Appearance</span>
                            <button class="sidebar-theme-btn" id="sidebar-theme-btn" aria-label="Toggle dark and light theme">
                                <span class="material-symbols-outlined theme-icon-sun">light_mode</span>
                                <span class="material-symbols-outlined theme-icon-moon">dark_mode</span>
                                <span class="sidebar-theme-status-text" id="sidebar-theme-text">Toggle Theme</span>
                            </button>
                        </div>
                        <div class="sidebar-social-row">
                            <a href="https://github.com/Naveen-beginner" target="_blank" rel="noopener noreferrer" class="sidebar-social-link" title="GitHub Profile" aria-label="GitHub Profile">
                                <i class="fa-brands fa-github"></i>
                                <span>GitHub</span>
                            </a>
                            <a href="https://play.google.com/store/apps/dev?id=8374043554473360551" target="_blank" rel="noopener noreferrer" class="sidebar-social-link" title="Google Play Store Developer" aria-label="Google Play Store Developer">
                                <i class="fa-brands fa-google-play"></i>
                                <span>Play Store</span>
                            </a>
                        </div>
                        <div class="sidebar-tag-quote">
                            <strong>#WeAreUnderratedDevs</strong>
                            <span>Naveen &amp; Santhosh Paul</span>
                        </div>
                    </div>
                </div>

                <div class="nav-meta-actions">
                    <button class="theme-toggle-btn" id="theme-toggle-btn" aria-label="Toggle dark and light theme" title="Toggle dark/light theme">
                        <span class="material-symbols-outlined theme-icon-sun">light_mode</span>
                        <span class="material-symbols-outlined theme-icon-moon">dark_mode</span>
                    </button>
                    <a href="https://github.com/Naveen-beginner" target="_blank" rel="noopener noreferrer" class="nav-icon-link nav-desktop-action" aria-label="GitHub Profile" title="GitHub">
                        <i class="fa-brands fa-github"></i>
                    </a>
                    <a href="https://play.google.com/store/apps/dev?id=8374043554473360551" target="_blank" rel="noopener noreferrer" class="nav-icon-link nav-desktop-action" aria-label="Play Store Developer" title="Google Play Store">
                        <i class="fa-brands fa-google-play"></i>
                    </a>
                    <button class="nav-mobile-toggle" id="nav-mobile-toggle" aria-label="Open navigation menu" aria-expanded="false" aria-controls="nav-menu">
                        <span class="material-symbols-outlined" id="nav-menu-icon">menu</span>
                    </button>
                </div>
            </nav>
        </header>
        `;

        const toggleBtn = this.querySelector("#nav-mobile-toggle");
        const navMenu = this.querySelector("#nav-menu");
        const backdrop = this.querySelector("#nav-backdrop");
        const closeBtn = this.querySelector("#sidebar-close-btn");
        const sidebarThemeText = this.querySelector("#sidebar-theme-text");
        const themeBtn = this.querySelector("#theme-toggle-btn");

        const syncInertState = () => {
            if (window.innerWidth <= 768) {
                if (!navMenu.classList.contains('open')) {
                    navMenu.inert = true;
                    navMenu.setAttribute('aria-hidden', 'true');
                } else {
                    navMenu.inert = false;
                    navMenu.removeAttribute('aria-hidden');
                }
            } else {
                navMenu.inert = false;
                navMenu.removeAttribute('aria-hidden');
            }
        };

        const updateThemeLabel = (theme) => {
            const label = theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
            if (sidebarThemeText) {
                sidebarThemeText.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
            }
            if (themeBtn) {
                themeBtn.setAttribute('aria-label', label);
            }
        };

        const openSidebar = () => {
            if (!navMenu) return;
            navMenu.classList.add('open');
            if (backdrop) backdrop.classList.add('open');
            document.documentElement.classList.add('nav-open');
            document.body.classList.add('nav-open');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
            navMenu.removeAttribute('aria-hidden');
            navMenu.inert = false;
            // preventScroll prevents mobile browsers from horizontally shifting the viewport
            closeBtn?.focus({ preventScroll: true });
        };

        const closeSidebar = () => {
            if (!navMenu) return;
            navMenu.classList.remove('open');
            if (backdrop) backdrop.classList.remove('open');
            document.documentElement.classList.remove('nav-open');
            document.body.classList.remove('nav-open');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.focus({ preventScroll: true });
            }
            // Reset any horizontal viewport shift
            window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' });
            syncInertState();
        };

        syncInertState();
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navMenu.classList.contains('open')) {
                closeSidebar();
            } else {
                syncInertState();
            }
        }, { passive: true });

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (navMenu.classList.contains('open')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeSidebar);
        }

        if (backdrop) {
            backdrop.addEventListener('click', closeSidebar);
            backdrop.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                closeSidebar();
            }
        });

        // Close on clicking any navigation link inside sidebar
        this.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });

        // Theme toggling (Header button + Sidebar button)
        const toggleTheme = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const nextTheme = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('ud-theme', nextTheme);
            updateThemeLabel(nextTheme);
        };

        if (themeBtn) {
            themeBtn.addEventListener('click', toggleTheme);
        }

        const sidebarThemeBtn = this.querySelector("#sidebar-theme-btn");
        if (sidebarThemeBtn) {
            sidebarThemeBtn.addEventListener('click', toggleTheme);
        }

        // Initialize label with current theme
        const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateThemeLabel(initialTheme);

        // Highlight active link
        const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
        const cleanPath = currentPath.replace(/\.html$/, '');
        this.querySelectorAll('.nav-item').forEach(link => {
            const href = link.getAttribute('href');
            if (href === cleanPath || (cleanPath === '' && href === '/') || (cleanPath === '/index' && href === '/')) {
                link.classList.add('active');
            }
        });
    }
}

customElements.define('app-navbar', AppNavBar);