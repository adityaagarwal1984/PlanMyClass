const pool = require('../config/db');

exports.dashboard = async (req, res) => {
  const facultyId = req.session.user.id;
  // fetch timetable for this faculty
  const [rows] = await pool.query(
    `SELECT t.day, t.period, s.name AS subject_name, sec.name AS section_name
     FROM timetable t
     LEFT JOIN subject s ON t.subject_id = s.id
     LEFT JOIN section sec ON t.section_id = sec.id
     WHERE t.faculty_id = ?
     ORDER BY FIELD(t.day, 'Monday','Tuesday','Wednesday','Thursday','Friday'), t.period`,
    [facultyId]
  );
  res.render('faculty/dashboard', { timetable: rows, facultyName: req.session.user.name });
};
