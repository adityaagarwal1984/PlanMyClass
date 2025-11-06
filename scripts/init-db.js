require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const sqlPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true
    });

    await connection.query(sql);
    console.log('Database and tables created successfully.');
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err.message || err);
    process.exit(1);
  }
})();
