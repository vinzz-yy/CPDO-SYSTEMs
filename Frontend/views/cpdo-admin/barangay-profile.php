<?php
require_once '../../../Backend/middleware/auth.php'; // Check authentication
require_once '../../../Backend/db/conn.php';
require_once '../../../Backend/controllers/cpdo-admin/barangay-profilecontrollers.php';

$successMessage = null;
if (isset($_SESSION['barangay_success'])) {
    $successMessage = $_SESSION['barangay_success'];
    unset($_SESSION['barangay_success']);
}

$kpis       = getBarangayKPIs($conn);
$search = $_GET['search'] ?? '';
$zone = $_GET['zone'] ?? '';
$poverty = $_GET['poverty'] ?? '';
$classification = $_GET['classification'] ?? '';
$barangays  = getBarangayDirectory($conn, $search, $zone, $poverty, $classification, (int)($_GET['page'] ?? 1));
$zones      = getZones($conn);

// Determine active filter pill
$activeFilter = 'all';
if ($poverty === 'high') {
    $activeFilter = 'high-risk';
} elseif ($classification === 'urban') {
    $activeFilter = 'urban';
} elseif ($classification === 'rural') {
    $activeFilter = 'rural';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Profiles — CPDO Program Monitoring System</title>

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
        .profile-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .profile-badge.complete { background: #dcfce7; color: #166534; }
        .profile-badge.incomplete { background: #fef3c7; color: #92400e; }
        .profile-badge.not-started { background: #fee2e2; color: #991b1b; }
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
        .form-input, .form-select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
        }
        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #3b82f6;
        }
        .form-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 24px;
        }
        .btn-cancel, .btn-no {
            padding: 10px 16px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 8px;
            cursor: pointer;
        }
        .btn-submit, .btn-yes {
            padding: 10px 16px;
            border: none;
            background: #10b981;
            color: white;
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

            <!-- Barangay Directory -->
            <section class="programs-section">
                <div class="programs-header">
                    <span class="programs-title">Barangay Directory (<?= $barangays['total'] ?> barangays)</span>
                    <div class="table-controls">
                        <div class="search-input-wrap">
                            <span class="search-icon"><i class="fas fa-search"></i></span>
                            <input type="text" id="bgySearch" placeholder="Search barangay..."
                                   value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
                        </div>
                        <select class="filter-select" id="bgyZone">
                            <option value="">All Zones</option>
                            <?php foreach ($zones as $zone): ?>
                            <option value="<?= htmlspecialchars($zone['zone']) ?>" <?= (($_GET['zone'] ?? '') === $zone['zone']) ? 'selected' : '' ?>>
                                <?= htmlspecialchars($zone['zone']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <button class="icon-btn" title="Add Barangay" id="newBarangayBtn">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="programs-table-wrap">
                    <table class="data-table" id="barangayTable">
                        <thead>
                            <tr>
                                <th colspan="7"></th>
                                <th colspan="2">
                                    <div class="filter-pills" style="margin:0;justify-content:center">
                                        <button class="filter-pill <?= $activeFilter === 'all' ? 'active' : '' ?>" data-filter="all">All</button>
                                        <button class="filter-pill <?= $activeFilter === 'urban' ? 'active' : '' ?>" data-filter="urban">Urban</button>
                                        <button class="filter-pill <?= $activeFilter === 'rural' ? 'active' : '' ?>" data-filter="rural">Rural</button>
                                        <button class="filter-pill <?= $activeFilter === 'high-risk' ? 'active' : '' ?>" data-filter="high-risk">High Risk</button>
                                    </div>
                                </th>
                            </tr>
                            <tr>
                                <th><input type="checkbox" id="selectAll"></th>
                                <th>Barangay Name</th>
                                <th>Zone / District</th>
                                <th>Population</th>
                                <th>Classification</th>
                                <th>Poverty Level</th>
                                <th>Active Programs</th>
                                <th>Profile Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="barangayBody">
                            <?php foreach ($barangays['data'] as $bgy):
                                $povertyColor = match($bgy['poverty_level']) {
                                    'low'    => '#10b981',
                                    'moderate' => '#f59e0b',
                                    'high'   => '#ef4444',
                                    default  => '#6b7280',
                                };
                                $profileStatus = $bgy['program_count'] > 0 ? ($bgy['program_count'] >= 5 ? 'complete' : 'incomplete') : 'not-started';
                            ?>
                            <tr>
                                <td><input type="checkbox" class="bgy-checkbox"></td>
                                <td>
                                    <div style="display:flex;flex-direction:column">
                                        <strong><?= htmlspecialchars($bgy['name']) ?></strong>
                                        <small style="color:#6b7280">ID: BRY-<?= str_pad($bgy['id'], 3, '0', STR_PAD_LEFT) ?></small>
                                    </div>
                                </td>
                                <td><?= htmlspecialchars($bgy['zone']) ?></td>
                                <td><?= number_format($bgy['population']) ?></td>
                                <td>
                                    <span class="badge badge-success">
                                        <i class="fas fa-circle" style="font-size:7px"></i>
                                        Urban
                                    </span>
                                </td>
                                <td>
                                    <div style="display:flex;align-items:center;gap:8px">
                                        <div style="width:60px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                                            <div style="width:<?= $bgy['poverty_level'] === 'low' ? '25' : ($bgy['poverty_level'] === 'moderate' ? '55' : '85') ?>%;height:100%;background:<?= $povertyColor ?>"></div>
                                        </div>
                                        <span style="color:<?= $povertyColor ?>;font-weight:600;text-transform:capitalize">
                                            <?= htmlspecialchars($bgy['poverty_level']) ?>
                                        </span>
                                    </div>
                                </td>
                                <td><?= $bgy['program_count'] ?></td>
                                <td>
                                    <span class="profile-badge <?= $profileStatus ?>">
                                        <?= ucfirst(str_replace('-', ' ', $profileStatus)) ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="kebab-menu-container">
                                        <button class="kebab-btn" data-id="<?= $bgy['id'] ?>">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <div class="kebab-dropdown" data-id="<?= $bgy['id'] ?>">
                                            <div class="kebab-dropdown-item view-barangay" data-id="<?= $bgy['id'] ?>">
                                                <i class="fas fa-eye"></i> View
                                            </div>
                                            <div class="kebab-dropdown-item edit-barangay" data-id="<?= $bgy['id'] ?>">
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
                        Showing <?= count($barangays['data']) ?> of <?= $barangays['total'] ?> entries
                    </span>
                    <div class="pagination" id="bgyPagination"
                         data-pages="<?= $barangays['pages'] ?>"
                         data-current="<?= $barangays['page'] ?>">
                    </div>
                </div>
            </section>
        </main>
    </div>
</div>

<!-- Add/Edit Barangay Modal -->
<div class="modal-overlay" id="barangayModal">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title" id="barangayModalTitle">Add New Barangay</span>
            <button class="modal-close" id="closeBarangayModal">&times;</button>
        </div>
        <form method="POST" id="barangayForm">
            <input type="hidden" name="action" id="barangayFormAction" value="add">
            <input type="hidden" name="id" id="barangayId">

            <div class="form-group">
                <label class="form-label">Barangay Name</label>
                <input type="text" name="name" id="barangayName" class="form-input" required>
            </div>

            <div class="form-group">
                <label class="form-label">Zone / District</label>
                <select name="zone" id="barangayZone" class="form-select" required>
                    <option value="">Select Zone</option>
                    <?php foreach ($zones as $zone): ?>
                    <option value="<?= htmlspecialchars($zone['zone']) ?>"><?= htmlspecialchars($zone['zone']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Population</label>
                <input type="number" name="population" id="barangayPopulation" class="form-input" min="0" required>
            </div>

            <div class="form-group">
                <label class="form-label">Area (sq km)</label>
                <input type="number" name="area_sqkm" id="barangayArea" class="form-input" step="0.01" min="0" required>
            </div>

            <div class="form-group">
                <label class="form-label">Poverty Level</label>
                <select name="poverty_level" id="barangayPoverty" class="form-select" required>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                </select>
            </div>

            <div class="form-buttons">
                <button type="button" class="btn-cancel" id="cancelBarangayModal">Cancel</button>
                <button type="button" class="btn-submit" id="confirmSaveBarangay">Save Barangay</button>
            </div>
        </form>
    </div>
</div>

<!-- Confirmation Modal -->
<div class="modal-overlay" id="barangayConfirmModal">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title" id="barangayConfirmTitle">Confirm</span>
            <button class="modal-close" id="closeBarangayConfirmModal">&times;</button>
        </div>
        <div class="confirm-message" id="barangayConfirmMessage">Are you sure you want to do this?</div>
        <div class="form-buttons">
            <button type="button" class="btn-no" id="barangayNoBtn">No</button>
            <button type="button" class="btn-yes" id="barangayYesBtn">Yes</button>
        </div>
    </div>
</div>

<!-- View Barangay Modal -->
<div class="modal-overlay" id="viewBarangayModal">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title">Barangay Details</span>
            <button class="modal-close" id="closeViewBarangayModal">&times;</button>
        </div>
        <div id="viewBarangayContent"></div>
        <div class="form-buttons">
            <button type="button" class="btn-no" id="closeViewBarangayBtn">Close</button>
        </div>
    </div>
</div>

<?php if ($successMessage): ?>
    <div class="success-toast" id="barangaySuccessToast">
        <i class="fas fa-check-circle" style="margin-right:8px"></i>
        <?= htmlspecialchars($successMessage) ?>
    </div>
<?php endif; ?>

<!-- Inject Barangay Data -->
<script>
    window.CPDO_BARANGAYS = <?= json_encode($barangays['data']) ?>;
</script>

<!-- Component Scripts -->
<script src="../../scripts/components/sidebar.js"></script>
<script src="../../scripts/components/header.js"></script>

<!-- Page Script -->
<script src="../../scripts/functions/barangay-profile.js"></script>

</body>
</html>
