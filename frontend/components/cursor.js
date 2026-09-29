// ==============================================================================
// CANVA-STYLE INTERACTIVE DEV CURSOR
// Exclusively activates on desktop pointers (pointer: fine)
// Uses requestAnimationFrame lerp interpolation for silky 60/120fps motion
// ==============================================================================

(function initTechCursor() {
    // Only run on desktop devices with fine pointer and no reduced-motion preference
    if (typeof window === 'undefined') return;
    const isDesktopPointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isDesktopPointer || prefersReducedMotion) return;

    // Prevent duplicate initializations
    if (document.getElementById('ud-cursor-container')) return;

    // Create DOM elements
    const container = document.createElement('div');
    container.id = 'ud-cursor-container';
    container.className = 'ud-cursor-container ud-cursor-hidden';
    container.setAttribute('aria-hidden', 'true');

    const dot = document.createElement('div');
    dot.className = 'ud-cursor-dot';

    const ring = document.createElement('div');
    ring.className = 'ud-cursor-ring';

    const badge = document.createElement('span');
    badge.className = 'ud-cursor-badge';
    badge.textContent = '<dev/>';
    ring.appendChild(badge);

    container.appendChild(ring);
    container.appendChild(dot);
    document.body.appendChild(container);
    document.body.classList.add('ud-cursor-active');

    // Smooth physics variables
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;
    let isHovering = false;
    let isCardHover = false;
    let currentBadgeText = '<dev/>';

    // Lerp factor (0.16 gives a snappy yet buttery-smooth Canva/Figma trail)
    const LERP_FACTOR = 0.16;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
            isVisible = true;
            container.classList.remove('ud-cursor-hidden');
            ringX = mouseX;
            ringY = mouseY;
        }

        // Direct GPU translate on dot for 0ms lag
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    }, { passive: true });

    // Handle mouse leaving and entering viewport
    document.addEventListener('mouseleave', () => {
        isVisible = false;
        container.classList.add('ud-cursor-hidden');
    });

    document.addEventListener('mouseenter', () => {
        isVisible = true;
        container.classList.remove('ud-cursor-hidden');
    });

    // Click micro-bounce
    window.addEventListener('mousedown', () => {
        ring.classList.add('is-clicked');
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        ring.classList.remove('is-clicked');
    }, { passive: true });

    // Interactive target detection using event delegation
    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (!target || !(target instanceof Element)) return;

        const linkEl = target.closest('a');
        const btnEl = target.closest('button');
        const cardEl = target.closest('.featured-card, .journal-entry-row, .work-row-item, .hero-status-pill, .topic-chip');
        const codeEl = target.closest('pre, code, .code-snippet-box');

        if (codeEl) {
            isHovering = true;
            isCardHover = false;
            currentBadgeText = '{ }';
            badge.textContent = currentBadgeText;
            ring.classList.add('is-hovering');
            ring.classList.remove('is-card-hover');
        } else if (cardEl) {
            isHovering = false;
            isCardHover = true;
            currentBadgeText = 'read';
            badge.textContent = currentBadgeText;
            ring.classList.add('is-card-hover');
            ring.classList.remove('is-hovering');
        } else if (linkEl || btnEl) {
            isHovering = true;
            isCardHover = false;
            if (btnEl && (btnEl.id === 'theme-toggle-btn' || btnEl.id === 'sidebar-theme-btn')) {
                currentBadgeText = 'theme';
            } else if (linkEl && linkEl.getAttribute('target') === '_blank') {
                currentBadgeText = 'open ↗';
            } else {
                currentBadgeText = '<dev/>';
            }
            badge.textContent = currentBadgeText;
            ring.classList.add('is-hovering');
            ring.classList.remove('is-card-hover');
        } else {
            isHovering = false;
            isCardHover = false;
            ring.classList.remove('is-hovering', 'is-card-hover');
        }
    }, { passive: true });

    // Animation loop using requestAnimationFrame
    function animateCursor() {
        if (isVisible) {
            ringX += (mouseX - ringX) * LERP_FACTOR;
            ringY += (mouseY - ringY) * LERP_FACTOR;
            ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        }
        requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);
})();
