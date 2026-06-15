<?php
/* Dashboard Overview Controllers
 * All functions query the cpdo_monitoring database via PDO.
 */

/* ---------------------------------------------------------------
 * getKPIStats()
 * Aggregates KPI values from businesses, programs, and agricultural_data.
 * Returns spark arrays built from the last 10 months of business records.
 * --------------------------------------------------------------- */
function getKPIStats($conn) {

    /* ---- Registered Businesses ---- */
    $stmtBiz = $conn->query("
        SELECT SUM(registration_count) AS total,
               SUM(CASE WHEN report_month = MONTH(CURDATE()) AND report_year = YEAR(CURDATE())
                        THEN registration_count ELSE 0 END) AS current_month,
               SUM(CASE WHEN (report_year = YEAR(CURDATE()) AND report_month = MONTH(CURDATE()) - 1)
                           OR (MONTH(CURDATE()) = 1 AND report_year = YEAR(CURDATE()) - 1 AND report_month = 12)
                        THEN registration_count ELSE 0 END) AS prev_month
        FROM businesses
    ");
    $biz = $stmtBiz->fetch();
    $bizTotal   = (int)($biz['total'] ?? 0);
    $bizCurrent = (int)($biz['current_month'] ?? 0);
    $bizPrev    = (int)($biz['prev_month'] ?? 1);
    $bizChange  = $bizPrev > 0 ? round((($bizCurrent - $bizPrev) / $bizPrev) * 100, 1) : 0;
    $bizTrend   = $bizChange >= 0 ? 'up' : 'down';

    /* ---- Employment Rate ---- */
    $stmtEmp = $conn->query("
        SELECT AVG(employment_rate) AS avg_rate,
               AVG(CASE WHEN report_month = MONTH(CURDATE()) AND report_year = YEAR(CURDATE())
                        THEN employment_rate END) AS current_month,
               AVG(CASE WHEN (report_year = YEAR(CURDATE()) AND report_month = MONTH(CURDATE()) - 1)
                           OR (MONTH(CURDATE()) = 1 AND report_year = YEAR(CURDATE()) - 1 AND report_month = 12)
                        THEN employment_rate END) AS prev_month
        FROM businesses
    ");
    $emp = $stmtEmp->fetch();
    $empRate    = round((float)($emp['avg_rate'] ?? 0), 1);
    $empCurrent = (float)($emp['current_month'] ?? 0);
    $empPrev    = (float)($emp['prev_month'] ?? 1);
    $empChange  = $empPrev > 0 ? round($empCurrent - $empPrev, 1) : 0;
    $empTrend   = $empChange >= 0 ? 'up' : 'down';

    /* ---- Investment Volume ---- */
    $stmtInv = $conn->query("
        SELECT SUM(investment_volume) AS total,
               SUM(CASE WHEN report_month = MONTH(CURDATE()) AND report_year = YEAR(CURDATE())
                        THEN investment_volume ELSE 0 END) AS current_month,
               SUM(CASE WHEN (report_year = YEAR(CURDATE()) AND report_month = MONTH(CURDATE()) - 1)
                           OR (MONTH(CURDATE()) = 1 AND report_year = YEAR(CURDATE()) - 1 AND report_month = 12)
                        THEN investment_volume ELSE 0 END) AS prev_month
        FROM businesses
    ");
    $inv = $stmtInv->fetch();
    $invTotal   = (float)($inv['total'] ?? 0);
    $invCurrent = (float)($inv['current_month'] ?? 0);
    $invPrev    = (float)($inv['prev_month'] ?? 1);
    $invChange  = $invPrev > 0 ? round((($invCurrent - $invPrev) / $invPrev) * 100, 1) : 0;
    $invTrend   = $invChange >= 0 ? 'up' : 'down';
    // Format: e.g. 3.6M
    $invFormatted = $invTotal >= 1_000_000
        ? round($invTotal / 1_000_000, 2) . 'M'
        : number_format($invTotal);

    /* ---- Market Revenue ---- */
    $stmtRev = $conn->query("
        SELECT SUM(market_revenue) AS total,
               SUM(CASE WHEN report_month = MONTH(CURDATE()) AND report_year = YEAR(CURDATE())
                        THEN market_revenue ELSE 0 END) AS current_month,
               SUM(CASE WHEN (report_year = YEAR(CURDATE()) AND report_month = MONTH(CURDATE()) - 1)
                           OR (MONTH(CURDATE()) = 1 AND report_year = YEAR(CURDATE()) - 1 AND report_month = 12)
                        THEN market_revenue ELSE 0 END) AS prev_month
        FROM businesses
    ");
    $rev = $stmtRev->fetch();
    $revTotal   = (float)($rev['total'] ?? 0);
    $revCurrent = (float)($rev['current_month'] ?? 0);
    $revPrev    = (float)($rev['prev_month'] ?? 1);
    $revChange  = $revPrev > 0 ? round((($revCurrent - $revPrev) / $revPrev) * 100, 1) : 0;
    $revTrend   = $revChange >= 0 ? 'up' : 'down';
    $revFormatted = $revTotal >= 1_000_000
        ? '₱' . round($revTotal / 1_000_000, 1) . 'M'
        : '₱' . number_format($revTotal);

    /* ---- Agricultural Output ---- */
    $stmtAgri = $conn->query("
        SELECT SUM(output_hectares) AS total_ha,
               SUM(CASE WHEN report_month = MONTH(CURDATE()) AND report_year = YEAR(CURDATE())
                        THEN output_hectares ELSE 0 END) AS current_month,
               SUM(CASE WHEN (report_year = YEAR(CURDATE()) AND report_month = MONTH(CURDATE()) - 1)
                           OR (MONTH(CURDATE()) = 1 AND report_year = YEAR(CURDATE()) - 1 AND report_month = 12)
                        THEN output_hectares ELSE 0 END) AS prev_month
        FROM agricultural_data
    ");
    $agri = $stmtAgri->fetch();
    $agriTotal   = (float)($agri['total_ha'] ?? 0);
    $agriCurrent = (float)($agri['current_month'] ?? 0);
    $agriPrev    = (float)($agri['prev_month'] ?? 1);
    $agriChange  = $agriPrev > 0 ? round((($agriCurrent - $agriPrev) / $agriPrev) * 100, 1) : 0;
    $agriTrend   = $agriChange >= 0 ? 'up' : 'down';

    /* ---- Active & Delayed Programs ---- */
    $stmtProg = $conn->query("
        SELECT
            SUM(status = 'in_progress') AS active_count,
            SUM(status = 'delayed')     AS delayed_count,
            (SELECT SUM(status = 'in_progress') FROM programs WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)) AS prev_active,
            (SELECT SUM(status = 'delayed')     FROM programs WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)) AS prev_delayed
        FROM programs
    ");
    $prog = $stmtProg->fetch();
    $activeCount  = (int)($prog['active_count']  ?? 0);
    $delayedCount = (int)($prog['delayed_count'] ?? 0);

    /* ---- Spark arrays (last 10 months of monthly totals) ---- */
    $stmtSpark = $conn->query("
        SELECT report_month, report_year,
               SUM(registration_count) AS biz,
               AVG(employment_rate)    AS emp,
               SUM(investment_volume)  AS inv,
               SUM(market_revenue)     AS rev
        FROM businesses
        GROUP BY report_year, report_month
        ORDER BY report_year ASC, report_month ASC
        LIMIT 10
    ");
    $sparkRows = $stmtSpark->fetchAll();

    $sparkBiz = $sparkEmp = $sparkInv = $sparkRev = [];
    foreach ($sparkRows as $row) {
        $sparkBiz[] = (int)$row['biz'];
        $sparkEmp[] = round((float)$row['emp'], 1);
        $sparkInv[] = round((float)$row['inv'] / 1000, 1); // scale to thousands
        $sparkRev[] = round((float)$row['rev'] / 1_000_000, 2);
    }
    // Pad to 10 points if fewer rows exist
    while (count($sparkBiz) < 10) { $sparkBiz[] = end($sparkBiz) ?: 0; }
    while (count($sparkEmp) < 10) { $sparkEmp[] = end($sparkEmp) ?: 0; }
    while (count($sparkInv) < 10) { $sparkInv[] = end($sparkInv) ?: 0; }
    while (count($sparkRev) < 10) { $sparkRev[] = end($sparkRev) ?: 0; }

    $stmtAgriSpark = $conn->query("
        SELECT SUM(output_hectares) AS ha
        FROM agricultural_data
        GROUP BY report_year, report_month
        ORDER BY report_year ASC, report_month ASC
        LIMIT 10
    ");
    $agriSparkRows = $stmtAgriSpark->fetchAll();
    $sparkAgri = array_column($agriSparkRows, 'ha');
    while (count($sparkAgri) < 10) { $sparkAgri[] = end($sparkAgri) ?: 0; }

    $sparkProg = array_fill(0, 9, max(1, $activeCount - 2));
    $sparkProg[] = $activeCount;
    $sparkDelayed = array_fill(0, 9, max(0, $delayedCount - 1));
    $sparkDelayed[] = $delayedCount;

    return [
        'registered_businesses' => [
            'label'  => 'Registered Businesses',
            'value'  => number_format($bizTotal),
            'trend'  => $bizTrend,
            'change' => ($bizChange >= 0 ? '+' : '') . $bizChange . '%',
            'icon'   => 'fa-store',
            'color'  => 'teal',
            'spark'  => $sparkBiz,
        ],
        'employment_rate' => [
            'label'  => 'Employment Rate',
            'value'  => $empRate . '%',
            'trend'  => $empTrend,
            'change' => ($empChange >= 0 ? '+' : '') . $empChange . '%',
            'icon'   => 'fa-briefcase',
            'color'  => 'green',
            'spark'  => $sparkEmp,
        ],
        'investment_volume' => [
            'label'  => 'Investment Volume',
            'value'  => $invFormatted,
            'trend'  => $invTrend,
            'change' => ($invChange >= 0 ? '+' : '') . $invChange . '%',
            'icon'   => 'fa-coins',
            'color'  => 'blue',
            'spark'  => $sparkInv,
        ],
        'market_revenue' => [
            'label'  => 'Market Revenue',
            'value'  => $revFormatted,
            'trend'  => $revTrend,
            'change' => ($revChange >= 0 ? '+' : '') . $revChange . '%',
            'icon'   => 'fa-chart-line',
            'color'  => 'purple',
            'spark'  => $sparkRev,
        ],
        'agricultural_output' => [
            'label'  => 'Agricultural Output',
            'value'  => round($agriTotal, 1) . ' ha',
            'trend'  => $agriTrend,
            'change' => ($agriChange >= 0 ? '+' : '') . $agriChange . '%',
            'icon'   => 'fa-seedling',
            'color'  => 'emerald',
            'spark'  => $sparkAgri,
        ],
        'active_programs' => [
            'label'  => 'Active Programs',
            'value'  => (string)$activeCount,
            'trend'  => 'up',
            'change' => '+' . $activeCount,
            'icon'   => 'fa-tasks',
            'color'  => 'indigo',
            'spark'  => $sparkProg,
        ],
        'delayed_programs' => [
            'label'  => 'Delayed Programs',
            'value'  => (string)$delayedCount,
            'trend'  => $delayedCount > 0 ? 'down' : 'up',
            'change' => '+' . $delayedCount,
            'icon'   => 'fa-exclamation-triangle',
            'color'  => 'red',
            'spark'  => $sparkDelayed,
        ],
    ];
}

/* ---------------------------------------------------------------
 * getDevelopmentPrograms()
 * Fetches paginated programs from the programs table.
 * Supports search (name / office) and status filter.
 * --------------------------------------------------------------- */
function getDevelopmentPrograms($conn, $search = '', $statusFilter = '', $page = 1, $perPage = 5) {

    // Map view status values to DB enum values
    $statusMap = [
        'in-progress' => 'in_progress',
        'completed'   => 'completed',
        'delayed'     => 'delayed',
    ];
    $dbStatus = $statusMap[$statusFilter] ?? $statusFilter;

    $where  = [];
    $params = [];

    if ($search !== '') {
        $where[]    = '(p.name LIKE :search OR p.implementing_office LIKE :search2)';
        $params[':search']  = '%' . $search . '%';
        $params[':search2'] = '%' . $search . '%';
    }
    if ($dbStatus !== '') {
        $where[]    = 'p.status = :status';
        $params[':status'] = $dbStatus;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Total count
    $countSql  = "SELECT COUNT(*) FROM programs p $whereClause";
    $stmtCount = $conn->prepare($countSql);
    $stmtCount->execute($params);
    $total = (int)$stmtCount->fetchColumn();

    $pages  = max(1, (int)ceil($total / $perPage));
    $page   = max(1, min($page, $pages));
    $offset = ($page - 1) * $perPage;

    // Data query
    $dataSql = "
        SELECT p.name,
               p.implementing_office   AS office,
               p.planning_aspect       AS aspect,
               p.status,
               p.progress_percent      AS progress,
               DATE_FORMAT(p.deadline, '%d/%m/%Y') AS deadline
        FROM programs p
        $whereClause
        ORDER BY
            FIELD(p.status, 'delayed', 'in_progress', 'completed'),
            p.deadline ASC
        LIMIT :limit OFFSET :offset
    ";

    $stmtData = $conn->prepare($dataSql);
    foreach ($params as $key => $val) {
        $stmtData->bindValue($key, $val);
    }
    $stmtData->bindValue(':limit',  $perPage, PDO::PARAM_INT);
    $stmtData->bindValue(':offset', $offset,  PDO::PARAM_INT);
    $stmtData->execute();
    $rows = $stmtData->fetchAll();

    // Normalise status enum → view status strings
    $viewStatusMap = [
        'in_progress' => 'in-progress',
        'completed'   => 'completed',
        'delayed'     => 'delayed',
    ];
    foreach ($rows as &$row) {
        $row['status'] = $viewStatusMap[$row['status']] ?? $row['status'];
    }
    unset($row);

    return [
        'data'  => $rows,
        'total' => $total,
        'pages' => $pages,
        'page'  => $page,
    ];
}

/* ---------------------------------------------------------------
 * getAlerts()
 * Fetches unread alerts from the alerts table grouped by type.
 * --------------------------------------------------------------- */
function getAlerts($conn) {
    $stmt = $conn->query("
        SELECT type,
               COUNT(*)        AS cnt,
               MIN(message)    AS sample_msg
        FROM alerts
        WHERE is_read = 0
        GROUP BY type
        ORDER BY FIELD(type, 'missing_data', 'delayed_program', 'low_investment', 'agricultural_decline')
    ");
    $rows = $stmt->fetchAll();

    // Map DB type → display properties
    $typeMap = [
        'missing_data'         => ['type' => 'danger',  'icon' => 'fa-exclamation-circle', 'title' => 'Missing Data Submissions'],
        'delayed_program'      => ['type' => 'danger',  'icon' => 'fa-clock',              'title' => 'Delayed Programs'],
        'low_investment'       => ['type' => 'warning', 'icon' => 'fa-chart-line',         'title' => 'Low Investment Alert'],
        'agricultural_decline' => ['type' => 'warning', 'icon' => 'fa-seedling',           'title' => 'Agricultural Decline Warning'],
    ];

    $alerts = [];
    foreach ($rows as $row) {
        $meta     = $typeMap[$row['type']] ?? ['type' => 'warning', 'icon' => 'fa-bell', 'title' => ucfirst($row['type'])];
        $alerts[] = [
            'type'  => $meta['type'],
            'icon'  => $meta['icon'],
            'title' => $meta['title'],
            'desc'  => $row['sample_msg'],
            'count' => (int)$row['cnt'],
        ];
    }

    // Always include all 4 alert types even if count = 0
    $allTypes = ['missing_data', 'delayed_program', 'low_investment', 'agricultural_decline'];
    $present  = array_column($rows, 'type');
    foreach ($allTypes as $t) {
        if (!in_array($t, $present)) {
            $meta     = $typeMap[$t];
            $alerts[] = [
                'type'  => $meta['type'],
                'icon'  => $meta['icon'],
                'title' => $meta['title'],
                'desc'  => 'No current alerts.',
                'count' => 0,
            ];
        }
    }

    return $alerts;
}

/* ---------------------------------------------------------------
 * getInsights()
 * Derives top/bottom barangays by performance_status,
 * programs at risk (delayed), and a trend summary.
 * --------------------------------------------------------------- */
function getInsights($conn) {

    // Top performing barangays
    $stmtTop = $conn->query("
        SELECT name FROM barangays
        WHERE performance_status = 'high'
        ORDER BY name ASC
        LIMIT 5
    ");
    $topBarangays = $stmtTop->fetchAll(PDO::FETCH_COLUMN);

    // If fewer than 5 'high', fill with 'moderate'
    if (count($topBarangays) < 5) {
        $need = 5 - count($topBarangays);
        $stmtMod = $conn->prepare("
            SELECT name FROM barangays
            WHERE performance_status = 'moderate'
            ORDER BY name ASC
            LIMIT :need
        ");
        $stmtMod->bindValue(':need', $need, PDO::PARAM_INT);
        $stmtMod->execute();
        $topBarangays = array_merge($topBarangays, $stmtMod->fetchAll(PDO::FETCH_COLUMN));
    }

    // Bottom performing barangays
    $stmtBot = $conn->query("
        SELECT name FROM barangays
        WHERE performance_status = 'needs_attention'
        ORDER BY name ASC
        LIMIT 5
    ");
    $bottomBarangays = $stmtBot->fetchAll(PDO::FETCH_COLUMN);

    // Programs at risk (delayed)
    $stmtRisk = $conn->query("
        SELECT name FROM programs
        WHERE status = 'delayed'
        ORDER BY deadline ASC
    ");
    $programsAtRisk = $stmtRisk->fetchAll(PDO::FETCH_COLUMN);

    // Trend summary (live numbers)
    $stmtSummary = $conn->query("
        SELECT
            ROUND(AVG(b.employment_rate), 1)           AS emp_rate,
            ROUND(SUM(b.investment_volume) / 1000000, 2) AS inv_millions,
            COUNT(DISTINCT p.id)                        AS active_progs,
            (SELECT COUNT(*) FROM barangays WHERE performance_status = 'high') AS high_count
        FROM businesses b
        LEFT JOIN programs p ON p.status = 'in_progress'
        LIMIT 1
    ");
    $s = $stmtSummary->fetch();

    $empRate   = $s['emp_rate']    ?? 0;
    $invMil    = $s['inv_millions'] ?? 0;
    $highCount = $s['high_count']  ?? 0;
    $year      = date('Y');
    $quarter   = 'Q' . ceil(date('n') / 3);

    $trendSummary = "San Fernando City is showing positive economic momentum in {$quarter} {$year}. "
                  . "Employment rate stands at {$empRate}% with investment volume at ₱{$invMil}M. "
                  . "{$highCount} barangay(s) are performing at a high level, indicating strong local development progress.";

    return [
        'top_barangays'    => $topBarangays,
        'bottom_barangays' => $bottomBarangays,
        'programs_at_risk' => $programsAtRisk,
        'trend_summary'    => $trendSummary,
    ];
}

/* ---------------------------------------------------------------
 * getChartData()
 * Returns monthly business + agricultural data for the four
 * canvas charts on the dashboard.  Consumed via window.CPDO_CHARTS
 * injected into the page as JSON.
 * --------------------------------------------------------------- */
function getChartData($conn) {

    $monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    /* Business + employment + investment + revenue — monthly */
    $stmtBiz = $conn->query("
        SELECT report_month, report_year,
               SUM(registration_count)  AS biz,
               ROUND(AVG(employment_rate), 1)   AS emp,
               ROUND(SUM(investment_volume)/1000, 2) AS inv_k,
               ROUND(SUM(market_revenue)/1000000, 2)  AS rev_m
        FROM businesses
        GROUP BY report_year, report_month
        ORDER BY report_year ASC, report_month ASC
        LIMIT 12
    ");
    $bizRows = $stmtBiz->fetchAll();

    $bizLabels = $bizValues = $empValues = $invValues = $revValues = [];
    foreach ($bizRows as $r) {
        $bizLabels[] = $monthNames[(int)$r['report_month'] - 1];
        $bizValues[] = (int)$r['biz'];
        $empValues[] = (float)$r['emp'];
        $invValues[] = (float)$r['inv_k'];
        $revValues[] = (float)$r['rev_m'];
    }

    // Fallback: if only 1 data point, duplicate it so charts render
    if (count($bizLabels) < 2) {
        $bizLabels[] = $bizLabels[0] ?? 'Now';
        $bizValues[] = $bizValues[0] ?? 0;
        $empValues[] = $empValues[0] ?? 0;
        $invValues[] = $invValues[0] ?? 0;
        $revValues[] = $revValues[0] ?? 0;
    }

    /* Agricultural output — monthly */
    $stmtAgri = $conn->query("
        SELECT report_month, report_year,
               ROUND(SUM(output_hectares), 2) AS ha
        FROM agricultural_data
        GROUP BY report_year, report_month
        ORDER BY report_year ASC, report_month ASC
        LIMIT 12
    ");
    $agriRows = $stmtAgri->fetchAll();

    $agriLabels = $agriValues = [];
    foreach ($agriRows as $r) {
        $agriLabels[] = $monthNames[(int)$r['report_month'] - 1];
        $agriValues[] = (float)$r['ha'];
    }
    if (count($agriLabels) < 2) {
        $agriLabels[] = $agriLabels[0] ?? 'Now';
        $agriValues[] = $agriValues[0] ?? 0;
    }

    return [
        'business'   => ['labels' => $bizLabels, 'values' => $bizValues,  'color' => '#3b82f6'],
        'investment' => ['labels' => $bizLabels, 'values' => $invValues,  'color' => '#93c5fd', 'hlColor' => '#1d4ed8'],
        'employment' => ['labels' => $bizLabels, 'values' => $empValues,  'color' => '#10b981'],
        'agri'       => ['labels' => $agriLabels,'values' => $agriValues, 'color' => '#6ee7b7', 'hlColor' => '#059669'],
    ];
}

/* ---------------------------------------------------------------
 * getBarangayList()
 * Returns all barangays with id, name and performance_status
 * for the map dropdown and JS map overlay.
 * --------------------------------------------------------------- */
function getBarangayList($conn) {
    $stmt = $conn->query("
        SELECT id, name, performance_status AS status,
               coordinates_lat AS lat, coordinates_lng AS lng,
               poverty_level, population, area_sqkm
        FROM barangays
        ORDER BY name ASC
    ");
    return $stmt->fetchAll();
}
?>
