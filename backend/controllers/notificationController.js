const Notification = require("../models/Notification");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const TPO = require("../models/TPO");
const Coordinator = require("../models/Coordinator");
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
    if (/quiz|test/i.test(title)) category = "Tests";
    else if (/assign/i.test(title)) category = "Tests";
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
// 🔹 Send notifications to all students when a trainer creates an assignment
exports.notifyAssignmentCreated = async (batchId, trainerName, assignmentTitle, trainerId) => {
  try {
    const mongoose = require("mongoose");
    const Notification = require("../models/Notification");
    const Student = require("../models/Student");

    console.log("📘 [notifyAssignmentCreated] Batch ID:", batchId);
    console.log("👨‍🏫 Trainer:", trainerName, "Assignment:", assignmentTitle);

    // ✅ Validate trainer ID
    const validTrainerId = mongoose.Types.ObjectId.isValid(trainerId)
      ? new mongoose.Types.ObjectId(trainerId)
      : null;
    if (!validTrainerId) {
      console.error("❌ Invalid trainerId:", trainerId);
      return;
    }

    // ✅ Fetch students who belong to this batch
    let students = await Student.find({ placementTrainingBatchId: batchId }).select("_id name email");
    console.log(`🧾 Found ${students.length} students for batch ${batchId}`);

    if (!students.length) {
      students = await Student.find({ batchId: batchId }).select("_id name email");

      console.warn("⚠️ No students found for placementTrainingBatchId:", batchId);
      return;
    }

    // ✅ Prepare notifications
    const notifications = students.map((student) => ({
      title: `New Assignment: ${assignmentTitle}`,
      message: `A new assignment "${assignmentTitle}" has been created by ${trainerName}.`,
      category: "Tests",
      senderId: validTrainerId,
      senderModel: "Trainer",
      targetBatches: [batchId],
      targetRoles: ["student"],
      status: "sent",
      recipients: [
        { recipientId: student._id, recipientModel: "Student", isRead: false },
      ],
    }));

    // ✅ Insert notifications in bulk
    await Notification.insertMany(notifications);
    console.log(`✅ Inserted ${notifications.length} notifications successfully.`);
  } catch (error) {
    console.error("❌ Error in notifyAssignmentCreated:", error);
  }
};

