// ==============================================================================
// AUTHENTIC CANVA-STYLE POINTER CURSOR
// Minimalist, high-precision arrow pointer (No floating label pills)
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

    // Arrow Wrapper with Vector SVG (Tip aligned precisely to 0,0)
    const arrowWrap = document.createElement('div');
    arrowWrap.className = 'canva-cursor-arrow-wrap';
    arrowWrap.innerHTML = `
        <svg class="canva-cursor-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.5 3.21z" />
        </svg>
    `;

    root.appendChild(arrowWrap);
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

    // Subtle scale feedback when hovering interactive links & buttons
    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (!target || !(target instanceof Element)) return;

        const isInteractive = target.closest('a, button, input, select, textarea, [role="button"], .topic-chip, .featured-card, .work-row-item, .author-card-main');
        if (isInteractive) {
            root.classList.add('is-hovering');
        } else {
            root.classList.remove('is-hovering');
        }
    }, { passive: true });
})();
