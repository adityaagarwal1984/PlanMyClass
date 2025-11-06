const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { ensureFaculty } = require('../config/auth');

router.get('/dashboard', ensureFaculty, facultyController.dashboard);

module.exports = router;
