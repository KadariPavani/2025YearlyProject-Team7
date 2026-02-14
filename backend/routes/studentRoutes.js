const express = require('express');
const generalAuth = require('../middleware/generalAuth');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAvailableCrtOptions,
  getPendingApprovals,
  uploadProfileImage,
  uploadResume,
  checkPasswordChange,
  getMyBatch,
  getPlacementTrainingBatchInfo,
  getMyTrainersSchedule,
  getMyAttendance,
  getAttendanceMonthlySummary
} = require('../controllers/studentController');

router.get('/profile', generalAuth, getProfile);

// Updated profile update to validate CRT batch choice
router.put('/profile', generalAuth, updateProfile);

// GET available CRT batch options for the student
router.get('/available-crt-options', generalAuth, getAvailableCrtOptions);

// GET Pending Approvals for Student
router.get('/pending-approvals', generalAuth, getPendingApprovals);

// POST /api/student/profile-image
router.post('/profile-image', generalAuth, uploadProfileImage);

// POST /api/student/resume
router.post('/resume', generalAuth, uploadResume);

// GET /api/student/check-password-change
router.get('/check-password-change', generalAuth, checkPasswordChange);

// GET /api/student/my-batch
router.get('/my-batch', generalAuth, getMyBatch);

// GET /api/student/placement-training-batch-info
router.get('/placement-training-batch-info', generalAuth, getPlacementTrainingBatchInfo);

// GET /api/student/my-trainers-schedule
router.get('/my-trainers-schedule', generalAuth, getMyTrainersSchedule);

// GET Student's Own Attendance
router.get('/attendance/my-attendance', generalAuth, getMyAttendance);

// GET Student Attendance Summary by Month
router.get('/attendance/monthly-summary', generalAuth, getAttendanceMonthlySummary);

module.exports = router;
