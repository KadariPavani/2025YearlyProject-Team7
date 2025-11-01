const Notification = require("../models/Notification");
const Student = require("../models/Student");
const asyncHandler = require("express-async-handler");
const PlacementTrainingBatch = require("../models/PlacementTrainingBatch");

exports.createNotification = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      message,
      category: providedCategory,
      targetBatchIds,
      type, // optional: "event" | "schedule" | "assignment" | "quiz" | "resource"
    } = req.body;

    const senderRole = req.user.role || req.userType || "TPO";

    // 🧩 Smart category detection
    let category = providedCategory;

if (!category) {
  if (senderRole === "TPO") {
    // 🔵 TPO notifications always go to Placement Calendar
    category = "Placement Calendar";
  } else if (senderRole === "Trainer") {
    // 🟢 Trainer notifications limited to My Classes or Placement Calendar
    if (/schedule|class/i.test(title)) category = "My Classes";
    else category = "My Classes";
  } else {
    // 🧩 Default for student-facing notifications
    if (/quiz|test/i.test(title)) category = "Available Quizzes";
    else if (/assign/i.test(title)) category = "My Assignments";
    else if (/schedule|class/i.test(title)) category = "Weekly Class Schedule";
    else category = "Learning Resources";
  }
}


    // 🧭 Handle specific automatic notification types
    if (type === "schedule") {
      await exports.notifyWeeklyScheduleUpdate(
        req.body.batchId,
        req.user?.name || "Trainer"
      );
      return res.status(201).json({
        success: true,
        message: "Weekly schedule notifications sent successfully.",
      });
    }

    // 🎯 Target all or specific students
    let targetStudents = [];
    if (targetBatchIds && targetBatchIds.length > 0) {
      targetStudents = await Student.find({ batch: { $in: targetBatchIds } }, "_id");
    } else {
      targetStudents = await Student.find({}, "_id");
    }

    if (!targetStudents.length) {
      return res.status(404).json({
        success: false,
        message: "No target students found.",
      });
    }

    // 💬 Create notification document
    const notification = new Notification({
      title,
      message,
      category,
      senderId: req.user.id,
      senderModel: senderRole,
      recipients: targetStudents.map((student) => ({
        recipientId: student._id,
        recipientModel: "Student",
        isRead: false,
      })),
      targetBatches: targetBatchIds || [],
      targetRoles: ["student"],
      status: "sent",
    });

    await notification.save();

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${targetStudents.length} students under "${category}".`,
      data: notification,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔔 Auto notification when a weekly class schedule is created or updated
exports.notifyWeeklyScheduleUpdate = async (batchId, trainerName) => {
  try {
    const batch = await PlacementTrainingBatch.findById(batchId).populate("students", "_id name");
    if (!batch || !batch.students.length) return;

    const notifications = batch.students.map((student) => ({
      title: "Weekly Class Schedule Updated",
      message: `Your weekly class schedule has been updated by ${trainerName}. Please check your schedule for details.`,
      category: "Weekly Class Schedule",
      senderModel: "Trainer",
      recipients: [
        { recipientId: student._id, recipientModel: "Student", isRead: false },
      ],
    }));

    await Notification.insertMany(notifications);
    console.log(`📅 Sent Weekly Schedule notifications to ${batch.students.length} students.`);
  } catch (error) {
    console.error("Error sending Weekly Schedule notifications:", error);
  }
};
// 🔔 When TPO assigns trainers to a batch → notify students
exports.notifyTrainerAssignment = async (batchId, tpoName) => {
  console.log("📢 notifyTrainerAssignment called for batch:", batchId, "by:", tpoName);

  try {
    const batch = await PlacementTrainingBatch.findById(batchId)
      .populate("students", "_id name");

    if (!batch || !batch.students.length) {
      console.log("⚠️ No batch or students found");
      return;
    }

    const notifications = batch.students.map((student) => ({
      title: "Weekly Class Schedule Assigned",
      message: `Your training schedule has been assigned by ${tpoName}. Check your Weekly Class Schedule section for details.`,
      category: "Weekly Class Schedule",
      senderId: batch.tpoId, // ✅ add sender ID (the TPO)
      senderModel: "TPO",
      targetBatches: [batchId],
      targetRoles: ["student"],
      status: "sent",
      recipients: [
        { recipientId: student._id, recipientModel: "Student", isRead: false },
      ],
    }));

    await Notification.insertMany(notifications);
    console.log(`✅ Notifications created for ${batch.students.length} students.`);
  } catch (error) {
    console.error("❌ Error sending trainer assignment notifications:", error);
  }
};
// 🔔 Auto notification when a new assignment is created by a trainer
exports.notifyAssignmentCreated = async (batchId, trainerName, assignmentTitle) => {
  try {
    const PlacementTrainingBatch = require("../models/PlacementTrainingBatch");
    const Notification = require("../models/Notification");

    const batch = await PlacementTrainingBatch.findById(batchId)
      .populate("students", "_id name");

    if (!batch || !batch.students.length) {
      console.log("⚠️ No students found in batch for assignment notification.");
      return;
    }

    const notifications = batch.students.map((student) => ({
      title: `New Assignment: ${assignmentTitle}`,
      message: `A new assignment "${assignmentTitle}" has been created by ${trainerName}. Please check your My Assignments section for details.`,
      category: "My Assignments",
      senderModel: "Trainer",
      targetBatches: [batchId],
      targetRoles: ["student"],
      status: "sent",
      recipients: [
        { recipientId: student._id, recipientModel: "Student", isRead: false },
      ],
    }));

    await Notification.insertMany(notifications);
    console.log(`📘 Sent 'My Assignments' notifications to ${batch.students.length} students.`);
  } catch (error) {
    console.error("❌ Error sending assignment notifications:", error);
  }
};



// ✅ Get all notifications for the logged-in student (with proper filters + logs)
exports.getStudentNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    console.log("👤 Fetching notifications for student:", userId);

    // Match any notification where this student is one of the recipients
    const notifications = await Notification.find({
      "recipients.recipientId": userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${notifications.length} notifications.`);

    // 🧩 Fix any missing categories before sending to frontend
    const fixedNotifications = notifications.map((n) => ({
      ...n,
      category: n.category || "Placement", // Default fallback
    }));

    const unreadByCategory = fixedNotifications.reduce(
      (acc, n) => {
        const cat = n.category || "Placement";
        if (!n.recipients?.some((r) => r.isRead)) {
          acc[cat] = (acc[cat] || 0) + 1;
        }
        return acc;
      },
      {
        Placement: 0,
        "Weekly Class Schedule": 0,
        "My Assignments": 0,
        "Available Quizzes": 0,
        "Learning Resources": 0,
      }
    );

    res.status(200).json({
      success: true,
      count: fixedNotifications.length,
      data: fixedNotifications,
      unreadByCategory,
    });
  } catch (error) {
    console.error("❌ Error fetching student notifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching notifications.",
      error: error.message,
    });
  }
});




