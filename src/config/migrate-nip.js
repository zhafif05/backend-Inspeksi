const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ppns_lab_inspection'
  });

  console.log('Connected. Running NIP migration...');

  try {
    await conn.query('ALTER TABLE laboratories DROP COLUMN nip');
    console.log('✓ nip dropped from laboratories');
  } catch (e) {
    console.log('~ nip already dropped or not exists:', e.message);
  }

  try {
    await conn.query("ALTER TABLE users ADD COLUMN nip VARCHAR(50) DEFAULT '' AFTER name");
    console.log('✓ nip added to users');
  } catch (e) {
    console.log('~ nip column in users already exists:', e.message);
  }

  try {
    await conn.query("UPDATE users SET nip = '197501012005011001' WHERE name = 'Kepala Lab Fisika'");
    console.log('✓ sample nip updated');
  } catch (e) {
    console.log('~ update sample nip:', e.message);
  }

  await conn.end();
  console.log('Migration complete.');
}

run().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
