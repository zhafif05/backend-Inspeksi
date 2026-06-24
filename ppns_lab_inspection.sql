-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 23 Jun 2026 pada 05.49
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ppns_lab_inspection`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `inspections`
--

CREATE TABLE `inspections` (
  `id` int(11) NOT NULL,
  `laboratory_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `tahun` year(4) NOT NULL,
  `semester` enum('GANJIL','GENAP') NOT NULL,
  `inspector_id` int(11) NOT NULL,
  `tanggal_inspeksi` datetime NOT NULL,
  `catatan` text DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `inspections`
--

INSERT INTO `inspections` (`id`, `laboratory_id`, `item_id`, `tahun`, `semester`, `inspector_id`, `tanggal_inspeksi`, `catatan`, `foto`, `created_at`, `updated_at`) VALUES
(21, 11, 21, '2026', 'GENAP', 3, '2026-06-12 10:35:47', '', NULL, '2026-06-12 03:35:47', '2026-06-18 07:31:09'),
(22, 11, 29, '2026', 'GENAP', 3, '2026-06-13 20:19:35', 'sacwQSFC', '/uploads/foto-1781356775575-350278554.jpeg', '2026-06-13 13:19:35', '2026-06-18 07:31:09'),
(23, 10, 30, '2026', 'GENAP', 11, '2026-06-13 23:13:47', 'wqdCX', '/uploads/foto-1781367227294-801425556.jpeg', '2026-06-13 16:13:47', '2026-06-18 07:31:09'),
(24, 12, 31, '2026', 'GENAP', 3, '2026-06-15 13:44:14', '', NULL, '2026-06-15 06:44:14', '2026-06-18 07:31:09'),
(25, 10, 41, '2026', 'GENAP', 11, '2026-06-15 13:46:58', 'ASCw', '/uploads/foto-1781506018133-434570890.jpeg', '2026-06-15 06:46:58', '2026-06-18 07:31:09'),
(27, 14, 57, '2026', 'GENAP', 15, '2026-06-17 15:16:12', 'Peralatan Sudah Di cek Perlu Perbaikan ', '/uploads/foto-1781684171989-677903594.jpeg', '2026-06-17 08:16:12', '2026-06-18 07:31:09'),
(28, 13, 62, '2026', 'GENAP', 3, '2026-06-18 12:46:13', 's', '/uploads/foto-1781761573550-416786970.jpeg', '2026-06-18 05:46:13', '2026-06-18 07:31:09'),
(29, 13, 65, '2026', 'GENAP', 11, '2026-06-18 13:32:41', 'sx', '/uploads/foto-1781764361086-599392418.jpeg', '2026-06-18 06:32:41', '2026-06-18 07:31:09'),
(30, 13, 66, '2026', 'GENAP', 3, '2026-06-18 13:34:41', 'sx', '/uploads/foto-1781764481703-311542805.jpeg', '2026-06-18 06:34:41', '2026-06-18 07:31:09'),
(31, 13, 64, '2026', 'GENAP', 11, '2026-06-18 13:39:57', 'ad5', '/uploads/foto-1781764797814-160127520.jpeg', '2026-06-18 06:39:57', '2026-06-18 07:31:09'),
(202, 11, 21, '2025', 'GANJIL', 3, '2025-09-01 08:00:00', NULL, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(204, 11, 29, '2025', 'GANJIL', 3, '2025-09-10 08:00:00', NULL, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(205, 10, 30, '2025', 'GANJIL', 11, '2025-08-20 08:00:00', NULL, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(206, 10, 30, '2025', 'GENAP', 11, '2025-02-20 08:00:00', NULL, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(207, 14, 57, '2025', 'GANJIL', 11, '2025-03-15 08:00:00', NULL, NULL, '2026-06-18 08:28:11', '2026-06-18 08:28:11');

-- --------------------------------------------------------

--
-- Struktur dari tabel `inspection_categories`
--

CREATE TABLE `inspection_categories` (
  `id` int(11) NOT NULL,
  `nama_kategori` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `urutan` int(11) DEFAULT 1,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED',
  `alasan_penolakan` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `laboratory_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `inspection_categories`
--

INSERT INTO `inspection_categories` (`id`, `nama_kategori`, `deskripsi`, `urutan`, `status`, `alasan_penolakan`, `created_by`, `laboratory_id`, `item_id`, `created_at`, `updated_at`) VALUES
(67, 'MAKAN', '11', 1, 'APPROVED', NULL, 3, 10, NULL, '2026-06-10 06:33:02', '2026-06-10 06:33:27'),
(70, 'omkegas', 'omke gas', 1, 'APPROVED', NULL, 3, 11, 21, '2026-06-12 03:35:10', '2026-06-12 03:35:22'),
(71, 'CONTOH1', 'dd', 1, 'APPROVED', NULL, 3, 10, NULL, '2026-06-12 07:24:04', '2026-06-12 07:24:11'),
(72, 'contoh', NULL, 1, 'APPROVED', NULL, 3, 11, 29, '2026-06-13 13:08:53', '2026-06-13 13:09:07'),
(73, 'contoh  2', NULL, 2, 'APPROVED', NULL, 3, 11, 29, '2026-06-13 13:08:53', '2026-06-13 13:09:08'),
(74, 'eqawfcs', NULL, 1, 'APPROVED', NULL, 11, 10, 30, '2026-06-13 16:05:13', '2026-06-13 16:13:22'),
(75, 'fwqeqw3f', NULL, 2, 'APPROVED', NULL, 11, 10, 30, '2026-06-13 16:05:13', '2026-06-13 16:13:23'),
(76, 'KATEGORI-1', NULL, 1, 'APPROVED', NULL, 3, 12, 31, '2026-06-15 04:08:37', '2026-06-15 06:17:37'),
(77, 'KATEGORI-2', NULL, 2, 'APPROVED', NULL, 3, 12, 31, '2026-06-15 04:08:37', '2026-06-15 04:16:00'),
(78, 'SCC', NULL, 1, 'APPROVED', NULL, 11, 10, 41, '2026-06-15 04:37:02', '2026-06-15 04:37:21'),
(79, 'ACSWFQC', NULL, 2, 'APPROVED', NULL, 11, 10, 41, '2026-06-15 04:37:02', '2026-06-15 06:46:43'),
(80, 'KATEGORI-3', NULL, 1, 'APPROVED', NULL, 3, 12, 31, '2026-06-15 06:22:04', '2026-06-15 06:22:46'),
(81, 'TES1.1', NULL, 1, 'APPROVED', NULL, 3, 13, NULL, '2026-06-15 07:50:04', '2026-06-15 07:50:17'),
(82, 'TES1.2', NULL, 2, 'APPROVED', NULL, 3, 13, NULL, '2026-06-15 07:50:04', '2026-06-15 08:15:31'),
(83, 'fdsf', NULL, 1, 'APPROVED', NULL, 11, 10, NULL, '2026-06-15 08:25:12', '2026-06-15 08:25:42'),
(84, 'dfsd', NULL, 2, 'APPROVED', NULL, 11, 10, NULL, '2026-06-15 08:25:12', '2026-06-15 08:26:17'),
(85, 'KATEGORI-1', NULL, 1, 'APPROVED', NULL, 11, 10, NULL, '2026-06-15 08:59:31', '2026-06-15 08:59:59'),
(86, 'alat1', NULL, 1, 'APPROVED', NULL, 3, 10, NULL, '2026-06-15 09:51:30', '2026-06-15 09:51:38'),
(87, 'alat2', NULL, 2, 'APPROVED', NULL, 3, 10, NULL, '2026-06-15 09:51:30', '2026-06-15 09:52:10'),
(88, 'Pemeriksaan Fisik dan Umum', NULL, 1, 'APPROVED', NULL, 15, 14, 57, '2026-06-17 08:11:49', '2026-06-17 08:13:25'),
(89, 'Pemeriksaan Sistem Optik', NULL, 2, 'APPROVED', NULL, 15, 14, 57, '2026-06-17 08:11:49', '2026-06-17 08:13:27'),
(90, 'Pemeriksaan Kompartemen Sampel (Sample Holder)', NULL, 3, 'APPROVED', NULL, 15, 14, 57, '2026-06-17 08:11:49', '2026-06-17 08:14:59'),
(91, 'a', NULL, 1, 'APPROVED', NULL, 11, 10, NULL, '2026-06-17 09:36:57', '2026-06-18 03:37:05'),
(92, 's', NULL, 1, 'APPROVED', NULL, 11, 10, 62, '2026-06-18 05:45:46', '2026-06-18 05:46:02'),
(94, 'sd1', NULL, 1, 'APPROVED', NULL, 3, 13, NULL, '2026-06-18 05:47:31', '2026-06-18 05:47:34'),
(95, 'sd3', NULL, 2, 'APPROVED', NULL, 3, 13, NULL, '2026-06-18 05:47:31', '2026-06-18 05:47:36'),
(96, 'sd1', NULL, 1, 'APPROVED', NULL, 11, 10, 64, '2026-06-18 05:48:39', '2026-06-18 05:48:52'),
(97, 'sd3', NULL, 2, 'APPROVED', NULL, 11, 10, 64, '2026-06-18 05:48:39', '2026-06-18 05:48:53'),
(98, 'sx1', NULL, 1, 'APPROVED', NULL, 11, 10, 65, '2026-06-18 05:58:31', '2026-06-18 05:58:41'),
(99, 'sx3', NULL, 2, 'APPROVED', NULL, 11, 10, 65, '2026-06-18 05:58:31', '2026-06-18 06:09:32'),
(100, 'sz', NULL, 1, 'APPROVED', NULL, 11, 10, 65, '2026-06-18 06:09:05', '2026-06-18 06:09:31'),
(101, 'sv', NULL, 1, 'APPROVED', NULL, 11, 10, 66, '2026-06-18 06:10:27', '2026-06-18 06:10:36'),
(103, 'p', NULL, 1, 'APPROVED', NULL, 11, 10, NULL, '2026-06-18 08:14:06', '2026-06-19 03:26:38');

-- --------------------------------------------------------

--
-- Struktur dari tabel `inspection_monthly_reviews`
--

CREATE TABLE `inspection_monthly_reviews` (
  `id` int(11) NOT NULL,
  `inspection_id` int(11) NOT NULL,
  `bulan_ke` int(11) NOT NULL,
  `review_status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `reviewed_by` int(11) DEFAULT NULL,
  `alasan_penolakan` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `inspection_monthly_reviews`
--

INSERT INTO `inspection_monthly_reviews` (`id`, `inspection_id`, `bulan_ke`, `review_status`, `reviewed_by`, `alasan_penolakan`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(43, 21, 1, 'REJECTED', 3, 'ga jelas', '2026-06-12 03:36:00', '2026-06-12 03:35:47', '2026-06-12 03:36:00'),
(44, 22, 1, 'APPROVED', 3, NULL, '2026-06-13 13:41:17', '2026-06-13 13:19:35', '2026-06-13 13:41:17'),
(46, 22, 2, 'APPROVED', 3, NULL, '2026-06-13 14:24:41', '2026-06-13 13:57:55', '2026-06-13 14:24:41'),
(47, 22, 3, 'APPROVED', 3, NULL, '2026-06-13 14:39:32', '2026-06-13 14:32:02', '2026-06-13 14:39:32'),
(48, 22, 4, 'APPROVED', 3, NULL, '2026-06-13 14:41:11', '2026-06-13 14:40:00', '2026-06-13 14:41:11'),
(50, 22, 5, 'APPROVED', 3, NULL, '2026-06-13 14:41:35', '2026-06-13 14:41:30', '2026-06-13 14:41:35'),
(51, 22, 6, 'APPROVED', 3, NULL, '2026-06-13 14:41:58', '2026-06-13 14:41:52', '2026-06-13 14:41:58'),
(52, 23, 1, 'APPROVED', 3, NULL, '2026-06-13 16:14:45', '2026-06-13 16:13:47', '2026-06-13 16:14:45'),
(53, 23, 2, 'APPROVED', 3, NULL, '2026-06-13 16:15:21', '2026-06-13 16:15:09', '2026-06-13 16:15:21'),
(54, 23, 3, 'APPROVED', 3, NULL, '2026-06-13 16:15:41', '2026-06-13 16:15:30', '2026-06-13 16:15:41'),
(55, 23, 4, 'APPROVED', 3, NULL, '2026-06-13 16:15:58', '2026-06-13 16:15:50', '2026-06-13 16:15:58'),
(56, 23, 5, 'APPROVED', 3, NULL, '2026-06-13 16:16:26', '2026-06-13 16:16:16', '2026-06-13 16:16:26'),
(57, 23, 6, 'APPROVED', 3, NULL, '2026-06-13 16:16:44', '2026-06-13 16:16:38', '2026-06-13 16:16:44'),
(58, 24, 1, 'APPROVED', 3, NULL, '2026-06-15 06:49:01', '2026-06-15 06:44:14', '2026-06-15 06:49:01'),
(59, 25, 1, 'APPROVED', 3, NULL, '2026-06-17 03:40:37', '2026-06-15 06:46:58', '2026-06-17 03:40:37'),
(60, 24, 2, 'APPROVED', 3, NULL, '2026-06-15 07:13:29', '2026-06-15 07:09:31', '2026-06-15 07:13:29'),
(61, 24, 3, 'APPROVED', 3, NULL, '2026-06-15 07:48:20', '2026-06-15 07:19:12', '2026-06-15 07:48:20'),
(64, 24, 4, 'APPROVED', 3, NULL, '2026-06-17 03:19:29', '2026-06-17 03:17:23', '2026-06-17 03:19:29'),
(65, 24, 5, 'APPROVED', 3, NULL, '2026-06-17 03:29:27', '2026-06-17 03:19:52', '2026-06-17 03:29:27'),
(67, 24, 6, 'APPROVED', 3, NULL, '2026-06-17 03:29:45', '2026-06-17 03:29:41', '2026-06-17 03:29:45'),
(68, 25, 2, 'APPROVED', 3, NULL, '2026-06-17 05:08:02', '2026-06-17 05:07:54', '2026-06-17 05:08:02'),
(69, 25, 3, 'APPROVED', 3, NULL, '2026-06-17 05:08:15', '2026-06-17 05:08:12', '2026-06-17 05:08:15'),
(70, 25, 4, 'APPROVED', 3, NULL, '2026-06-17 05:08:30', '2026-06-17 05:08:27', '2026-06-17 05:08:30'),
(71, 25, 5, 'APPROVED', 3, NULL, '2026-06-17 05:08:42', '2026-06-17 05:08:39', '2026-06-17 05:08:42'),
(72, 25, 6, 'APPROVED', 3, NULL, '2026-06-17 05:08:54', '2026-06-17 05:08:50', '2026-06-17 05:08:54'),
(73, 27, 1, 'APPROVED', 3, NULL, '2026-06-17 08:17:47', '2026-06-17 08:16:12', '2026-06-17 08:17:47'),
(75, 27, 2, 'APPROVED', 3, NULL, '2026-06-17 08:27:16', '2026-06-17 08:27:09', '2026-06-17 08:27:16'),
(76, 27, 3, 'APPROVED', 3, NULL, '2026-06-17 08:27:39', '2026-06-17 08:27:30', '2026-06-17 08:27:39'),
(77, 27, 4, 'APPROVED', 3, NULL, '2026-06-17 08:28:01', '2026-06-17 08:27:57', '2026-06-17 08:28:01'),
(78, 27, 5, 'APPROVED', 3, NULL, '2026-06-17 08:28:20', '2026-06-17 08:28:16', '2026-06-17 08:28:20'),
(79, 27, 6, 'APPROVED', 3, NULL, '2026-06-17 08:28:37', '2026-06-17 08:28:34', '2026-06-17 08:28:37'),
(80, 28, 1, 'APPROVED', 3, NULL, '2026-06-18 05:46:40', '2026-06-18 05:46:13', '2026-06-18 05:46:40'),
(81, 29, 1, 'APPROVED', 3, NULL, '2026-06-18 06:33:17', '2026-06-18 06:32:41', '2026-06-18 06:33:17'),
(82, 30, 1, 'APPROVED', 3, NULL, '2026-06-18 06:40:13', '2026-06-18 06:34:41', '2026-06-18 06:40:13'),
(83, 31, 1, 'APPROVED', 3, NULL, '2026-06-18 09:44:40', '2026-06-18 06:39:57', '2026-06-18 09:44:40'),
(97, 205, 1, 'APPROVED', 11, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(98, 205, 2, 'APPROVED', 11, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(99, 206, 1, 'APPROVED', 3, NULL, '2026-06-18 08:12:44', '2026-06-18 07:49:53', '2026-06-18 08:12:44'),
(100, 202, 1, 'APPROVED', 3, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(101, 202, 2, 'REJECTED', 3, 'Kerusakan alat tidak dilaporkan', '2026-06-18 07:49:53', '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(102, 204, 1, 'APPROVED', 3, NULL, '2026-06-18 07:49:53', '2026-06-18 07:49:53', '2026-06-18 07:49:53'),
(103, 29, 2, 'APPROVED', 3, NULL, '2026-06-18 09:44:24', '2026-06-18 09:44:03', '2026-06-18 09:44:24'),
(104, 30, 2, 'APPROVED', 3, NULL, '2026-06-22 07:53:19', '2026-06-22 07:48:12', '2026-06-22 07:53:19'),
(105, 30, 3, 'PENDING', NULL, NULL, NULL, '2026-06-22 08:06:20', '2026-06-22 08:06:20'),
(106, 29, 3, 'PENDING', NULL, NULL, NULL, '2026-06-22 08:47:26', '2026-06-22 08:47:26'),
(107, 31, 2, 'PENDING', NULL, NULL, NULL, '2026-06-22 08:47:32', '2026-06-22 08:47:32'),
(108, 28, 2, 'PENDING', NULL, NULL, NULL, '2026-06-22 08:47:39', '2026-06-22 08:47:39');

-- --------------------------------------------------------

--
-- Struktur dari tabel `inspection_results`
--

CREATE TABLE `inspection_results` (
  `id` int(11) NOT NULL,
  `inspection_id` int(11) NOT NULL,
  `subitem_id` int(11) NOT NULL,
  `bulan_ke` int(11) NOT NULL DEFAULT 1,
  `status` enum('B','K','N/A') NOT NULL DEFAULT 'B',
  `alasan_penolakan` text DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `inspection_results`
--

INSERT INTO `inspection_results` (`id`, `inspection_id`, `subitem_id`, `bulan_ke`, `status`, `alasan_penolakan`, `keterangan`, `approval_status`, `created_at`) VALUES
(596, 21, 184, 1, 'B', 'ga jelas', 'Baik', 'REJECTED', '2026-06-12 03:35:47'),
(597, 21, 185, 1, 'B', 'ga jelas', 'Baik', 'REJECTED', '2026-06-12 03:35:47'),
(598, 21, 186, 1, 'B', 'ga jelas', 'Baik', 'REJECTED', '2026-06-12 03:35:47'),
(599, 21, 187, 1, 'K', 'ga jelas', 'Kurang', 'REJECTED', '2026-06-12 03:35:47'),
(600, 21, 188, 1, 'K', 'ga jelas', 'Kurang', 'REJECTED', '2026-06-12 03:35:47'),
(601, 21, 189, 1, 'B', 'ga jelas', 'Baik', 'REJECTED', '2026-06-12 03:35:47'),
(602, 22, 193, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:19:35'),
(603, 22, 194, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:19:35'),
(604, 22, 195, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:19:35'),
(605, 22, 196, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:19:35'),
(606, 22, 197, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:19:35'),
(607, 22, 198, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:19:35'),
(614, 22, 193, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:57:55'),
(615, 22, 194, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 13:57:55'),
(616, 22, 195, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:57:55'),
(617, 22, 196, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:57:55'),
(618, 22, 197, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 13:57:55'),
(619, 22, 198, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 13:57:55'),
(620, 22, 193, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:32:02'),
(621, 22, 194, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:32:02'),
(622, 22, 195, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:32:02'),
(623, 22, 196, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:32:02'),
(624, 22, 197, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:32:02'),
(625, 22, 198, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:32:02'),
(626, 22, 193, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:40:00'),
(627, 22, 194, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:40:00'),
(628, 22, 195, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:40:00'),
(629, 22, 196, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:40:00'),
(630, 22, 197, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:40:00'),
(631, 22, 198, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:40:00'),
(638, 22, 193, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:30'),
(639, 22, 194, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:30'),
(640, 22, 195, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:30'),
(641, 22, 196, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:30'),
(642, 22, 197, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:30'),
(643, 22, 198, 5, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 14:41:30'),
(644, 22, 193, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:52'),
(645, 22, 194, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:52'),
(646, 22, 195, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 14:41:52'),
(647, 22, 196, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:52'),
(648, 22, 197, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:52'),
(649, 22, 198, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 14:41:52'),
(650, 23, 199, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:13:47'),
(651, 23, 200, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:13:47'),
(652, 23, 201, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:13:47'),
(653, 23, 202, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:13:47'),
(654, 23, 203, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:13:47'),
(655, 23, 204, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:13:47'),
(656, 23, 199, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:09'),
(657, 23, 200, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:09'),
(658, 23, 201, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:09'),
(659, 23, 202, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:09'),
(660, 23, 203, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:09'),
(661, 23, 204, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:09'),
(662, 23, 199, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:30'),
(663, 23, 200, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:30'),
(664, 23, 201, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:30'),
(665, 23, 202, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:30'),
(666, 23, 203, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:30'),
(667, 23, 204, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:15:30'),
(668, 23, 199, 4, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:50'),
(669, 23, 200, 4, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:50'),
(670, 23, 201, 4, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:50'),
(671, 23, 202, 4, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:50'),
(672, 23, 203, 4, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:50'),
(673, 23, 204, 4, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:15:50'),
(674, 23, 199, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:16'),
(675, 23, 200, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:16'),
(676, 23, 201, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:16'),
(677, 23, 202, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:16'),
(678, 23, 203, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:16'),
(679, 23, 204, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:16'),
(680, 23, 199, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:16:38'),
(681, 23, 200, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:38'),
(682, 23, 201, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:16:38'),
(683, 23, 202, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:16:38'),
(684, 23, 203, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-13 16:16:38'),
(685, 23, 204, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-13 16:16:38'),
(686, 24, 205, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:44:14'),
(687, 24, 206, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 06:44:14'),
(688, 24, 207, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:44:14'),
(689, 24, 216, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 06:44:14'),
(690, 24, 217, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:44:14'),
(691, 24, 218, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 06:44:14'),
(692, 24, 208, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:44:14'),
(693, 24, 209, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 06:44:14'),
(694, 25, 210, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:46:58'),
(695, 25, 211, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:46:58'),
(696, 25, 212, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:46:58'),
(697, 25, 213, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:46:58'),
(698, 25, 214, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:46:58'),
(699, 25, 215, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 06:46:58'),
(700, 24, 205, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:09:31'),
(701, 24, 206, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 07:09:31'),
(702, 24, 207, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:09:31'),
(703, 24, 216, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 07:09:31'),
(704, 24, 217, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:09:31'),
(705, 24, 218, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:09:31'),
(706, 24, 208, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 07:09:31'),
(707, 24, 209, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 07:09:31'),
(708, 24, 205, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:19:11'),
(709, 24, 206, 3, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 07:19:11'),
(710, 24, 207, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:19:11'),
(711, 24, 216, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:19:11'),
(712, 24, 217, 3, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 07:19:11'),
(713, 24, 218, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:19:12'),
(714, 24, 208, 3, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-15 07:19:12'),
(715, 24, 209, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-15 07:19:12'),
(730, 24, 205, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(731, 24, 206, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(732, 24, 207, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(733, 24, 216, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(734, 24, 217, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(735, 24, 218, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(736, 24, 208, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(737, 24, 209, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:17:23'),
(738, 24, 205, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(739, 24, 206, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(740, 24, 207, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(741, 24, 216, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(742, 24, 217, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(743, 24, 218, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(744, 24, 208, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(745, 24, 209, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:19:52'),
(754, 24, 205, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:29:41'),
(755, 24, 206, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 03:29:41'),
(756, 24, 207, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:29:41'),
(757, 24, 216, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 03:29:41'),
(758, 24, 217, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:29:41'),
(759, 24, 218, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 03:29:41'),
(760, 24, 208, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 03:29:41'),
(761, 24, 209, 6, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 03:29:41'),
(762, 25, 210, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:07:54'),
(763, 25, 211, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 05:07:54'),
(764, 25, 212, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:07:54'),
(765, 25, 213, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 05:07:54'),
(766, 25, 214, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:07:54'),
(767, 25, 215, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 05:07:54'),
(768, 25, 210, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:12'),
(769, 25, 211, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:12'),
(770, 25, 212, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:12'),
(771, 25, 213, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:12'),
(772, 25, 214, 3, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 05:08:12'),
(773, 25, 215, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:12'),
(774, 25, 210, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:27'),
(775, 25, 211, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:27'),
(776, 25, 212, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:27'),
(777, 25, 213, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:27'),
(778, 25, 214, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:27'),
(779, 25, 215, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:27'),
(780, 25, 210, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:39'),
(781, 25, 211, 5, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 05:08:39'),
(782, 25, 212, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:39'),
(783, 25, 213, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:39'),
(784, 25, 214, 5, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 05:08:39'),
(785, 25, 215, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:39'),
(786, 25, 210, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:50'),
(787, 25, 211, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:50'),
(788, 25, 212, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:50'),
(789, 25, 213, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:50'),
(790, 25, 214, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:50'),
(791, 25, 215, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 05:08:50'),
(792, 27, 235, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:16:12'),
(793, 27, 236, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:16:12'),
(794, 27, 237, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 08:16:12'),
(795, 27, 238, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:16:12'),
(796, 27, 239, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:16:12'),
(797, 27, 240, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 08:16:12'),
(798, 27, 241, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:16:12'),
(799, 27, 242, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 08:16:12'),
(808, 27, 235, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:09'),
(809, 27, 236, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:09'),
(810, 27, 237, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:09'),
(811, 27, 238, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:09'),
(812, 27, 239, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:09'),
(813, 27, 240, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 08:27:09'),
(814, 27, 241, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 08:27:09'),
(815, 27, 242, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 08:27:09'),
(816, 27, 235, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:30'),
(817, 27, 236, 3, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-17 08:27:30'),
(818, 27, 237, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:30'),
(819, 27, 238, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:30'),
(820, 27, 239, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:30'),
(821, 27, 240, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:30'),
(822, 27, 241, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:30'),
(823, 27, 242, 3, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:30'),
(824, 27, 235, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(825, 27, 236, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(826, 27, 237, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(827, 27, 238, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(828, 27, 239, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(829, 27, 240, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(830, 27, 241, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(831, 27, 242, 4, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:27:57'),
(832, 27, 235, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(833, 27, 236, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(834, 27, 237, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(835, 27, 238, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(836, 27, 239, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(837, 27, 240, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(838, 27, 241, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(839, 27, 242, 5, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:16'),
(840, 27, 235, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(841, 27, 236, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(842, 27, 237, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(843, 27, 238, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(844, 27, 239, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(845, 27, 240, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(846, 27, 241, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(847, 27, 242, 6, 'B', NULL, 'Baik', 'APPROVED', '2026-06-17 08:28:34'),
(848, 28, 244, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-18 05:46:13'),
(849, 29, 250, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-18 06:32:41'),
(850, 29, 252, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-18 06:32:41'),
(851, 29, 251, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-18 06:32:41'),
(852, 30, 253, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-18 06:34:41'),
(853, 31, 248, 1, 'B', NULL, 'Baik', 'APPROVED', '2026-06-18 06:39:57'),
(854, 31, 249, 1, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-18 06:39:57'),
(966, 205, 199, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(967, 205, 200, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(968, 205, 201, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(969, 205, 202, 1, 'K', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(970, 205, 203, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(971, 205, 204, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(972, 205, 199, 2, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(973, 205, 200, 2, 'K', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(974, 205, 201, 2, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(975, 205, 202, 2, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(976, 205, 203, 2, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(977, 205, 204, 2, 'K', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(978, 206, 199, 1, 'K', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(979, 206, 200, 1, 'K', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(980, 206, 201, 1, 'N/A', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(981, 206, 202, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(982, 206, 203, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(983, 206, 204, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(984, 202, 184, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(985, 202, 185, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(986, 202, 186, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(987, 202, 187, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(988, 202, 188, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(989, 202, 189, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(990, 202, 184, 2, 'K', NULL, NULL, 'REJECTED', '2026-06-18 07:49:53'),
(991, 202, 185, 2, 'K', NULL, NULL, 'REJECTED', '2026-06-18 07:49:53'),
(992, 202, 186, 2, 'K', NULL, NULL, 'REJECTED', '2026-06-18 07:49:53'),
(993, 202, 187, 2, 'B', NULL, NULL, 'REJECTED', '2026-06-18 07:49:53'),
(994, 202, 188, 2, 'B', NULL, NULL, 'REJECTED', '2026-06-18 07:49:53'),
(995, 202, 189, 2, 'K', NULL, NULL, 'REJECTED', '2026-06-18 07:49:53'),
(996, 204, 193, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(997, 204, 194, 1, 'N/A', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(998, 204, 195, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(999, 204, 196, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(1000, 204, 197, 1, 'K', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(1001, 204, 198, 1, 'B', NULL, NULL, 'APPROVED', '2026-06-18 07:49:53'),
(1002, 207, 235, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1003, 207, 236, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1004, 207, 237, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1005, 207, 238, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1006, 207, 239, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1007, 207, 240, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1008, 207, 241, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1009, 207, 242, 1, 'B', NULL, NULL, 'PENDING', '2026-06-18 08:28:11'),
(1010, 29, 250, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-18 09:44:03'),
(1011, 29, 252, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-18 09:44:03'),
(1013, 29, 251, 2, 'K', NULL, 'Kurang', 'APPROVED', '2026-06-18 09:44:03'),
(1014, 30, 253, 2, 'B', NULL, 'Baik', 'APPROVED', '2026-06-22 07:48:12'),
(1015, 30, 253, 3, 'K', NULL, 'Kurang', 'PENDING', '2026-06-22 08:06:20'),
(1016, 29, 250, 3, 'K', NULL, 'Kurang', 'PENDING', '2026-06-22 08:47:26'),
(1017, 29, 252, 3, 'B', NULL, 'Baik', 'PENDING', '2026-06-22 08:47:26'),
(1018, 29, 251, 3, 'K', NULL, 'Kurang', 'PENDING', '2026-06-22 08:47:26'),
(1019, 31, 248, 2, 'K', NULL, 'Kurang', 'PENDING', '2026-06-22 08:47:32'),
(1020, 31, 249, 2, 'K', NULL, 'Kurang', 'PENDING', '2026-06-22 08:47:32'),
(1021, 28, 244, 2, 'B', NULL, 'Baik', 'PENDING', '2026-06-22 08:47:39');

-- --------------------------------------------------------

--
-- Struktur dari tabel `inspection_subitems`
--

CREATE TABLE `inspection_subitems` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `nama_subitem` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `urutan` int(11) DEFAULT 1,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED',
  `alasan_penolakan` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `inspection_subitems`
--

INSERT INTO `inspection_subitems` (`id`, `category_id`, `nama_subitem`, `deskripsi`, `urutan`, `status`, `alasan_penolakan`, `created_by`, `created_at`, `updated_at`) VALUES
(176, 67, 'MIE', NULL, 1, 'APPROVED', NULL, 3, '2026-06-10 06:33:02', '2026-06-10 06:33:28'),
(177, 67, 'TAHU', NULL, 2, 'APPROVED', NULL, 3, '2026-06-10 06:33:02', '2026-06-10 06:33:28'),
(178, 67, 'TEMPE', NULL, 3, 'APPROVED', NULL, 3, '2026-06-10 06:33:02', '2026-06-10 06:33:37'),
(179, 67, 'RENDANG', NULL, 4, 'APPROVED', NULL, 3, '2026-06-10 06:33:02', '2026-06-10 06:33:37'),
(180, 67, 'SOTO', NULL, 5, 'APPROVED', NULL, 3, '2026-06-10 06:33:02', '2026-06-10 06:33:37'),
(181, 67, 'ODADING', NULL, 6, 'APPROVED', NULL, 3, '2026-06-10 06:33:02', '2026-06-10 06:33:37'),
(184, 70, 'omke gas', NULL, 1, 'APPROVED', NULL, 3, '2026-06-12 03:35:10', '2026-06-12 03:35:23'),
(185, 70, 'omke gas', NULL, 2, 'APPROVED', NULL, 3, '2026-06-12 03:35:10', '2026-06-12 03:35:24'),
(186, 70, 'omke gas', NULL, 3, 'APPROVED', NULL, 3, '2026-06-12 03:35:10', '2026-06-12 03:35:25'),
(187, 70, 'omke gas', NULL, 4, 'APPROVED', NULL, 3, '2026-06-12 03:35:10', '2026-06-12 03:35:29'),
(188, 70, 'omke gas', NULL, 5, 'APPROVED', NULL, 3, '2026-06-12 03:35:10', '2026-06-12 03:35:31'),
(189, 70, 'omke gas', NULL, 6, 'APPROVED', NULL, 3, '2026-06-12 03:35:10', '2026-06-12 03:35:33'),
(190, 71, 'contoh 2', NULL, 1, 'APPROVED', NULL, 3, '2026-06-12 07:24:04', '2026-06-12 07:24:13'),
(191, 71, 'contoh 3', NULL, 2, 'APPROVED', NULL, 3, '2026-06-12 07:24:04', '2026-06-12 07:24:14'),
(192, 71, 'contoh 4', NULL, 3, 'APPROVED', NULL, 3, '2026-06-12 07:24:04', '2026-06-12 07:24:15'),
(193, 72, 'contoh1', NULL, 1, 'APPROVED', NULL, 3, '2026-06-13 13:08:53', '2026-06-13 13:18:52'),
(194, 72, 'contoh2', NULL, 2, 'APPROVED', NULL, 3, '2026-06-13 13:08:53', '2026-06-13 13:18:53'),
(195, 72, 'contoh3', NULL, 3, 'APPROVED', NULL, 3, '2026-06-13 13:08:53', '2026-06-13 13:18:54'),
(196, 73, 'contoh1', NULL, 1, 'APPROVED', NULL, 3, '2026-06-13 13:08:53', '2026-06-13 13:18:55'),
(197, 73, 'contoh2', NULL, 2, 'APPROVED', NULL, 3, '2026-06-13 13:08:53', '2026-06-13 13:18:56'),
(198, 73, 'contoh3', NULL, 3, 'APPROVED', NULL, 3, '2026-06-13 13:08:53', '2026-06-13 13:18:56'),
(199, 74, 'caqfwes', NULL, 1, 'APPROVED', NULL, 11, '2026-06-13 16:05:13', '2026-06-13 16:13:22'),
(200, 74, 'ccwasqs', NULL, 2, 'APPROVED', NULL, 11, '2026-06-13 16:05:13', '2026-06-13 16:13:22'),
(201, 74, 'cwwcs', NULL, 3, 'APPROVED', NULL, 11, '2026-06-13 16:05:13', '2026-06-13 16:13:22'),
(202, 75, 'wascfd', NULL, 1, 'APPROVED', NULL, 11, '2026-06-13 16:05:13', '2026-06-13 16:13:23'),
(203, 75, 'qwfcas', NULL, 2, 'APPROVED', NULL, 11, '2026-06-13 16:05:13', '2026-06-13 16:13:23'),
(204, 75, 'wcfqas', NULL, 3, 'APPROVED', NULL, 11, '2026-06-13 16:05:13', '2026-06-13 16:13:23'),
(205, 76, 'SUB-1-1', NULL, 1, 'APPROVED', NULL, 3, '2026-06-15 04:08:37', '2026-06-15 06:24:32'),
(206, 76, 'SUB-1-2', NULL, 2, 'APPROVED', NULL, 3, '2026-06-15 04:08:37', '2026-06-15 06:24:34'),
(207, 76, 'SUB-1-3', NULL, 3, 'APPROVED', NULL, 3, '2026-06-15 04:08:37', '2026-06-15 06:24:31'),
(208, 77, 'SUB-2-1', NULL, 1, 'APPROVED', NULL, 3, '2026-06-15 04:08:37', '2026-06-15 04:16:00'),
(209, 77, 'SUB-2-2', NULL, 2, 'APPROVED', NULL, 3, '2026-06-15 04:08:37', '2026-06-15 04:16:00'),
(210, 78, 'CWQAF', NULL, 1, 'APPROVED', NULL, 11, '2026-06-15 04:37:02', '2026-06-15 04:37:21'),
(211, 78, 'WWACFQ', NULL, 2, 'APPROVED', NULL, 11, '2026-06-15 04:37:02', '2026-06-15 04:37:21'),
(212, 78, 'WFQACS', NULL, 3, 'APPROVED', NULL, 11, '2026-06-15 04:37:02', '2026-06-15 04:37:21'),
(213, 79, 'awsfcqacqf', NULL, 1, 'APPROVED', NULL, 11, '2026-06-15 04:37:02', '2026-06-15 06:46:43'),
(214, 79, 'awcfsqafq', NULL, 2, 'APPROVED', NULL, 11, '2026-06-15 04:37:02', '2026-06-15 06:46:43'),
(215, 79, 'acswqdq', NULL, 3, 'APPROVED', NULL, 11, '2026-06-15 04:37:02', '2026-06-15 06:46:43'),
(216, 80, 'EEEEEEEE', NULL, 1, 'APPROVED', NULL, 3, '2026-06-15 06:22:04', '2026-06-15 06:24:26'),
(217, 80, 'EEEEEEEE', NULL, 2, 'APPROVED', NULL, 3, '2026-06-15 06:22:04', '2026-06-15 06:24:27'),
(218, 80, 'EEEEEEEE', NULL, 3, 'APPROVED', NULL, 3, '2026-06-15 06:22:04', '2026-06-15 06:24:29'),
(219, 81, 'TT', NULL, 1, 'PENDING', NULL, 3, '2026-06-15 07:50:04', '2026-06-15 07:50:04'),
(220, 81, 'TT2', NULL, 2, 'PENDING', NULL, 3, '2026-06-15 07:50:04', '2026-06-15 07:50:04'),
(221, 82, 'TT2', NULL, 1, 'PENDING', NULL, 3, '2026-06-15 07:50:04', '2026-06-15 07:50:04'),
(223, 82, 'TT3sss', NULL, 2, 'PENDING', NULL, 3, '2026-06-15 08:15:10', '2026-06-15 08:15:10'),
(224, 83, 'dfsdf', NULL, 1, 'PENDING', NULL, 11, '2026-06-15 08:25:12', '2026-06-15 08:25:12'),
(226, 84, 'fsdfsfss', NULL, 1, 'PENDING', NULL, 11, '2026-06-15 08:25:54', '2026-06-15 08:25:54'),
(227, 85, 'SUB-1.1', NULL, 1, 'PENDING', NULL, 11, '2026-06-15 08:59:31', '2026-06-15 08:59:31'),
(228, 85, 'SUB-1.2', NULL, 2, 'PENDING', NULL, 11, '2026-06-15 08:59:31', '2026-06-15 08:59:31'),
(229, 86, 'alat1-1', NULL, 1, 'PENDING', NULL, 3, '2026-06-15 09:51:30', '2026-06-15 09:51:30'),
(230, 86, 'alatt1-2', NULL, 2, 'PENDING', NULL, 3, '2026-06-15 09:51:30', '2026-06-15 09:51:30'),
(231, 86, 'alat1-3', NULL, 3, 'PENDING', NULL, 3, '2026-06-15 09:51:30', '2026-06-15 09:51:30'),
(232, 87, 'alat2-1', NULL, 1, 'PENDING', NULL, 3, '2026-06-15 09:51:30', '2026-06-15 09:51:30'),
(233, 87, 'alat2-2', NULL, 2, 'PENDING', NULL, 3, '2026-06-15 09:51:30', '2026-06-15 09:51:30'),
(234, 87, 'alat2-3', NULL, 3, 'PENDING', NULL, 3, '2026-06-15 09:52:07', '2026-06-15 09:52:07'),
(235, 88, 'Body alat bersih, bebas debu dan tumpahan bahan kimia', NULL, 1, 'PENDING', NULL, 15, '2026-06-17 08:11:49', '2026-06-17 08:11:49'),
(236, 88, 'Tombol panel (jika manual) berfungsi dengan baik', NULL, 2, 'PENDING', NULL, 15, '2026-06-17 08:11:49', '2026-06-17 08:11:49'),
(237, 88, 'Layar monitor/tampilan digital menyala dengan jelas', NULL, 3, 'PENDING', NULL, 15, '2026-06-17 08:11:49', '2026-06-17 08:11:49'),
(238, 88, 'Tidak ada kabel yang terkelupas atau longgar', NULL, 4, 'PENDING', NULL, 15, '2026-06-17 08:11:49', '2026-06-17 08:11:49'),
(239, 88, 'Tutup kompartemen kuvet dapat dibuka-tutup sempurna', NULL, 5, 'PENDING', NULL, 15, '2026-06-17 08:11:49', '2026-06-17 08:11:49'),
(240, 89, 'Sumber cahaya UV dan Visible menyala normal (lampu deuterium dan tungsten)', NULL, 1, 'PENDING', NULL, 15, '2026-06-17 08:11:49', '2026-06-17 08:11:49'),
(241, 90, 'Kompartemen bersih dari tumpahan cairan atau kotoran', NULL, 1, 'PENDING', NULL, 15, '2026-06-17 08:11:49', '2026-06-17 08:11:49'),
(242, 90, 'Pegangan kuvet presisi dan tidak longgar', NULL, 2, 'PENDING', NULL, 15, '2026-06-17 08:14:20', '2026-06-17 08:14:20'),
(243, 91, 'a', NULL, 1, 'PENDING', NULL, 11, '2026-06-17 09:36:57', '2026-06-17 09:36:57'),
(244, 92, 's', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 05:45:46', '2026-06-18 05:45:46'),
(246, 94, 'sd2', NULL, 1, 'PENDING', NULL, 3, '2026-06-18 05:47:31', '2026-06-18 05:47:31'),
(247, 95, 'sd4', NULL, 1, 'PENDING', NULL, 3, '2026-06-18 05:47:31', '2026-06-18 05:47:31'),
(248, 96, 'sd2', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 05:48:39', '2026-06-18 05:48:39'),
(249, 97, 'sd4', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 05:48:39', '2026-06-18 05:48:39'),
(250, 98, 'sx2', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 05:58:31', '2026-06-18 05:58:31'),
(251, 99, 'sx4', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 05:58:31', '2026-06-18 05:58:31'),
(252, 100, 'sz', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 06:09:05', '2026-06-18 06:09:05'),
(253, 101, 'sv', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 06:10:27', '2026-06-18 06:10:27'),
(255, 103, 'p', NULL, 1, 'PENDING', NULL, 11, '2026-06-18 08:14:06', '2026-06-18 08:14:06');

-- --------------------------------------------------------

--
-- Struktur dari tabel `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `nama_barang` varchar(255) NOT NULL,
  `kode_barang` varchar(100) NOT NULL,
  `pembuat_alat` varchar(255) DEFAULT NULL,
  `tanggal_pembelian` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `items`
--

INSERT INTO `items` (`id`, `nama_barang`, `kode_barang`, `pembuat_alat`, `tanggal_pembelian`, `created_at`, `updated_at`) VALUES
(21, 'GAS', 'FIS-008', 'omke gas', '2026-07-10', '2026-06-12 03:34:21', '2026-06-12 03:34:21'),
(29, 'wD', 'CQWFas', 'qawcfS', '2026-06-13', '2026-06-13 12:49:37', '2026-06-13 12:49:37'),
(30, 'WQCSD', 'WACSQ', 'WSCFQA', '2026-06-13', '2026-06-13 12:49:51', '2026-06-13 12:49:51'),
(31, 'ITEM1', 'FIS-00291', 'ADRIAN', '2026-06-15', '2026-06-15 04:07:12', '2026-06-15 04:07:12'),
(37, 'Test Alat Baru', 'TST-999', 'Test', '2024-06-01', '2026-06-15 04:32:09', '2026-06-15 04:32:09'),
(38, 'alatke', 'kel-098', 'kamu', '2026-06-15', '2026-06-15 04:33:36', '2026-06-15 04:33:36'),
(41, 'kamubaik', 'kamubaaik-9877', 'kamutaik', '2026-06-15', '2026-06-15 04:36:38', '2026-06-15 04:36:38'),
(42, 'GAS API', 'FIS-909', 'IKAN', '2026-06-16', '2026-06-15 07:45:48', '2026-06-15 07:45:48'),
(57, 'PLC OMRON', '123', 'OMRON', '2026-06-17', '2026-06-17 08:07:28', '2026-06-17 08:07:28'),
(62, 's', 's34', 's', '2026-06-18', '2026-06-18 05:45:41', '2026-06-18 05:45:41'),
(64, 'sd1', 'sd2', 'sd', '2026-06-18', '2026-06-18 05:48:27', '2026-06-18 05:48:27'),
(65, 'sx', 'sx2', 'sx', '2026-06-18', '2026-06-18 05:58:15', '2026-06-18 05:58:15'),
(66, 'sv', 'svs', 'sv', '2026-06-18', '2026-06-18 06:10:20', '2026-06-18 06:10:20');

-- --------------------------------------------------------

--
-- Struktur dari tabel `laboratories`
--

CREATE TABLE `laboratories` (
  `id` int(11) NOT NULL,
  `nama_lab` varchar(255) NOT NULL,
  `lokasi` varchar(255) NOT NULL,
  `kalab_id` int(11) DEFAULT NULL,
  `plp1_id` int(11) DEFAULT NULL,
  `plp2_id` int(11) DEFAULT NULL,
  `item_ids` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `laboratories`
--

INSERT INTO `laboratories` (`id`, `nama_lab`, `lokasi`, `kalab_id`, `plp1_id`, `plp2_id`, `item_ids`, `created_at`, `updated_at`) VALUES
(10, 'PENGOLAHAN MAKAN', 'Gedung A lantai 3', 11, 24, 23, '30,41', '2026-06-10 06:07:25', '2026-06-22 07:26:19'),
(11, 'LAB IPA', 'GEDUNG A LANTAI 9', 2, NULL, NULL, '21,29', '2026-06-12 03:33:55', '2026-06-13 12:49:37'),
(12, 'COBA', 'COBA', 11, NULL, NULL, '31,42', '2026-06-15 04:06:35', '2026-06-15 08:50:34'),
(13, 'LAB 1', 'LANTAI 3', 11, NULL, NULL, '62,64,65,66', '2026-06-15 07:49:03', '2026-06-19 07:56:19'),
(14, 'LAB OTOMASI', 'Gedung J Lantai 5', 15, NULL, NULL, '57', '2026-06-17 08:04:19', '2026-06-17 08:07:28');

-- --------------------------------------------------------

--
-- Struktur dari tabel `schedules`
--

CREATE TABLE `schedules` (
  `id` int(11) NOT NULL,
  `laboratory_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nip` varchar(50) DEFAULT '',
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','kalab','plp') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `nip`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Admin PPNS', '', 'admin@ppns.ac.id', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHqg9C', 'admin', '2026-06-03 04:22:18', '2026-06-03 04:22:18'),
(2, 'Kepala Lab Fisika', '197501012005011001', 'kalab.fisika@ppns.ac.id', '$2a$10$kCqWc5WXmvT5pqH5s5V9a.B3ZYN8hIQQZv3H1f8.N7u8O5p5H1Hp2', 'kalab', '2026-06-03 04:22:18', '2026-06-04 06:17:59'),
(3, 'Admin Ganteng', '0000000022', 'admin3@ppns.ac.id', '$2a$10$P87mHC9W5CRPbaHcvP.3mO2ejseMtfVwtxLcuvF427f/6mRFnPiN6', 'admin', '2026-06-03 04:22:28', '2026-06-12 08:56:01'),
(11, 'Vivin Setiani, S.T., M.Eng', '198909162015042020', 'kalab3@ppns.ac.id', '$2a$10$11BPO6ufPK8dqkJRu71w8O.SRwoqPOt8IwG7VKZJgN4q8d7Xi2I/2', 'kalab', '2026-06-04 06:28:02', '2026-06-12 08:56:01'),
(15, 'Medi', '123456789', 'Medi@ppns.ac.id', '$2a$10$pTCx2QH/CgpDJICVA8asqurY4Jm2g.6L8AhA7GwxptyXez0bHVAAC', 'kalab', '2026-06-17 08:03:30', '2026-06-17 08:03:30'),
(16, 'sa', '112345788', 'sa123@gmail.com', '$2a$10$R5zrPcwBe31ABnTrTomOKemeXV4o/wqVgIJqEyyFpayPdtGMPrNYS', 'kalab', '2026-06-22 06:26:53', '2026-06-22 06:26:53'),
(23, 'PLP 1', '123456', 'plp1@gmail.com', '$2a$10$09ZzOvEBmPnvBj8XhDaDU.VlPUUJqMZD.TWDAdZpryEgWA.KTXYFi', 'plp', '2026-06-22 07:23:07', '2026-06-22 07:23:07'),
(24, 'PLP 2', '123456', 'plp2@gmail.com', '$2a$10$VmNrvspNmDRAaeeBXigTcuVA7Rnz1MILDm3rQL/X5w/CeJTGXWjpi', 'plp', '2026-06-22 07:23:33', '2026-06-22 07:23:33'),
(25, 'saep', '1122334455', 'saep123@gmail.com', '$2a$10$zTremhOnh0L0lS/92ahZte66uIIfYTQudypUK5rYaYiG4SmgueIDq', 'plp', '2026-06-22 07:24:08', '2026-06-22 07:24:08');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `inspections`
--
ALTER TABLE `inspections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_item_semester` (`item_id`,`tahun`,`semester`),
  ADD KEY `idx_laboratory_id` (`laboratory_id`),
  ADD KEY `idx_item_id` (`item_id`),
  ADD KEY `idx_inspector_id` (`inspector_id`),
  ADD KEY `idx_tanggal_inspeksi` (`tanggal_inspeksi`),
  ADD KEY `idx_tahun_semester` (`tahun`,`semester`);

--
-- Indeks untuk tabel `inspection_categories`
--
ALTER TABLE `inspection_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_urutan` (`urutan`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_laboratory_id` (`laboratory_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indeks untuk tabel `inspection_monthly_reviews`
--
ALTER TABLE `inspection_monthly_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_inspection_month` (`inspection_id`,`bulan_ke`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_review_status` (`review_status`);

--
-- Indeks untuk tabel `inspection_results`
--
ALTER TABLE `inspection_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_unique_inspec_subitem_month` (`inspection_id`,`subitem_id`,`bulan_ke`),
  ADD KEY `idx_inspection_id` (`inspection_id`),
  ADD KEY `idx_subitem_id` (`subitem_id`);

--
-- Indeks untuk tabel `inspection_subitems`
--
ALTER TABLE `inspection_subitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_category_id` (`category_id`),
  ADD KEY `idx_urutan` (`urutan`),
  ADD KEY `idx_status` (`status`);

--
-- Indeks untuk tabel `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_barang` (`kode_barang`),
  ADD KEY `idx_kode_barang` (`kode_barang`);

--
-- Indeks untuk tabel `laboratories`
--
ALTER TABLE `laboratories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_nama_lab` (`nama_lab`),
  ADD KEY `fk_kalab` (`kalab_id`),
  ADD KEY `fk_lab_plp1` (`plp1_id`),
  ADD KEY `fk_lab_plp2` (`plp2_id`);

--
-- Indeks untuk tabel `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_laboratory_id` (`laboratory_id`),
  ADD KEY `idx_tanggal` (`tanggal`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `inspections`
--
ALTER TABLE `inspections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=208;

--
-- AUTO_INCREMENT untuk tabel `inspection_categories`
--
ALTER TABLE `inspection_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT untuk tabel `inspection_monthly_reviews`
--
ALTER TABLE `inspection_monthly_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT untuk tabel `inspection_results`
--
ALTER TABLE `inspection_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1022;

--
-- AUTO_INCREMENT untuk tabel `inspection_subitems`
--
ALTER TABLE `inspection_subitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=256;

--
-- AUTO_INCREMENT untuk tabel `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT untuk tabel `laboratories`
--
ALTER TABLE `laboratories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `inspections`
--
ALTER TABLE `inspections`
  ADD CONSTRAINT `inspections_ibfk_1` FOREIGN KEY (`laboratory_id`) REFERENCES `laboratories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inspections_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inspections_ibfk_3` FOREIGN KEY (`inspector_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `inspection_categories`
--
ALTER TABLE `inspection_categories`
  ADD CONSTRAINT `inspection_categories_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inspection_categories_ibfk_2` FOREIGN KEY (`laboratory_id`) REFERENCES `laboratories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inspection_categories_ibfk_3` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `inspection_monthly_reviews`
--
ALTER TABLE `inspection_monthly_reviews`
  ADD CONSTRAINT `inspection_monthly_reviews_ibfk_1` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inspection_monthly_reviews_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `inspection_results`
--
ALTER TABLE `inspection_results`
  ADD CONSTRAINT `inspection_results_ibfk_1` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inspection_results_ibfk_2` FOREIGN KEY (`subitem_id`) REFERENCES `inspection_subitems` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `inspection_subitems`
--
ALTER TABLE `inspection_subitems`
  ADD CONSTRAINT `inspection_subitems_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `inspection_categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inspection_subitems_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `laboratories`
--
ALTER TABLE `laboratories`
  ADD CONSTRAINT `fk_kalab` FOREIGN KEY (`kalab_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lab_plp1` FOREIGN KEY (`plp1_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lab_plp2` FOREIGN KEY (`plp2_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`laboratory_id`) REFERENCES `laboratories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
