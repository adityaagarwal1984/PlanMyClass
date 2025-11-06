const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/dashboard', studentController.showDashboard);
router.post('/dashboard', studentController.viewSectionTimetable);

module.exports = router;
