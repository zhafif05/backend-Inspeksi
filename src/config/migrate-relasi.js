const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ppns_lab_inspection',
    multipleStatements: true
  });

  console.log('Connected. Running relasi migration...');

  try {
    // Cari nama foreign key constraint
    const [fk] = await conn.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'laboratory_id' AND CONSTRAINT_NAME != 'PRIMARY'"
    );
    if (fk.length > 0) {
      await conn.query(`ALTER TABLE users DROP FOREIGN KEY ${fk[0].CONSTRAINT_NAME}`);
      console.log('✓ FK users.laboratory_id dropped');
    }
    await conn.query('ALTER TABLE users DROP COLUMN laboratory_id');
    console.log('✓ laboratory_id dropped from users');
  } catch (e) {
    console.log('~ ' + e.message);
  }

  try {
    await conn.query(
      'ALTER TABLE laboratories ADD COLUMN kalab_id INT NULL AFTER penanggung_jawab'
    );
    console.log('✓ kalab_id added to laboratories');
  } catch (e) {
    console.log('~ ' + e.message);
  }

  try {
    await conn.query(
      'ALTER TABLE laboratories ADD CONSTRAINT fk_kalab FOREIGN KEY (kalab_id) REFERENCES users(id) ON DELETE SET NULL'
    );
    console.log('✓ FK laboratories.kalab_id added');
  } catch (e) {
    console.log('~ ' + e.message);
  }

  try {
    // Set kalab_id existing berdasarkan nama penanggung_jawab
    await conn.query(
      `UPDATE laboratories l
       JOIN users u ON u.name = l.penanggung_jawab AND u.role = 'kalab'
       SET l.kalab_id = u.id`
    );
    console.log('✓ existing kalab_id synced');
  } catch (e) {
    console.log('~ ' + e.message);
  }

  await conn.end();
  console.log('Migration complete.');
}

run().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
