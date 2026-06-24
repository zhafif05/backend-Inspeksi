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
    const [rows] = await pool.query("SHOW COLUMNS FROM inspection_results LIKE 'approval_status'");
    if (rows.length === 0) {
      await pool.query(
        `ALTER TABLE inspection_results
         ADD COLUMN approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' AFTER keterangan,
         ADD COLUMN alasan_penolakan TEXT NULL AFTER approval_status`
      );
      console.log('✓ Kolom approval_status dan alasan_penolakan berhasil ditambahkan');
    } else {
      console.log('- Kolom approval_status sudah ada, skip');
    }

    try {
      await pool.query(
        `ALTER TABLE inspection_results
         ADD UNIQUE INDEX idx_unique_inspec_subitem_month (inspection_id, subitem_id, bulan_ke)`
      );
      console.log('✓ Unique index (inspection_id, subitem_id, bulan_ke) berhasil ditambahkan');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('- Unique index sudah ada, skip');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migrasi selesai!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Gagal:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
