<?php
require_once '../../../Backend/middleware/auth.php'; // Check authentication
require_once '../../../Backend/db/conn.php';

// Fetch all barangay data for the CLUP map
$clupBarangays = [];
$totalArea     = 0;
$totalPop      = 0;
if ($conn) {
    $stmtB = $conn->query("
        SELECT id, name, zone, population, area_sqkm,
               poverty_level, performance_status,
               coordinates_lat AS lat, coordinates_lng AS lng
        FROM barangays
        ORDER BY name ASC
    ");
    $clupBarangays = $stmtB->fetchAll(PDO::FETCH_ASSOC);
    foreach ($clupBarangays as $b) {
        $totalPop  += (int)$b['population'];
        $totalArea += (float)$b['area_sqkm'];
    }
}
$totalCount = count($clupBarangays);

// Logged-in user name
$clupUser = 'CPDO Coordinator';
if (!empty($_SESSION['user_name'])) {
    $clupUser = $_SESSION['user_name'];
} elseif ($conn) {
    try {
        $uRow = $conn->query("SELECT name FROM users WHERE status='active' LIMIT 1")->fetch();
        if ($uRow) $clupUser = $uRow['name'];
    } catch (Exception $e) {}
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CLUP Interactive Map — San Fernando City, La Union</title>

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

    <!-- CLUP Styles (also imports sidebar/header CSS variables) -->
    <link rel="stylesheet" href="../../css/components/sidebar.css">
    <link rel="stylesheet" href="../../css/clup-mapping.css">
</head>
<body>

<!-- ================================================================
     APP SHELL — Full-screen CLUP dashboard
================================================================ -->
<div class="clup-shell">

    <!-- ==================== TOP BAR ==================== -->
    <header class="clup-topbar">

        <!-- Logo -->
        <div class="topbar-logo">
            <div class="topbar-logo-icon">
                <i class="fas fa-map"></i>
            </div>
            <div class="topbar-logo-text">
                <span class="topbar-title">CPDO — San Fernando City</span>
                <span class="topbar-sub">La Union, Philippines</span>
            </div>
        </div>

        <div class="topbar-divider"></div>
        <span class="topbar-badge"><i class="fas fa-layer-group"></i> CLUP Monitoring</span>
        <div class="topbar-divider"></div>

        <!-- Search -->
        <div class="topbar-search">
            <span class="search-icon"><i class="fas fa-search"></i></span>
            <input type="text" id="clupSearch" placeholder="Search barangay…" autocomplete="off">
            <div class="search-results" id="searchResults"></div>
        </div>

        <!-- Right controls -->
        <div class="topbar-right">
            <button class="tb-btn" id="topbarSidebarBtn" title="Toggle Panel">
                <i class="fas fa-columns"></i>
                <span>Panel</span>
            </button>

            <a href="dashboard-overview.php" class="tb-btn" title="Back to Dashboard">
                <i class="fas fa-th-large"></i>
                <span>Dashboard</span>
            </a>

            <button class="user-menu-btn" title="User Profile">
                <div class="user-avatar"><i class="fas fa-user"></i></div>
                <span><?= htmlspecialchars($clupUser) ?></span>
                <i class="fas fa-chevron-down" style="font-size:10px;margin-left:2px;color:#94a3b8"></i>
            </button>
        </div>

    </header>

    <!-- ==================== BODY (sidebar + map) ==================== -->
    <div class="clup-body">

        <!-- ==================== LEFT SIDEBAR ==================== -->
        <aside class="clup-sidebar" id="clupSidebar">

            <!-- Tabs -->
            <div class="sidebar-tabs">
                <div class="sidebar-tab active" data-tab="legend">
                    <i class="fas fa-palette"></i> Legend
                </div>
                <div class="sidebar-tab" data-tab="list">
                    <i class="fas fa-list"></i> Barangays
                </div>
                <div class="sidebar-tab" data-tab="info">
                    <i class="fas fa-info-circle"></i> Details
                </div>
            </div>

            <!-- ---- TAB: Legend ---- -->
            <div class="sidebar-tab-content active" data-content="legend">
                <div class="legend-content">
                    <div class="legend-title-main">
                        <i class="fas fa-chart-line" style="color:#16a34a;margin-right:6px"></i>
                        Performance Status
                    </div>

                    <div class="legend-item" data-cls="high">
                        <div class="legend-swatch high"></div>
                        <div class="legend-text">
                            <div class="legend-label">High Performance</div>
                            <div class="legend-desc">Barangays performing well</div>
                        </div>
                        <span class="legend-count high" id="count-high">0</span>
                    </div>

                    <div class="legend-item" data-cls="moderate">
                        <div class="legend-swatch moderate"></div>
                        <div class="legend-text">
                            <div class="legend-label">Moderate</div>
                            <div class="legend-desc">Barangays performing adequately</div>
                        </div>
                        <span class="legend-count moderate" id="count-moderate">0</span>
                    </div>

                    <div class="legend-item" data-cls="needs_attention">
                        <div class="legend-swatch needs_attention"></div>
                        <div class="legend-text">
                            <div class="legend-label">Needs Attention</div>
                            <div class="legend-desc">Barangays that require monitoring</div>
                        </div>
                        <span class="legend-count needs_attention" id="count-needs-attention">0</span>
                    </div>

                    <!-- Stats from DB -->
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-num" id="stat-total"><?= $totalCount ?></div>
                            <div class="stat-lbl">Total Barangays</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-num"><?= number_format($totalArea, 2) ?></div>
                            <div class="stat-lbl">Area (km²)</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-num"><?= number_format($totalPop) ?></div>
                            <div class="stat-lbl">Population</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-num">I</div>
                            <div class="stat-lbl">Region</div>
                        </div>
                    </div>

                    <!-- Data source note -->
                    <div style="margin-top:14px;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:11px;color:#166534">
                        <i class="fas fa-info-circle" style="margin-right:4px"></i>
                        CLUP data based on San Fernando City Comprehensive Land Use Plan.
                        Click any barangay for full details.
                    </div>
                </div>
            </div>

            <!-- ---- TAB: Barangay List ---- -->
            <div class="sidebar-tab-content" data-content="list">
                <div class="bgy-filter-bar">
                    <select class="bgy-filter-select" id="bgyFilterSelect">
                        <option value="all">All Status</option>
                        <option value="high">High Performance</option>
                        <option value="moderate">Moderate</option>
                        <option value="needs_attention">Needs Attention</option>
                    </select>
                </div>
                <div class="bgy-list" id="bgyList">
                    <!-- Built by JavaScript -->
                </div>
            </div>

            <!-- ---- TAB: Info / Details ---- -->
            <div class="sidebar-tab-content" data-content="info">
                <div id="infoPlaceholder" class="info-placeholder">
                    <i class="fas fa-mouse-pointer"></i>
                    <strong>Click a barangay</strong>
                    <p>Select any barangay on the map to see detailed land-use and demographic information.</p>
                </div>
                <div id="infoPanelContent" class="info-panel">
                    <!-- Populated by JavaScript -->
                </div>
            </div>

        </aside><!-- /clup-sidebar -->

        <!-- ==================== MAP AREA ==================== -->
        <div class="clup-map-wrap">

            <!-- Leaflet map -->
            <div id="clupFullMap"></div>

            <!-- Loading overlay -->
            <div id="mapLoader">
                <div class="loader-spinner"></div>
                <div class="loader-msg">Connecting to OpenStreetMap…</div>
            </div>

            <!-- Error overlay (shown only if Overpass fails AND fallback also fails) -->
            <div id="mapError">
                <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="error-title">Could not load boundary data</div>
                <div class="error-msg"></div>
                <label class="geojson-upload-label">
                    <i class="fas fa-upload"></i> Upload GeoJSON
                    <input type="file" id="geojsonUpload" accept=".geojson,.json">
                </label>
            </div>

            <!-- Filter pills (top-left of map) -->
            <div class="map-filter-bar">
                <button class="filter-pill all-pill active" data-cls="all">
                    <i class="fas fa-globe" style="font-size:10px"></i> All
                </button>
                <button class="filter-pill high" data-cls="high">
                    <span class="pill-dot"></span> High
                </button>
                <button class="filter-pill moderate" data-cls="moderate">
                    <span class="pill-dot"></span> Moderate
                </button>
                <button class="filter-pill needs_attention" data-cls="needs_attention">
                    <span class="pill-dot"></span> Needs Attention
                </button>
            </div>

            <!-- Sidebar toggle (floating over map) -->
            <button class="sidebar-toggle-btn" id="sidebarToggleBtn" title="Toggle Sidebar">
                <i class="fas fa-bars"></i>
            </button>

            <!-- Floating controls (right side) -->
            <div class="map-controls">
                <button class="ctrl-btn" id="ctrlZoomIn"    title="Zoom In"><i class="fas fa-plus"></i></button>
                <button class="ctrl-btn" id="ctrlZoomOut"   title="Zoom Out"><i class="fas fa-minus"></i></button>
                <div class="ctrl-divider"></div>
                <button class="ctrl-btn" id="ctrlReset"      title="Reset View"><i class="fas fa-home"></i></button>
                <button class="ctrl-btn" id="ctrlFullscreen" title="Fullscreen"><i class="fas fa-expand"></i></button>
                <div class="ctrl-divider"></div>
                <button class="ctrl-btn" id="ctrlTile"       title="Switch to Satellite"><i class="fas fa-layer-group"></i></button>
            </div>

            <!-- Hover tooltip -->
            <div class="clup-tooltip" id="clupTooltip"></div>

            <!-- Active layer indicator (bottom-left) -->
            <div class="layer-indicator">
                <i class="fas fa-layer-group" style="color:#4ade80"></i>
                Layer: <strong id="layerName">Streets</strong>
            </div>

            <!-- Status bar (bottom) -->
            <div class="clup-statusbar">
                <div class="status-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Selected:</span>
                    <span class="status-val" id="statusBarBgy">—</span>
                </div>
                <div class="status-sep"></div>
                <div class="status-item">
                    <span>Area:</span>
                    <span class="status-val" id="statusBarArea">—</span>
                </div>
                <div class="status-sep"></div>
                <div class="status-item">
                    <span>Class:</span>
                    <span class="status-val" id="statusBarCls">—</span>
                </div>
                <div class="status-sep"></div>
                <div class="status-item" style="margin-left:auto">
                    <i class="fas fa-crosshairs" style="font-size:10px"></i>
                    <span class="status-val" id="statusLat">—</span>
                    <span class="status-val" id="statusLng">—</span>
                </div>
                <div class="status-sep"></div>
                <div class="status-item">
                    <span class="status-val" id="statusZoom">Z13</span>
                </div>
            </div>

        </div><!-- /clup-map-wrap -->

    </div><!-- /clup-body -->
</div><!-- /clup-shell -->

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Inject real DB barangay data for the CLUP map -->
<script>
    window.CPDO_CLUP_BARANGAYS = <?= json_encode($clupBarangays, JSON_UNESCAPED_UNICODE) ?>;
</script>

<!-- CLUP Map Logic -->
<script src="../../scripts/functions/clup-mapping.js"></script>

</body>
</html>
