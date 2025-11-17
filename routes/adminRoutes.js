const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../config/auth');

router.get('/', ensureAdmin, adminController.dashboard);

// faculty
router.get('/faculty', ensureAdmin, adminController.listFaculty);
router.post('/faculty/add', ensureAdmin, adminController.addFaculty);

// subjects
router.get('/subjects', ensureAdmin, adminController.listSubjects);
router.post('/subjects/add', ensureAdmin, adminController.addSubject);

// sections
router.get('/sections', ensureAdmin, adminController.listSections);
router.post('/sections/add', ensureAdmin, adminController.addSection);

// assign
router.get('/assign', ensureAdmin, adminController.showAssign);
router.post('/assign', ensureAdmin, adminController.assignSubject);

// generate
router.get('/generate', ensureAdmin, adminController.generatePage);
router.post('/generate', ensureAdmin, adminController.generateTimetable);

// analytics
router.get('/analytics', ensureAdmin, adminController.analytics);

// new admin pages
router.get('/faculty-timetable', ensureAdmin, adminController.facultyTimetablePage);
router.get('/room-allocation', ensureAdmin, adminController.roomAllocationPage);

module.exports = router;
