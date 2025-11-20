const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.showLogin = (req, res) => {
  res.render('login', { error: null });
};

exports.login = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    if (role === 'admin') {
      // admin stored in admin table (single account)
      const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
      if (rows.length === 0) return res.render('login', { error: 'Invalid credentials' });
      const admin = rows[0];
      const ok = await bcrypt.compare(password, admin.password);
      if (!ok) return res.render('login', { error: 'Invalid credentials' });
      req.session.user = { id: admin.id, username: admin.username, role: 'admin' };
      return res.redirect('/admin');
    } else if (role === 'faculty') {
      const [rows] = await pool.query('SELECT * FROM faculty WHERE username = ?', [username]);
      if (rows.length === 0) return res.render('login', { error: 'Invalid credentials' });
      const faculty = rows[0];
      let ok = false;
      // support both bcrypt-hashed and plain-text stored passwords
      if (typeof faculty.password === 'string' && /^\$2[aby]\$/.test(faculty.password)) {
        ok = await bcrypt.compare(password, faculty.password);
      } else {
        ok = (password === faculty.password);
      }
      if (!ok) return res.render('login', { error: 'Invalid credentials' });
      req.session.user = { id: faculty.id, username: faculty.username, name: faculty.name, role: 'faculty' };
      return res.redirect('/faculty/dashboard');
    }
    return res.render('login', { error: 'Invalid role' });
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    res.redirect('/');
  });
};
