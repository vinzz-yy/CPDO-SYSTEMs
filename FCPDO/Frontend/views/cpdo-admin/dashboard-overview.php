<?php
// require_once '../../../Backend/middleware/auth.php'; // Check authentication
require_once '../../../Backend/db/conn.php';
require_once '../../../Backend/controllers/cpdo-admin/dashboard-overviewcontrollers.php';

$kpis     = getKPIStats($conn);
$programs = getDevelopmentPrograms($conn,
    $_GET['search']  ?? '',
    $_GET['status']  ?? '',
    (int)($_GET['page'] ?? 1)
);
$alerts   = getAlerts($conn);
$insights = getInsights($conn);

/* ---- Chart data from DB ---- */
$chartData = getChartData($conn);

/* ---- Barangay list for map dropdown ---- */
$barangayList = getBarangayList($conn);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Overview — CPDO Program Monitoring System</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

    <!-- Component CSS (defines CSS variables + shared styles) -->
    <link rel="stylesheet" href="../../css/components/sidebar.css">
    <link rel="stylesheet" href="../../css/components/header.css">
    <link rel="stylesheet" href="../../css/components/sections.css">

    <!-- Page CSS -->
    <link rel="stylesheet" href="../../css/dashboard-overview.css">

    
</head>
<body>

<!-- Mobile overlay (closes sidebar on small screens) -->
<div class="sidebar-overlay" id="sidebarOverlay"></div>