// 🔔 Notify students when a trainer creates a contest
exports.notifyContestCreated = async (contestId, trainerId, contestName, targetBatchIds = [], trainerName = 'Trainer') => {
  try {
    const Notification = require('../models/Notification');
    const Student = require('../models/Student');

    // Only notify students in the specified batches
    if (!targetBatchIds || !targetBatchIds.length) {
      console.log('⚠️ No target batches specified for contest notification, skipping.');
      return;
    }

    const students = await Student.find({ batch: { $in: targetBatchIds } }).select('_id name email');

    if (!students.length) {
      console.log('No students found for contest notification');
      return;
    }

    const notifications = students.map((student) => ({
      title: `New Contest: ${contestName}`,
      message: `${trainerName} created a new coding contest: ${contestName}. Please check your Contests section to participate.`,
      category: 'Contest',
      senderId: trainerId,
      senderModel: 'Trainer',
      targetBatches: targetBatchIds || [],
      targetRoles: ['student'],
      status: 'sent',
      recipients: [
        { recipientId: student._id, recipientModel: 'Student', isRead: false }
      ]
    }));

    await Notification.insertMany(notifications);
    console.log(`✅ Sent contest notifications to ${students.length} students.`);
  } catch (error) {
    console.error('❌ Error in notifyContestCreated:', error);
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

    // 🧩 Normalize legacy categories to current ones
    const normalizeCat = (cat) => {
      if (cat === "Available Quizzes" || cat === "My Assignments" || cat === "Contest") return "Tests";
      return cat || "Placement";
    };

    const fixedNotifications = notifications.map((n) => ({
      ...n,
      category: normalizeCat(n.category),
    }));

    // Calculate unread counts - check if THIS specific user has read the notification
    const unreadByCategory = fixedNotifications.reduce(
      (acc, n) => {
        const cat = n.category;
        // Find if THIS user has read this notification
        const userRecipient = n.recipients?.find(
          (r) => r.recipientId?.toString() === userId?.toString()
        );
        const isUnread = userRecipient && !userRecipient.isRead;
        
        if (isUnread) {
          console.log(`📝 Counting unread in ${cat}: "${n.title}"`);
          acc[cat] = (acc[cat] || 0) + 1;
        }
        return acc;
      },
      {
        Placement: 0,
        "Weekly Class Schedule": 0,
        "Tests": 0,
        "Learning Resources": 0,
        "Account": 0,
      }
    );

    console.log("📊 Unread by category:", unreadByCategory);
    console.log("📊 Total unread:", Object.values(unreadByCategory).reduce((a, b) => a + b, 0));

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

// Mark all notifications as read for a user (Student, Trainer, or TPO)
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    let userModel = req.user.role || req.userType || "Student"; // Student, Trainer, or TPO
    const { category } = req.body; // Optional: mark only specific category
    
    // Normalize the userModel to match database values
    if (userModel.toLowerCase() === 'student') userModel = 'Student';
    if (userModel.toLowerCase() === 'trainer') userModel = 'Trainer';
    if (userModel.toLowerCase() === 'tpo') userModel = 'TPO';
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log(`📬 Marking notifications as read for ${userModel}:`, userId, category ? `(Category: ${category})` : '(All categories)');

    // Build query - if category is provided, filter by it
    const query = { 
      "recipients.recipientId": userId
    };
    
    if (category) {
      query.category = category;
    }

    // Find all notifications where this user is a recipient
    const notifications = await Notification.find(query);

    console.log(`📋 Found ${notifications.length} notifications for user ${userId}${category ? ` in category ${category}` : ''}`);

    // Update all notifications where this user is a recipient
    const result = await Notification.updateMany(
      query,
      {
        $set: {
          "recipients.$[elem].isRead": true,
          "recipients.$[elem].readAt": new Date(),
        },
      },
      {
        arrayFilters: [{ 
          "elem.recipientId": userId
        }],
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} notifications, matched ${result.matchedCount}`);

    return res.status(200).json({
      success: true,
      message: category ? `All notifications in ${category} marked as read` : "All notifications marked as read",
      data: { 
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        category: category || 'all'
      },
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
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

    // 🧮 Compute unread counts by category - check if THIS trainer has read it
    const unreadByCategory = notifications.reduce((acc, n) => {
      const category = n.category || "Placement Calendar";
      // Find if THIS specific trainer has read this notification
      const recipient = n.recipients?.find(
        (r) => r.recipientId?.toString() === trainerId?.toString()
      );
      const isUnread = recipient && !recipient.isRead;
      if (isUnread) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {
      "My Classes": 0,
      "Placement Calendar": 0,
      "Account": 0,
    });

    console.log("📊 Backend trainer unread by category:", unreadByCategory);
    console.log("📊 Backend trainer total unread:", Object.values(unreadByCategory).reduce((a, b) => a + b, 0));

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

// ✅ Get notifications for TPO (supports recipients where recipientModel is TPO OR global/targetRoles include tpo)
exports.getTpoNotifications = asyncHandler(async (req, res) => {
  try {
    let tpoId = req.user?.userId || req.user?._id || req.user?.id;

    // If token belongs to a TPO user, use req.user directly
    if (!tpoId && req.userType && String(req.userType).toLowerCase() === 'tpo') {
      tpoId = req.user?._id || req.user?.id;
      console.log('[notificationController] Using req.user as TPO id:', tpoId);
    }

    if (!tpoId) {
      console.warn('[notificationController] Unauthorized: no TPO id in request', { user: req.user?.id, userType: req.userType });
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("🔔 Fetching notifications for TPO:", tpoId);

    const notifications = await Notification.find({
      "recipients.recipientId": tpoId,
      "recipients.recipientModel": "TPO"
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${notifications.length} notifications for TPO ${tpoId}.`);

    const unreadByCategory = notifications.reduce((acc, n) => {
      const category = n.category || "Placement";
      // Find if THIS specific TPO has read this notification
      const recipient = n.recipients?.find(
        (r) => r.recipientId?.toString() === tpoId?.toString()
      );
      const isUnread = recipient && !recipient.isRead;
      if (isUnread) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {
      "Placement": 0,
      "CRT Batches": 0,
      "Account": 0,
    });

    console.log("📊 Backend TPO unread by category:", unreadByCategory);
    console.log("📊 Backend TPO total unread:", Object.values(unreadByCategory).reduce((a, b) => a + b, 0));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
      unreadByCategory,
    });
  } catch (error) {
    console.error("❌ Error fetching TPO notifications:", error);
    res.status(500).json({ success: false, message: "Error fetching TPO notifications", error: error.message });
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
exports.notifyStudentEventUpdate = async (eventTitle, action, senderId, targetBatchIds = []) => {
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

    let students = [];
    if (targetBatchIds && targetBatchIds.length > 0) {
      students = await Student.find({
        $or: [
          { placementTrainingBatchId: { $in: targetBatchIds } },
          { batchId: { $in: targetBatchIds } },
        ],
      }, "_id");
    }

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
// 🔔 Notify students when an assignment is deleted/cancelled
exports.notifyAssignmentDeleted = async (batchId, trainerName, assignmentTitle, trainerId) => {
  try {
    const mongoose = require("mongoose");
    const Notification = require("../models/Notification");
    const Student = require("../models/Student");

    console.log("🗑️ [notifyAssignmentDeleted] Batch ID:", batchId);
    console.log("👨‍🏫 Trainer:", trainerName, "Assignment:", assignmentTitle);

    const validTrainerId = mongoose.Types.ObjectId.isValid(trainerId)
      ? new mongoose.Types.ObjectId(trainerId)
      : null;
    if (!validTrainerId) {
      console.error("❌ Invalid trainerId:", trainerId);
      return;
    }

    // Find students linked to the batch (placement or regular)
    let students = await Student.find({ placementTrainingBatchId: batchId }).select("_id name email");

    if (!students.length) {
      students = await Student.find({ batchId }).select("_id name email");
      if (!students.length) {
        console.warn("⚠️ No students found for batch:", batchId);
        return;
      }
    }

    const notifications = students.map((student) => ({
      title: `Assignment Cancelled: ${assignmentTitle}`,
      message: `The assignment "${assignmentTitle}" created by ${trainerName} has been cancelled.`,
      category: "Tests",
      senderId: validTrainerId,
      senderModel: "Trainer",
      targetBatches: [batchId],
      targetRoles: ["student"],
      status: "sent",
      type: "warning",
      recipients: [
        { recipientId: student._id, recipientModel: "Student", isRead: false },
      ],
    }));

    await Notification.insertMany(notifications);
    console.log(`🚮 Sent cancellation notifications to ${notifications.length} students.`);
  } catch (error) {
    console.error("❌ Error in notifyAssignmentDeleted:", error);
  }
};

exports.sendNotificationToBatches = async (data) => {
  const { title, message, category, targetBatchIds = [], type, user } = data;

  try {
    let targetStudents = [];

    if (targetBatchIds.length > 0) {
      targetStudents = await Student.find({
        $or: [
          { batchId: { $in: targetBatchIds } },
          { placementTrainingBatchId: { $in: targetBatchIds } }
        ]
      }).select("_id name");
    }

    if (!targetStudents.length) {
      console.log("⚠️ No students found for notification");
      return;
    }

    const notification = new Notification({
      title,
      message,
      category: category || "Tests",
      senderId: user.id,
      senderModel: user.role || "Trainer",
      recipients: targetStudents.map(s => ({
        recipientId: s._id,
        recipientModel: "Student",
        isRead: false
      })),
      targetBatches: targetBatchIds,
      targetRoles: ["student"],
      status: "sent",
      type: type || "info"
    });

    await notification.save();
    console.log(`📩 Notification sent to ${targetStudents.length} students`);
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
};


// ✅ Notify students if a quiz is deleted
exports.notifyQuizDeleted = async (batchId, trainerName, quizTitle, trainerId) => {
  try {
    let students = await Student.find({ placementTrainingBatchId: batchId }).select("_id name");
    if (!students.length) students = await Student.find({ batchId }).select("_id name");
    if (!students.length) return;

    const notifications = students.map(s => ({
      title: `Quiz Cancelled: ${quizTitle}`,
      message: `The quiz "${quizTitle}" created by ${trainerName} has been cancelled.`,
      category: "Tests",
      senderId: trainerId,
      senderModel: "Trainer",
      recipients: [{ recipientId: s._id, recipientModel: "Student", isRead: false }],
      targetBatches: [batchId],
      targetRoles: ["student"],
      status: "sent",
      type: "warning"
    }));

    await Notification.insertMany(notifications);
    console.log(`🚮 Sent cancellation notifications for quiz '${quizTitle}'`);
  } catch (error) {
    console.error("❌ Error in notifyQuizDeleted:", error);
  }
};

// ✅ Notify students when a quiz is created
exports.notifyQuizCreated = async (batchId, trainerName, quizTitle, trainerId) => {
  try {
    const Student = require("../models/Student");
    let students = await Student.find({ placementTrainingBatchId: batchId }).select("_id name");
    if (!students.length) students = await Student.find({ batchId }).select("_id name");
    if (!students.length) return;

    const notifications = students.map((s) => ({
      title: `New Quiz Created: ${quizTitle}`,
      message: `A new quiz "${quizTitle}" has been created by ${trainerName}.`,
      category: "Tests",
      senderId: trainerId,
      senderModel: "Trainer",
      recipients: [{ recipientId: s._id, recipientModel: "Student", isRead: false }],
      targetBatches: [batchId],
      targetRoles: ["student"],
      status: "sent",
      type: "info",
      priority: "medium",
    }));

    await Notification.insertMany(notifications);
    console.log(`🧠 Sent quiz creation notifications for '${quizTitle}'`);
  } catch (error) {
    console.error("❌ Error in notifyQuizCreated:", error);
  }
};

// Notify students when trainer uploads a new resource
const notifyBatches = async (batchIds, batchTypeLabel) => {
  if (batchIds.length > 0) {
    await createNotification(
      {
        body: {
          title: `New Resource Added (${batchTypeLabel})`,
          message: `A new resource "${topicName}" has been uploaded by ${req.user.name}.`,
          category: "Learning Resources",
          targetBatchIds: batchIds,
          type: "resource",
        },
        user: req.user,
      },
      { status: () => ({ json: () => {} }) }
    );
  }
};

// ✅ Get all notifications for the logged-in admin
exports.getAdminNotifications = asyncHandler(async (req, res) => {
  try {
    const adminId = req.admin?._id || req.userId;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await Notification.find({
      "recipients.recipientId": adminId,
      "recipients.recipientModel": "Admin",
    })
      .sort({ createdAt: -1 })
      .lean();

    const unreadByCategory = notifications.reduce(
      (acc, n) => {
        const category = n.category || "Contact Messages";
        const recipient = n.recipients?.find(
          (r) => r.recipientId?.toString() === adminId?.toString()
        );
        const isUnread = recipient && !recipient.isRead;
        if (isUnread) {
          acc[category] = (acc[category] || 0) + 1;
        }
        return acc;
      },
      { "Contact Messages": 0 }
    );

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
      unreadByCategory,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ Mark one admin notification as read
exports.markAdminNotificationAsRead = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.userId;
    const notificationId = req.params.id;

    await Notification.updateOne(
      { _id: notificationId, "recipients.recipientId": adminId },
      {
        $set: {
          "recipients.$.isRead": true,
          "recipients.$.readAt": new Date(),
        },
      }
    );

    return res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking admin notification as read:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Mark all admin notifications as read
exports.markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    const adminId = req.admin?._id || req.userId;

    const result = await Notification.updateMany(
      { "recipients.recipientId": adminId, "recipients.recipientModel": "Admin" },
      {
        $set: {
          "recipients.$[elem].isRead": true,
          "recipients.$[elem].readAt": new Date(),
        },
      },
      { arrayFilters: [{ "elem.recipientId": adminId }] }
    );

    return res.status(200).json({
      success: true,
      message: "All admin notifications marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (err) {
    console.error("Error marking all admin notifications as read:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Create notification for all admins when a new contact form is submitted
exports.notifyAdminNewContact = async (contactData) => {
  try {
    const { name, email, phone, message } = contactData;

    const admins = await Admin.find({}, "_id");
    if (!admins.length) return;

    const notification = new Notification({
      title: "New Contact Message",
      message: `${name} (${phone}) sent: "${message ? message.substring(0, 100) : ""}"`,
      category: "Contact Messages",
      senderId: admins[0]._id,
      senderModel: "Admin",
      recipients: admins.map((a) => ({
        recipientId: a._id,
        recipientModel: "Admin",
        isRead: false,
      })),
      targetRoles: ["admin"],
      status: "sent",
      type: "info",
      priority: "medium",
    });

    await notification.save();
    console.log(`Sent contact notification to ${admins.length} admins.`);
  } catch (error) {
    console.error("Error in notifyAdminNewContact:", error);
  }
};

// ✅ Notify TPO when a CRT batch is assigned to them
exports.notifyTpoBatchAssignment = async ({ tpoId, batchNumber, colleges, studentsCount, adminId }) => {
  try {
    const notification = new Notification({
      title: "New CRT Batch Assigned",
      message: `CRT Batch "${batchNumber}" (${colleges.join(", ")}) with ${studentsCount} students has been assigned to you.`,
      category: "CRT Batches",
      senderId: adminId,
      senderModel: "Admin",
      recipients: [{ recipientId: tpoId, recipientModel: "TPO", isRead: false }],
      targetRoles: ["tpo"],
      status: "sent",
      type: "info",
      priority: "medium",
    });

    await notification.save();
    console.log(`Sent CRT batch assignment notification to TPO ${tpoId}.`);
  } catch (error) {
    console.error("Error in notifyTpoBatchAssignment:", error);
  }
};

// ✅ Notify TPO when their account is created with login credentials
exports.notifyTpoAccountCreated = async ({ tpoId, tpoName, tpoEmail, adminName }) => {
  try {
    const admins = await Admin.find({}, "_id");
    const senderId = admins.length > 0 ? admins[0]._id : tpoId;

    const notification = new Notification({
      title: "Welcome to InfoVerse!",
      message: `Hello ${tpoName}, your TPO account has been created by ${adminName}. Your login credentials have been sent to ${tpoEmail}. Please login and change your password.`,
      category: "Account",
      senderId: senderId,
      senderModel: "Admin",
      recipients: [{ recipientId: tpoId, recipientModel: "TPO", isRead: false }],
      targetRoles: ["tpo"],
      status: "sent",
      type: "info",
      priority: "high",
    });

    await notification.save();
    console.log(`Sent account creation notification to TPO ${tpoId}.`);
  } catch (error) {
    console.error("Error in notifyTpoAccountCreated:", error);
  }
};

// ✅ Notify Trainer when their account is created with login credentials
exports.notifyTrainerAccountCreated = async ({ trainerId, trainerName, trainerEmail, adminName }) => {
  try {
    const admins = await Admin.find({}, "_id");
    const senderId = admins.length > 0 ? admins[0]._id : trainerId;

    const notification = new Notification({
      title: "Welcome to InfoVerse!",
      message: `Hello ${trainerName}, your Trainer account has been created by ${adminName}. Your login credentials have been sent to ${trainerEmail}. Please login and change your password.`,
      category: "Account",
      senderId: senderId,
      senderModel: "Admin",
      recipients: [{ recipientId: trainerId, recipientModel: "Trainer", isRead: false }],
      targetRoles: ["trainer"],
      status: "sent",
      type: "info",
      priority: "high",
    });

    await notification.save();
    console.log(`Sent account creation notification to Trainer ${trainerId}.`);
  } catch (error) {
    console.error("Error in notifyTrainerAccountCreated:", error);
  }
};

// ✅ Notify Student when their account is created with login credentials
exports.notifyStudentAccountCreated = async ({ studentId, studentName, studentEmail, tpoName }) => {
  try {
    const tpos = await TPO.find({}, "_id");
    const senderId = tpos.length > 0 ? tpos[0]._id : studentId;

    const notification = new Notification({
      title: "Welcome to InfoVerse!",
      message: `Hello ${studentName}, your student account has been created by ${tpoName}. Your login credentials have been sent to ${studentEmail}. Please login and change your password.`,
      category: "Account",
      senderId: senderId,
      senderModel: "TPO",
      recipients: [{ recipientId: studentId, recipientModel: "Student", isRead: false }],
      targetRoles: ["student"],
      status: "sent",
      type: "info",
      priority: "high",
    });

    await notification.save();
    console.log(`Sent account creation notification to Student ${studentId}.`);
  } catch (error) {
    console.error("Error in notifyStudentAccountCreated:", error);
  }
};

// ✅ Notify TPO when their account is suspended or reactivated
exports.notifyTpoStatusChange = async ({ tpoId, tpoName, isSuspended, adminId }) => {
  try {
    const title = isSuspended ? "Account Suspended" : "Account Reactivated";
    const message = isSuspended
      ? `Hello ${tpoName}, your TPO account has been suspended by the admin. Please contact the administrator for more details.`
      : `Hello ${tpoName}, your TPO account has been reactivated by the admin. You can now access all features.`;

    const notification = new Notification({
      title,
      message,
      category: "Account",
      senderId: adminId,
      senderModel: "Admin",
      recipients: [{ recipientId: tpoId, recipientModel: "TPO", isRead: false }],
      targetRoles: ["tpo"],
      status: "sent",
      type: isSuspended ? "warning" : "success",
      priority: "high",
    });

    await notification.save();
    console.log(`Sent ${isSuspended ? "suspend" : "reactivate"} notification to TPO ${tpoId}.`);
  } catch (error) {
    console.error("Error in notifyTpoStatusChange:", error);
  }
};

// ✅ Notify Trainer when their account is suspended or reactivated by admin
exports.notifyTrainerStatusChange = async ({ trainerId, trainerName, isSuspended, adminId }) => {
  try {
    const title = isSuspended ? "Account Suspended" : "Account Reactivated";
    const message = isSuspended
      ? `Hello ${trainerName}, your trainer account has been suspended by the admin. Please contact the administrator for more details.`
      : `Hello ${trainerName}, your trainer account has been reactivated by the admin. You can now access all features.`;

    const notification = new Notification({
      title,
      message,
      category: "Account",
      senderId: adminId,
      senderModel: "Admin",
      recipients: [{ recipientId: trainerId, recipientModel: "Trainer", isRead: false }],
      targetRoles: ["trainer"],
      status: "sent",
      type: isSuspended ? "warning" : "success",
      priority: "high",
    });

    await notification.save();
    console.log(`Sent ${isSuspended ? "suspend" : "reactivate"} notification to Trainer ${trainerId}.`);
  } catch (error) {
    console.error("Error in notifyTrainerStatusChange:", error);
  }
};

// ✅ Notify Student when their account is suspended or unsuspended by TPO
exports.notifyStudentStatusChange = async ({ studentId, studentName, isSuspended, tpoId, tpoName }) => {
  try {
    const title = isSuspended ? "Account Suspended" : "Account Reactivated";
    const message = isSuspended
      ? `Hello ${studentName}, your student account has been suspended by ${tpoName}. Please contact your TPO for more details.`
      : `Hello ${studentName}, your student account has been reactivated by ${tpoName}. You can now access all features.`;

    const notification = new Notification({
      title,
      message,
      category: "Account",
      senderId: tpoId,
      senderModel: "TPO",
      recipients: [{ recipientId: studentId, recipientModel: "Student", isRead: false }],
      targetRoles: ["student"],
      status: "sent",
      type: isSuspended ? "warning" : "success",
      priority: "high",
    });

    await notification.save();
    console.log(`Sent ${isSuspended ? "suspend" : "unsuspend"} notification to Student ${studentId}.`);
  } catch (error) {
    console.error("Error in notifyStudentStatusChange:", error);
  }
};

// ✅ Get all notifications for the logged-in coordinator
exports.getCoordinatorNotifications = asyncHandler(async (req, res) => {
  try {
    const coordinatorId = req.user?._id || req.user?.userId;
    if (!coordinatorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await Notification.find({
      "recipients.recipientId": coordinatorId,
      "recipients.recipientModel": "Coordinator",
    })
      .sort({ createdAt: -1 })
      .lean();

    const unreadByCategory = notifications.reduce(
      (acc, n) => {
        const category = n.category || "Batch Updates";
        const recipient = n.recipients?.find(
          (r) => r.recipientId?.toString() === coordinatorId?.toString()
        );
        const isUnread = recipient && !recipient.isRead;
        if (isUnread) {
          acc[category] = (acc[category] || 0) + 1;
        }
        return acc;
      },
      { "Account": 0, "Batch Updates": 0 }
    );

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
      unreadByCategory,
    });
  } catch (error) {
    console.error("Error fetching coordinator notifications:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ Notify coordinator when assigned to a batch
exports.notifyCoordinatorAssignment = async ({ coordinatorId, coordinatorName, batchNumber, tpoId, tpoName }) => {
  try {
    const notification = new Notification({
      title: "Assigned as Batch Coordinator",
      message: `Hello ${coordinatorName}, you have been assigned as the student coordinator for batch "${batchNumber}" by ${tpoName}. Your login credentials have been sent to your email.`,
      category: "Account",
      senderId: tpoId,
      senderModel: "TPO",
      recipients: [{ recipientId: coordinatorId, recipientModel: "Coordinator", isRead: false }],
      targetRoles: ["coordinator"],
      status: "sent",
      type: "info",
      priority: "high",
    });

    await notification.save();
    console.log(`Sent batch assignment notification to Coordinator ${coordinatorId}.`);
  } catch (error) {
    console.error("Error in notifyCoordinatorAssignment:", error);
  }
};

// ✅ Notify coordinator when a student in their batch is suspended/unsuspended
exports.notifyCoordinatorStudentSuspended = async ({ studentName, isSuspended, batchId, tpoId, tpoName }) => {
  try {
    const coordinator = await Coordinator.findOne({ assignedPlacementBatch: batchId });
    if (!coordinator) return;

    const title = isSuspended ? "Student Suspended" : "Student Reactivated";
    const message = isSuspended
      ? `${studentName} has been suspended from your batch by ${tpoName}.`
      : `${studentName} has been reactivated in your batch by ${tpoName}.`;

    const notification = new Notification({
      title,
      message,
      category: "Batch Updates",
      senderId: tpoId,
      senderModel: "TPO",
      recipients: [{ recipientId: coordinator._id, recipientModel: "Coordinator", isRead: false }],
      targetRoles: ["coordinator"],
      status: "sent",
      type: isSuspended ? "warning" : "success",
      priority: "medium",
    });

    await notification.save();
    console.log(`Sent student ${isSuspended ? "suspend" : "unsuspend"} notification to Coordinator ${coordinator._id}.`);
  } catch (error) {
    console.error("Error in notifyCoordinatorStudentSuspended:", error);
  }
};
