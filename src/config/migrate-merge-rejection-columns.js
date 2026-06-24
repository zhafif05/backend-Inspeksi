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
    const [columns] = await pool.query("SHOW COLUMNS FROM inspection_results");

    const hasRejectionNote = columns.some(c => c.Field === 'rejection_note');
    const hasAlasanPenolakan = columns.some(c => c.Field === 'alasan_penolakan');

    if (hasRejectionNote && hasAlasanPenolakan) {
      console.log('✓ Kedua kolom ditemukan. Menggabungkan data...');

      await pool.query(
        `UPDATE inspection_results SET alasan_penolakan = rejection_note WHERE alasan_penolakan IS NULL AND rejection_note IS NOT NULL`
      );
      console.log('✓ Data rejection_note disalin ke alasan_penolakan');

      await pool.query('ALTER TABLE inspection_results DROP COLUMN rejection_note');
      console.log('✓ Kolom rejection_note dihapus');

    } else if (hasRejectionNote && !hasAlasanPenolakan) {
      console.log('✓ Hanya rejection_note ditemukan. Me-rename...');
      await pool.query('ALTER TABLE inspection_results CHANGE COLUMN rejection_note alasan_penolakan TEXT NULL');
      console.log('✓ rejection_note diubah menjadi alasan_penolakan');

    } else if (!hasRejectionNote && hasAlasanPenolakan) {
      console.log('✓ Kolom alasan_penolakan sudah ada, tidak perlu perubahan');

    } else {
      console.log('✓ Kolom rejection_note dan alasan_penolakan tidak ditemukan. Menambahkan alasan_penolakan...');
      await pool.query('ALTER TABLE inspection_results ADD COLUMN alasan_penolakan TEXT NULL AFTER approval_status');
      console.log('✓ Kolom alasan_penolakan berhasil ditambahkan');
    }

    console.log('\n✅ Migrasi merging kolom selesai!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Gagal:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
