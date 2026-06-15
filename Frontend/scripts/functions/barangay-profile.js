/* ============================================================
   BARANGAY PROFILES — Table, Search, Pagination, Modal
   ============================================================ */
(function () {
    'use strict';

    // Barangay data from PHP (for edit)
    window.CPDO_BARANGAYS = window.CPDO_BARANGAYS || [];
    let pendingBarangayForm = null;
    let pendingBarangayDelete = null;

    /* ===========================================================
       1. BARANGAY TABLE — Search, Zone Filter, Pagination
    ============================================================ */
    function initBarangayTable() {
        const searchInput = document.getElementById('bgySearch');
        const zoneSel   = document.getElementById('bgyZone');
        const pagination  = document.getElementById('bgyPagination');
        const newBarangayBtn = document.getElementById('newBarangayBtn');
        const filterPills = document.querySelectorAll('.filter-pill');
        const kebabBtns = document.querySelectorAll('.kebab-btn');
        const editItems = document.querySelectorAll('.edit-barangay');
        const viewItems = document.querySelectorAll('.view-barangay');

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.kebab-menu-container')) {
                document.querySelectorAll('.kebab-dropdown').forEach(dd => {
                    dd.classList.remove('active');
                });
            }
        });

        if (newBarangayBtn) {
            newBarangayBtn.addEventListener('click', function() {
                openBarangayModal();
            });
        }

        if (kebabBtns.length > 0) {
            kebabBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    // Close all other dropdowns
                    document.querySelectorAll('.kebab-dropdown').forEach(dd => {
                        if (dd.previousElementSibling !== this) {
                            dd.classList.remove('active');
                        }
                    });
                    // Toggle current dropdown
                    this.nextElementSibling.classList.toggle('active');
                });
            });
        }

        if (editItems.length > 0) {
            editItems.forEach(item => {
                item.addEventListener('click', function() {
                    const barangayId = this.getAttribute('data-id');
                    const barangay = window.CPDO_BARANGAYS.find(b => b.id == barangayId);
                    if (barangay) {
                        openBarangayModal(barangay);
                        // Close dropdown
                        this.closest('.kebab-dropdown').classList.remove('active');
                    }
                });
            });
        }

        if (viewItems.length > 0) {
            viewItems.forEach(item => {
                item.addEventListener('click', function() {
                    const barangayId = this.getAttribute('data-id');
                    const barangay = window.CPDO_BARANGAYS.find(b => b.id == barangayId);
                    if (barangay) {
                        openViewBarangayModal(barangay);
                        // Close dropdown
                        this.closest('.kebab-dropdown').classList.remove('active');
                    }
                });
            });
        }

        if (!pagination) return;

        const totalPages = parseInt(pagination.dataset.pages, 10)  || 1;
        const curPage    = parseInt(pagination.dataset.current, 10) || 1;

        /* Build pagination buttons */
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
            if (searchInput) {
                if (searchInput.value) {
                    params.set('search', searchInput.value);
                } else {
                    params.delete('search');
                }
            }
            if (zoneSel) {
                if (zoneSel.value) {
                    params.set('zone', zoneSel.value);
                } else {
                    params.delete('zone');
                }
            }
            // Handle filter pill
            const activeFilter = getActiveFilter();
            if (activeFilter === 'high-risk') {
                params.set('poverty', 'high');
            } else if (activeFilter === 'urban' || activeFilter === 'rural') {
                // For urban/rural, we might need to adjust later, but let's set for now
                params.set('classification', activeFilter);
            } else {
                params.delete('poverty');
                params.delete('classification');
            }
            window.location.search = params.toString();
        }

        /* Debounced search */
        let searchTimer;
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(function () { navigatePage(1); }, 400);
            });
        }
        if (zoneSel) {
            zoneSel.addEventListener('change', function () { navigatePage(1); });
        }

        // Filter Pills
        if (filterPills.length > 0) {
            filterPills.forEach(pill => {
                pill.addEventListener('click', function() {
                    // Remove active class from all pills
                    filterPills.forEach(p => p.classList.remove('active'));
                    // Add active class to clicked pill
                    this.classList.add('active');
                    // Navigate with filter
                    navigatePage(1);
                });
            });
        }
    }

    function getActiveFilter() {
        const activePill = document.querySelector('.filter-pill.active');
        return activePill ? activePill.dataset.filter : 'all';
    }

    /* ===========================================================
       2. MODAL — Add/Edit Barangay
    ============================================================ */
    function openBarangayModal(barangay = null) {
        const modal = document.getElementById('barangayModal');
        const modalTitle = document.getElementById('barangayModalTitle');
        const formAction = document.getElementById('barangayFormAction');
        const barangayId = document.getElementById('barangayId');
        const barangayName = document.getElementById('barangayName');
        const barangayZone = document.getElementById('barangayZone');
        const barangayPopulation = document.getElementById('barangayPopulation');
        const barangayArea = document.getElementById('barangayArea');
        const barangayPoverty = document.getElementById('barangayPoverty');

        if (barangay) {
            modalTitle.textContent = 'Edit Barangay';
            formAction.value = 'edit';
            barangayId.value = barangay.id;
            barangayName.value = barangay.name || '';
            barangayZone.value = barangay.zone || '';
            barangayPopulation.value = barangay.population || '';
            barangayArea.value = barangay.area_sqkm || '';
            barangayPoverty.value = barangay.poverty_level || 'moderate';
        } else {
            modalTitle.textContent = 'Add New Barangay';
            formAction.value = 'add';
            document.getElementById('barangayForm').reset();
        }

        modal.classList.add('active');
    }

    function closeBarangayModal() {
        const modal = document.getElementById('barangayModal');
        modal.classList.remove('active');
    }

    function initBarangayModal() {
        const closeBtn = document.getElementById('closeBarangayModal');
        const cancelBtn = document.getElementById('cancelBarangayModal');
        const modalOverlay = document.getElementById('barangayModal');
        const confirmSaveBtn = document.getElementById('confirmSaveBarangay');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeBarangayModal);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeBarangayModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === this) closeBarangayModal();
            });
        }

        if (confirmSaveBtn) {
            confirmSaveBtn.addEventListener('click', function() {
                const form = document.getElementById('barangayForm');
                if (form.checkValidity()) {
                    const action = document.getElementById('barangayFormAction').value;
                    const message = action === 'add' ? 'Are you sure you want to add this barangay?' : 'Are you sure you want to update this barangay?';
                    pendingBarangayForm = form;
                    openBarangayConfirmModal(message);
                } else {
                    form.reportValidity();
                }
            });
        }
    }

    /* ===========================================================
       3. CONFIRMATION MODAL
    ============================================================ */
    function openBarangayConfirmModal(message) {
        const modal = document.getElementById('barangayConfirmModal');
        const messageEl = document.getElementById('barangayConfirmMessage');
        messageEl.textContent = message;
        modal.classList.add('active');
    }

    function closeBarangayConfirmModal() {
        const modal = document.getElementById('barangayConfirmModal');
        modal.classList.remove('active');
        pendingBarangayForm = null;
        pendingBarangayDelete = null;
    }

    function initBarangayConfirmModal() {
        const closeBtn = document.getElementById('closeBarangayConfirmModal');
        const noBtn = document.getElementById('barangayNoBtn');
        const yesBtn = document.getElementById('barangayYesBtn');
        const modalOverlay = document.getElementById('barangayConfirmModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeBarangayConfirmModal);
        }
        if (noBtn) {
            noBtn.addEventListener('click', closeBarangayConfirmModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === this) closeBarangayConfirmModal();
            });
        }

        if (yesBtn) {
            yesBtn.addEventListener('click', function() {
                if (pendingBarangayForm) {
                    pendingBarangayForm.submit();
                } else if (pendingBarangayDelete) {
                    pendingBarangayDelete.submit();
                }
                closeBarangayConfirmModal();
            });
        }
    }

    function openViewBarangayModal(barangay) {
        const modal = document.getElementById('viewBarangayModal');
        const content = document.getElementById('viewBarangayContent');
        
        content.innerHTML = `
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Barangay Name</label>
                <div style="font-size:16px;font-weight:600;color:#111827;">${barangay.name}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Zone / District</label>
                <div style="font-size:14px;color:#111827;">${barangay.zone}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Population</label>
                <div style="font-size:14px;color:#111827;">${barangay.population.toLocaleString()}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Area (sq km)</label>
                <div style="font-size:14px;color:#111827;">${barangay.area_sqkm}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Poverty Level</label>
                <div style="font-size:14px;color:#111827;text-transform:capitalize;">${barangay.poverty_level}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Active Programs</label>
                <div style="font-size:14px;color:#111827;">${barangay.program_count}</div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    function closeViewBarangayModal() {
        const modal = document.getElementById('viewBarangayModal');
        modal.classList.remove('active');
    }

    function initViewBarangayModal() {
        const closeBtn = document.getElementById('closeViewBarangayModal');
        const closeBtn2 = document.getElementById('closeViewBarangayBtn');
        const modalOverlay = document.getElementById('viewBarangayModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeViewBarangayModal);
        }
        if (closeBtn2) {
            closeBtn2.addEventListener('click', closeViewBarangayModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === this) closeViewBarangayModal();
            });
        }
    }

    /* ===========================================================
       4. SUCCESS TOAST
    ============================================================ */
    function initBarangaySuccessToast() {
        const toast = document.getElementById('barangaySuccessToast');
        if (toast) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = '0.3s ease';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }
    }

    /* ===========================================================
       5. BOOT — Run after DOM is ready
    ============================================================ */
    function boot() {
        initBarangayTable();
        initBarangayModal();
        initBarangayConfirmModal();
        initViewBarangayModal();
        initBarangaySuccessToast();
    }

    /* Real-time refresh: reload page every 30 seconds for updated data */
    function refreshPage() {
        window.location.reload();
    }
    setInterval(refreshPage, 30000);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
