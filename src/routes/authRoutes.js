const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

// landing
router.get('/', auth.landing);

// Admin signup/login
router.get('/admin-signup', auth.getAdminSignup);
router.post('/admin-signup', auth.postAdminSignup);
router.get('/admin-login', auth.getAdminLogin);
router.post('/admin-login', auth.postAdminLogin);

// Faculty login
router.get('/faculty-login', auth.getFacultyLogin);
router.post('/faculty-login', auth.postFacultyLogin);

// Student login
router.get('/student-login', auth.getStudentLogin);
router.post('/student-login', auth.postStudentLogin);

// Simple dashboards (placeholders)
router.get('/admin/dashboard', auth.adminDashboard);
router.get('/faculty/dashboard', auth.facultyDashboard);
router.get('/student/dashboard', auth.studentDashboard);

module.exports = router;