// ✅ Mark one notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const studentId = req.user._id;
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

// ✅ Get only notifications for the logged-in trainer
exports.getTrainerNotifications = asyncHandler(async (req, res) => {
  try {
    const trainerId = req.user?.userId || req.user?._id;
    if (!trainerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("👨‍🏫 Fetching notifications for trainer:", trainerId);

    // 🔒 Fetch only notifications that belong to this specific trainer
    const notifications = await Notification.find({
      "recipients.recipientId": trainerId,
      "recipients.recipientModel": "Trainer"
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${notifications.length} notifications for trainer ${trainerId}.`);

    // 🧮 Compute unread counts by category
    const unreadByCategory = notifications.reduce((acc, n) => {
      const category = n.category || "Placement Calendar";
      const isUnread = n.recipients?.some(
        (r) => r.recipientId.toString() === trainerId.toString() && !r.isRead
      );
      if (isUnread) acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
      unreadByCategory,
    });
  } catch (error) {
    console.error("❌ Error fetching trainer notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trainer notifications",
      error: error.message,
    });
  }
});

exports.notifyTrainerEventUpdate = async (trainerIds, eventTitle, action, senderId) => {
  try {
    const Notification = require("../models/Notification");
    const actionLower = (action || "").toLowerCase();

    // 🧠 Safety: always sanitize inputs
    if (!trainerIds?.length || !eventTitle) {
      console.log("⚠️ No trainers or invalid event title for notifyTrainerEventUpdate");
      return;
    }

    let baseTitle = "";
    let baseMessage = "";

    // ✅ Decide proper message
    if (["create", "created", "new"].includes(actionLower)) {
      baseTitle = "New Placement Event Created";
      baseMessage = `TPO has scheduled a new placement event: "${eventTitle}".`;
    }
    else if (["cancel", "cancelled", "delete", "deleted", "remove", "removed"].includes(actionLower)) {
      baseTitle = "Placement Event Cancelled";
      baseMessage = `The event "${eventTitle}" has been cancelled by the TPO.`;
    }
    else if (["update", "updated", "edit", "edited"].includes(actionLower)) {
      baseTitle = "Placement Event Updated";
      baseMessage = `The event "${eventTitle}" has been updated by the TPO.`;
    }
    else {
      baseTitle = "Placement Event Updated";
      baseMessage = `The event "${eventTitle}" has been updated by the TPO.`;
    }

    const notifications = trainerIds.map((trainerId) => ({
      title: baseTitle,
      message: baseMessage,
      category: "Placement Calendar",
      senderId,
      senderModel: "TPO",
      recipients: [
        { recipientId: trainerId, recipientModel: "Trainer", isRead: false },
      ],
      targetRoles: ["trainer"],
      status: "sent",
      type: "info",
      priority: "medium",
      isGlobal: false,
    }));

    await Notification.insertMany(notifications, { ordered: false });
    console.log(`📩 Sent '${baseTitle}' notifications to ${trainerIds.length} trainers.`);
  } catch (error) {
    console.error("❌ Error sending trainer event update notifications:", error);
  }
};

// 🔔 Notify students when a TPO updates or cancels a placement event
exports.notifyStudentEventUpdate = async (eventTitle, action, senderId) => {
  try {
    const Notification = require("../models/Notification");
    const Student = require("../models/Student");

    const actionLower = (action || "").toLowerCase();
    let baseTitle = "";
    let baseMessage = "";

    if (["cancel", "cancelled", "delete", "deleted", "remove", "removed"].includes(actionLower)) {
      baseTitle = "Placement Event Cancelled";
      baseMessage = `The placement event "${eventTitle}" has been cancelled by the TPO.`;
    } else if (["update", "updated", "edit", "edited"].includes(actionLower)) {
      baseTitle = "Placement Event Updated";
      baseMessage = `The placement event "${eventTitle}" has been updated by the TPO.`;
    } else {
      baseTitle = "Placement Event Update";
      baseMessage = `There is an update regarding the placement event "${eventTitle}".`;
    }

    const students = await Student.find({}, "_id");
    if (!students.length) {
      console.log("⚠️ No students found for event notification.");
      return;
    }

    const notifications = students.map((s) => ({
      title: baseTitle,
      message: baseMessage,
      category: "Placement",
      senderId,
      senderModel: "TPO",
      recipients: [{ recipientId: s._id, recipientModel: "Student", isRead: false }],
      targetRoles: ["student"],
      status: "sent",
      type: "info",
      priority: "medium",
      isGlobal: false,
    }));

    await Notification.insertMany(notifications, { ordered: false });
    console.log(`📩 Sent '${baseTitle}' notifications to ${students.length} students.`);
  } catch (error) {
    console.error("❌ Error sending student event update notifications:", error);
  }
};
// ✅ Notify Trainers that their schedule was rescheduled
exports.notifyTrainerReschedule = async (batchId, updatedBy) => {
  try {
    const PlacementTrainingBatch = require("../models/PlacementTrainingBatch");
    const Notification = require("../models/Notification");

    const batch = await PlacementTrainingBatch.findById(batchId)
      .populate("assignedTrainers.trainer", "_id name email");

    if (!batch || !batch.assignedTrainers || batch.assignedTrainers.length === 0) {
      console.warn("⚠️ No trainers found for batch reschedule notification");
      return;
    }

    for (const assignment of batch.assignedTrainers) {
      const trainer = assignment.trainer;
      if (!trainer?._id) continue;

      await Notification.create({
        title: "Class Rescheduled",
        message: `Your assigned class for batch ${batch.batchNumber} has been rescheduled by ${updatedBy}. Please review your updated Weekly Class Schedule.`,
        category: "My Classes",
        senderModel: "TPO",
        senderId: batch.tpoId,
        recipients: [
          {
            recipientId: trainer._id,
            recipientModel: "Trainer",
            isRead: false,
          },
        ],
        targetRoles: ["trainer"],
        targetBatches: [batch._id],
        status: "sent",
      });

      console.log(`📢 Reschedule notification sent to trainer ${trainer.name}`);
    }
  } catch (error) {
    console.error("❌ Error sending trainer reschedule notifications:", error);
  }
};

// ✅ Notify Students that their schedule was rescheduled
exports.notifyStudentReschedule = async (batchId, updatedBy) => {
  try {
    const PlacementTrainingBatch = require("../models/PlacementTrainingBatch");
    const Notification = require("../models/Notification");

    const batch = await PlacementTrainingBatch.findById(batchId)
      .populate("students", "_id name email");

    if (!batch || !batch.students || batch.students.length === 0) {
      console.warn("⚠️ No students found for batch reschedule notification");
      return;
    }

    const notifications = batch.students.map(student => ({
      title: "Weekly Class Schedule Rescheduled",
      message: `Your Weekly Class Schedule has been rescheduled by ${updatedBy}. Please check your schedule for the updated timings.`,
      category: "Weekly Class Schedule",
      senderModel: "TPO",
      senderId: batch.tpoId,
      recipients: [
        {
          recipientId: student._id,
          recipientModel: "Student",
          isRead: false,
        },
      ],
      targetRoles: ["student"],
      targetBatches: [batch._id],
      status: "sent",
    }));

    await Notification.insertMany(notifications);
    console.log(`📢 Reschedule notifications sent to ${notifications.length} students`);
  } catch (error) {
    console.error("❌ Error sending student reschedule notifications:", error);
  }
};







