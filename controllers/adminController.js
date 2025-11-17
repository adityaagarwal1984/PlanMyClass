const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.dashboard = async (req, res) => {
  res.render('admin/dashboard');
};

// Faculty management
exports.listFaculty = async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, username FROM faculty');
  res.render('admin/faculty', { faculty: rows });
};

exports.addFaculty = async (req, res) => {
  const { name, username, password } = req.body;
  const hash = await bcrypt.hash(password, 8);
  await pool.query('INSERT INTO faculty (name, username, password) VALUES (?, ?, ?)', [name, username, hash]);
  res.redirect('/admin/faculty');
};

// Subject management
exports.listSubjects = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM subject');
  res.render('admin/subjects', { subjects: rows, message: null });
};

exports.addSubject = async (req, res) => {
  const { name, year, semester } = req.body;
  // normalize year and semester to integers (forms may send strings like "3 YEAR" or "SEM 1")
  const yearNum = parseInt((year || '').toString().replace(/[^0-9]/g, ''), 10);
  const semNum = parseInt((semester || '').toString().replace(/[^0-9]/g, ''), 10);

  if (!name || Number.isNaN(yearNum) || Number.isNaN(semNum)) {
    // return subjects view with an error message
    const [rows] = await pool.query('SELECT * FROM subject');
    return res.render('admin/subjects', { subjects: rows, message: 'Invalid input — please provide subject name, numeric year and semester.' });
  }

  await pool.query('INSERT INTO subject (name, year, semester) VALUES (?, ?, ?)', [name, yearNum, semNum]);
  res.redirect('/admin/subjects');
};

// Sections management
exports.listSections = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM section');
  res.render('admin/sections', { sections: rows, message: null });
};

exports.addSection = async (req, res) => {
  const { name, year } = req.body;
  const yearNum = parseInt((year || '').toString().replace(/[^0-9]/g, ''), 10);
  if (!name || Number.isNaN(yearNum)) {
    const [rows] = await pool.query('SELECT * FROM section');
    return res.render('admin/sections', { sections: rows, message: 'Invalid input — provide section name and numeric year.' });
  }
  await pool.query('INSERT INTO section (name, year) VALUES (?, ?)', [name, yearNum]);
  res.redirect('/admin/sections');
};

// Assign
exports.showAssign = async (req, res) => {
  const [sections] = await pool.query('SELECT * FROM section');
  const [subjects] = await pool.query('SELECT * FROM subject');
  const [faculty] = await pool.query('SELECT id, name FROM faculty');
  // fetch existing assignments to show on the page
  const [assignments] = await pool.query(
    `SELECT fs.id, sec.name AS section_name, s.name AS subject_name, f.name AS faculty_name, fs.section_id
     FROM faculty_subject fs
     JOIN section sec ON fs.section_id = sec.id
     JOIN subject s ON fs.subject_id = s.id
     JOIN faculty f ON fs.faculty_id = f.id
     ORDER BY sec.name, s.name`
  );

  // ensure message is always defined for the template
  res.render('admin/generate', { sections, subjects, faculty, assignMode: true, message: null, assignments });
};

exports.assignSubject = async (req, res) => {
  const { faculty_id, subject_id, section_id } = req.body;
  await pool.query('INSERT INTO faculty_subject (faculty_id, subject_id, section_id) VALUES (?, ?, ?)', [faculty_id, subject_id, section_id]);
  res.redirect('/admin/assign');
};

exports.generatePage = async (req, res) => {
  const [sections] = await pool.query('SELECT * FROM section');
  res.render('admin/generate', { sections, assignMode: false, message: null });
};

// Basic timetable generation logic
exports.generateTimetable = async (req, res) => {
  // Admin posts: section_id
  const { section_id } = req.body;
  try {
    // fetch assignments for section
    const [assignments] = await pool.query(
      `SELECT fs.id, fs.faculty_id, fs.subject_id, s.name AS subject_name, f.name AS faculty_name
       FROM faculty_subject fs
       JOIN subject s ON fs.subject_id = s.id
       JOIN faculty f ON fs.faculty_id = f.id
       WHERE fs.section_id = ?`,
      [section_id]
    );

    if (assignments.length === 0) {
      // If there are no assignments for the selected section, show the assign UI
      const [sections] = await pool.query('SELECT * FROM section');
      const [subjects] = await pool.query('SELECT * FROM subject');
      const [faculty] = await pool.query('SELECT id, name FROM faculty');
      return res.render('admin/generate', { sections, subjects, faculty, assignMode: true, message: 'No assignments for selected section' });
    }

    // simple timetable: Mon-Fri, periods 1..6
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1,2,3,4,5,6];

    // build a map of faculty schedules to avoid conflicts: faculty_id -> {day: Set(periods)}
    const facultySchedule = {};

    // clear existing timetable for section
    await pool.query('DELETE FROM timetable WHERE section_id = ?', [section_id]);

    const entriesToInsert = [];

    // naive round-robin fill for subjects, try to avoid faculty conflicts
    let assignIndex = 0;
    for (const day of days) {
      for (const period of periods) {
        // pick next assignment candidate
        let placed = false;
        for (let tries = 0; tries < assignments.length; tries++) {
          const idx = (assignIndex + tries) % assignments.length;
          const a = assignments[idx];
          const fId = a.faculty_id;

          facultySchedule[fId] = facultySchedule[fId] || {};
          facultySchedule[fId][day] = facultySchedule[fId][day] || new Set();

          // check conflict: faculty not already teaching at this day/period in ANY section
          // to ensure cross-section conflict-free, check in DB if this faculty is scheduled at day+period
          const conflictRow = await pool.query('SELECT 1 FROM timetable WHERE faculty_id = ? AND day = ? AND period = ?', [fId, day, period]);
          if (conflictRow[0].length > 0) {
            continue; // this teacher is busy, try next
          }

          if (!facultySchedule[fId][day].has(period)) {
            // place
            entriesToInsert.push([section_id, day, period, a.subject_id, fId]);
            facultySchedule[fId][day].add(period);
            assignIndex = (idx + 1) % assignments.length;
            placed = true;
            break;
          }
        }
        if (!placed) {
          // no available teacher found (rare). leave empty or assign null
          // we'll skip creating entry for this slot (or create with nulls)
          entriesToInsert.push([section_id, day, period, null, null]);
        }
      }
    }

    // bulk insert
    const placeholders = entriesToInsert.map(() => '(?,?,?,?,?)').join(',');
    const flat = entriesToInsert.flat();
    if (entriesToInsert.length > 0) {
      await pool.query(
        `INSERT INTO timetable (section_id, day, period, subject_id, faculty_id) VALUES ${placeholders}`,
        flat
      );
    }

    // show generate page again with sections so admin can generate for another section
    {
      const [sections] = await pool.query('SELECT * FROM section');
      res.render('admin/generate', { sections, assignMode: false, message: 'Timetable generated successfully' });
    }
  } catch (err) {
    console.error(err);
    const [sections] = await pool.query('SELECT * FROM section');
    res.render('admin/generate', { sections, assignMode: false, message: 'Error generating timetable' });
  }
};

exports.analytics = async (req, res) => {
  // compute workload per faculty as number of periods assigned
  const [rows] = await pool.query(
    `SELECT f.name, COUNT(t.id) AS periods
     FROM faculty f
     LEFT JOIN timetable t ON f.id = t.faculty_id
     GROUP BY f.id`);
  const total = rows.reduce((s, r) => s + r.periods, 0) || 1;
  const payload = rows.map(r => ({ name: r.name, percent: Math.round((r.periods/total)*100) }));
  res.render('admin/analytics', { data: payload });
};
