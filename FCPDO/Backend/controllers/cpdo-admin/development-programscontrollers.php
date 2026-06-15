<?php

function getProgramKPIs($conn) {
    $active = $conn->query("SELECT COUNT(*) FROM programs WHERE status = 'in_progress'")->fetchColumn();
    $delayed = $conn->query("SELECT COUNT(*) FROM programs WHERE status = 'delayed'")->fetchColumn();
    $completed = $conn->query("SELECT COUNT(*) FROM programs WHERE status = 'completed'")->fetchColumn();
    $budgetAllocated = '₱84.2M';
    $budgetTarget = '₱51.7M';
    $avgCompletion = '61.4%';
    $barangaysCovered = '54';

    return [
        ['value' => $active, 'label' => 'Active Programs', 'color' => 'blue', 'change' => '+12', 'trend' => 'up'],
        ['value' => $delayed, 'label' => 'Delayed Programs', 'color' => 'red', 'change' => '-3', 'trend' => 'down'],
        ['value' => $completed, 'label' => 'Completed This Year', 'color' => 'green', 'change' => '+8', 'trend' => 'up'],
        ['value' => $budgetAllocated, 'label' => 'Total Budget Allocated', 'color' => 'yellow', 'change' => '+15%', 'trend' => 'up'],
        ['value' => $budgetTarget, 'label' => 'Budget Target', 'color' => 'purple', 'change' => '+12%', 'trend' => 'up'],
        ['value' => $avgCompletion, 'label' => 'Avg. Completion Rate', 'color' => 'cyan', 'change' => '+5%', 'trend' => 'up'],
        ['value' => $barangaysCovered, 'label' => 'Barangays Covered', 'color' => 'green', 'change' => '+4', 'trend' => 'up']
    ];
}

function getProgramList($conn, $search = '', $status = '', $page = 1) {
    $perPage = 10;
    $offset = ($page - 1) * $perPage;

    $statusMap = [
        'in-progress' => 'in_progress',
        'completed'   => 'completed',
        'delayed'     => 'delayed',
    ];
    $dbStatus = $statusMap[$status] ?? $status;

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

    $countSql  = "SELECT COUNT(*) FROM programs p $whereClause";
    $stmtCount = $conn->prepare($countSql);
    foreach ($params as $key => $val) {
        $stmtCount->bindValue($key, $val);
    }
    $stmtCount->execute();
    $total = (int)$stmtCount->fetchColumn();

    $pages  = max(1, (int)ceil($total / $perPage));
    $page   = max(1, min($page, $pages));
    $offset = ($page - 1) * $perPage;

    $dataSql = "
        SELECT p.id,
               p.name,
               p.implementing_office   AS office,
               p.planning_aspect     AS aspect,
               p.status,
               p.progress_percent      AS progress,
               DATE_FORMAT(p.deadline, '%Y-%m-%d') AS deadline,
               p.barangay_id,
               b.name AS barangay
        FROM programs p
        LEFT JOIN barangays b ON p.barangay_id = b.id
        $whereClause
        ORDER BY
            FIELD(p.status, 'delayed', 'in_progress', 'completed'),
            p.deadline DESC,
            p.id DESC
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

    $viewStatusMap = [
        'in_progress' => 'in-progress',
        'completed'   => 'completed',
        'delayed'     => 'delayed',
    ];
    foreach ($rows as &$row) {
        $row['status'] = $viewStatusMap[$row['status']] ?? $row['status'];
    }

    return [
        'data'  => $rows,
        'total' => $total,
        'pages' => $pages,
        'page'  => $page,
    ];
}

function getBarangaysForSelect($conn) {
    $stmt = $conn->query("SELECT id, name FROM barangays ORDER BY name ASC");
    return $stmt->fetchAll();
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (isset($_POST['action'])) {
    require_once '../../../Backend/db/conn.php';
    $action = $_POST['action'];

    if ($action === 'delete' && isset($_POST['id'])) {
        $stmt = $conn->prepare("DELETE FROM programs WHERE id = ?");
        $stmt->execute([$_POST['id']]);
        $_SESSION['program_success'] = "Program successfully deleted!";
        header('Location: development-programs.php');
        exit;
    }

    if ($action === 'add') {
        $stmt = $conn->prepare("INSERT INTO programs (name, implementing_office, planning_aspect, status, progress_percent, deadline, barangay_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $_POST['name'],
            $_POST['implementing_office'],
            $_POST['planning_aspect'],
            $_POST['status'],
            $_POST['progress'],
            $_POST['deadline'],
            $_POST['barangay_id'] ?: null,
            1
        ]);
        $_SESSION['program_success'] = "Program successfully added!";
        header('Location: development-programs.php');
        exit;
    }

    if ($action === 'edit' && isset($_POST['id'])) {
        $stmt = $conn->prepare("UPDATE programs SET name = ?, implementing_office = ?, planning_aspect = ?, status = ?, progress_percent = ?, deadline = ?, barangay_id = ? WHERE id = ?");
        $stmt->execute([
            $_POST['name'],
            $_POST['implementing_office'],
            $_POST['planning_aspect'],
            $_POST['status'],
            $_POST['progress'],
            $_POST['deadline'],
            $_POST['barangay_id'] ?: null,
            $_POST['id']
        ]);
        $_SESSION['program_success'] = "Program successfully updated!";
        header('Location: development-programs.php');
        exit;
    }
}
