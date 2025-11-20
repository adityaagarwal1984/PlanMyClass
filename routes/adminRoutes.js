const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../config/auth');

router.get('/', ensureAdmin, adminController.dashboard);

// faculty
router.get('/faculty', ensureAdmin, adminController.listFaculty);
router.post('/faculty/add', ensureAdmin, adminController.addFaculty);
router.delete('/faculty/:id', ensureAdmin, adminController.deleteFaculty);

// subjects
router.get('/subjects', ensureAdmin, adminController.listSubjects);
router.post('/subjects/add', ensureAdmin, adminController.addSubject);
router.delete('/subjects/:id', ensureAdmin, adminController.deleteSubject);

// sections
router.get('/sections', ensureAdmin, adminController.listSections);
router.post('/sections/add', ensureAdmin, adminController.addSection);
router.delete('/sections/:id', ensureAdmin, adminController.deleteSection);

// assign
router.get('/assign', ensureAdmin, adminController.showAssign);
router.post('/assign', ensureAdmin, adminController.assignSubject);
router.delete('/assignment/:id', ensureAdmin, adminController.deleteAssignment);

// generate
router.get('/generate', ensureAdmin, adminController.generatePage);
router.post('/generate', ensureAdmin, adminController.generateTimetable);
router.delete('/timetable/:id', ensureAdmin, adminController.deleteTimetableEntry);
router.delete('/timetable/section/:id', ensureAdmin, adminController.clearTimetableForSection);

// analytics
router.get('/analytics', ensureAdmin, adminController.analytics);

// new admin pages
router.get('/faculty-timetable', ensureAdmin, adminController.facultyTimetablePage);
router.get('/room-allocation', ensureAdmin, adminController.roomAllocationPage);

module.exports = router;
