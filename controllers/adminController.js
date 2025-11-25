const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Fallback sample lab allocations used when `lab_allocations` table is missing
const SAMPLE_LAB_ALLOCATIONS = [
  // Lab 1 entries
  { lab_id: 1, day: 'Monday', section: '3A', period: '1,2', subject_id: 8 },
  { lab_id: 1, day: 'Monday', section: '3D', period: '3,4', subject_id: 8 },
  { lab_id: 1, day: 'Monday', section: '3G', period: '8,9', subject_id: 8 },
  { lab_id: 1, day: 'Tuesday', section: '3A', period: '1,2', subject_id: 12 },
  { lab_id: 1, day: 'Tuesday', section: '3D', period: '3,4', subject_id: 12 },
  { lab_id: 1, day: 'Tuesday', section: '3G', period: '8,9', subject_id: 12 },
  { lab_id: 1, day: 'Wednesday', section: '3B', period: '1,2', subject_id: 8 },
  { lab_id: 1, day: 'Wednesday', section: '3E', period: '3,4', subject_id: 8 },
  { lab_id: 1, day: 'Wednesday', section: '3H1', period: '8,9', subject_id: 8 },
  { lab_id: 1, day: 'Thursday', section: '3B', period: '1,2', subject_id: 12 },
  { lab_id: 1, day: 'Thursday', section: '3E', period: '3,4', subject_id: 12 },
  { lab_id: 1, day: 'Thursday', section: '3H1', period: '8,9', subject_id: 12 },
  { lab_id: 1, day: 'Friday', section: '3C', period: '1,2', subject_id: 8 },
  { lab_id: 1, day: 'Friday', section: '3F', period: '3,4', subject_id: 8 },
  { lab_id: 1, day: 'Friday', section: '3H2', period: '8,9', subject_id: 8 },
  { lab_id: 1, day: 'Saturday', section: '3C', period: '1,2', subject_id: 12 },
  { lab_id: 1, day: 'Saturday', section: '3F', period: '3,4', subject_id: 12 },
  { lab_id: 1, day: 'Saturday', section: '3H2', period: '8,9', subject_id: 12 },
  // Lab 2 entries
  { lab_id: 2, day: 'Monday', section: '3H1', period: '1,2', subject_id: 9 },
  { lab_id: 2, day: 'Monday', section: '3F', period: '3,4', subject_id: 9 },
  { lab_id: 2, day: 'Monday', section: '3E', period: '8,9', subject_id: 9 },
  { lab_id: 2, day: 'Tuesday', section: '3H1', period: '1,2', subject_id: 10 },
  { lab_id: 2, day: 'Tuesday', section: '3F', period: '3,4', subject_id: 10 },
  { lab_id: 2, day: 'Tuesday', section: '3E', period: '8,9', subject_id: 10 },
  { lab_id: 2, day: 'Wednesday', section: '3H2', period: '1,2', subject_id: 9 },
  { lab_id: 2, day: 'Wednesday', section: '3C', period: '3,4', subject_id: 9 },
  { lab_id: 2, day: 'Wednesday', section: '3B', period: '8,9', subject_id: 9 },
  { lab_id: 2, day: 'Thursday', section: '3H2', period: '1,2', subject_id: 10 },
  { lab_id: 2, day: 'Thursday', section: '3C', period: '3,4', subject_id: 10 },
  { lab_id: 2, day: 'Thursday', section: '3B', period: '8,9', subject_id: 10 },
  { lab_id: 2, day: 'Friday', section: '3G', period: '1,2', subject_id: 9 },
  { lab_id: 2, day: 'Friday', section: '3D', period: '3,4', subject_id: 9 },
  { lab_id: 2, day: 'Friday', section: '3A', period: '8,9', subject_id: 9 },
  { lab_id: 2, day: 'Saturday', section: '3G', period: '1,2', subject_id: 10 },
  { lab_id: 2, day: 'Saturday', section: '3D', period: '3,4', subject_id: 10 },
  { lab_id: 2, day: 'Saturday', section: '3A', period: '8,9', subject_id: 10 }
];

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
      return { ...a, hours: Number.isNaN(hrs) || hrs < 0 ? 0 : hrs };
    }).sort((x, y) => y.hours - x.hours);

    const technicalTraining = !!req.body.technical_training_global;
    const labs = !!req.body.labs_global;

    // compute total input hours provided by admin
    const totalInput = assignmentsWithHours.reduce((s, a) => s + a.hours, 0);

    // compute lab slots count for this section by querying lab_allocations table (fallback counted from sample earlier)
    let labSlotsCount = 0;
    try {
      const secRow = (await pool.query('SELECT name FROM section WHERE id = ?', [section_id]))[0][0];
      const secName = secRow ? secRow.name : null;
      if (secName) {
        const [labRows] = await pool.query('SELECT period FROM lab_allocations WHERE section = ?', [secName]);
        if (labRows && labRows.length) {
          for (const r of labRows) {
            const parts = (r.period || '').toString().split(',').map(x => parseInt(x,10)).filter(Boolean);
            labSlotsCount += parts.length;
          }
        } else {
          // fallback to sample data
          for (const la of SAMPLE_LAB_ALLOCATIONS) {
            if (la.section === secName) {
              const parts = (la.period || '').toString().split(',').map(x=>parseInt(x,10)).filter(Boolean);
              labSlotsCount += parts.length;
            }
          }
        }
      }
    } catch (e) {
      const secRow = (await pool.query('SELECT name FROM section WHERE id = ?', [section_id]))[0][0];
      const secName = secRow ? secRow.name : null;
      if (secName) {
        for (const la of SAMPLE_LAB_ALLOCATIONS) {
          if (la.section === secName) {
            const parts = (la.period || '').toString().split(',').map(x=>parseInt(x,10)).filter(Boolean);
            labSlotsCount += parts.length;
          }
        }
      }
    }

    // training occupies periods 6 and 7 across all 6 days => 12 slots
    const trainingSlots = technicalTraining ? 12 : 0;

    // base total required lectures for section
    const TOTAL_LECTURES = 48;

    // determine expected lectures after reserving training and labs
    const expectedLectures = TOTAL_LECTURES - (technicalTraining ? trainingSlots : 0) - (labs ? labSlotsCount : 0);

    if (totalInput !== expectedLectures) {
      // mismatch: show alert/message and re-render without changing DB
      const [sections] = await pool.query('SELECT * FROM section');
      const [fs] = await pool.query(
        `SELECT fs.id AS assignment_id, fs.subject_id, fs.faculty_id, f.name as faculty_name, s.name as subject_name
         FROM faculty_subject fs
         JOIN faculty f ON fs.faculty_id = f.id
         JOIN subject s ON fs.subject_id = s.id
         WHERE fs.section_id = ?`,
        [section_id]
      );
      const facultySubjects = fs;
      const message = `Total lecture hours must equal ${expectedLectures} for the selected options (you entered ${totalInput}).`;
      return res.render('admin/generate', { sections, assignMode: false, message, periods: [], days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], generatedTimetables: [], facultySubjects, selectedSection: section_id });
    }

    // build slots according to hours (subjects with more hours appear earlier)
    const slots = [];
    for (const a of assignmentsWithHours) {
      for (let i = 0; i < a.hours; i++) slots.push(a);
    }

    // prepare period ids
    let periodRows = [];
    try { const _p = await pool.query('SELECT id, label FROM periods ORDER BY id'); periodRows = _p[0] || []; } catch (e) { periodRows = []; }
    const periodIds = periodRows.length ? periodRows.map(p => p.id) : [1,2,3,4,5,6];

    // find period ids for training: target labels 'P5' and 'P6'
    let t1 = null, t2 = null;
    for (const p of periodRows) {
      if (p.label === 'P5') t1 = p.id;
      if (p.label === 'P6') t2 = p.id;
    }
    // fallback to sensible indices: P5 -> periodIds[4], P6 -> periodIds[5]
    if (!t1) t1 = periodIds[4] || 5;
    if (!t2) t2 = periodIds[5] || 6;

    // clear existing timetable for section
    await pool.query('DELETE FROM timetable WHERE section_id = ?', [section_id]);

    const entriesToInsert = [];

    // prepare reserved set early to avoid inserting duplicate day|period entries
    const reserved = new Set();

    // 1) insert lab allocations for this section if labs selected
    if (labs) {
      // fetch lab allocations from DB or fallback
      let labRowsForSection = [];
      try {
        const secName = (await pool.query('SELECT name FROM section WHERE id = ?', [section_id]))[0][0]?.name;
        const [lr] = await pool.query('SELECT lab_id, day, period, subject_id FROM lab_allocations WHERE section = ?', [secName]);
        labRowsForSection = lr || [];
      } catch (e) {
        const secName = (await pool.query('SELECT name FROM section WHERE id = ?', [section_id]))[0][0]?.name;
        labRowsForSection = SAMPLE_LAB_ALLOCATIONS.filter(la => la.section === secName);
      }

      for (const lr of labRowsForSection) {
        const parts = (lr.period || '').toString().split(',').map(x=>parseInt(x,10)).filter(Boolean);
        for (const pid of parts) {
          const key = `${lr.day}|${pid}`;
          if (reserved.has(key)) continue; // avoid duplicates
          entriesToInsert.push([section_id, lr.day, pid, lr.subject_id || null, null]);
          reserved.add(key);
        }
      }
    }

    // 2) insert training slots if selected (use or create a subject named 'Technical Training')
    let trainingSubjectId = null;
    if (technicalTraining) {
      try {
        const [found] = await pool.query("SELECT id FROM subject WHERE name = 'Technical Training' LIMIT 1");
        if (found && found.length) trainingSubjectId = found[0].id;
        else {
          const [r] = await pool.query("INSERT INTO subject (name, year, semester) VALUES ('Technical Training', 0, 0)");
          trainingSubjectId = r.insertId;
        }
      } catch (e) {
        trainingSubjectId = null;
      }

      const daysArr = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      for (const d of daysArr) {
        const k1 = `${d}|${t1}`;
        const k2 = `${d}|${t2}`;
        if (!reserved.has(k1)) { entriesToInsert.push([section_id, d, t1, trainingSubjectId, null]); reserved.add(k1); }
        if (!reserved.has(k2)) { entriesToInsert.push([section_id, d, t2, trainingSubjectId, null]); reserved.add(k2); }
      }
    }

    // 3) fill remaining lecture slots avoiding already reserved day/periods

    // faculty schedule cache to avoid conflicts: faculty_id -> {day: Set(periods)}
    const facultySchedule = {};

    const daysArr = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    for (const day of daysArr) {
      for (const period of periodIds) {
        if (slots.length === 0) break;
        // skip lunch label periods
        const label = periodRows.find(p=>p.id===period)?.label || '';
        if (label.toLowerCase().includes('lunch')) continue;

        if (reserved.has(`${day}|${period}`)) continue;

        let placed = false;
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
            slots.splice(i,1);
            reserved.add(`${day}|${period}`);
            placed = true;
            break;
          }
        }
        if (!placed) {
          // leave empty
          const key = `${day}|${period}`;
          if (!reserved.has(key)) { entriesToInsert.push([section_id, day, period, null, null]); reserved.add(key); }
        }
      }
      if (slots.length === 0) break;
    }

    // bulk insert all entries
    if (entriesToInsert.length > 0) {
      const placeholders = entriesToInsert.map(() => '(?,?,?,?,?)').join(',');
      const flat = entriesToInsert.flat();
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
    console.error('Error in generateTimetable:', err);
    const [sections] = await pool.query('SELECT * FROM section');
    // provide periods and days so the template can render safely and show the error message
    let periods = [];
    try { const _p = await pool.query('SELECT id, label, start_time, end_time FROM periods ORDER BY id'); periods = _p[0] || []; } catch (e) { periods = []; }
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const message = `Error generating timetable: ${err && err.message ? err.message : 'unknown error'}`;
    res.render('admin/generate', { sections, assignMode: false, message, periods, days, generatedTimetables: [], facultySubjects: [], selectedSection: null });
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
  // Try to read lab allocations from database; if table doesn't exist or query fails,
  // fall back to sample data provided by the user.
  let labAllocations = [];
  try {
    const [rows] = await pool.query('SELECT lab_id, day, section, period, subject_id FROM lab_allocations ORDER BY lab_id, FIELD(day, "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), period');
    // If table exists and returns rows, use them
    if (rows && rows.length) {
      labAllocations = rows.map(r => ({ lab_id: r.lab_id, day: r.day, section: r.section, period: r.period, subject_id: r.subject_id }));
    }
  } catch (e) {
    // Table may not exist; use the fallback dataset
    labAllocations = SAMPLE_LAB_ALLOCATIONS;
  }

  // Group by lab id for rendering
  const labsGrouped = {};
  for (const row of labAllocations) {
    labsGrouped[row.lab_id] = labsGrouped[row.lab_id] || [];
    labsGrouped[row.lab_id].push(row);
  }

  // fetch periods and subjects to build a proper grid
  let periods = [];
  try {
    const _p = await pool.query('SELECT id, label, start_time, end_time FROM periods ORDER BY id');
    periods = _p[0] || [];
  } catch (e) {
    periods = [];
  }

  // fetch subject names
  const subjectsMap = {};
  try {
    const [subs] = await pool.query('SELECT id, name FROM subject');
    subs.forEach(s => { subjectsMap[s.id] = s.name; });
  } catch (e) {
    // ignore
  }

  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // build labsData: array of { labId, grid }
  const labsData = Object.keys(labsGrouped).map(lid => {
    const rows = labsGrouped[lid];
    const grid = {};
    for (const d of days) grid[d] = {};
    for (const r of rows) {
      // r.period may be '1,2' or '3,4' etc.
      const pParts = (r.period || '').toString().split(',').map(x => parseInt(x, 10)).filter(Boolean);
      for (const pid of pParts) {
        grid[r.day] = grid[r.day] || {};
        grid[r.day][pid] = {
          subject_name: subjectsMap[r.subject_id] || (`#${r.subject_id}`),
          section: r.section || ''
        };
      }
    }
    return { labId: parseInt(lid,10), grid };
  });

  res.render('admin/room_allocation', { labsData, periods, days });
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
