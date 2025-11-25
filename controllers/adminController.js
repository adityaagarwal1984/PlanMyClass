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
  // Store faculty password as provided (plain) per user request
  await pool.query('INSERT INTO faculty (name, username, password) VALUES (?, ?, ?)', [name, username, password]);
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
  const sectionId = req.query.section_id || null;

  // fetch periods once
  let periods = [];
  try {
    const _p = await pool.query('SELECT id, label, start_time, end_time FROM periods ORDER BY id');
    periods = _p[0] || [];
  } catch (e) {
    periods = [];
  }

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // build generated timetables for all sections so admin can always see them
  const generatedTimetables = [];
  for (const sec of sections) {
    const [rows] = await pool.query(
      `SELECT t.day, t.period, s.name as subject_name, f.name as faculty_name
       FROM timetable t
       LEFT JOIN subject s ON t.subject_id = s.id
       LEFT JOIN faculty f ON t.faculty_id = f.id
       WHERE t.section_id = ?`,
      [sec.id]
    );
    const grid = {};
    rows.forEach(r => {
      grid[r.day] = grid[r.day] || {};
      grid[r.day][r.period] = { subject_name: r.subject_name, faculty_name: r.faculty_name };
    });
    generatedTimetables.push({ sectionId: sec.id, sectionName: sec.name, grid });
  }

  // if a specific section is selected, also fetch its facultySubjects for the assign/generate UI
  let facultySubjects = [];
  if (sectionId) {
    const [fs] = await pool.query(
      `SELECT fs.id AS assignment_id, fs.subject_id, fs.faculty_id, f.name as faculty_name, s.name as subject_name
       FROM faculty_subject fs
       JOIN faculty f ON fs.faculty_id = f.id
       JOIN subject s ON fs.subject_id = s.id
       WHERE fs.section_id = ?`,
      [sectionId]
    );
    facultySubjects = fs;
  }

  res.render('admin/generate', { sections, assignMode: false, message: null, periods, days, generatedTimetables, facultySubjects, selectedSection: sectionId });
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

    // simple timetable: Mon-Sat.
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // After generation, show generate page again with generated timetables for all sections
    const [sections] = await pool.query('SELECT * FROM section');

    // parse per-subject hours inputs and global flags
    const assignmentsWithHours = assignments.map(a => {
      const key = `hours_${a.subject_id}`;
      const raw = req.body[key];
      const hrs = parseInt(raw, 10);
      return { ...a, hours: Number.isNaN(hrs) || hrs <= 0 ? 1 : hrs };
    }).sort((x, y) => y.hours - x.hours);

    const technicalTraining = !!req.body.technical_training_global;
    const labs = !!req.body.labs_global;

    // build slots according to hours (subjects with more hours appear earlier)
    const slots = [];
    for (const a of assignmentsWithHours) {
      for (let i = 0; i < a.hours; i++) slots.push(a);
    }

    // simple placement loop: iterate days & periods and place slots while avoiding faculty conflicts
    const daysArr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let periodIds = [1,2,3,4,5,6];
    try { const _pids = await pool.query('SELECT id FROM periods ORDER BY id'); if (_pids[0] && _pids[0].length) periodIds = _pids[0].map(r => r.id); } catch (e) { periodIds = [1,2,3,4,5,6]; }

    // clear existing timetable for section
    await pool.query('DELETE FROM timetable WHERE section_id = ?', [section_id]);

    const entriesToInsert = [];
    // faculty schedule cache to avoid duplicates within this generation
    const facultySchedule = {};

    // iterate through schedule slots
    for (const day of daysArr) {
      for (const period of periodIds) {
        if (slots.length === 0) break;
        let placed = false;
        // try each remaining slot in order until one fits
        for (let i = 0; i < slots.length; i++) {
          const candidate = slots[i];
          const fId = candidate.faculty_id;

          facultySchedule[fId] = facultySchedule[fId] || {};
          facultySchedule[fId][day] = facultySchedule[fId][day] || new Set();

          // check DB for cross-section conflict
          const conflictRow = await pool.query('SELECT 1 FROM timetable WHERE faculty_id = ? AND day = ? AND period = ?', [fId, day, period]);
          if (conflictRow[0].length > 0) continue;

          if (!facultySchedule[fId][day].has(period)) {
            entriesToInsert.push([section_id, day, period, candidate.subject_id, fId]);
            facultySchedule[fId][day].add(period);
            // remove this slot
            slots.splice(i, 1);
            placed = true;
            break;
          }
        }
        if (!placed) {
          // no slot could be placed for this day/period; insert empty
          entriesToInsert.push([section_id, day, period, null, null]);
        }
      }
      if (slots.length === 0) break;
    }

    // bulk insert
    const placeholders = entriesToInsert.map(() => '(?,?,?,?,?)').join(',');
    const flat = entriesToInsert.flat();
    if (entriesToInsert.length > 0) {
      await pool.query(`INSERT INTO timetable (section_id, day, period, subject_id, faculty_id) VALUES ${placeholders}`, flat);
    }

    // fetch periods once
    let periods = [];
    try { const _p = await pool.query('SELECT id, label, start_time, end_time FROM periods ORDER BY id'); periods = _p[0] || []; } catch (e) { periods = []; }

    // prepare generated timetables for all sections
    const generatedTimetables = [];
    for (const sec of sections) {
      const [rows] = await pool.query(
        `SELECT t.day, t.period, s.name as subject_name, f.name as faculty_name
         FROM timetable t
         LEFT JOIN subject s ON t.subject_id = s.id
         LEFT JOIN faculty f ON t.faculty_id = f.id
         WHERE t.section_id = ?`,
        [sec.id]
      );
      const grid = {};
      rows.forEach(r => {
        grid[r.day] = grid[r.day] || {};
        grid[r.day][r.period] = { subject_name: r.subject_name, faculty_name: r.faculty_name };
      });
      generatedTimetables.push({ sectionId: sec.id, sectionName: sec.name, grid });
    }

    const [fs] = await pool.query(
      `SELECT fs.id AS assignment_id, fs.subject_id, fs.faculty_id, f.name as faculty_name, s.name as subject_name
       FROM faculty_subject fs
       JOIN faculty f ON fs.faculty_id = f.id
       JOIN subject s ON fs.subject_id = s.id
       WHERE fs.section_id = ?`,
      [section_id]
    );
    const facultySubjects = fs;

    res.render('admin/generate', { sections, assignMode: false, message: 'Timetable generated successfully', periods, days: daysArr, generatedTimetables, facultySubjects, selectedSection: section_id, technicalTraining, labs });
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

