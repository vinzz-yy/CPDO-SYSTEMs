-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 15, 2026 at 12:27 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cpdo_monitoring`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agricultural_data`
--

CREATE TABLE `agricultural_data` (
  `id` int(10) UNSIGNED NOT NULL,
  `barangay_id` int(10) UNSIGNED NOT NULL,
  `output_hectares` decimal(10,2) NOT NULL DEFAULT 0.00,
  `crop_type` varchar(100) NOT NULL,
  `production_volume` decimal(14,2) NOT NULL DEFAULT 0.00,
  `report_month` tinyint(3) UNSIGNED NOT NULL,
  `report_year` smallint(5) UNSIGNED NOT NULL,
  `submitted_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agricultural_data`
--

INSERT INTO `agricultural_data` (`id`, `barangay_id`, `output_hectares`, `crop_type`, `production_volume`, `report_month`, `report_year`, `submitted_by`, `created_at`) VALUES
(1, 1, 12.50, 'Rice', 45000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(2, 2, 18.20, 'Corn', 62000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(3, 3, 8.50, 'Vegetables', 28000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(4, 4, 15.00, 'Rice', 52000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(5, 5, 22.00, 'Mixed Crops', 78000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(6, 10, 5.20, 'Vegetables', 15000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(7, 11, 4.80, 'Rice', 12000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(8, 12, 3.50, 'Corn', 9000.00, 2, 2026, 2, '2026-06-15 16:05:08');

-- --------------------------------------------------------

--
-- Table structure for table `alerts`
--

CREATE TABLE `alerts` (
  `id` int(10) UNSIGNED NOT NULL,
  `type` enum('missing_data','delayed_program','low_investment','agricultural_decline') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `alerts`
--

INSERT INTO `alerts` (`id`, `type`, `message`, `is_read`, `created_at`) VALUES
(1, 'missing_data', 'Barangay Biday has not submitted economic data for February 2026.', 0, '2026-06-15 16:05:08'),
(2, 'missing_data', 'Barangay Camansi has not submitted agricultural data for Q1 2026.', 0, '2026-06-15 16:05:08'),
(3, 'delayed_program', 'Market Rehabilitation project is 65% behind schedule.', 0, '2026-06-15 16:05:08'),
(4, 'delayed_program', 'Solid Waste Management program missed March deadline.', 0, '2026-06-15 16:05:08'),
(5, 'low_investment', 'Barangay Bato investment volume dropped 30% from last quarter.', 0, '2026-06-15 16:05:08'),
(6, 'agricultural_decline', 'Agricultural output in Barangay Nalvo declined 15% month-over-month.', 0, '2026-06-15 16:05:08');

-- --------------------------------------------------------

--
-- Table structure for table `barangays`
--

CREATE TABLE `barangays` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `zone` varchar(50) NOT NULL,
  `population` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `area_sqkm` decimal(8,2) NOT NULL DEFAULT 0.00,
  `poverty_level` enum('low','moderate','high') NOT NULL DEFAULT 'moderate',
  `performance_status` enum('high','moderate','needs_attention') NOT NULL DEFAULT 'moderate',
  `coordinates_lat` decimal(10,7) NOT NULL,
  `coordinates_lng` decimal(10,7) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `barangays`
--

INSERT INTO `barangays` (`id`, `name`, `zone`, `population`, `area_sqkm`, `poverty_level`, `performance_status`, `coordinates_lat`, `coordinates_lng`) VALUES
(1, 'Abut', 'North', 3200, 1.20, 'moderate', 'moderate', 16.6250000, 120.3150000),
(2, 'Apaleng', 'North', 4100, 1.45, 'low', 'high', 16.6280000, 120.3180000),
(3, 'Bacsil', 'North', 2800, 0.95, 'moderate', 'moderate', 16.6310000, 120.3210000),
(4, 'Bangbangolan', 'North', 3500, 1.10, 'low', 'high', 16.6340000, 120.3240000),
(5, 'Bangcusay', 'North', 5200, 1.80, 'low', 'high', 16.6370000, 120.3270000),
(6, 'Barangay I', 'Central', 6800, 0.65, 'moderate', 'moderate', 16.6150000, 120.3160000),
(7, 'Barangay II', 'Central', 7200, 0.70, 'moderate', 'moderate', 16.6160000, 120.3170000),
(8, 'Barangay III', 'Central', 6500, 0.68, 'moderate', 'moderate', 16.6170000, 120.3180000),
(9, 'Barangay IV', 'Central', 7100, 0.72, 'low', 'high', 16.6180000, 120.3190000),
(10, 'Baraoas', 'South', 3900, 1.30, 'moderate', 'moderate', 16.6000000, 120.3100000),
(11, 'Bato', 'South', 4200, 1.40, 'moderate', 'needs_attention', 16.5980000, 120.3080000),
(12, 'Biday', 'South', 3100, 1.05, 'high', 'needs_attention', 16.5960000, 120.3060000),
(13, 'Birunget', 'South', 3600, 1.15, 'moderate', 'moderate', 16.5940000, 120.3040000),
(14, 'Bungro', 'South', 2900, 0.98, 'high', 'needs_attention', 16.5920000, 120.3020000),
(15, 'Cabaroan', 'East', 4500, 1.50, 'low', 'high', 16.6200000, 120.3300000),
(16, 'Cabarsican', 'East', 3800, 1.25, 'moderate', 'moderate', 16.6220000, 120.3320000),
(17, 'Cadaclan', 'East', 4100, 1.35, 'low', 'high', 16.6240000, 120.3340000),
(18, 'Calabugao', 'East', 3300, 1.10, 'moderate', 'moderate', 16.6260000, 120.3360000),
(19, 'Camansi', 'East', 2700, 0.90, 'high', 'needs_attention', 16.6280000, 120.3380000),
(20, 'Canaoay', 'East', 4800, 1.60, 'low', 'high', 16.6300000, 120.3400000),
(21, 'Carlatan', 'West', 5500, 1.85, 'low', 'high', 16.6100000, 120.3050000),
(22, 'Catbangen', 'West', 6200, 2.10, 'moderate', 'moderate', 16.6080000, 120.3030000),
(23, 'Dallangayan Este', 'West', 3400, 1.12, 'moderate', 'moderate', 16.6060000, 120.3010000),
(24, 'Dallangayan Oeste', 'West', 3200, 1.08, 'moderate', 'moderate', 16.6040000, 120.2990000),
(25, 'Dalumpinas Este', 'West', 3600, 1.18, 'moderate', 'moderate', 16.6020000, 120.2970000),
(26, 'Dalumpinas Oeste', 'West', 3500, 1.15, 'moderate', 'needs_attention', 16.6000000, 120.2950000),
(27, 'Ilocanos Norte', 'North', 4300, 1.42, 'low', 'high', 16.6400000, 120.3100000),
(28, 'Ilocanos Sur', 'North', 4000, 1.38, 'moderate', 'moderate', 16.6420000, 120.3120000),
(29, 'Langcuas', 'North', 3700, 1.22, 'moderate', 'moderate', 16.6440000, 120.3140000),
(30, 'Lingsat', 'North', 4600, 1.55, 'low', 'high', 16.6460000, 120.3160000),
(31, 'Madayegdeg', 'North', 3300, 1.08, 'moderate', 'moderate', 16.6480000, 120.3180000),
(32, 'Mameltac', 'North', 3900, 1.28, 'moderate', 'moderate', 16.6500000, 120.3200000),
(33, 'Masicong', 'North', 2800, 0.92, 'high', 'needs_attention', 16.6520000, 120.3220000),
(34, 'Nagyubuyuban', 'South', 3600, 1.18, 'moderate', 'moderate', 16.5900000, 120.3000000),
(35, 'Namtutan', 'North', 3400, 1.10, 'moderate', 'moderate', 16.6560000, 120.3260000),
(36, 'Narra Este', 'South', 3100, 1.05, 'moderate', 'moderate', 16.5960000, 120.3000000),
(37, 'Narra Oeste', 'South', 3000, 1.00, 'moderate', 'moderate', 16.5940000, 120.2980000),
(38, 'Pacpaco', 'East', 3800, 1.25, 'moderate', 'moderate', 16.6320000, 120.3420000),
(39, 'Pagdalagan', 'West', 3700, 1.20, 'moderate', 'moderate', 16.5780000, 120.2880000),
(40, 'Pagdaraoan', 'Central', 5800, 0.85, 'low', 'high', 16.6190000, 120.3200000),
(41, 'Pagudpud', 'West', 3600, 1.15, 'moderate', 'moderate', 16.5760000, 120.2860000),
(42, 'Pao Norte', 'East', 3800, 1.25, 'moderate', 'moderate', 16.6320000, 120.3420000),
(43, 'Pao Sur', 'East', 3600, 1.20, 'moderate', 'moderate', 16.6340000, 120.3440000),
(44, 'Parian', 'Central', 5800, 0.85, 'low', 'high', 16.6190000, 120.3200000),
(45, 'Pias', 'East', 4200, 1.38, 'low', 'high', 16.6360000, 120.3460000),
(46, 'Poro', 'East', 3500, 1.15, 'moderate', 'moderate', 16.6380000, 120.3480000),
(47, 'Puspus', 'East', 3100, 1.02, 'moderate', 'moderate', 16.6400000, 120.3500000),
(48, 'Sacyud', 'East', 4000, 1.32, 'moderate', 'moderate', 16.5980000, 120.2930000),
(49, 'Sagayad', 'West', 4000, 1.32, 'moderate', 'moderate', 16.5980000, 120.2930000),
(50, 'San Agustin', 'Central', 7500, 0.78, 'low', 'high', 16.6200000, 120.3210000),
(51, 'San Francisco', 'Central', 6900, 0.74, 'moderate', 'moderate', 16.6210000, 120.3220000),
(52, 'San Vicente', 'Central', 7100, 0.76, 'low', 'high', 16.6220000, 120.3230000),
(53, 'Santiago Norte', 'North', 3900, 1.28, 'moderate', 'moderate', 16.6500000, 120.3200000),
(54, 'Santiago Sur', 'North', 3800, 1.25, 'moderate', 'moderate', 16.6480000, 120.3180000),
(55, 'Saoay', 'West', 3700, 1.22, 'moderate', 'moderate', 16.5960000, 120.2910000),
(56, 'Sevilla', 'West', 3300, 1.08, 'moderate', 'needs_attention', 16.5940000, 120.2890000),
(57, 'Siboan-Otong', 'South', 3400, 1.10, 'moderate', 'moderate', 16.5900000, 120.2850000),
(58, 'Tanqui', 'West', 4100, 1.35, 'moderate', 'moderate', 16.5920000, 120.2870000),
(59, 'Tanquigan', 'West', 3500, 1.15, 'moderate', 'moderate', 16.5900000, 120.2850000);

-- --------------------------------------------------------

--
-- Table structure for table `businesses`
--

CREATE TABLE `businesses` (
  `id` int(10) UNSIGNED NOT NULL,
  `barangay_id` int(10) UNSIGNED NOT NULL,
  `registration_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `employment_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `investment_volume` decimal(14,2) NOT NULL DEFAULT 0.00,
  `market_revenue` decimal(14,2) NOT NULL DEFAULT 0.00,
  `report_month` tinyint(3) UNSIGNED NOT NULL,
  `report_year` smallint(5) UNSIGNED NOT NULL,
  `submitted_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `businesses`
--

INSERT INTO `businesses` (`id`, `barangay_id`, `registration_count`, `employment_rate`, `investment_volume`, `market_revenue`, `report_month`, `report_year`, `submitted_by`, `created_at`) VALUES
(1, 1, 1200, 62.50, 150000.00, 25000000.00, 1, 2026, 2, '2026-06-15 16:05:08'),
(2, 2, 1450, 68.00, 220000.00, 32000000.00, 1, 2026, 2, '2026-06-15 16:05:08'),
(3, 3, 980, 58.00, 95000.00, 18000000.00, 1, 2026, 2, '2026-06-15 16:05:08'),
(4, 4, 1100, 64.50, 180000.00, 28000000.00, 1, 2026, 2, '2026-06-15 16:05:08'),
(5, 5, 1600, 70.20, 310000.00, 45000000.00, 1, 2026, 2, '2026-06-15 16:05:08'),
(6, 1, 1250, 63.00, 165000.00, 26500000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(7, 2, 1500, 69.00, 235000.00, 33500000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(8, 3, 1020, 59.50, 105000.00, 19000000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(9, 4, 1150, 65.00, 195000.00, 29000000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(10, 5, 1680, 71.00, 325000.00, 47000000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(11, 6, 2100, 72.50, 420000.00, 62000000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(12, 7, 1950, 70.80, 380000.00, 58000000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(13, 8, 2200, 73.00, 450000.00, 68000000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(14, 9, 1800, 67.50, 290000.00, 42000000.00, 2, 2026, 2, '2026-06-15 16:05:08'),
(15, 10, 890, 55.00, 75000.00, 12000000.00, 2, 2026, 2, '2026-06-15 16:05:08');

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `implementing_office` varchar(150) NOT NULL,
  `planning_aspect` varchar(150) NOT NULL,
  `status` enum('delayed','in_progress','completed') NOT NULL DEFAULT 'in_progress',
  `progress_percent` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `deadline` date NOT NULL,
  `barangay_id` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`id`, `name`, `implementing_office`, `planning_aspect`, `status`, `progress_percent`, `deadline`, `barangay_id`, `created_by`, `updated_at`) VALUES
(1, 'Road Improvement Phase 1', 'City Engineering Office', 'Infrastructure', 'in_progress', 65, '2026-06-30', 1, 1, '2026-06-15 16:05:08'),
(2, 'Barangay Health Center Upgrade', 'City Health Office', 'Social Services', 'completed', 100, '2026-03-15', 2, 1, '2026-06-15 16:05:08'),
(3, 'Market Rehabilitation', 'CPDO', 'Economic Development', 'delayed', 35, '2026-04-30', 5, 1, '2026-06-15 16:05:08'),
(4, 'Drainage System Project', 'City Engineering Office', 'Infrastructure', 'in_progress', 50, '2026-08-31', 6, 1, '2026-06-15 16:05:08'),
(5, 'Livelihood Training Program', 'DSWD', 'Social Services', 'in_progress', 80, '2026-05-31', NULL, 1, '2026-06-15 16:05:08'),
(6, 'Solid Waste Management', 'ENRO', 'Environment', 'delayed', 25, '2026-03-31', NULL, 1, '2026-06-15 16:05:08'),
(7, 'Barangay Hall Renovation', 'CPDO', 'Infrastructure', 'in_progress', 70, '2026-07-15', 8, 1, '2026-06-15 16:05:08'),
(8, 'Street Lighting Installation', 'City Engineering Office', 'Infrastructure', 'completed', 100, '2026-02-28', 4, 1, '2026-06-15 16:05:08'),
(9, 'Water Supply Extension', 'Water District', 'Utilities', 'in_progress', 55, '2026-09-30', 10, 1, '2026-06-15 16:05:08'),
(10, 'Agricultural Support Program', 'DA Office', 'Agriculture', 'delayed', 40, '2026-05-15', 12, 1, '2026-06-15 16:05:08'),
(11, 'Youth Skills Development', 'TESDA', 'Education', 'in_progress', 60, '2026-06-30', NULL, 1, '2026-06-15 16:05:08'),
(12, 'Coastal Protection Initiative', 'ENRO', 'Environment', 'in_progress', 45, '2026-10-31', 15, 1, '2026-06-15 16:05:08');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `barangay_id` int(10) UNSIGNED NOT NULL,
  `submitted_by` int(10) UNSIGNED NOT NULL,
  `submission_date` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `barangay_id`, `submitted_by`, `submission_date`, `status`, `remarks`) VALUES
(1, 1, 2, '2026-06-15 16:05:08', 'approved', 'Data verified and approved.'),
(2, 2, 2, '2026-06-15 16:05:08', 'approved', NULL),
(3, 3, 2, '2026-06-15 16:05:08', 'pending', NULL),
(4, 10, 2, '2026-06-15 16:05:08', 'pending', NULL),
(5, 12, 2, '2026-06-15 16:05:08', 'rejected', 'Incomplete employment rate data.');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('coordinator','encoder','analyst') NOT NULL DEFAULT 'analyst',
  `barangay_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `barangay_id`, `status`, `created_at`) VALUES
(1, 'CPDO Coordinator', 'admin@cpdo.gov.ph', '$2y$10$Q6ymw2mS4cXAHfSPGVaC8e3QnD6uvNjAgiziDwRpJImf5sB0zNlr2', 'coordinator', NULL, 'active', '2026-06-15 16:05:08'),
(2, 'Juan Dela Cruz', 'encoder@cpdo.gov.ph', '$2y$10$dxCVWE5mlBD.1yaTv5Z7z.PVTAzDOS29s4B4YiKv0wag8jTT9f6dS', 'encoder', 1, 'active', '2026-06-15 16:05:08'),
(3, 'Ana Reyes', 'analyst@cpdo.gov.ph', '$2y$10$oaMv.bSaQ6w5j5kDmrijg.xb/VaLCeza4M.H9d/rff9X7RmNFuMeO', 'analyst', NULL, 'active', '2026-06-15 16:05:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_logs_user` (`user_id`);

--
-- Indexes for table `agricultural_data`
--
ALTER TABLE `agricultural_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barangay_id` (`barangay_id`),
  ADD KEY `submitted_by` (`submitted_by`),
  ADD KEY `idx_agri_period` (`report_year`,`report_month`);

--
-- Indexes for table `alerts`
--
ALTER TABLE `alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alerts_read` (`is_read`);

--
-- Indexes for table `barangays`
--
ALTER TABLE `barangays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_barangays_zone` (`zone`),
  ADD KEY `idx_barangays_performance` (`performance_status`);

--
-- Indexes for table `businesses`
--
ALTER TABLE `businesses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `submitted_by` (`submitted_by`),
  ADD KEY `idx_businesses_period` (`report_year`,`report_month`),
  ADD KEY `idx_businesses_barangay` (`barangay_id`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barangay_id` (`barangay_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_programs_status` (`status`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barangay_id` (`barangay_id`),
  ADD KEY `submitted_by` (`submitted_by`),
  ADD KEY `idx_submissions_status` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_barangay` (`barangay_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agricultural_data`
--
ALTER TABLE `agricultural_data`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `alerts`
--
ALTER TABLE `alerts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `barangays`
--
ALTER TABLE `barangays`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `businesses`
--
ALTER TABLE `businesses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `agricultural_data`
--
ALTER TABLE `agricultural_data`
  ADD CONSTRAINT `agricultural_data_ibfk_1` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agricultural_data_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `businesses`
--
ALTER TABLE `businesses`
  ADD CONSTRAINT `businesses_ibfk_1` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `businesses_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `programs`
--
ALTER TABLE `programs`
  ADD CONSTRAINT `programs_ibfk_1` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `programs_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_barangay` FOREIGN KEY (`barangay_id`) REFERENCES `barangays` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
