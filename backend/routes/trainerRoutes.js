const express = require('express');
const generalAuth = require('../middleware/generalAuth');
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const {
  registerTrainer,
  loginTrainer,
  getTrainerProfile,
  getPlacementTrainingBatches,
  getPlacementBatchDetails,
  updateTrainerProfile,
  changeTrainerPassword,
  logoutTrainer,
  getMyAttendance,
  getSessionsTaught
} = require('../controllers/trainerController');

// Fetch all notifications for the logged-in trainer
router.get("/notifications", generalAuth, notificationController.getTrainerNotifications);

// @desc Register trainer
// @route POST /api/trainer/register
// @access Public
router.post('/register', registerTrainer);

// @desc Auth trainer & get token
// @route POST /api/trainer/login
// @access Public
router.post('/login', loginTrainer);

// @desc Get trainer profile
// @route GET /api/trainer/profile
// @access Private
router.get('/profile', generalAuth, getTrainerProfile);

// @desc Get assigned placement training batches
// @route GET /api/trainer/placement-training-batches
// @access Private
router.get('/placement-training-batches', generalAuth, getPlacementTrainingBatches);

// @desc Get detailed batch information for trainer
// @route GET /api/trainer/placement-batch-details/:batchId
// @access Private
router.get('/placement-batch-details/:batchId', generalAuth, getPlacementBatchDetails);

// @desc Update trainer profile
// @route PUT /api/trainer/profile
// @access Private
router.put('/profile', generalAuth, updateTrainerProfile);

// @desc Change trainer password
// @route PUT /api/trainer/change-password
// @access Private
router.put('/change-password', generalAuth, changeTrainerPassword);

// @desc Logout trainer
// @route POST /api/trainer/logout
// @access Private
router.post('/logout', generalAuth, logoutTrainer);

// GET Trainer's Own Attendance
router.get('/attendance/my-attendance', generalAuth, getMyAttendance);

// GET Sessions Taught by Trainer
router.get('/attendance/sessions-taught', generalAuth, getSessionsTaught);

module.exports = router;
