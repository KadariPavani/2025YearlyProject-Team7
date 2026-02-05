const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const {
  getTpoStudentActivity,
  getTrainerStudentActivity,
  getCoordinatorStudentActivity,
  getStudentOwnActivity,
  getStudentActivityById
} = require('../controllers/studentActivityController');

// @route   GET /api/student-activity/tpo
// @desc    Get all student activity (TPO view - all batches)
// @access  Private (TPO only)
router.get('/tpo', generalAuth, getTpoStudentActivity);

// @route   GET /api/student-activity/trainer
// @desc    Get student activity for trainer's assigned batches and subjects
// @access  Private (Trainer only)
router.get('/trainer', generalAuth, getTrainerStudentActivity);

// @route   GET /api/student-activity/coordinator
// @desc    Get student activity for coordinator's assigned batch
// @access  Private (Coordinator only)
router.get('/coordinator', generalAuth, getCoordinatorStudentActivity);

// @route   GET /api/student-activity/student
// @desc    Get individual student's activity with personal ranking
// @access  Private (Student only)
router.get('/student', generalAuth, getStudentOwnActivity);

// @route   GET /api/student-activity/:studentId
// @desc    Get activity summary for a specific student
// @access  Private (TPO or Coordinator)
router.get('/:studentId', generalAuth, getStudentActivityById);

module.exports = router;
