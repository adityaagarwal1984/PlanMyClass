const pool = require('../config/db');

exports.dashboard = async (req, res) => {
  const facultyId = req.session.user.id;
  // fetch periods (if present) and timetable for this faculty
  let periods = [];
  try {
    const _p = await pool.query('SELECT id, label, start_time, end_time FROM periods ORDER BY id');
    periods = _p[0] || [];
  } catch (e) {
    periods = [];
  }
  const [rows] = await pool.query(
    `SELECT t.day, t.period, s.name AS subject_name, sec.name AS section_name
     FROM timetable t
     LEFT JOIN subject s ON t.subject_id = s.id
     LEFT JOIN section sec ON t.section_id = sec.id
     WHERE t.faculty_id = ?`,
    [facultyId]
  );

  // build grid by day and period
  const grid = {};
  rows.forEach(r => {
    grid[r.day] = grid[r.day] || {};
    grid[r.day][r.period] = { subject_name: r.subject_name, section_name: r.section_name };
  });

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  res.render('faculty/dashboard', { periods, days, grid, facultyName: req.session.user.name });
};
