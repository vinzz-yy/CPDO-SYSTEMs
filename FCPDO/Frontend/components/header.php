<?php
/* ---------------------------------------------------------------
 * header.php — shared top-header component
 * Reads live data from $conn (injected by including page).
 * --------------------------------------------------------------- */

// Unread alert count from DB
$unreadCount = 0;
$notifItems  = [];
if (!empty($conn)) {
    try {
        $stmtN = $conn->query("
            SELECT type, message, created_at
            FROM   alerts
            WHERE  is_read = 0
            ORDER  BY created_at DESC
            LIMIT  5
        ");
        $notifItems  = $stmtN->fetchAll();
        $unreadCount = count($notifItems);
    } catch (Exception $e) { /* silent fail */ }
}

// Logged-in user name (from session or DB fallback)
$userName = 'CPDO Coordinator';
if (!empty($_SESSION['name'])) {
    $userName = $_SESSION['name'];
} elseif (!empty($_SESSION['email'])) {
    $userName = $_SESSION['email'];
}

// Notification type → icon/color map
$notifMeta = [
    'missing_data'         => ['icon' => 'fa-exclamation-circle', 'color' => 'var(--danger)'],
    'delayed_program'      => ['icon' => 'fa-clock',              'color' => 'var(--danger)'],
    'low_investment'       => ['icon' => 'fa-chart-line',         'color' => 'var(--warning)'],
    'agricultural_decline' => ['icon' => 'fa-seedling',           'color' => 'var(--warning)'],
];

// Human-readable time-ago helper
function timeAgo($datetime) {
    $diff = time() - strtotime($datetime);
    if ($diff < 60)     return 'Just now';
    if ($diff < 3600)   return floor($diff/60)  . ' min ago';
    if ($diff < 86400)  return floor($diff/3600) . ' hr ago';
    return floor($diff/86400) . ' day(s) ago';
}
?>
<header class="top-header" id="topHeader">
    <div class="header-left">
        <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle Sidebar">
            <i class="fas fa-bars"></i>
        </button>
        <div class="header-brand">
            <h1 class="brand-title">City Planning and Development Office (CPDO)</h1>
            <span class="brand-subtitle">Program Monitoring System</span>
        </div>
    </div>

    <div class="header-controls">
        <div class="period-control">
            <select class="ctrl-select" id="reportingPeriod" title="Select Reporting Period">
                <option value="all">Monthly/Quarterly/Annual</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
            </select>
        </div>

        <div class="date-control">
            <i class="fas fa-calendar-alt date-icon"></i>
            <input type="date" class="ctrl-date" id="reportDate" value="<?= date('Y-m-d') ?>">
        </div>

        <div class="notif-control">
            <button class="notif-btn" id="notifBtn" aria-label="Notifications">
                <i class="fas fa-bell"></i>
                <?php if ($unreadCount > 0): ?>
                <span class="notif-badge" id="notifBadge"><?= $unreadCount ?></span>
                <?php endif; ?>
            </button>
            <div class="notif-dropdown" id="notifDropdown">
                <div class="notif-header">
                    <span>Notifications</span>
                    <span class="notif-count"><?= $unreadCount ?> new</span>
                </div>
                <?php if (empty($notifItems)): ?>
                <div class="notif-item">
                    <i class="fas fa-check-circle" style="color:var(--success)"></i>
                    <div>
                        <p class="notif-text">No unread notifications.</p>
                        <span class="notif-time">All clear</span>
                    </div>
                </div>
                <?php else: ?>
                    <?php foreach ($notifItems as $n):
                        $meta = $notifMeta[$n['type']] ?? ['icon' => 'fa-bell', 'color' => 'var(--text-secondary)'];
                    ?>
                    <div class="notif-item unread">
                        <i class="fas <?= $meta['icon'] ?>" style="color:<?= $meta['color'] ?>"></i>
                        <div>
                            <p class="notif-text"><?= htmlspecialchars($n['message']) ?></p>
                            <span class="notif-time"><?= timeAgo($n['created_at']) ?></span>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
                <div class="notif-footer">
                    <a href="#">View all notifications</a>
                </div>
            </div>
        </div>

        <div class="user-control" id="userControl">
            <div class="user-avatar-icon">
                <i class="fas fa-user-circle"></i>
            </div>
            <span class="user-label"><?= htmlspecialchars($userName) ?></span>
            <i class="fas fa-chevron-down user-caret" id="userCaret"></i>
            <div class="user-dropdown" id="userDropdown">
                <a href="settings.php" class="dd-item">
                    <i class="fas fa-user"></i> My Profile
                </a>
                <a href="settings.php" class="dd-item">
                    <i class="fas fa-cog"></i> Settings
                </a>
                <div class="dd-divider"></div>
                <a href="/FCPDO/Backend/controllers/auth/AuthController.php?logout=1" class="dd-item dd-danger">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        </div>
    </div>
</header>
