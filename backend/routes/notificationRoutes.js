const express = require("express");
const router = express.Router();
const {
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getTrainerNotifications,
  getTpoNotifications,
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  getCoordinatorNotifications
} = require("../controllers/notificationController");
const generalAuth = require('../middleware/generalAuth');
const { verifyAdmin } = require('../middleware/auth');
const Notification = require("../models/Notification");

// 🔹 Admin notification routes (must be before parameterized routes)
router.get("/admin", verifyAdmin, getAdminNotifications);
router.put("/admin/mark-read/:id", verifyAdmin, markAdminNotificationAsRead);
router.put("/admin/mark-all-read", verifyAdmin, markAllAdminNotificationsAsRead);

// 🔹 Get all notifications for the logged-in student
router.get("/student", generalAuth, getStudentNotifications);

// 🔹 Mark one as read
router.put("/mark-read/:id", generalAuth, markNotificationAsRead);

// 🔹 Mark all as read
router.put("/mark-all-read", generalAuth, markAllNotificationsAsRead);
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

// ✅ Get Notifications for Coordinator (logged-in Coordinator)
router.get("/coordinator", generalAuth, getCoordinatorNotifications);

// ✅ Get Notifications for TPO (logged-in TPO)
router.get("/tpo", generalAuth, getTpoNotifications);

module.exports = router;
