const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/authRoutes');
const { pool } = require('./config/db');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// session store backed by MySQL (optional - falls back to memory if not available)
let sessionStore;
try {
  sessionStore = new MySQLStore({}, pool.promise ? pool.promise() : pool);
} catch (err) {
  sessionStore = null;
}

app.use(
  session({
    key: 'pmc_sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: sessionStore || undefined,
  })
);

// Mount routes
app.use('/', authRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).send('Not Found');
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`PlanMyClass (src) listening on http://localhost:${port}`);
  });
}

module.exports = app;
