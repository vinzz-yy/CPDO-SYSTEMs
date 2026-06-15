/* ============================================================
   DATA SUBMISSIONS — Submissions Table, Filters, Kebab Menu
   ============================================================ */
(function () {
    'use strict';

    function initKebabMenus() {
        const kebabBtns = document.querySelectorAll('.kebab-btn');
        const kebabDrops = document.querySelectorAll('.kebab-dropdown');

        kebabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const dropdown = document.querySelector('.kebab-dropdown[data-id="' + id + '"]');
                
                // Close all others first
                kebabDrops.forEach(d => d.classList.remove('active'));
                
                // Toggle this one
                dropdown.classList.toggle('active');
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            kebabDrops.forEach(d => d.classList.remove('active'));
        });
    }

    function initSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.sub-checkbox');

        if (!selectAll) return;

        selectAll.addEventListener('change', () => {
            checkboxes.forEach(cb => cb.checked = selectAll.checked);
        });

        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                selectAll.checked = Array.from(checkboxes).every(c => c.checked);
            });
        });
    }

    function initSubmissionTable() {
        const searchInput = document.getElementById('subSearch');
        const statusSelect = document.getElementById('subStatus');
        const pagination  = document.getElementById('subPagination');
        const filterPills  = document.querySelectorAll('.filter-pill');

        if (!pagination) return;

        const totalPages = parseInt(pagination.dataset.pages, 10)  || 1;
        const curPage    = parseInt(pagination.dataset.current, 10) || 1;

        function buildPagination(cur, total) {
            pagination.innerHTML = '';

            function makeBtn(label, page, disabled, active) {
                const btn = document.createElement('button');
                btn.className = 'page-btn' + (active ? ' active' : '');
                btn.textContent = label;
                btn.disabled = disabled;
                btn.addEventListener('click', function () { navigatePage(page); });
                return btn;
            }

            pagination.appendChild(makeBtn('‹', cur - 1, cur === 1, false));

            const start = Math.max(1, cur - 2);
            const end   = Math.min(total, cur + 2);
            for (let p = start; p <= end; p++) {
                pagination.appendChild(makeBtn(p, p, false, p === cur));
            }

            pagination.appendChild(makeBtn('›', cur + 1, cur === total, false));
        }

        buildPagination(curPage, totalPages);

        function navigatePage(page) {
            const params = new URLSearchParams(window.location.search);
            params.set('page', page);
            if (searchInput && searchInput.value) params.set('search', searchInput.value);
            if (statusSelect && statusSelect.value) params.set('status', statusSelect.value);
            window.location.search = params.toString();
        }

        filterPills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                filterPills.forEach(function (p) { p.classList.remove('active'); });
                this.classList.add('active');
            });
        });

        let searchTimer;
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(function () { navigatePage(1); }, 400);
            });
        }

        if (statusSelect) {
            statusSelect.addEventListener('change', function () {
                navigatePage(1);
            });
        }
    }

    function initKebabActions() {
        const approveBtns = document.querySelectorAll('.approve-submission');
        const rejectBtns = document.querySelectorAll('.reject-submission');

        approveBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                document.getElementById('approveId').value = id;
                document.getElementById('approveForm').submit();
            });
        });

        rejectBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                document.getElementById('rejectId').value = id;
                document.getElementById('rejectForm').submit();
            });
        });
    }

    function boot() {
        initSubmissionTable();
        initKebabMenus();
        initSelectAll();
        initKebabActions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
