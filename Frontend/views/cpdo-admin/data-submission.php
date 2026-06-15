<?php
require_once '../../../Backend/middleware/auth.php'; // Check authentication
require_once '../../../Backend/db/conn.php';
require_once '../../../Backend/controllers/cpdo-admin/data-submissioncontrollers.php';

$kpis          = getSubmissionKPIs($conn);
$submissions   = getSubmissionsList($conn, $_GET['search'] ?? '', $_GET['status'] ?? '', (int)($_GET['page'] ?? 1));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Submissions — CPDO Program Monitoring System</title>

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
        .filter-pills {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        .filter-pill {
            padding: 6px 16px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        .filter-pill.active {
            background: #10b981;
            color: white;
            border-color: #10b981;
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

            <!-- Submissions Table -->
            <section class="programs-section">
                <div class="programs-header">
                    <span class="programs-title">Data Submissions (<?= $submissions['total'] ?>)</span>
                    <div class="table-controls">
                        <div class="search-input-wrap">
                            <span class="search-icon"><i class="fas fa-search"></i></span>
                            <input type="text" id="subSearch" placeholder="Search submissions..."
                                   value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
                        </div>
                        <select class="filter-select" id="subStatus">
                            <option value="">All Status</option>
                            <option value="pending" <?= (($_GET['status'] ?? '') === 'pending') ? 'selected' : '' ?>>Pending</option>
                            <option value="approved" <?= (($_GET['status'] ?? '') === 'approved') ? 'selected' : '' ?>>Approved</option>
                            <option value="rejected" <?= (($_GET['status'] ?? '') === 'rejected') ? 'selected' : '' ?>>Rejected</option>
                        </select>
                        <button class="icon-btn" title="New Submission">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="programs-table-wrap">
                    <table class="data-table" id="submissionsTable">
                        <thead>
                            <tr>
                                <th colspan="4"></th>
                                <th colspan="2">
                                    <div class="filter-pills" style="margin:0;justify-content:center">
                                        <button class="filter-pill active" data-filter="all">All types</button>
                                        <button class="filter-pill" data-filter="population">Population</button>
                                        <button class="filter-pill" data-filter="economic">Economic</button>
                                        <button class="filter-pill" data-filter="health">Health</button>
                                    </div>
                                </th>
                            </tr>
                            <tr>
                                <th><input type="checkbox" id="selectAll"></th>
                                <th>Barangay</th>
                                <th>Submitted By</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Remarks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="submissionsBody">
                            <?php foreach ($submissions['data'] as $sub):
                                $statusClass = match($sub['status']) {
                                    'approved' => 'badge-success',
                                    'pending'  => 'badge-warning',
                                    'rejected' => 'badge-danger',
                                    default    => 'badge-pending',
                                };
                            ?>
                            <tr>
                                <td><input type="checkbox" class="sub-checkbox"></td>
                                <td>
                                    <div style="display:flex;flex-direction:column">
                                        <strong><?= htmlspecialchars($sub['barangay']) ?></strong>
                                        <small style="color:#6b7280">ID: SUB-<?= str_pad($sub['id'], 3, '0', STR_PAD_LEFT) ?></small>
                                    </div>
                                </td>
                                <td><?= htmlspecialchars($sub['submitted_by']) ?></td>
                                <td><?= htmlspecialchars($sub['submission_date']) ?></td>
                                <td>
                                    <span class="badge <?= $statusClass ?>">
                                        <i class="fas fa-circle" style="font-size:7px"></i>
                                        <?= ucfirst($sub['status']) ?>
                                    </span>
                                </td>
                                <td>
                                    <?= htmlspecialchars($sub['remarks'] ?? '—') ?>
                                </td>
                                <td>
                                    <div class="kebab-menu-container">
                                        <button class="kebab-btn" data-id="<?= $sub['id'] ?>">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <div class="kebab-dropdown" data-id="<?= $sub['id'] ?>">
                                            <div class="kebab-dropdown-item view-submission" data-id="<?= $sub['id'] ?>">
                                                <i class="fas fa-eye"></i> View
                                            </div>
                                            <?php if ($sub['status'] === 'pending'): ?>
                                            <div class="kebab-dropdown-item approve-submission" data-id="<?= $sub['id'] ?>">
                                                <i class="fas fa-check"></i> Approve
                                            </div>
                                            <div class="kebab-dropdown-item reject-submission" data-id="<?= $sub['id'] ?>">
                                                <i class="fas fa-times"></i> Reject
                                            </div>
                                            <?php endif; ?>
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
                        Showing <?= count($submissions['data']) ?> of <?= $submissions['total'] ?> entries
                    </span>
                    <div class="pagination" id="subPagination"
                         data-pages="<?= $submissions['pages'] ?>"
                         data-current="<?= $submissions['page'] ?>">
                    </div>
                </div>
            </section>
        </main>
    </div>
</div>

<!-- Component Scripts -->
<script src="../../scripts/components/sidebar.js"></script>
<script src="../../scripts/components/header.js"></script>

<!-- Hidden Forms for Approve/Reject -->
<form id="approveForm" method="POST" style="display:none">
    <input type="hidden" name="submission_id" id="approveId">
    <input type="hidden" name="submission_action" value="approved">
</form>
<form id="rejectForm" method="POST" style="display:none">
    <input type="hidden" name="submission_id" id="rejectId">
    <input type="hidden" name="submission_action" value="rejected">
</form>

<!-- Inject Submissions Data -->
<script>
    window.CPDO_SUBMISSIONS = <?= json_encode($submissions['data']) ?>;
</script>

<!-- Page Script -->
<script src="../../scripts/functions/data-submission.js"></script>

</body>
</html>
