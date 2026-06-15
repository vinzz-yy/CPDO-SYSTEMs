<?php
require_once '../../db/conn.php';

session_start();

/**
 * Handle login request
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $email_or_name = trim($_POST['username']);
    $password = trim($_POST['password']);

    // Validate input
    if (empty($email_or_name) || empty($password)) {
        $_SESSION['login_error'] = 'Please fill in all fields';
        header('Location: /FCPDO/Frontend/login.php');
        exit();
    }

    try {
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? OR name = ?");
        $stmt->execute([$email_or_name, $email_or_name]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            // Login successful, set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['barangay_id'] = $user['barangay_id'];
            $_SESSION['logged_in'] = true;

            // Redirect to dashboard
            header('Location: /FCPDO/Frontend/views/cpdo-admin/dashboard-overview.php');
            exit();
        } else {
            $_SESSION['login_error'] = 'Invalid email/name or password';
            header('Location: /FCPDO/Frontend/login.php');
            exit();
        }
    } catch (PDOException $e) {
        $_SESSION['login_error'] = 'Database error: ' . $e->getMessage();
        header('Location: /FCPDO/Frontend/login.php');
        exit();
    }
}

/**
 * Handle logout request
 */
if (isset($_GET['logout']) || (isset($_POST['logout']))) {
    session_start();
    session_unset();
    session_destroy();
    
    // Redirect to login page
    header('Location: /FCPDO/Frontend/login.php');
    exit();
}
