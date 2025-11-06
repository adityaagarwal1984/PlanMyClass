const pool = require('../config/db');

exports.showDashboard = async (req, res) => {
  const [sections] = await pool.query('SELECT * FROM section');
  res.render('student/dashboard', { sections, timetable: null, facultySubjects: [] });
};

exports.viewSectionTimetable = async (req, res) => {
  const { section_id } = req.body;
  const [timetable] = await pool.query(
    `SELECT t.day, t.period, s.name as subject_name, f.name as faculty_name
     FROM timetable t
     LEFT JOIN subject s ON t.subject_id = s.id
     LEFT JOIN faculty f ON t.faculty_id = f.id
     WHERE t.section_id = ?
     ORDER BY FIELD(t.day, 'Monday','Tuesday','Wednesday','Thursday','Friday'), t.period`,
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
  res.render('student/dashboard', { sections, timetable, facultySubjects });
};
