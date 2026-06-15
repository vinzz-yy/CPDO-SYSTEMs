<?php
require_once '../../../Backend/middleware/auth.php'; // Check authentication
require_once '../../../Backend/db/conn.php';
require_once '../../../Backend/controllers/cpdo-admin/economic-performancecontrollers.php';

$kpis       = getEconomicKPIs($conn);
$topBarangays = getTopPerformingBarangays($conn);
$outlook    = getEconomicOutlook($conn);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Economic Performance — CPDO Program Monitoring System</title>

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
        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        .insight-box {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .insight-title {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .insight-content {
            font-size: 14px;
            color: #1e293b;
            line-height: 1.6;
        }
        .chart-container {
            padding: 10px;
            height: 400px;
        }
        .chart-container-sm {
            padding: 10px;
            height: 250px;
        }
        .page-body {
            padding: 24px;
        }
        .kpi-section {
            margin-bottom: 24px;
        }
        .programs-section {
            margin-bottom: 24px;
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

            <!-- Charts & Insights -->
            <div class="content-grid">
                <!-- Main Charts -->
                <div>
                    <!-- GDP & Inflation Chart -->
                    <section class="programs-section">
                        <div class="programs-header">
                            <span class="programs-title">GDP growth & inflation trend</span>
                            <div style="display:flex;gap:8px">
                                <button class="kpi-card kpi-blue" style="padding:6px 12px;margin:0;font-size:12px">Monthly</button>
                                <button class="kpi-card kpi-cyan" style="padding:6px 12px;margin:0;font-size:12px">Quarterly</button>
                                <button class="kpi-card kpi-green" style="padding:6px 12px;margin:0;font-size:12px">Annual</button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="gdpInflationChart"></canvas>
                        </div>
                    </section>

                    <!-- Investment Inflow & Sector Contribution -->
                    <section class="programs-section" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                        <div class="insight-box">
                            <div class="insight-title">Investment Inflow (₱M)</div>
                            <div class="chart-container-sm">
                                <canvas id="investmentChart"></canvas>
                            </div>
                        </div>
                        <div class="insight-box">
                            <div class="insight-title">Sector Contribution to GDP</div>
                            <div class="chart-container-sm">
                                <canvas id="sectorChart"></canvas>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Right Column: Insights -->
                <div>
                    <section class="programs-section">
                        <div class="insight-box">
                            <div class="insight-title">Insight summary</div>
                            <div class="insight-content"><?= htmlspecialchars($outlook) ?></div>
                        </div>
                    </section>

                    <section class="programs-section">
                        <div class="insight-box">
                            <div class="insight-title">Top performing barangays</div>
                            <div style="margin-top:16px">
                                <?php foreach ($topBarangays as $bgy): ?>
                                <div style="padding:10px 0;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
                                    <div style="font-weight:600"><?= htmlspecialchars($bgy['name']) ?></div>
                                    <div style="display:flex;align-items:center;gap:8px">
                                        <span class="badge badge-success">
                                            <i class="fas fa-circle" style="font-size:7px"></i> High
                                        </span>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </section>

                    <section class="programs-section">
                        <div class="insight-box">
                            <div class="insight-title">Comparative analysis</div>
                            <table class="data-table" style="margin:0">
                                <thead>
                                    <tr>
                                        <th>Indicator</th>
                                        <th>Q1</th>
                                        <th>Q2</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>GDP growth</td>
                                        <td>6.1%</td>
                                        <td>6.8%</td>
                                        <td><span class="badge badge-success"><i class="fas fa-arrow-up"></i> Up</span></td>
                                    </tr>
                                    <tr>
                                        <td>Inflation</td>
                                        <td>5.0%</td>
                                        <td>4.2%</td>
                                        <td><span class="badge badge-success"><i class="fas fa-arrow-down"></i> Down</span></td>
                                    </tr>
                                    <tr>
                                        <td>Unemployment</td>
                                        <td>6.1%</td>
                                        <td>5.5%</td>
                                        <td><span class="badge badge-success"><i class="fas fa-arrow-down"></i> Down</span></td>
                                    </tr>
                                    <tr>
                                        <td>Investment inflow</td>
                                        <td>₱428M</td>
                                        <td>₱517M</td>
                                        <td><span class="badge badge-success"><i class="fas fa-arrow-up"></i> Up</span></td>
                                    </tr>
                                    <tr>
                                        <td>Market revenue</td>
                                        <td>₱1.1B</td>
                                        <td>₱1.66B</td>
                                        <td><span class="badge badge-success"><i class="fas fa-arrow-up"></i> Up</span></td>
                                    </tr>
                                    <tr>
                                        <td>Poverty incidence</td>
                                        <td>21.3%</td>
                                        <td>18.3%</td>
                                        <td><span class="badge badge-success"><i class="fas fa-arrow-down"></i> Down</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    </div>
</div>

<!-- Component Scripts -->
<script src="../../scripts/components/sidebar.js"></script>
<script src="../../scripts/components/header.js"></script>

<!-- Page Script -->
<script src="../../scripts/functions/economic-performance.js"></script>

</body>
</html>
