// ==============================================================================
// AUTHENTIC CANVA-STYLE MULTIPLAYER CURSOR
// Iconic Canva / Figma collaborative arrow pointer with live interactive tag
// Honors both founders (Team 4FrndTech: Naveen & Santhosh Paul)
// Exclusively activates on desktop pointers (pointer: fine & hover: hover)
// ==============================================================================

(function initCanvaCursor() {
    if (typeof window === 'undefined') return;

    const isDesktopPointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isDesktopPointer || prefersReducedMotion) return;

    if (document.getElementById('canva-cursor-root')) return;

    // Default neutral team badge honoring both founders
    const DEFAULT_LABEL = '4FrndTech';

    // Create Root Container
    const root = document.createElement('div');
    root.id = 'canva-cursor-root';
    root.className = 'canva-cursor-root canva-cursor-hidden';
    root.setAttribute('aria-hidden', 'true');

    // Arrow Wrapper with Vector SVG (Tip aligned precisely to 0,0)
    const arrowWrap = document.createElement('div');
    arrowWrap.className = 'canva-cursor-arrow-wrap';
    arrowWrap.innerHTML = `
        <svg class="canva-cursor-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.5 3.21z" />
        </svg>
    `;

    // Attached Canva User Tag Pill
    const tag = document.createElement('div');
    tag.className = 'canva-cursor-tag';

    const dot = document.createElement('span');
    dot.className = 'canva-cursor-dot';

    const text = document.createElement('span');
    text.className = 'canva-cursor-text';
    text.textContent = DEFAULT_LABEL;

    tag.appendChild(dot);
    tag.appendChild(text);

    root.appendChild(arrowWrap);
    root.appendChild(tag);
    document.body.appendChild(root);
    document.documentElement.classList.add('canva-cursor-enabled');

    let mouseX = -100;
    let mouseY = -100;
    let isVisible = false;

    // Instant 1:1 hardware tracking with zero lag
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
            isVisible = true;
            root.classList.remove('canva-cursor-hidden');
        }

        root.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        isVisible = false;
        root.classList.add('canva-cursor-hidden');
    });

    document.addEventListener('mouseenter', () => {
        isVisible = true;
        root.classList.remove('canva-cursor-hidden');
    });

    // Snappy Canva click micro-bounce & ripple
    window.addEventListener('mousedown', (e) => {
        root.classList.add('is-clicked');

        const ripple = document.createElement('div');
        ripple.className = 'canva-cursor-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 420);
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        root.classList.remove('is-clicked');
    }, { passive: true });

    // Context-sensitive interactive tag updates
    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (!target || !(target instanceof Element)) return;

        // Specific founder detection (Naveen vs Santhosh Paul)
        const naveenContext = target.closest('#author-naveen, [data-author="naveen"], a[href*="Naveen-beginner"], a[href*="naveen191496"], a[href*="naveen-chandra-kowshik"]');
        const paulContext = target.closest('#author-paul, [data-author="paul"], [data-author="santhosh"], a[href*="santhoshpaul"], a[href*="devfrnd"]');

        if (naveenContext) {
            root.classList.add('is-hovering');
            text.textContent = 'Naveen (Founder)';
            dot.style.background = '#38bdf8';
            dot.style.boxShadow = '0 0 6px #38bdf8';
            return;
        }

        if (paulContext) {
            root.classList.add('is-hovering');
            text.textContent = 'Santhosh Paul (Founder)';
            dot.style.background = '#818cf8';
            dot.style.boxShadow = '0 0 6px #818cf8';
            return;
        }

        // Interactive UI Element Detection
        const inputEl = target.closest('input, textarea, [contenteditable="true"]');
        const copyBtn = target.closest('.copy-btn, [data-action="copy"]');
        const codeEl = target.closest('pre, code, .code-snippet-box');
        const cardEl = target.closest('.featured-card, .journal-entry-row, .post-item, .author-card-main');
        const workEl = target.closest('.work-row-item');
        const topicChip = target.closest('.topic-chip, .filter-chip');
        const btnEl = target.closest('button, [role="button"]');
        const linkEl = target.closest('a');

        if (inputEl) {
            root.classList.add('is-hovering');
            text.textContent = 'Type Here ✎';
            dot.style.background = '#a855f7';
            dot.style.boxShadow = '0 0 6px #a855f7';
        } else if (copyBtn) {
            root.classList.add('is-hovering');
            text.textContent = 'Copy Code 📋';
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 6px #22c55e';
        } else if (codeEl) {
            root.classList.add('is-hovering');
            text.textContent = '{ } Source Code';
            dot.style.background = '#f59e0b';
            dot.style.boxShadow = '0 0 6px #f59e0b';
        } else if (workEl) {
            root.classList.add('is-hovering');
            text.textContent = 'Open Project ↗';
            dot.style.background = '#38bdf8';
            dot.style.boxShadow = '0 0 6px #38bdf8';
        } else if (cardEl) {
            root.classList.add('is-hovering');
            text.textContent = 'Read Article ↗';
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 6px #22c55e';
        } else if (topicChip) {
            root.classList.add('is-hovering');
            text.textContent = 'Filter Topic 🏷';
            dot.style.background = '#38bdf8';
            dot.style.boxShadow = '0 0 6px #38bdf8';
        } else if (btnEl) {
            root.classList.add('is-hovering');
            if (btnEl.id === 'theme-toggle-btn' || btnEl.id === 'sidebar-theme-btn') {
                text.textContent = 'Theme ☀/☾';
                dot.style.background = '#f59e0b';
                dot.style.boxShadow = '0 0 6px #f59e0b';
            } else if (btnEl.id === 'sidebar-close-btn') {
                text.textContent = 'Close ✕';
                dot.style.background = '#ef4444';
                dot.style.boxShadow = '0 0 6px #ef4444';
            } else {
                text.textContent = btnEl.getAttribute('aria-label') || 'Action';
                dot.style.background = '#38bdf8';
                dot.style.boxShadow = '0 0 6px #38bdf8';
            }
        } else if (linkEl) {
            root.classList.add('is-hovering');
            if (linkEl.getAttribute('target') === '_blank') {
                text.textContent = 'Visit Link ↗';
            } else {
                text.textContent = 'Explore ↗';
            }
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 6px #22c55e';
        } else {
            // Revert smoothly to Team default
            root.classList.remove('is-hovering');
            text.textContent = DEFAULT_LABEL;
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 6px #22c55e';
        }
    }, { passive: true });
})();
