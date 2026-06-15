<?php
require_once '../../../Backend/middleware/auth.php'; // Check authentication
require_once '../../../Backend/db/conn.php';
require_once '../../../Backend/controllers/cpdo-admin/development-programscontrollers.php';

$successMessage = null;
if (isset($_SESSION['program_success'])) {
    $successMessage = $_SESSION['program_success'];
    unset($_SESSION['program_success']);
}

$kpis       = getProgramKPIs($conn);
$programs   = getProgramList($conn, $_GET['search'] ?? '', $_GET['status'] ?? '', (int)($_GET['page'] ?? 1));
$barangays  = getBarangaysForSelect($conn);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Development Programs — CPDO Program Monitoring System</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Component CSS -->
    <link rel="stylesheet" href="../../css/components/sidebar.css">
    <link rel="stylesheet" href="../../css/components/header.css">
    <link rel="stylesheet" href="../../css/components/sections.css">

    <!-- Page CSS -->
    <link rel="stylesheet" href="../../css/dashboard-overview.css">

    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: var(--bg-primary); color: var(--text-primary); }
        a { text-decoration: none; }
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s;
        }
        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        .modal {
            background: white;
            border-radius: 12px;
            padding: 24px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .modal-title {
            font-size: 18px;
            font-weight: 600;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6b7280;
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
        }
        .form-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
        }
        .form-input:focus {
            outline: none;
            border-color: #3b82f6;
        }
        .form-select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
        }
        .form-select:focus {
            outline: none;
            border-color: #3b82f6;
        }
        .form-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 24px;
        }
        .btn-cancel {
            padding: 10px 16px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 8px;
            cursor: pointer;
        }
        .btn-submit {
            padding: 10px 16px;
            border: none;
            background: #10b981;
            color: white;
            border-radius: 8px;
            cursor: pointer;
        }
        .btn-yes {
            padding: 10px 16px;
            border: none;
            background: #10b981;
            color: white;
            border-radius: 8px;
            cursor: pointer;
        }
        .btn-no {
            padding: 10px 16px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 8px;
            cursor: pointer;
        }
        .success-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .confirm-message {
            font-size: 15px;
            margin-bottom: 20px;
            text-align: center;
        }
        /* Kebab Menu Styles */
        .kebab-menu-container {
            position: relative;
            display: inline-block;
        }
        .kebab-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 8px;
            color: #6b7280;
            border-radius: 4px;
        }
        .kebab-btn:hover {
            background-color: #f3f4f6;
        }
        .kebab-dropdown {
            position: absolute;
            right: 0;
            top: 100%;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 150px;
            z-index: 100;
            display: none;
        }
        .kebab-dropdown.active {
            display: block;
        }
        .kebab-dropdown-item {
            padding: 10px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: #374151;
        }
        .kebab-dropdown-item:hover {
            background-color: #f3f4f6;
        }
    </style>
</head>
<body>

<div class="sidebar-overlay" id="sidebarOverlay"></div>

<div class="app-wrapper">
    <?php include '../../components/sidebar.php'; ?>

    <div class="main-content" id="mainContent">
        <?php include '../../components/header.php'; ?>

        <main class="page-body">
            <!-- KPI Cards -->
            <section class="kpi-section">
                <div class="kpi-grid">
                    <?php foreach ($kpis as $kpi): ?>
                    <div class="kpi-card kpi-<?= htmlspecialchars($kpi['color']) ?>">
                        <div class="kpi-top">
                            <span class="kpi-value"><?= htmlspecialchars($kpi['value']) ?></span>
                            <span class="kpi-trend <?= $kpi['trend'] === 'up' ? 'up' : 'down' ?>">
                                <i class="fas fa-<?= $kpi['trend'] === 'up' ? 'arrow' : 'arrow' ?>-<?= $kpi['trend'] === 'up' ? 'up' : 'down' ?>"></i>
                                <?= htmlspecialchars($kpi['change']) ?>
                            </span>
                        </div>
                        <div class="kpi-label"><?= htmlspecialchars($kpi['label']) ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </section>

            <!-- Development Programs Table -->
            <section class="programs-section">
                <div class="programs-header">
                    <span class="programs-title">Development Programs</span>
                    <div class="table-controls">
                        <div class="search-input-wrap">
                            <span class="search-icon"><i class="fas fa-search"></i></span>
                            <input type="text" id="progSearch" placeholder="Search programs..."
                                   value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
                        </div>
                        <select class="filter-select" id="progStatus">
                            <option value="">All Status</option>
                            <option value="in-progress" <?= ($_GET['status'] ?? '') === 'in-progress' ? 'selected' : '' ?>>In Progress</option>
                            <option value="completed" <?= ($_GET['status'] ?? '') === 'completed' ? 'selected' : '' ?>>Completed</option>
                            <option value="delayed" <?= ($_GET['status'] ?? '') === 'delayed' ? 'selected' : '' ?>>Delayed</option>
                        </select>
                        <button class="icon-btn" title="New Program" id="newProgramBtn">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="programs-table-wrap">
                    <table class="data-table" id="programsTable">
                        <thead>
                            <tr>
                                <th>Program Name</th>
                                <th>Implementing Office</th>
                                <th>Planning Aspect</th>
                                <th>Barangay</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Deadline</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="programsBody">
                            <?php foreach ($programs['data'] as $prog):
                                $statusClass = match($prog['status']) {
                                    'completed'   => 'badge-success',
                                    'in-progress' => 'badge-info',
                                    'delayed'     => 'badge-danger',
                                    default       => 'badge-pending',
                                };
                                $barClass = match($prog['status']) {
                                    'completed'   => 'success',
                                    'in-progress' => 'info',
                                    'delayed'     => 'danger',
                                    default       => 'warning',
                                };
                            ?>
                            <tr>
                                <td><?= htmlspecialchars($prog['name']) ?></td>
                                <td><?= htmlspecialchars($prog['office']) ?></td>
                                <td><?= htmlspecialchars($prog['aspect']) ?></td>
                                <td><?= htmlspecialchars($prog['barangay'] ?? 'All') ?></td>
                                <td>
                                    <span class="badge <?= $statusClass ?>">
                                        <i class="fas fa-circle" style="font-size:7px"></i>
                                        <?= ucfirst($prog['status']) ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="prog-progress-wrap">
                                        <div class="progress-bar-wrap" style="flex:1">
                                            <div class="progress-bar-fill <?= $barClass ?>"
                                                 style="width:<?= $prog['progress'] ?>%"></div>
                                        </div>
                                        <span class="prog-progress-label"><?= $prog['progress'] ?>%</span>
                                    </div>
                                </td>
                                <td><?= htmlspecialchars($prog['deadline']) ?></td>
                                <td>
                                    <div class="kebab-menu-container">
                                        <button class="kebab-btn" data-id="<?= $prog['id'] ?>">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <div class="kebab-dropdown" data-id="<?= $prog['id'] ?>">
                                            <div class="kebab-dropdown-item view-program" data-id="<?= $prog['id'] ?>">
                                                <i class="fas fa-eye"></i> View
                                            </div>
                                            <div class="kebab-dropdown-item edit-program" data-id="<?= $prog['id'] ?>">
                                                <i class="fas fa-edit"></i> Update
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div class="programs-footer">
                    <span id="progEntries">
                        Showing <?= count($programs['data']) ?> of <?= $programs['total'] ?> entries
                    </span>
                    <div class="pagination" id="progPagination"
                         data-pages="<?= $programs['pages'] ?>"
                         data-current="<?= $programs['page'] ?>">
                    </div>
                </div>
            </section>
        </main>
    </div>
