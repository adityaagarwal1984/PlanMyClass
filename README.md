# Timetable Generator

Minimal Express + EJS app for generating college timetables.

Prereqs:
- Node 18+ (or compatible)
- MySQL server

Setup
1. Clone or copy files into your workspace.
2. Install dependencies:

```powershell
npm install
```

3. Create a MySQL database and apply schema in `sql/schema.sql`:

Use your preferred MySQL client or run:

```powershell
mysql -u root -p < sql/schema.sql
```

4. Seed initial admin and sample data. Example in Node REPL or MySQL:

- Create admin user (hashed password using bcrypt)

You can create an admin record with a hashed password via a small Node script or by using bcrypt to hash the password. Example script:

```js
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
(async () => {
  const hash = await bcrypt.hash('adminpassword', 8);
  const conn = await mysql.createConnection({host:'localhost', user:'root', password:'', database:'timetable_db'});
  await conn.query('INSERT INTO admin (username, password) VALUES (?, ?)', ['admin', hash]);
  await conn.end();
})();
```

5. Configure environment variables by creating a `.env` file in project root:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=timetable_db
SESSION_SECRET=some_secret_here
PORT=3000
```

6. Start the app:

```powershell
npm start
```

Routes
- GET / -> home
- GET /login -> login page (choose 'admin' or 'faculty')
- Admin routes under /admin (protected)
- Faculty dashboard under /faculty/dashboard (protected)
- Student view at /student/dashboard (no login)

Notes & next steps
- The generator provided is basic and tries to avoid assigning a faculty who already has a slot at the same day/period.
- For production, add input validation, better UI, and stronger generation rules (labs as double slots, etc.).
- Consider using migrations (knex/Sequelize) and seeders for convenient setup.

