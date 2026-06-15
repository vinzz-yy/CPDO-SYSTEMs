/* ============================================================
   SIDEBAR — Toggle collapse / mobile behaviour
   ============================================================ */
(function () {
    'use strict';

    const sidebar  = document.getElementById('sidebar');
    const toggle   = document.getElementById('sidebarToggle');
    const overlay  = document.getElementById('sidebarOverlay');
    const main     = document.getElementById('mainContent');

    if (!sidebar || !toggle) return;

    const COLLAPSED_KEY = 'cpdo_sidebar_collapsed';
    const isMobile = () => window.innerWidth <= 768;

    function applyState(collapsed) {
        if (isMobile()) {
            sidebar.classList.toggle('mobile-open', !collapsed);
            overlay && overlay.classList.toggle('visible', !collapsed);
        } else {
            sidebar.classList.toggle('collapsed', collapsed);
            if (main) main.style.marginLeft = collapsed
                ? 'var(--sidebar-collapsed)'
                : 'var(--sidebar-width)';
        }
    }

    // Restore saved state on load (desktop only)
    if (!isMobile()) {
        const saved = localStorage.getItem(COLLAPSED_KEY) === 'true';
        applyState(saved);
    }

    toggle.addEventListener('click', function () {
        if (isMobile()) {
            const isOpen = sidebar.classList.contains('mobile-open');
            applyState(isOpen); // toggle: if open → close
        } else {
            const willCollapse = !sidebar.classList.contains('collapsed');
            localStorage.setItem(COLLAPSED_KEY, willCollapse);
            applyState(willCollapse);
        }
    });

    // Close mobile sidebar on overlay click
    overlay && overlay.addEventListener('click', function () {
        applyState(true);
    });

    // Re-evaluate on resize
    window.addEventListener('resize', function () {
        if (!isMobile()) {
            sidebar.classList.remove('mobile-open');
            overlay && overlay.classList.remove('visible');
            const saved = localStorage.getItem(COLLAPSED_KEY) === 'true';
            applyState(saved);
        } else {
            sidebar.classList.remove('collapsed');
            if (main) main.style.marginLeft = '';
        }
    });
}());