</div>

<!-- Add Program Modal -->
<div class="modal-overlay" id="programModal">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title" id="modalTitle">Add New Program</span>
            <button class="modal-close" id="closeModal">&times;</button>
        </div>
        <form method="POST" id="programForm">
            <input type="hidden" name="action" id="formAction" value="add">
            <input type="hidden" name="id" id="programId">

            <div class="form-group">
                <label class="form-label">Program Name</label>
                <input type="text" name="name" id="programName" class="form-input" required>
            </div>

            <div class="form-group">
                <label class="form-label">Implementing Office</label>
                <input type="text" name="implementing_office" id="implementingOffice" class="form-input" required>
            </div>

            <div class="form-group">
                <label class="form-label">Planning Aspect</label>
                <input type="text" name="planning_aspect" id="planningAspect" class="form-input" required>
            </div>

            <div class="form-group">
                <label class="form-label">Barangay</label>
                <select name="barangay_id" id="barangaySelect" class="form-select">
                    <option value="">All Barangays</option>
                    <?php foreach ($barangays as $bgy): ?>
                        <option value="<?= $bgy['id'] ?>"><?= htmlspecialchars($bgy['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" id="programStatus" class="form-select" required>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Progress (%)</label>
                <input type="number" name="progress" id="progressPercent" class="form-input" min="0" max="100" value="0" required>
            </div>

            <div class="form-group">
                <label class="form-label">Deadline</label>
                <input type="date" name="deadline" id="programDeadline" class="form-input" required>
            </div>

            <div class="form-buttons">
                <button type="button" class="btn-cancel" id="cancelModal">Cancel</button>
                <button type="button" class="btn-submit" id="confirmSaveBtn">Save Program</button>
            </div>
        </form>
    </div>
</div>

<!-- Confirmation Modal -->
<div class="modal-overlay" id="confirmModal">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title" id="confirmTitle">Confirm</span>
            <button class="modal-close" id="closeConfirmModal">&times;</button>
        </div>
        <div class="confirm-message" id="confirmMessage">Are you sure you want to do this?</div>
        <div class="form-buttons">
            <button type="button" class="btn-no" id="noBtn">No</button>
            <button type="button" class="btn-yes" id="yesBtn">Yes</button>
        </div>
    </div>
</div>

<!-- View Program Modal -->
<div class="modal-overlay" id="viewProgramModal">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title">Program Details</span>
            <button class="modal-close" id="closeViewProgramModal">&times;</button>
        </div>
        <div id="viewProgramContent"></div>
        <div class="form-buttons">
            <button type="button" class="btn-no" id="closeViewProgramBtn">Close</button>
        </div>
    </div>
</div>

<?php if ($successMessage): ?>
    <div class="success-toast" id="successToast">
        <i class="fas fa-check-circle" style="margin-right:8px"></i>
        <?= htmlspecialchars($successMessage) ?>
    </div>
<?php endif; ?>

<!-- Inject Program Data -->
<script>
    window.CPDO_PROGRAMS = <?= json_encode($programs['data']) ?>;
</script>

<!-- Component Scripts -->
<script src="../../scripts/components/sidebar.js"></script>
<script src="../../scripts/components/header.js"></script>

<!-- Page Script -->
<script src="../../scripts/functions/development-programs.js"></script>

</body>
</html>
