const Notification = require("../models/Notification");

// ✅ Fetch all notifications for the logged-in student
exports.getStudentNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const notifications = await Notification.find({
      "recipients.recipientId": studentId,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Mark one notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const studentId = req.user.id;
    const notificationId = req.params.id;

    const updated = await Notification.updateOne(
      { _id: notificationId, "recipients.recipientId": studentId },
      {
        $set: {
          "recipients.$.isRead": true,
          "recipients.$.readAt": new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: updated,
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
