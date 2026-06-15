<?php
$currentPage = basename($_SERVER['PHP_SELF']);

$navItems = [
    ['href' => 'dashboard-overview.php',  'icon' => 'fa-th-large',        'label' => 'Dashboard Overview'],
    ['href' => 'economic-performance.php','icon' => 'fa-chart-line',       'label' => 'Economic Performance'],
    ['href' => 'development-programs.php','icon' => 'fa-project-diagram',  'label' => 'Development Programs'],
    ['href' => 'barangay-profile.php',    'icon' => 'fa-map-marker-alt',   'label' => 'Barangay Profiles'],
    ['href' => 'clup-mapping.php',        'icon' => 'fa-map',              'label' => 'CLUP Mapping'],
    ['href' => 'data-submission.php',     'icon' => 'fa-database',         'label' => 'Data Submissions'],
    ['href' => 'report-generator.php',    'icon' => 'fa-file-alt',         'label' => 'Reports Generator'],
    ['href' => 'analytics-trends.php',    'icon' => 'fa-chart-bar',        'label' => 'Analytics & Trends'],
];
?>

<aside class="sidebar" id="sidebar">
    <!-- Logo / Brand -->
    <div class="sidebar-brand">
        <div class="brand-logo">
            <i class="fas fa-city"></i>
        </div>
        <div class="brand-info">
            <span class="brand-name">CPDO</span>
            <span class="brand-city">San Fernando City, La Union</span>
        </div>
    </div>

    <!-- Primary Navigation -->
    <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
        <?php foreach ($navItems as $item):
            $active = ($currentPage === $item['href']) ? ' active' : '';
        ?>
        <a href="<?= htmlspecialchars($item['href']) ?>" class="nav-item<?= $active ?>" title="<?= htmlspecialchars($item['label']) ?>">
            <span class="nav-icon"><i class="fas <?= $item['icon'] ?>"></i></span>
            <span class="nav-label"><?= htmlspecialchars($item['label']) ?></span>
        </a>
        <?php endforeach; ?>
    </nav>

    <!-- Bottom: Settings -->
    <div class="sidebar-footer">
        <a href="settings.php" class="nav-item<?= ($currentPage === 'settings.php') ? ' active' : '' ?>" title="Settings">
            <span class="nav-icon"><i class="fas fa-cog"></i></span>
            <span class="nav-label">Settings</span>
        </a>
    </div>
</aside>
