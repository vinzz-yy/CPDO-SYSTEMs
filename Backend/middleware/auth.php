<?php
/**
 * Authentication Middleware
 * Include this file at the top of every protected page
 */

session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    // User not logged in, redirect to login page
    header('Location: ../../Frontend/login.php');
    exit();
}
