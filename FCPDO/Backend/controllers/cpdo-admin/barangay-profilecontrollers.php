<?php

function getBarangayKPIs($conn) {
    $total = $conn->query("SELECT COUNT(*) FROM barangays")->fetchColumn();
    $population = $conn->query("SELECT SUM(population) FROM barangays")->fetchColumn();
    $urban = 48;
    $rural = $total - $urban;
    $highPoverty = $conn->query("SELECT COUNT(*) FROM barangays WHERE poverty_level = 'high'")->fetchColumn();
    $activePrograms = $conn->query("SELECT COUNT(*) FROM programs WHERE status = 'in_progress'")->fetchColumn();
    $completionRate = '92%';

    return [
        ['value' => $total, 'label' => 'Total Barangays', 'color' => 'blue', 'change' => '+2', 'trend' => 'up'],
        ['value' => number_format($population), 'label' => 'Total Population', 'color' => 'green', 'change' => '+3.2%', 'trend' => 'up'],
        ['value' => $urban, 'label' => 'Urban Barangays', 'color' => 'cyan', 'change' => '+3', 'trend' => 'up'],
        ['value' => $rural, 'label' => 'Rural Barangays', 'color' => 'yellow', 'change' => '-1', 'trend' => 'down'],
        ['value' => $highPoverty, 'label' => 'High Poverty Barangays', 'color' => 'red', 'change' => '-2', 'trend' => 'down'],
        ['value' => $activePrograms, 'label' => 'Active Programs', 'color' => 'purple', 'change' => '+5', 'trend' => 'up'],
        ['value' => $completionRate, 'label' => 'Profile Completion Rate', 'color' => 'green', 'change' => '+8%', 'trend' => 'up']
    ];
}

function getBarangayDirectory($conn, $search = '', $zone = '', $poverty = '', $classification = '', $page = 1) {
    $perPage = 10;
    $offset = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    if ($search !== '') {
        $where[]    = 'b.name LIKE :search';
        $params[':search']  = '%' . $search . '%';
    }

    if ($zone !== '') {
        $where[]    = 'b.zone = :zone';
        $params[':zone'] = $zone;
    }

    if ($poverty !== '') {
        $where[]    = 'b.poverty_level = :poverty';
        $params[':poverty'] = $poverty;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $countSql  = "SELECT COUNT(*) FROM barangays b $whereClause";
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
        SELECT b.id,
               b.name,
               b.zone,
               b.population,
               b.poverty_level,
               (SELECT COUNT(*) FROM programs p WHERE p.barangay_id = b.id AND p.status = 'in_progress') AS program_count
        FROM barangays b
        $whereClause
        ORDER BY b.id DESC
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

    return [
        'data'  => $rows,
        'total' => $total,
        'pages' => $pages,
        'page'  => $page,
    ];
}

// Get zones for filter
function getZones($conn) {
    $stmt = $conn->query("SELECT DISTINCT zone FROM barangays ORDER BY zone ASC");
    return $stmt->fetchAll();
}

// Handle actions (add/edit/delete)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (isset($_POST['action'])) {
    require_once '../../../Backend/db/conn.php';
    $action = $_POST['action'];

    if ($action === 'delete' && isset($_POST['id'])) {
        $stmt = $conn->prepare("DELETE FROM barangays WHERE id = ?");
        $stmt->execute([$_POST['id']]);
        $_SESSION['barangay_success'] = 'Barangay successfully deleted!';
        header('Location: barangay-profile.php');
        exit;
    }

    if ($action === 'add') {
        $stmt = $conn->prepare("INSERT INTO barangays (name, zone, population, area_sqkm, poverty_level, performance_status, coordinates_lat, coordinates_lng) VALUES (?, ?, ?, ?, ?, 'moderate', 0, 0)");
        $stmt->execute([
            $_POST['name'],
            $_POST['zone'],
            $_POST['population'],
            $_POST['area_sqkm'],
            $_POST['poverty_level']
        ]);
        $_SESSION['barangay_success'] = 'Barangay successfully added!';
        header('Location: barangay-profile.php');
        exit;
    }

    if ($action === 'edit' && isset($_POST['id'])) {
        $stmt = $conn->prepare("UPDATE barangays SET name = ?, zone = ?, population = ?, area_sqkm = ?, poverty_level = ? WHERE id = ?");
        $stmt->execute([
            $_POST['name'],
            $_POST['zone'],
            $_POST['population'],
            $_POST['area_sqkm'],
            $_POST['poverty_level'],
            $_POST['id']
        ]);
        $_SESSION['barangay_success'] = 'Barangay successfully updated!';
        header('Location: barangay-profile.php');
        exit;
    }
}
