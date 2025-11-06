// Usage: node scripts/create_admin.js [username] [password]
require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';

  try {
    const hash = await bcrypt.hash(password, 8);

    // ensure database/table exist: caller should have run sql/schema.sql
    // upsert admin user
    const [rows] = await pool.query('SELECT id FROM admin WHERE username = ?', [username]);
    if (rows.length > 0) {
      await pool.query('UPDATE admin SET password = ? WHERE username = ?', [hash, username]);
      console.log(`Updated admin user '${username}' with new password.`);
    } else {
      await pool.query('INSERT INTO admin (username, password) VALUES (?, ?)', [username, hash]);
      console.log(`Created admin user '${username}'.`);
    }
  } catch (err) {
    console.error('Error creating admin user:', err.message);
    console.error('Make sure your DB is configured in .env and the schema has been applied.');
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
})();
