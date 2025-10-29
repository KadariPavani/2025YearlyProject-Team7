const express = require("express");
const router = express.Router();
const {
  getStudentNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationController");
const generalAuth = require('../middleware/generalAuth');

// 🔹 Get all notifications for the logged-in student
router.get("/student", generalAuth, getStudentNotifications);

// 🔹 Mark one as read
router.put("/mark-read/:id", generalAuth, markNotificationAsRead);

module.exports = router;
