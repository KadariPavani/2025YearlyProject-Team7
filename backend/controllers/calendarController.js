const Calendar = require('../models/Calendar');
const Student = require('../models/Student');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require("express-async-handler");

// ---------------------- FILE UPLOAD SETUP ----------------------
const multer = require("multer");
const Notification = require("../models/Notification");
// Store uploaded resumes temporarily in 'uploads' folder
const upload = multer({ dest: "uploads/" });
const createTransporter = require("../config/nodemailer");
const transporter = createTransporter();


const sendEmail = async (to, subject, htmlContent, attachments = []) => {
  try {
    await transporter.sendMail({
      from: `"TPO Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      attachments
    });
    console.log(`📧 Email sent successfully to ${to}`);
  } catch (err) {
    console.error(`❌ Error sending email to ${to}:`, err.message);
  }
};


// ---------------------- CREATE EVENT ----------------------
exports.createEvent = async (req, res) => {
console.log("📦 Incoming Event Body:", req.body);
  try {
    const {
      title, description, startDate, endDate,
      startTime, endTime, venue, isOnline,
      companyDetails = {}, eventType, createdBy, createdByModel,
      externalLink, targetGroup  // also capture root-level
    } = req.body;

    const newEvent = new Calendar({
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      isOnline,
      eventType,
      createdBy,
      createdByModel,
      targetGroup,
      companyDetails: {
        ...companyDetails,
        companyFormLink: companyDetails.companyFormLink || "",
        externalLink: companyDetails.externalLink || externalLink || ""
      }
    });

    await newEvent.save();
    res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};



// ---------------------- GET ALL EVENTS ----------------------
// ---------------------- GET ALL EVENTS ----------------------
exports.getEvents = asyncHandler(async (req, res) => {
  try {
    let filter = {};

    // 🧑‍🎓 STUDENT → Only events from assigned TPO
if (req.userType === "student") {
  const studentEmail = req.user.email?.toLowerCase();

  // 1️⃣ Find student
  let student = await Student.findById(req.user.userId);
  if (!student && req.user.email) {
    student = await Student.findOne({ email: req.user.email });
  }

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }

  // 2️⃣ Auto-link assigned TPO
  await ensureStudentTpoLink(student);

  // 3️⃣ Determine if CRT or Non-CRT student
  let studentType = "non-crt";

// 🧩 Determine student group correctly
if (student.batchType) {
  // Example: batchType: "CRT" / "Non-CRT"
  studentType = student.batchType.toLowerCase();
} else if (typeof student.crtInterested !== "undefined") {
  studentType = student.crtInterested ? "crt" : "non-crt";
}


  // 4️⃣ Filter events:
  //    - Only show events created by student's assigned TPO
  //    - And match student's type (crt/non-crt/both)
  filter = {
    createdBy: student.assignedTpo,
    $or: [
      { targetGroup: studentType },
      { targetGroup: "both" },
    ],
  };
}


    // 🧑‍🏫 TPO → Only their own events
    else if (req.userType === "tpo") {
      filter.createdBy = req.user._id;
    }

    // 👑 Admin → sees all
    else if (req.userType === "admin") {
      filter = {};
    }

    const events = await Calendar.find(filter)
      .populate("createdBy", "name email role")
      .populate("companyDetails.companyId")
      .populate("registrations.studentId", "name rollNo email branch");

    console.log(`📅 Found ${events.length} events for filter`, filter);

    res.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Helper function
async function ensureStudentTpoLink(student) {
  try {
    if (student.assignedTpo) return student;

    const PlacementTrainingBatch = require("../models/PlacementTrainingBatch");
    if (student.placementTrainingBatchId) {
      const batch = await PlacementTrainingBatch.findById(student.placementTrainingBatchId);
      if (batch && batch.tpoId) {
        student.assignedTpo = batch.tpoId;
        await student.save({ validateBeforeSave: false });
        console.log(`✅ Linked ${student.email} to TPO ${batch.tpoId}`);
      } else {
        console.log(`⚠️ Batch not found or no TPO for ${student.email}`);
      }
    } else {
      console.log(`⚠️ No placementTrainingBatchId for ${student.email}`);
    }

    return student;
  } catch (err) {
    console.error("Error linking student to TPO:", err);
    return student;
  }
}

// ---------------------- GET REGISTERED EVENTS (Student) ----------------------
exports.getRegisteredEvents = async (req, res) => {
  try {
    // ✅ Ensure the request is from a student
    if (!req.user || req.userType !== "student") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const studentId = req.user._id; // ✅ Correct way to access student ID

    // Find all events where this student is registered
    const registeredEvents = await Calendar.find({
      "registrations.studentId": studentId,
    })
      .populate("createdBy", "name email")
      .populate("companyDetails.companyId")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: registeredEvents.length,
      data: registeredEvents,
    });
  } catch (error) {
    console.error("❌ Error fetching registered events:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ---------------------- GET EVENT BY ID ----------------------
exports.getEventById = async (req, res) => {
  try {
    const event = await Calendar.findById(req.params.id)
      .populate('createdBy')
      .populate('companyDetails.companyId')
      .populate('targetBatches')
      .populate('registrations.studentId');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------- UPDATE EVENT ----------------------
// ---------------------- UPDATE EVENT ----------------------
exports.updateEvent = async (req, res) => {
  try {
    const event = await Calendar.findById(req.params.id);
    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });

    // 🧩 Capture old target group before updating
    const oldTargetGroup = event.targetGroup;

    // Preserve companyDetails correctly
    if (req.body.companyDetails || req.body.externalLink) {
      event.companyDetails = {
        ...event.companyDetails.toObject(),
        ...req.body.companyDetails,
        externalLink:
          req.body.companyDetails?.externalLink ||
          req.body.externalLink ||
          event.companyDetails.externalLink,
        companyFormLink:
          req.body.companyDetails?.companyFormLink ||
          event.companyDetails.companyFormLink,
      };
    }

    // Merge remaining fields safely
    const excluded = ["companyDetails"];
    for (const key of Object.keys(req.body)) {
      if (!excluded.includes(key)) event[key] = req.body[key];
    }

    await event.save();

    // 🧠 --------- TARGET GROUP CHANGE HANDLER ----------
    if (req.body.targetGroup && req.body.targetGroup !== oldTargetGroup) {
      const removedStudents = [];
      const newGroup = req.body.targetGroup.toLowerCase();

      console.log(`🔄 Target group changed from ${oldTargetGroup} → ${newGroup}`);

      // Identify students to remove
      for (const reg of event.registrations) {
        const student = await Student.findById(reg.studentId);
        if (!student) continue;

        const studentGroup = student.batchType
          ? student.batchType.toLowerCase()
          : student.crtInterested
          ? "crt"
          : "non-crt";

        const shouldRemove =
          (newGroup === "crt" && studentGroup !== "crt") ||
          (newGroup === "non-crt" && studentGroup !== "non-crt");

        if (shouldRemove) {
          removedStudents.push({
            id: student._id,
            name: student.name,
            email: student.email,
            group: studentGroup,
          });
        }
      }

      // 🔥 Unregister + Notify removed students
      if (removedStudents.length > 0) {
        event.registrations = event.registrations.filter(
          (reg) =>
            !removedStudents.some(
              (s) => s.id.toString() === reg.studentId.toString()
            )
        );
        event.eventSummary.totalAttendees = event.registrations.length;
        await event.save();

        // ✉️ Send email + 🔔 Save notifications
        const notificationPayloads = [];

        for (const s of removedStudents) {
          const subject = `Event Update: ${event.title}`;
          const htmlContent = `
            <h3>Hello ${s.name},</h3>
            <p>The event <strong>${event.title}</strong> has been updated by the TPO.</p>
            <p>This event is now for <strong>${newGroup.toUpperCase()}</strong> students only.</p>
            <p>Your registration has been removed automatically since you belong to ${s.group.toUpperCase()}.</p>
            <p>Thank you for understanding.</p>
            <br />
            <p>— Placement Office</p>
          `;

          // 📧 Send email
          await sendEmail(s.email, subject, htmlContent);

          // Prepare notification payload
          notificationPayloads.push({
            title: "Event Registration Update",
            message: `You were removed from "${event.title}" since it is now for ${req.body.targetGroup.toUpperCase()} students.`,
            senderId: req.user?._id,
            senderModel: req.userType === "tpo" ? "TPO" : "Admin",
            recipients: [
              {
                recipientId: s.id,
                recipientModel: "Student",
                isRead: false,
              },
            ],
            relatedEntity: {
              entityId: event._id,
              entityModel: "Event",
            },
          });

          console.log(`📨 Removed & emailed ${s.email} (${s.group} student)`);
        }

        // 🧾 Insert all notifications at once
        if (notificationPayloads.length > 0) {
          await Notification.insertMany(notificationPayloads);
          console.log(`🔔 ${notificationPayloads.length} notifications created.`);
        }
      } else {
        console.log("✅ No students removed. No notifications needed.");
      }
    }
    // ---------------------------------------------------

    res.json({ success: true, data: event });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};


// ---------------------- DELETE EVENT (Soft Delete) ----------------------
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Calendar.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // 🔄 Soft delete instead of removing from DB
    event.status = "deleted";
    await event.save();

    return res
      .status(200)
      .json({ success: true, message: "Event moved to Deleted", data: event });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};


// ---------------------- UPDATE EVENT STATUS ----------------------
exports.updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid event status' });
    }

    const event = await Calendar.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.status = status;
    await event.save();

    res.json({ success: true, data: event });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------- REGISTER STUDENT WITH EMAIL ----------------------
exports.registerStudent = async (req, res) => {
  try {
    console.log("📩 Incoming registration request for event:", req.params.id);

    const event = await Calendar.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    let student = await Student.findById(req.user.userId);
    if (!student && req.user.email) {
      student = await Student.findOne({ email: req.user.email });
    }
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const alreadyRegistered = event.registrations.some(
      (r) => r.studentId?.toString() === student._id.toString()
    );
    if (alreadyRegistered)
      return res.json({ success: true, message: "Already registered" });

    const personalInfo = {
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      branch: student.branch,
      phonenumber: student.phonenumber,
      college: student.college,
      gender: student.gender,
      dob: student.dob,
      currentLocation: student.currentLocation,
      hometown: student.hometown,
      backlogs: student.backlogs,
      techStack: student.techStack,
      resumeUrl: student.resumeUrl,
      externalLink: req.body.externalLink || "",
    };

// 5️⃣ Add registration & recalc count
const newRegistration = {
  studentId: student._id,
  status: "registered",
  personalInfo,
  registeredAt: new Date(),
};

// 🧠 Ensure eventSummary exists before using it
if (!event.eventSummary) {
  event.eventSummary = { totalAttendees: 0, selectedStudents: 0 };
}

event.registrations.push(newRegistration);
event.eventSummary.totalAttendees = event.registrations.length;

await event.save();

console.log(`✅ ${student.name} registered. Total now: ${event.eventSummary.totalAttendees}`);

return res.status(200).json({
  success: true,
  message: "Student registered successfully",
  totalRegistered: event.eventSummary.totalAttendees,
});

  } catch (error) {
    console.error("❌ Error registering student:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




// ---------------------- UPLOAD SELECTED STUDENTS WITH EMAIL TO TPO ----------------------
exports.uploadSelectedStudents = async (req, res) => {
  try {
    const { selectedStudentsCount, files, tpoEmail } = req.body;

    const event = await Calendar.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.eventSummary.selectedStudents = selectedStudentsCount || event.eventSummary.selectedStudents;
    if (files && files.length > 0) {
      event.selectedListFiles = files; // array of {fileName, fileType, fileUrl}
    }

    await event.save();

    // Send email to TPO with attachments
    if(tpoEmail) {
      const attachments = files?.map(f => ({
        filename: f.fileName,
        path: path.join(__dirname, '..', 'uploads', f.fileName) // ensure files are saved in 'uploads' folder
      })) || [];

      const tpoEmailContent = `
        <h3>Selected Students Uploaded for ${event.title}</h3>
        <p>Total Selected: ${event.eventSummary.selectedStudents}</p>
        ${files && files.length > 0 ? `<p>Files attached:</p>` : ''}
      `;
      await sendEmail(tpoEmail, `Selected Students Uploaded: ${event.title}`, tpoEmailContent, attachments);
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error("Error uploading selected students:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// calendarController.js
// calendarController.js
// calendarController.js
// ---------------------- GET EVENT REGISTRATIONS ----------------------
// ---------------------- GET EVENT REGISTRATIONS (for TPO view) ----------------------
exports.getEventRegistrations = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Calendar.findById(eventId)
      .populate("registrations.studentId", "name rollNo email branch academics.btechCGPA");

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Only TPO or Admin should see this
    if (req.userType !== "tpo" && req.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const registrations = event.registrations.map((r) => ({
  name: r.personalInfo?.name || r.studentId?.name,
  rollNo: r.personalInfo?.rollNo || r.studentId?.rollNo,
  email: r.personalInfo?.email || r.studentId?.email,
  phonenumber: r.personalInfo?.phonenumber || r.studentId?.phonenumber,
  college: r.personalInfo?.college || r.studentId?.college,
  branch: r.personalInfo?.branch || r.studentId?.branch,
  gender: r.personalInfo?.gender || r.studentId?.gender,
  dob: r.personalInfo?.dob || r.studentId?.dob,
  currentLocation: r.personalInfo?.currentLocation || r.studentId?.currentLocation,
  hometown: r.personalInfo?.hometown || r.studentId?.hometown,
  backlogs: r.personalInfo?.backlogs || r.studentId?.backlogs,
  techStack: r.personalInfo?.techStack || r.studentId?.techStack,
  resumeUrl: r.personalInfo?.resumeUrl || r.studentId?.resumeUrl,
  externalLink: r.personalInfo?.externalLink || "",
  status: r.status,
  registeredAt: r.registeredAt,
}));

    res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

