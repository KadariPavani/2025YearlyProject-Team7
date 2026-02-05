// routes/coordinatorRoutes.js
const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const {
  getProfile,
  getDashboard,
  getTodaySessions,
  markAttendance,
  getAttendanceHistory,
  getAttendanceByDate,
  updateAttendance,
  getAttendanceSummary,
  getStudentAttendanceDetails
} = require('../controllers/coordinatorController');

// ============================================
// COORDINATOR PROFILE & DASHBOARD
// ============================================

// GET Coordinator Profile
router.get('/profile', generalAuth, getProfile);

// GET Coordinator Dashboard
router.get('/dashboard', generalAuth, getDashboard);

// ============================================
// ATTENDANCE MANAGEMENT - MARK ATTENDANCE
// ============================================

// GET Scheduled Sessions for Today
router.get('/attendance/today-sessions', generalAuth, getTodaySessions);

// POST Mark Attendance
router.post('/attendance/mark', generalAuth, markAttendance);

// ============================================
// ATTENDANCE VIEWING & MANAGEMENT
// ============================================

// GET Attendance History
router.get('/attendance/history', generalAuth, getAttendanceHistory);

// GET Attendance for Specific Date
router.get('/attendance/date/:date', generalAuth, getAttendanceByDate);

// PUT Update Attendance
router.put('/attendance/:attendanceId', generalAuth, updateAttendance);

// GET Attendance Summary Statistics
router.get('/attendance/summary', generalAuth, getAttendanceSummary);

// GET Detailed Student Attendance
router.get('/attendance/student-details/:attendanceId', generalAuth, getStudentAttendanceDetails);

module.exports = router;
