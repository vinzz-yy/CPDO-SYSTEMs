
/* ============================================================
   DEVELOPMENT PROGRAMS — Table, Search, Pagination, Modal
   ============================================================ */
(function () {
    'use strict';

    // Program data from PHP (for edit)
    window.CPDO_PROGRAMS = window.CPDO_PROGRAMS || [];
    let pendingForm = null;
    let pendingDelete = null;

    /* ===========================================================
       1. PROGRAM TABLE — Search, Status Filter, Pagination
    ============================================================ */
    function initProgramTable() {
        const searchInput = document.getElementById('progSearch');
        const statusSel   = document.getElementById('progStatus');
        const pagination  = document.getElementById('progPagination');
        const newProgramBtn = document.getElementById('newProgramBtn');
        const kebabBtns = document.querySelectorAll('.kebab-btn');
        const editItems = document.querySelectorAll('.edit-program');
        const viewItems = document.querySelectorAll('.view-program');

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.kebab-menu-container')) {
                document.querySelectorAll('.kebab-dropdown').forEach(dd => {
                    dd.classList.remove('active');
                });
            }
        });

        if (newProgramBtn) {
            newProgramBtn.addEventListener('click', function() {
                openModal();
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
                    const programId = this.getAttribute('data-id');
                    const program = window.CPDO_PROGRAMS.find(p => p.id == programId);
                    if (program) {
                        openModal(program);
                        // Close dropdown
                        this.closest('.kebab-dropdown').classList.remove('active');
                    }
                });
            });
        }

        if (viewItems.length > 0) {
            viewItems.forEach(item => {
                item.addEventListener('click', function() {
                    const programId = this.getAttribute('data-id');
                    const program = window.CPDO_PROGRAMS.find(p => p.id == programId);
                    if (program) {
                        openViewProgramModal(program);
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
            if (searchInput) params.set('search', searchInput.value);
            if (statusSel)   params.set('status', statusSel.value);
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
        if (statusSel) {
            statusSel.addEventListener('change', function () { navigatePage(1); });
        }
    }

    /* ===========================================================
       2. MODAL — Add/Edit Program
    ============================================================ */
    function openModal(program = null) {
        const modal = document.getElementById('programModal');
        const modalTitle = document.getElementById('modalTitle');
        const formAction = document.getElementById('formAction');
        const programId = document.getElementById('programId');
        const programName = document.getElementById('programName');
        const implementingOffice = document.getElementById('implementingOffice');
        const planningAspect = document.getElementById('planningAspect');
        const barangaySelect = document.getElementById('barangaySelect');
        const programStatus = document.getElementById('programStatus');
        const progressPercent = document.getElementById('progressPercent');
        const programDeadline = document.getElementById('programDeadline');

        if (program) {
            modalTitle.textContent = 'Edit Program';
            formAction.value = 'edit';
            programId.value = program.id;
            programName.value = program.name || '';
            implementingOffice.value = program.office || '';
            planningAspect.value = program.aspect || '';
            barangaySelect.value = program.barangay_id || '';
            programStatus.value = program.status || 'in_progress';
            progressPercent.value = program.progress || 0;
            programDeadline.value = program.deadline || '';
        } else {
            modalTitle.textContent = 'Add New Program';
            formAction.value = 'add';
            document.getElementById('programForm').reset();
        }

        modal.classList.add('active');
    }

    function closeModal() {
        const modal = document.getElementById('programModal');
        modal.classList.remove('active');
    }

    function initModal() {
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelModal');
        const modalOverlay = document.getElementById('programModal');
        const confirmSaveBtn = document.getElementById('confirmSaveBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === this) closeModal();
            });
        }

        if (confirmSaveBtn) {
            confirmSaveBtn.addEventListener('click', function() {
                const form = document.getElementById('programForm');
                if (form.checkValidity()) {
                    const action = document.getElementById('formAction').value;
                    const message = action === 'add' ? 'Are you sure you want to add this program?' : 'Are you sure you want to update this program?';
                    pendingForm = form;
                    openConfirmModal(message);
                } else {
                    form.reportValidity();
                }
            });
        }
    }

    /* ===========================================================
       3. CONFIRMATION MODAL
    ============================================================ */
    function openConfirmModal(message) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        messageEl.textContent = message;
        modal.classList.add('active');
    }

    function closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        modal.classList.remove('active');
        pendingForm = null;
        pendingDelete = null;
    }

    function initConfirmModal() {
        const closeBtn = document.getElementById('closeConfirmModal');
        const noBtn = document.getElementById('noBtn');
        const yesBtn = document.getElementById('yesBtn');
        const modalOverlay = document.getElementById('confirmModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeConfirmModal);
        }
        if (noBtn) {
            noBtn.addEventListener('click', closeConfirmModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === this) closeConfirmModal();
            });
        }

        if (yesBtn) {
            yesBtn.addEventListener('click', function() {
                if (pendingForm) {
                    pendingForm.submit();
                } else if (pendingDelete) {
                    pendingDelete.submit();
                }
                closeConfirmModal();
            });
        }
    }

    function openViewProgramModal(program) {
        const modal = document.getElementById('viewProgramModal');
        const content = document.getElementById('viewProgramContent');
        
        content.innerHTML = `
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Program Name</label>
                <div style="font-size:16px;font-weight:600;color:#111827;">${program.name}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Implementing Office</label>
                <div style="font-size:14px;color:#111827;">${program.office}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Planning Aspect</label>
                <div style="font-size:14px;color:#111827;">${program.aspect}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Barangay</label>
                <div style="font-size:14px;color:#111827;">${program.barangay || 'All'}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Status</label>
                <div style="font-size:14px;color:#111827;text-transform:capitalize;">${program.status}</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Progress</label>
                <div style="font-size:14px;color:#111827;">${program.progress}%</div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:13px;color:#6b7280;margin-bottom:4px;">Deadline</label>
                <div style="font-size:14px;color:#111827;">${program.deadline}</div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    function closeViewProgramModal() {
        const modal = document.getElementById('viewProgramModal');
        modal.classList.remove('active');
    }

    function initViewProgramModal() {
        const closeBtn = document.getElementById('closeViewProgramModal');
        const closeBtn2 = document.getElementById('closeViewProgramBtn');
        const modalOverlay = document.getElementById('viewProgramModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeViewProgramModal);
        }
        if (closeBtn2) {
            closeBtn2.addEventListener('click', closeViewProgramModal);
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === this) closeViewProgramModal();
            });
        }
    }

    /* ===========================================================
       4. SUCCESS TOAST
    ============================================================ */
    function initSuccessToast() {
        const toast = document.getElementById('successToast');
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
        initProgramTable();
        initModal();
        initConfirmModal();
        initViewProgramModal();
        initSuccessToast();
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

