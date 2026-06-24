const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ppns_lab_inspection',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 1,
    queueLimit: 0
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inspection_monthly_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inspection_id INT NOT NULL,
        bulan_ke INT NOT NULL,
        review_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
        reviewed_by INT,
        alasan_penolakan TEXT,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_inspection_month (inspection_id, bulan_ke),
        INDEX idx_review_status (review_status)
      )
    `);
    console.log('✓ Tabel inspection_monthly_reviews berhasil dibuat');
    process.exit(0);
  } catch (err) {
    console.error('✗ Gagal:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