<!-- App shell -->
<div class="app-wrapper">

    <!-- ========== SIDEBAR ========== -->
    <?php include '../../components/sidebar.php'; ?>

    <!-- ========== MAIN CONTENT ========== -->
    <div class="main-content" id="mainContent">

        <!-- ========== HEADER ========== -->
        <?php include '../../components/header.php'; ?>

        <!-- ========== DASHBOARD BODY ========== -->
        <main class="page-body">

            <!-- ===== KPI CARDS ===== -->
            <section class="kpi-section">
                <div class="kpi-grid">
                    <?php foreach ($kpis as $key => $kpi): ?>
                    <div class="kpi-card kpi-<?= htmlspecialchars($kpi['color']) ?>">
                        <div class="kpi-top">
                            <span class="kpi-value"><?= htmlspecialchars($kpi['value']) ?></span>
                            <span class="kpi-trend <?= $kpi['trend'] === 'up' ? 'up' : 'down' ?>">
                                <i class="fas <?= $kpi['trend'] === 'up' ? 'fa-arrow-up' : 'fa-arrow-down' ?>"></i>
                                <?= htmlspecialchars($kpi['change']) ?>
                            </span>
                        </div>
                        <div class="kpi-label"><?= htmlspecialchars($kpi['label']) ?></div>
                        <!-- Mini sparkline drawn by JS -->
                        <svg class="kpi-spark" id="spark-<?= $key ?>"
                             data-points='<?= json_encode($kpi['spark']) ?>'
                             data-trend="<?= $kpi['trend'] ?>"></svg>
                    </div>
                    <?php endforeach; ?>
                </div>
            </section>

            <!-- ===== MAIN 3-COLUMN GRID ===== -->
            <section class="dashboard-grid">

                <!-- ---- MAP PANEL ---- -->
                <div class="map-panel">
                    <div class="map-toolbar">
                        <select class="map-select" id="barangaySelect" title="Select Barangay">
                            <option value="all">All <?= count($barangayList) ?> barangays</option>
                            <?php foreach ($barangayList as $bgy): ?>
                            <option value="<?= htmlspecialchars(strtolower($bgy['name'])) ?>">
                                <?= htmlspecialchars($bgy['name']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <select class="map-select" id="layerSelect" title="Select Layer">
                            <option value="economic">economic</option>
                            <option value="program">program</option>
                            <option value="poverty">poverty level</option>
                        </select>
                    </div>
                    <div id="clupMap"></div>
                    <div class="map-legend">
                        <span class="legend-title">Development Performance</span>
                        <span class="legend-item"><span class="legend-dot high"></span> High</span>
                        <span class="legend-item"><span class="legend-dot moderate"></span> Moderate</span>
                        <span class="legend-item"><span class="legend-dot attention"></span> Needs attention</span>
                    </div>
                </div>

                <!-- ---- CHARTS COLUMN ---- -->
                <div class="charts-col">
                    <div class="chart-card">
                        <div class="chart-card-title">Business Growth Trend (Monthly)</div>
                        <canvas class="chart-canvas" id="chartBusiness" height="110"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title">Investment Inflow</div>
                        <canvas class="chart-canvas" id="chartInvestment" height="100"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title">Employment Rate Trend</div>
                        <canvas class="chart-canvas" id="chartEmployment" height="100"></canvas>
                    </div>
                    <div class="chart-card">
                        <div class="chart-card-title">Agricultural Production</div>
                        <canvas class="chart-canvas" id="chartAgri" height="100"></canvas>
                    </div>
                </div>

                <!-- ---- INSIGHTS + ALERTS COLUMN ---- -->
                <div class="insights-col">

                    <!-- Insight Summary -->
                    <div class="insights-card">
                        <div class="insights-header">
                            <span class="insights-title">Insight Summary</span>
                            <button class="icon-btn" title="More options"><i class="fas fa-ellipsis-h"></i></button>
                        </div>

                        <div class="insight-section top">
                            <div class="insight-section-label top">Tap 5 Performing Barangays</div>
                            <ul class="insight-list">
                                <?php foreach (array_slice($insights['top_barangays'], 0, 3) as $b): ?>
                                <li><?= htmlspecialchars($b) ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>

                        <div class="insight-section bottom">
                            <div class="insight-section-label bottom">Bottom 5 Performing Barangays</div>
                            <ul class="insight-list">
                                <?php foreach (array_slice($insights['bottom_barangays'], 0, 3) as $b): ?>
                                <li><?= htmlspecialchars($b) ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>

                        <div class="insight-section risk">
                            <div class="insight-section-label risk">Programs at Risk</div>
                            <ul class="insight-list">
                                <?php foreach ($insights['programs_at_risk'] as $r): ?>
                                <li><?= htmlspecialchars($r) ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>

                        <div class="insight-section">
                            <div class="insight-section-label" style="color:var(--text-secondary)">Economic Trend Summary</div>
                            <p class="trend-summary-text" style="padding:4px 0 0"><?= htmlspecialchars($insights['trend_summary']) ?></p>
                        </div>
                    </div>

                    <!-- Alerts -->
                    <div class="alerts-card">
                        <div class="alerts-header">
                            <span class="alerts-title">Alerts</span>
                            <button class="icon-btn" title="More options"><i class="fas fa-ellipsis-h"></i></button>
                        </div>
                        <div class="alert-list">
                            <?php foreach ($alerts as $alert): ?>
                            <div class="alert-item">
                                <div class="alert-icon-wrap <?= $alert['type'] ?>">
                                    <i class="fas <?= $alert['icon'] ?>"></i>
                                </div>
                                <div class="alert-body">
                                    <div class="alert-title"><?= htmlspecialchars($alert['title']) ?></div>
                                    <div class="alert-desc"><?= htmlspecialchars($alert['desc']) ?></div>
                                </div>
                                <?php if ($alert['count'] > 0): ?>
                                <span class="alert-badge <?= $alert['type'] ?>"><?= $alert['count'] ?></span>
                                <?php else: ?>
                                <span class="alert-badge hidden">0</span>
                                <?php endif; ?>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                </div><!-- /insights-col -->
            </section><!-- /dashboard-grid -->

            <!-- ===== DEVELOPMENT PROGRAMS TABLE ===== -->
            <section class="programs-section">
                <div class="programs-header">
                    <span class="programs-title">Development Program Monitoring</span>
                    <div class="table-controls">
                        <div class="search-input-wrap">
                            <span class="search-icon"><i class="fas fa-search"></i></span>
                            <input type="text" id="progSearch" placeholder="Search programs..."
                                   value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
                        </div>
                        <select class="filter-select" id="progStatus">
                            <option value="">All Status</option>
                            <option value="in-progress" <?= (($_GET['status'] ?? '') === 'in-progress') ? 'selected' : '' ?>>In Progress</option>
                            <option value="completed"   <?= (($_GET['status'] ?? '') === 'completed')   ? 'selected' : '' ?>>Completed</option>
                            <option value="delayed"     <?= (($_GET['status'] ?? '') === 'delayed')     ? 'selected' : '' ?>>Delayed</option>
                            <option value="pending"     <?= (($_GET['status'] ?? '') === 'pending')     ? 'selected' : '' ?>>Pending</option>
                        </select>
                        <button class="icon-btn" title="More options"><i class="fas fa-ellipsis-h"></i></button>
                    </div>
                </div>

                <div class="programs-table-wrap">
                    <table class="data-table" id="programsTable">
                        <thead>
                            <tr>
                                <th data-col="name">Program Name <i class="fas fa-sort sort-icon"></i></th>
                                <th data-col="office">Implementing Office <i class="fas fa-sort sort-icon"></i></th>
                                <th data-col="aspect">Planning Aspect <i class="fas fa-sort sort-icon"></i></th>
                                <th data-col="status">Status <i class="fas fa-sort sort-icon"></i></th>
                                <th data-col="progress">Progress bar (%) <i class="fas fa-sort sort-icon"></i></th>
                                <th data-col="deadline">Deadline <i class="fas fa-sort sort-icon"></i></th>
                            </tr>
                        </thead>
                        <tbody id="programsBody">
                            <?php foreach ($programs['data'] as $prog):
                                $statusClass = match($prog['status']) {
                                    'completed'   => 'badge-success',
                                    'in-progress' => 'badge-info',
                                    'delayed'     => 'badge-danger',
                                    'pending'     => 'badge-pending',
                                    default       => 'badge-pending',
                                };
                                $barClass = match($prog['status']) {
                                    'completed'   => 'success',
                                    'in-progress' => 'info',
                                    'delayed'     => 'danger',
                                    default       => 'warning',
                                };
                                $statusLabel = match($prog['status']) {
                                    'in-progress' => 'In progress',
                                    'completed'   => 'Completed',
                                    'delayed'     => 'Delayed',
                                    'pending'     => 'Pending',
                                    default       => ucfirst($prog['status']),
                                };
                            ?>
                            <tr>
                                <td><?= htmlspecialchars($prog['name']) ?></td>
                                <td><?= htmlspecialchars($prog['office']) ?></td>
                                <td><?= htmlspecialchars($prog['aspect']) ?></td>
                                <td>
                                    <span class="badge <?= $statusClass ?>">
                                        <i class="fas fa-circle" style="font-size:7px"></i>
                                        <?= $statusLabel ?>
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
                        <!-- Built by JS -->
                    </div>
                </div>
            </section>

        </main><!-- /page-body -->
    </div><!-- /main-content -->
</div><!-- /app-wrapper -->

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Component scripts -->
<script src="../../scripts/components/sidebar.js"></script>
<script src="../../scripts/components/header.js"></script>

<!-- Inject real DB data for JS charts and map -->
<script>
    window.CPDO_CHARTS = <?= json_encode($chartData, JSON_UNESCAPED_UNICODE) ?>;
    window.CPDO_BARANGAYS = <?= json_encode($barangayList, JSON_UNESCAPED_UNICODE) ?>;
</script>

<!-- Dashboard logic (charts + map + table) -->
<script src="../../scripts/functions/dashboard-overview.js"></script>

</body>
</html>
