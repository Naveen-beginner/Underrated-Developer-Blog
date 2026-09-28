// ==========================================================================
// UNDERRATED DEVELOPER - THEME MANAGER (DARK / LIGHT MODE)
// Team 4FrndTech • Clean Zero-Flash Theme Controller
// ==========================================================================

const THEME_KEY = 'ud-theme';

export function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
        return stored;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

export function applyTheme(theme) {
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', validTheme);
    localStorage.setItem(THEME_KEY, validTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: validTheme } }));
}

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    return nextTheme;
}

// Immediate execution to prevent flash of wrong theme
(function init() {
    const theme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Watch OS level theme changes only if user hasn't set an explicit preference
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
})();
