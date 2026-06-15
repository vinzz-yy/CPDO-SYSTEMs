<?php

function getEconomicKPIs($conn) {
    $gdpGrowth = '6.8%';
    $inflation = '4.2%';
    $unemployment = '5.5%';
    $avgHousehold = '₱28.4K';
    $marketRevenue = '₱1.66B';
    $programDisbursement = '₱11.1M';
    $registeredBusinesses = $conn->query("SELECT SUM(registration_count) FROM businesses")->fetchColumn();

    return [
        ['value' => $gdpGrowth, 'label' => 'GDP Growth (YoY)', 'color' => 'blue', 'change' => '+1.5%', 'trend' => 'up'],
        ['value' => $inflation, 'label' => 'Inflation Rate (YoY)', 'color' => 'red', 'change' => '-0.8%', 'trend' => 'down'],
        ['value' => $unemployment, 'label' => 'Unemployment Rate', 'color' => 'green', 'change' => '-2.3%', 'trend' => 'down'],
        ['value' => $avgHousehold, 'label' => 'Avg. Household Income', 'color' => 'yellow', 'change' => '+8.5%', 'trend' => 'up'],
        ['value' => $marketRevenue, 'label' => 'Market Revenue (YTD)', 'color' => 'purple', 'change' => '+12.3%', 'trend' => 'up'],
        ['value' => $programDisbursement, 'label' => 'Program Disbursement (YTD)', 'color' => 'cyan', 'change' => '+18.1%', 'trend' => 'up'],
        ['value' => number_format($registeredBusinesses), 'label' => 'Registered Businesses', 'color' => 'green', 'change' => '+7.6%', 'trend' => 'up'],
    ];
}

function getTopPerformingBarangays($conn) {
    $stmt = $conn->query("
        SELECT b.name, b.performance_status
        FROM barangays b
        WHERE b.performance_status = 'high'
        ORDER BY b.name
        LIMIT 3
    ");
    return $stmt->fetchAll();
}

function getEconomicOutlook($conn) {
    return 'Stable economic recovery with positive growth in services and industry sectors. Agricultural output improving with recent harvests.';
}
