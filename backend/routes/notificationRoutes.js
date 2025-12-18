const express = require("express");
const router = express.Router();
const {
  getStudentNotifications,
  markNotificationAsRead, getTrainerNotifications,
} = require("../controllers/notificationController");
const generalAuth = require('../middleware/generalAuth');
const Notification = require("../models/Notification"); 
// 🔹 Get all notifications for the logged-in student
router.get("/student", generalAuth, getStudentNotifications);

// 🔹 Mark one as read
router.put("/mark-read/:id", generalAuth, markNotificationAsRead);
// ✅ Get Notifications for Trainer
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;

    const notifications = await Notification.find({
      "recipients.recipientId": trainerId,
      "recipients.recipientModel": "Trainer",
    })
      .sort({ createdAt: -1 })
      .limit(30); // optional limit for performance

    res.json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching trainer notifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching trainer notifications",
      error: error.message,
    });
  }
});

module.exports = router;
