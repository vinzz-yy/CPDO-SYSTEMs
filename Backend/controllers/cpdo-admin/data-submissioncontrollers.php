<?php

function getSubmissionKPIs($conn) {
    $total = $conn->query("SELECT COUNT(*) FROM submissions")->fetchColumn();
    $approved = $conn->query("SELECT COUNT(*) FROM submissions WHERE status = 'approved'")->fetchColumn();
    $pending = $conn->query("SELECT COUNT(*) FROM submissions WHERE status = 'pending'")->fetchColumn();
    $rejected = $conn->query("SELECT COUNT(*) FROM submissions WHERE status = 'rejected'")->fetchColumn();
    $overdue = $conn->query("SELECT COUNT(*) FROM submissions WHERE status = 'pending' AND submission_date < DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    $avgReview = '2.4d';

    return [
        ['value' => $total, 'label' => 'Total Submissions', 'color' => 'blue', 'change' => '+48', 'trend' => 'up'],
        ['value' => $approved, 'label' => 'Approved', 'color' => 'green', 'change' => '+8.5%', 'trend' => 'up'],
        ['value' => $pending, 'label' => 'Pending Review', 'color' => 'yellow', 'change' => '-2', 'trend' => 'down'],
        ['value' => $rejected, 'label' => 'Rejected', 'color' => 'red', 'change' => '+1', 'trend' => 'up'],
        ['value' => $overdue, 'label' => 'Overdue / Needs Attention', 'color' => 'red', 'change' => '-3', 'trend' => 'down'],
        ['value' => $avgReview, 'label' => 'Avg. Review Time', 'color' => 'cyan', 'change' => '+0.3d', 'trend' => 'up'],
    ];
}

function getSubmissionsList($conn, $search = '', $status = '', $page = 1) {
    $perPage = 10;
    $offset = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    if ($search !== '') {
        $where[]    = '(b.name LIKE :search OR u.name LIKE :search2)';
        $params[':search']  = '%' . $search . '%';
        $params[':search2'] = '%' . $search . '%';
    }

    if ($status !== '') {
        $where[]    = 's.status = :status';
        $params[':status'] = $status;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $countSql  = "SELECT COUNT(*) FROM submissions s LEFT JOIN barangays b ON s.barangay_id = b.id LEFT JOIN users u ON s.submitted_by = u.id $whereClause";
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
        SELECT s.id,
               b.name AS barangay,
               u.name AS submitted_by,
               DATE_FORMAT(s.submission_date, '%Y-%m-%d') AS submission_date,
               s.status,
               s.remarks
        FROM submissions s
        LEFT JOIN barangays b ON s.barangay_id = b.id
        LEFT JOIN users u ON s.submitted_by = u.id
        $whereClause
        ORDER BY s.submission_date DESC
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

// Handle approve/reject actions
if (isset($_POST['submission_action']) && isset($_POST['submission_id'])) {
    require_once '../../../Backend/db/conn.php';
    $id = $_POST['submission_id'];
    $status = $_POST['submission_action'];
    $remarks = $_POST['remarks'] ?? null;

    $stmt = $conn->prepare("UPDATE submissions SET status = ?, remarks = ? WHERE id = ?");
    $stmt->execute([$status, $remarks, $id]);

    header('Location: data-submission.php');
    exit;
}
