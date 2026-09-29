// ==============================================================================
// AUTHENTIC CANVA-STYLE DESIGNER CURSOR
// Iconic Canva / Figma collaborative arrow pointer with live interactive tag
// Exclusively activates on desktop pointers (pointer: fine & hover: hover)
// ==============================================================================

(function initCanvaCursor() {
    if (typeof window === 'undefined') return;

    const isDesktopPointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isDesktopPointer || prefersReducedMotion) return;

    if (document.getElementById('canva-cursor-root')) return;

    // Create Root Container
    const root = document.createElement('div');
    root.id = 'canva-cursor-root';
    root.className = 'canva-cursor-root canva-cursor-hidden';
    root.setAttribute('aria-hidden', 'true');

    // Arrow Wrapper with SVG Vector
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
    text.textContent = 'Naveen • Dev';

    tag.appendChild(dot);
    tag.appendChild(text);

    root.appendChild(arrowWrap);
    root.appendChild(tag);
    document.body.appendChild(root);
    document.documentElement.classList.add('canva-cursor-enabled');

    let mouseX = -100;
    let mouseY = -100;
    let isVisible = false;
    const DEFAULT_LABEL = 'Naveen • Dev';

    // Instant, lag-free 1:1 hardware tracking
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

    // Click micro-animation & Canva ripple
    window.addEventListener('mousedown', (e) => {
        root.classList.add('is-clicked');

        // Create Canva click ripple
        const ripple = document.createElement('div');
        ripple.className = 'canva-cursor-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 450);
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        root.classList.remove('is-clicked');
    }, { passive: true });

    // Context-sensitive interactive tag updates
    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (!target || !(target instanceof Element)) return;

        const linkEl = target.closest('a');
        const btnEl = target.closest('button');
        const cardEl = target.closest('.featured-card, .journal-entry-row, .work-row-item, .author-card-main');
        const codeEl = target.closest('pre, code, .code-snippet-box');
        const topicChip = target.closest('.topic-chip');

        if (codeEl) {
            root.classList.add('is-hovering');
            text.textContent = '{ } Code';
            dot.style.background = '#f59e0b';
            dot.style.boxShadow = '0 0 6px #f59e0b';
        } else if (cardEl) {
            root.classList.add('is-hovering');
            text.textContent = 'Read Article ↗';
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 6px #22c55e';
        } else if (topicChip) {
            root.classList.add('is-hovering');
            text.textContent = 'Filter by Tag';
            dot.style.background = '#38bdf8';
            dot.style.boxShadow = '0 0 6px #38bdf8';
        } else if (btnEl) {
            root.classList.add('is-hovering');
            if (btnEl.id === 'theme-toggle-btn' || btnEl.id === 'sidebar-theme-btn') {
                text.textContent = 'Switch Theme ☀';
            } else if (btnEl.id === 'sidebar-close-btn') {
                text.textContent = 'Close ✕';
            } else {
                text.textContent = 'Action';
            }
            dot.style.background = '#38bdf8';
            dot.style.boxShadow = '0 0 6px #38bdf8';
        } else if (linkEl) {
            root.classList.add('is-hovering');
            if (linkEl.getAttribute('target') === '_blank') {
                text.textContent = 'Visit External ↗';
            } else {
                text.textContent = 'Navigate ↗';
            }
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 6px #22c55e';
        } else {
            root.classList.remove('is-hovering');
            text.textContent = DEFAULT_LABEL;
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 6px #22c55e';
        }
    }, { passive: true });
})();
