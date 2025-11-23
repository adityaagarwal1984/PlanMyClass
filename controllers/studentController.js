const pool = require('../config/db');

exports.showDashboard = async (req, res) => {
  const [sections] = await pool.query('SELECT * FROM section');
  res.render('student/dashboard', { sections, timetable: null, facultySubjects: [], periods: [] });
};

exports.viewSectionTimetable = async (req, res) => {
  const { section_id } = req.body;
  // fetch periods (if seeded). If the table doesn't exist, fall back to empty array.
  let periods = [];
  try {
    const _p = await pool.query('SELECT id, label, start_time, end_time FROM periods ORDER BY id');
    periods = _p[0] || [];
  } catch (e) {
    // periods table may not exist yet; continue with empty periods to keep backward compatibility
    periods = [];
  }

  const [rows] = await pool.query(
    `SELECT t.day, t.period, s.name as subject_name, f.name as faculty_name
     FROM timetable t
     LEFT JOIN subject s ON t.subject_id = s.id
     LEFT JOIN faculty f ON t.faculty_id = f.id
     WHERE t.section_id = ?`,
    [section_id]
  );

  const [facultySubjects] = await pool.query(
    `SELECT f.name as faculty_name, s.name as subject_name
     FROM faculty_subject fs
     JOIN faculty f ON fs.faculty_id = f.id
     JOIN subject s ON fs.subject_id = s.id
     WHERE fs.section_id = ?`,
    [section_id]
  );

  const [sections] = await pool.query('SELECT * FROM section');

  // build grid: grid[day][period] = { subject_name, faculty_name }
  const grid = {};
  rows.forEach(r => {
    grid[r.day] = grid[r.day] || {};
    grid[r.day][r.period] = { subject_name: r.subject_name, faculty_name: r.faculty_name };
  });

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  res.render('student/dashboard', { sections, periods, days, grid, facultySubjects });
};