// Admin: Faculty Timetable placeholder page
exports.facultyTimetablePage = async (req, res) => {
  // Allow selecting a faculty and viewing their timetable
  const [faculty] = await pool.query('SELECT id, name FROM faculty');
  const facultyId = req.query.faculty_id || null;

  // fetch periods if present
  let periods = [];
  try {
    const _p = await pool.query('SELECT id, label, start_time, end_time FROM periods ORDER BY id');
    periods = _p[0] || [];
  } catch (e) {
    periods = [];
  }

  let grid = {};
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  if (facultyId) {
    const [rows] = await pool.query(
      `SELECT t.day, t.period, s.name AS subject_name, sec.name AS section_name
       FROM timetable t
       LEFT JOIN subject s ON t.subject_id = s.id
       LEFT JOIN section sec ON t.section_id = sec.id
       WHERE t.faculty_id = ?`,
      [facultyId]
    );

    rows.forEach(r => {
      grid[r.day] = grid[r.day] || {};
      grid[r.day][r.period] = { subject_name: r.subject_name, section_name: r.section_name };
    });
  }

  res.render('admin/faculty_timetable', { faculty, periods, days, grid, selectedFaculty: facultyId });
};

// Admin: Room Allocation placeholder page
exports.roomAllocationPage = async (req, res) => {
  // Placeholder: later will manage rooms and their assignments.
  res.render('admin/room_allocation');
};

// Delete handlers
exports.deleteFaculty = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM faculty WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Faculty deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error deleting faculty' });
  }
};

exports.deleteSubject = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM subject WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error deleting subject' });
  }
};

exports.deleteSection = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM section WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Section deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error deleting section' });
  }
};

exports.deleteAssignment = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM faculty_subject WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error deleting assignment' });
  }
};

exports.deleteTimetableEntry = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM timetable WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Timetable entry deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error deleting timetable entry' });
  }
};

exports.clearTimetableForSection = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM timetable WHERE section_id = ?', [id]);
    return res.json({ success: true, message: 'Timetable cleared for section' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error clearing timetable for section' });
  }
};
