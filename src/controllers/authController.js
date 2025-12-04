const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// Render landing page
exports.landing = (req, res) => {
  res.render('landing', { session: req.session });
};

// Admin signup
exports.getAdminSignup = (req, res) => {
  res.render('admin-signup', { message: null });
};

exports.postAdminSignup = async (req, res) => {
  try {
    const { username, password, unique_id } = req.body;
    if (!username || !password || !unique_id) {
      return res.render('admin-signup', { message: 'All fields are required' });
    }

    // check unique_id
    const [rows] = await pool.promise().query('SELECT id FROM admins WHERE unique_id = ?', [unique_id]);
    if (rows.length > 0) {
      return res.render('admin-signup', { message: 'unique_id already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await pool.promise().query(
      'INSERT INTO admins (username, password_hash, unique_id, created_at) VALUES (?, ?, ?, NOW())',
      [username, password_hash, unique_id]
    );

    // set session
    req.session.unique_id = unique_id;
    req.session.username = username;
    req.session.role = 'admin';

    return res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('postAdminSignup error', err);
    return res.render('admin-signup', { message: 'Server error' });
  }
};

// Admin login
exports.getAdminLogin = (req, res) => {
  res.render('admin-login', { message: null });
};

exports.postAdminLogin = async (req, res) => {
  try {
    const { username, password, unique_id } = req.body;
    if (!username || !password || !unique_id) {
      return res.render('admin-login', { message: 'All fields are required' });
    }

    const [rows] = await pool.promise().query('SELECT * FROM admins WHERE username = ? AND unique_id = ?', [username, unique_id]);
    if (rows.length === 0) {
      return res.render('admin-login', { message: 'Invalid credentials' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.render('admin-login', { message: 'Invalid credentials' });

    req.session.unique_id = unique_id;
    req.session.username = username;
    req.session.role = 'admin';

    return res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('postAdminLogin error', err);
    return res.render('admin-login', { message: 'Server error' });
  }
};

// Faculty login
exports.getFacultyLogin = (req, res) => {
  res.render('faculty-login', { message: null });
};

exports.postFacultyLogin = async (req, res) => {
  try {
    const { username, password, unique_id } = req.body;
    if (!username || !password || !unique_id) {
      return res.render('faculty-login', { message: 'All fields are required' });
    }

    const [rows] = await pool.promise().query('SELECT * FROM faculty WHERE username = ? AND unique_id = ?', [username, unique_id]);
    if (rows.length === 0) return res.render('faculty-login', { message: 'Invalid credentials' });

    const fac = rows[0];
    const match = await bcrypt.compare(password, fac.password_hash);
    if (!match) return res.render('faculty-login', { message: 'Invalid credentials' });

    req.session.unique_id = unique_id;
    req.session.username = username;
    req.session.role = 'faculty';

    return res.redirect('/faculty/dashboard');
  } catch (err) {
    console.error('postFacultyLogin error', err);
    return res.render('faculty-login', { message: 'Server error' });
  }
};

// Student login
exports.getStudentLogin = (req, res) => {
  res.render('student-login', { message: null });
};

exports.postStudentLogin = async (req, res) => {
  try {
    const { unique_id, department, semester, section } = req.body;
    if (!unique_id || !department || !semester || !section) {
      return res.render('student-login', { message: 'All fields are required' });
    }

    // for now we just store the identifying info in session and redirect
    req.session.unique_id = unique_id;
    req.session.role = 'student';
    req.session.username = `${department}-${semester}-${section}`;

    return res.redirect('/student/dashboard');
  } catch (err) {
    console.error('postStudentLogin error', err);
    return res.render('student-login', { message: 'Server error' });
  }
};

// Placeholder dashboards
exports.adminDashboard = (req, res) => {
  if (!req.session || req.session.role !== 'admin') return res.redirect('/admin-login');
  res.send(`Admin dashboard for ${req.session.username} (unique_id=${req.session.unique_id})`);
};

exports.facultyDashboard = (req, res) => {
  if (!req.session || req.session.role !== 'faculty') return res.redirect('/faculty-login');
  res.send(`Faculty dashboard for ${req.session.username} (unique_id=${req.session.unique_id})`);
};

exports.studentDashboard = (req, res) => {
  if (!req.session || req.session.role !== 'student') return res.redirect('/student-login');
  res.send(`Student timetable for ${req.session.username} (unique_id=${req.session.unique_id})`);
};
