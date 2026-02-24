const Calendar = require('../models/Calendar');
const Student = require('../models/Student');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require("express-async-handler");
const Trainer = require("../models/Trainer");
const { notifyTrainerEventUpdate, notifyStudentEventUpdate } = require("./notificationController");

// ---------------------- FILE UPLOAD SETUP ----------------------
const multer = require("multer");
const Notification = require("../models/Notification");
const cloudinary = require('../config/cloudinary');
// Use memory storage (no disk writes) and upload buffers to Cloudinary to be Vercel-compatible
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

const createTransporter = require("../config/nodemailer");
let transporter = null;
const getTransporter = () => {
  if (!transporter) transporter = createTransporter();
  return transporter;
};
const XLSX = require("xlsx");
let pdfParse = null;
function getPdfParse() {
  if (pdfParse) return pdfParse;
  try {
    pdfParse = require('pdf-parse');
    return pdfParse;
  } catch (err) {
    pdfParse = null;
    return null;
  }
}
const mammoth = require("mammoth");

const sendEmail = async (to, subject, htmlContent, attachments = []) => {
  try {
    const tx = getTransporter();
    await tx.sendMail({
      from: `"TPO Portal" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
      to,
      subject,
      html: htmlContent,
      attachments
    });
  } catch (err) {
  }
};


// ---------------------- CREATE EVENT ----------------------
// ---------------------- CREATE EVENT ----------------------
// ---------------------- CREATE EVENT ----------------------
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, startDate, endDate,
      startTime, endTime, venue,
      companyDetails = {}, createdBy, createdByModel,
      externalLink, targetGroup, targetBatchIds = [], targetStudentIds = []
    } = req.body;

    // 1️⃣ Create event
    const newEvent = new Calendar({
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      eventType: "drive",
      createdBy,
      createdByModel,
      targetGroup,
      targetBatchIds,
      targetStudentIds,
      companyDetails: {
        ...companyDetails,
        companyFormLink: companyDetails.companyFormLink || "",
        externalLink: companyDetails.externalLink || externalLink || ""
      }
    });

    await newEvent.save();

    // 2️⃣ Find students by target criteria
    let studentFilter = {};

    // Priority 1: Specific students selected (highest priority)
    if (targetGroup === 'specific-students' && targetStudentIds && targetStudentIds.length > 0) {
      studentFilter = { _id: { $in: targetStudentIds } };
    }
    // Priority 2: Specific batches selected
    else if (targetGroup === 'batch-specific' && targetBatchIds && targetBatchIds.length > 0) {
      studentFilter = { placementTrainingBatchId: { $in: targetBatchIds } };
    }

    const students = await Student.find(studentFilter, "_id name email");

    // 3️⃣ Create student notifications
    if (students.length > 0) {
      const studentNotifications = students.map((student) => ({
        title: "New Event Created",
        message: `A new event "${title}" has been added to your placement calendar.`,
        category: "Placement",
        senderId: createdBy,
        senderModel: createdByModel || "TPO",
        recipients: [{ recipientId: student._id, recipientModel: "Student", isRead: false }],
        relatedEntity: { entityId: newEvent._id, entityModel: "Event" },
      }));

      await Notification.insertMany(studentNotifications);
    }

    // 4️⃣ Notify all trainers once
const trainerIds = (await Trainer.find({}, "_id")).map(t => t._id);
if (trainerIds.length > 0) {
  await notifyTrainerEventUpdate(trainerIds, title, "Created", createdBy);
}
// Note: Student notifications already sent in step 3 above (targeted).
// Do NOT call notifyStudentEventUpdate() here — it sends to ALL students,
// causing duplicates for students who already received targeted notifications.


    res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
};





// ---------------------- GET ALL EVENTS ----------------------
// ---------------------- GET ALL EVENTS ----------------------
exports.getEvents = asyncHandler(async (req, res) => {
  try {
    let filter = {};

    // 🧑‍🎓 STUDENT → Show ALL events, mark eligibility per event
if (req.userType === "student") {
  let student = await Student.findById(req.user.userId);
  if (!student && req.user.email) {
    student = await Student.findOne({ email: req.user.email });
  }

  if (!student) {
    return res.status(200).json({ success: false, message: "Student not found" });
  }

  // Auto-link assigned TPO
  await ensureStudentTpoLink(student);

  // Show all events from the student's assigned TPO (no batch filter)
  if (student.assignedTpo) {
    filter = { createdBy: student.assignedTpo };
  }

  // Store student info for eligibility check after fetching events
  req._studentInfo = {
    studentId: student._id,
    batchId: student.placementTrainingBatchId
  };
}


    // 🧑‍🏫 TPO → See all events (allow TPOs to view events created by any TPO)
    else if (req.userType === "tpo") {
      // Intentionally not filtering by createdBy so TPOs can view events across TPOs
      filter = {};
    }

    // 👑 Admin → sees all
    else if (req.userType === "admin") {
      filter = {};
    }

    let events = await Calendar.find(filter)
      .populate("createdBy", "name email role")
      .populate("companyDetails.companyId")
      .populate("registrations.studentId", "name rollNo email branch");


    // For students, add isEligible flag based on target group
    if (req._studentInfo) {
      const { studentId, batchId } = req._studentInfo;
      events = events.map(event => {
        const e = event.toObject();
        // Check if student is eligible to register
        if (!e.targetGroup || e.targetGroup === 'all') {
          e.isEligible = true;
        } else if (e.targetGroup === 'batch-specific') {
          e.isEligible = (e.targetBatchIds || []).some(
            id => id.toString() === (batchId ? batchId.toString() : '')
          );
        } else if (e.targetGroup === 'specific-students') {
          e.isEligible = (e.targetStudentIds || []).some(
            id => id.toString() === studentId.toString()
          );
        } else {
          e.isEligible = true;
        }
        return e;
      });
    }

    res.json({ success: true, data: events });
  } catch (error) {
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
      } else {
      }
    } else {
    }

    return student;
  } catch (err) {
    return student;
  }
}

// ---------------------- GET REGISTERED EVENTS (Student) ----------------------
exports.getRegisteredEvents = async (req, res) => {
  try {
    // ✅ Ensure the request is from a student
    if (!req.user || req.userType !== "student") {
      return res.status(200).json({ success: false, message: "Unauthorized" });
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

    if (!event) return res.status(200).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------- UPDATE EVENT ----------------------
// ---------------------- UPDATE EVENT ----------------------
exports.updateEvent = async (req, res) => {
  try {
    const event = await Calendar.findById(req.params.id);
    if (!event)
      return res.status(200).json({ success: false, message: "Event not found" });

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

// 🔔 Notify both trainers & students once per update (unique per request)
if (!req.notifiedOnce) {
  const trainerIds = (await Trainer.find({}, "_id")).map(t => t._id);
  const eventStatus = (req.body.status || event.status || "").toLowerCase();
  const notifyAction =
    ["cancelled", "deleted"].includes(eventStatus) ? "cancelled" : "updated";

  // 🔔 Notify both trainers & students
  await notifyTrainerEventUpdate(trainerIds, event.title, notifyAction, req.user._id);
  await notifyStudentEventUpdate(event.title, notifyAction, req.user._id, event.targetBatchIds || []);

  req.notifiedOnce = true;
}






    res.json({ success: true, data: event });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
};


// ---------------------- DELETE EVENT ----------------------
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Calendar.findById(req.params.id);
    if (!event) {
      return res.status(200).json({ success: false, message: "Event not found" });
    }

    // ✅ Soft delete
    event.status = "deleted";
    await event.save();

    // ✅ Fetch all trainers
    const trainers = await Trainer.find({}, "_id");
    const trainerIds = trainers.map(t => t._id);

    // ✅ Notify trainers of deletion (always runs)
if (trainerIds.length > 0) {
  await notifyTrainerEventUpdate(trainerIds, event.title, "cancelled", req.user._id);
  await notifyStudentEventUpdate(event.title, "cancelled", req.user._id, event.targetBatchIds || []);
}
 else {
    }

    res.status(200).json({
      success: true,
      message: "Event deleted and all trainers notified.",
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// ---------------------- UPDATE EVENT STATUS ----------------------
exports.updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled', 'deleted'];
    if (!validStatuses.includes(status)) {
      return res.status(200).json({ success: false, message: 'Invalid event status' });
    }

    const event = await Calendar.findById(req.params.id);
    if (!event) return res.status(200).json({ success: false, message: 'Event not found' });

    event.status = status;

    await event.save();

const trainerIds = (await Trainer.find({}, "_id")).map(t => t._id);
// 🧠 Choose proper notification action
const notifyAction =
  status.toLowerCase() === "cancelled" ? "cancelled" :
  status.toLowerCase() === "deleted" ? "cancelled" :
  "updated";

await notifyTrainerEventUpdate(trainerIds, event.title, notifyAction, req.user._id);

if (req.body.eventSummary) {
  event.eventSummary = {
    ...event.eventSummary,
    ...req.body.eventSummary,
  };
}


    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ---------------------- REGISTER STUDENT WITH EMAIL ----------------------
exports.registerStudent = async (req, res) => {
  try {

    const event = await Calendar.findById(req.params.id);
    if (!event) return res.status(200).json({ success: false, message: "Event not found" });

    let student = await Student.findById(req.user.userId);
    if (!student && req.user.email) {
      student = await Student.findOne({ email: req.user.email });
    }
    if (!student) return res.status(200).json({ success: false, message: "Student not found" });

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
      yearOfPassing: student.yearOfPassing,
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


return res.status(200).json({
  success: true,
  message: "Student registered successfully",
  totalRegistered: event.eventSummary.totalAttendees,
});

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




// ---------------------- UPLOAD SELECTED STUDENTS ----------------------
// ✅ UPDATED: Upload selected students with batch details
exports.uploadSelectedStudents = asyncHandler(async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const file = req.file;
    const { selectedEmails } = req.body;


    if (!selectedEmails) {
      return res.status(200).json({ 
        success: false, 
        message: "No selected student emails provided." 
      });
    }

    const emails = JSON.parse(selectedEmails);
    const event = await Calendar.findById(eventId);
    
    if (!event) {
      return res.status(200).json({ 
        success: false, 
        message: "Event not found." 
      });
    }

    const notifications = [];
    const sentEmails = new Set();

    // Collect already selected emails to avoid duplicates
    const alreadySelectedEmails = new Set(
      event.selectedStudents.map((s) => s.email?.toLowerCase())
    );

    for (const email of emails) {
      const lowerEmail = email.toLowerCase();

      // ✅ Only registered students are allowed
      const registeredStudent = event.registrations.find(
        (r) => r.personalInfo.email?.toLowerCase() === lowerEmail
      );

      if (!registeredStudent) {
        continue;
      }

      // ✅ Skip already selected students
      if (alreadySelectedEmails.has(lowerEmail)) {
        continue;
      }

      if (sentEmails.has(lowerEmail)) continue;
      sentEmails.add(lowerEmail);

      const student = registeredStudent.personalInfo;
      
      // ✅ FETCH STUDENT & BATCH DETAILS
      const studentDoc = await Student.findOne({ email: lowerEmail })
        .populate('placementTrainingBatchId', 'batchNumber colleges _id');

      const batchInfo = studentDoc?.placementTrainingBatchId || null;

      // ✅ Send email to selected student
      const subject = `🎉 Congratulations! You have been selected for ${event.title}`;
      const html = `
        <h2>You have been <strong>selected</strong> in <strong>${event.title}</strong>!</h2>
        <p>Best wishes from the Placement Team!</p>
      `;

      try {
        await sendEmail(student.email, subject, html);
      } catch (err) {
      }

      // ✅ Create notification with category
      const notification = {
        title: "Selection Update",
        message: `You have been selected in "${event.title}". Congratulations! 🎉`,
        category: "Placement",  // ✅ REQUIRED FIELD
        senderId: req.user?._id || event.createdBy,
        senderModel: req.userType === "tpo" ? "TPO" : "Admin",
        recipients: [
          {
            recipientId: registeredStudent.studentId,
            recipientModel: "Student",
            isRead: false,
          },
        ],
        relatedEntity: {
          entityId: event._id,
          entityModel: "Event",
        },
      };
      notifications.push(notification);

      // ✅ ADD TO SELECTED STUDENTS WITH BATCH INFO
      event.selectedStudents.push({
        studentId: registeredStudent.studentId,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        branch: student.branch,
        personalInfo: student,
        batchId: batchInfo?._id || null,           // ✅ Store batch ID
        batchNumber: batchInfo?.batchNumber || null, // ✅ Store batch number
        colleges: batchInfo?.colleges || [],         // ✅ Store colleges
        selectedAt: new Date(),
      });

    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Update counts & save event
    event.eventSummary.selectedStudents = event.selectedStudents.length;
    
    if (file) {
      try {
        // Upload file buffer to Cloudinary (no disk usage)
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, { folder: 'selected_lists' });
        event.selectedListFiles.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
          uploadedAt: new Date(),
        });
      } catch (err) {
        event.selectedListFiles.push({
          fileName: file.originalname,
          fileUrl: null,
          uploadedAt: new Date(),
          error: err.message || 'upload_failed'
        });
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: "✅ Selected students processed successfully with batch details.",
      newlyNotified: notifications.length,
      totalSelected: event.selectedStudents.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error while uploading selected students.",
      error: error.message,
    });
  }
});




exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// calendarController.js

// ✅ Upload selected students (adds to DB + sends mails & notifications once)
exports.uploadSelectedStudents = async (req, res) => {
  try {
    const selectedStudentsCount = req.body?.selectedStudentsCount || 0;
    const tpoEmail = req.body?.tpoEmail || null;
    let selectedEmails = req.body?.selectedEmails || [];

    // Parse JSON string if it was sent as string
    if (typeof selectedEmails === "string") {
      try {
        selectedEmails = JSON.parse(selectedEmails);
      } catch {
        selectedEmails = [];
      }
    }

    const files = req.file
      ? [
          {
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            fileType: req.file.mimetype,
          },
        ]
      : req.body?.files || [];

    const event = await Calendar.findById(req.params.id);
    if (!event) return res.status(200).json({ success: false, message: "Event not found" });

    // ✅ Store selected student details
    const selectedStudentDetails = [];
    for (const email of selectedEmails) {
      const student = await Student.findOne({ email: email.toLowerCase().trim() });
      if (student) {
        selectedStudentDetails.push({
          studentId: student._id,
          name: student.name,
          email: student.email,
          branch: student.branch,
          rollNo: student.rollNo,
        });
      }
    }

    // ✅ Update event document
    event.selectedStudents = selectedStudentDetails;
    event.eventSummary.selectedStudents =
      selectedStudentsCount || selectedStudentDetails.length;
    if (files?.length > 0) {
      event.selectedListFiles = files.map((f) => ({
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        uploadedAt: new Date(),
      }));
    }
    await event.save();

    // ✅ Send email & notification ONCE to each student
    const notifications = [];
    const sentEmails = new Set();
    for (const student of selectedStudentDetails) {
      if (sentEmails.has(student.email)) continue;
      sentEmails.add(student.email);

      const subject = `🎉 Congratulations! You have been selected for ${event.title}`;
      const html = `
        <h3>Dear ${student.name || "Student"},</h3>
        <p>You have been <b>selected</b> in <b>${event.title}</b>!</p>
        <p>Best wishes from the Placement Team!</p>
      `;
      try {
        await sendEmail(student.email, subject, html);
      } catch (err) {
      }

      notifications.push({
        title: "Selection Update",
        message: `You have been selected in "${event.title}". Congratulations! 🎉`,
        senderId: req.user?._id,
        senderModel: req.userType === "tpo" ? "TPO" : "Admin",
        recipients: [
          { recipientId: student.studentId, recipientModel: "Student", isRead: false },
        ],
        relatedEntity: { entityId: event._id, entityModel: "Event" },
      });
    }

    if (notifications.length > 0) await Notification.insertMany(notifications);

    return res.json({ success: true, message: "Selected list uploaded successfully.", data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Get registered students of a completed event
// ✅ Fetch registered students for a completed event
// ✅ Fetch registered students for a completed event
exports.getRegisteredStudentsForCompleted = async (req, res) => {
  try {
    const event = await Calendar.findById(req.params.id);

    if (!event)
      return res.status(200).json({ message: "Event not found" });

    // 🧠 Map registered students info — include ALL personalInfo fields
    // For older registrations missing yearOfPassing, fetch from Student document
    const registeredStudents = [];
    for (const r of event.registrations || []) {
      let yearOfPassing = r.personalInfo?.yearOfPassing || "";

      // Fallback: fetch from Student model if not stored in personalInfo
      if (!yearOfPassing && r.studentId) {
        const studentDoc = await Student.findById(r.studentId, "yearOfPassing");
        yearOfPassing = studentDoc?.yearOfPassing || "";
      }

      registeredStudents.push({
        name: r.personalInfo?.name || "",
        rollNo: r.personalInfo?.rollNo || "",
        email: r.personalInfo?.email || "",
        branch: r.personalInfo?.branch || "",
        phonenumber: r.personalInfo?.phonenumber || "",
        college: r.personalInfo?.college || "",
        gender: r.personalInfo?.gender || "",
        dob: r.personalInfo?.dob || "",
        currentLocation: r.personalInfo?.currentLocation || "",
        hometown: r.personalInfo?.hometown || "",
        backlogs: r.personalInfo?.backlogs ?? "",
        techStack: r.personalInfo?.techStack || [],
        resumeUrl: r.personalInfo?.resumeUrl || "",
        yearOfPassing,
        status: r.status || "registered",
        registeredAt: r.registeredAt,
      });
    }

    res.status(200).json({ success: true, data: registeredStudents });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching students", error: err.message });
  }
};

// ---------------------- EXPORT REGISTERED STUDENTS AS EXCEL ----------------------
exports.exportRegisteredStudents = async (req, res) => {
  try {
    const event = await Calendar.findById(req.params.id);
    if (!event)
      return res.status(200).json({ success: false, message: "Event not found" });

    const rows = [];
    for (const r of event.registrations || []) {
      let yearOfPassing = r.personalInfo?.yearOfPassing || "";
      if (!yearOfPassing && r.studentId) {
        const studentDoc = await Student.findById(r.studentId, "yearOfPassing");
        yearOfPassing = studentDoc?.yearOfPassing || "";
      }

      rows.push({
        'Name': r.personalInfo?.name || '',
        'Roll No': r.personalInfo?.rollNo || '',
        'Email': r.personalInfo?.email || '',
        'Phone': r.personalInfo?.phonenumber || '',
        'College': r.personalInfo?.college || '',
        'Branch': r.personalInfo?.branch || '',
        'Gender': r.personalInfo?.gender || '',
        'DOB': r.personalInfo?.dob ? new Date(r.personalInfo.dob).toLocaleDateString() : '',
        'Current Location': r.personalInfo?.currentLocation || '',
        'Home Town': r.personalInfo?.hometown || '',
        'Backlogs': r.personalInfo?.backlogs ?? '',
        'Tech Stack': Array.isArray(r.personalInfo?.techStack) ? r.personalInfo.techStack.join(', ') : '',
        'Year of Passing': yearOfPassing,
        'Resume URL': r.personalInfo?.resumeUrl || '',
        'Status': r.status || 'registered',
        'Registered At': r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '',
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 15 },
      { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registered Students');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const companyName = event.companyDetails?.companyName || event.title || 'Event';
    const safeName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeName}_Registered_Students_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error exporting students", error: err.message });
  }
};


// ✅ Mark student as selected for event
// ---------------------- SELECT STUDENT FOR EVENT ----------------------
exports.selectStudentForEvent = asyncHandler(async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { studentEmail } = req.body;

    if (!studentEmail) {
      return res.status(200).json({ success: false, message: "Student email is required" });
    }

    const event = await Calendar.findById(eventId);
    if (!event) {
      return res.status(200).json({ success: false, message: "Event not found" });
    }


    // ✅ Only registered students are eligible
    const registeredStudent = event.registrations.find(
      (r) => r.personalInfo.email.toLowerCase() === studentEmail.toLowerCase()
    );
    
    if (!registeredStudent) {
      return res.status(200).json({
        success: false,
        message: "Student not registered for this event",
      });
    }

    // ✅ Check if already selected FOR THIS EVENT ONLY (allow multiple company placements)
    const alreadySelected = event.selectedStudents.some(
      (s) => s.email.toLowerCase() === studentEmail.toLowerCase()
    );
    if (alreadySelected)
      return res.status(200).json({
        success: false,
        message: "This student has already been selected for this event.",
      });

const studentDoc = await Student.findOne({ email: studentEmail.toLowerCase() })
  .populate("placementTrainingBatchId", "batchNumber colleges _id");

const batchInfo = studentDoc?.placementTrainingBatchId || null;

const studentInfo = {
  studentId: registeredStudent.studentId,
  name: registeredStudent.personalInfo.name,
  rollNo: registeredStudent.personalInfo.rollNo,
  email: registeredStudent.personalInfo.email,
  branch: registeredStudent.personalInfo.branch,
  personalInfo: registeredStudent.personalInfo,

  // PlacementTrainingBatch info
  batchId: batchInfo?._id || null,
  batchNumber: batchInfo?.batchNumber || null,
  colleges: batchInfo?.colleges || [],

  selectedAt: new Date(),
};


    // ✅ Add to selected list
    event.selectedStudents.push(studentInfo);
    event.eventSummary.selectedStudents = event.selectedStudents.length;

    // ✅ Sync placement data to Student model (for public page & student profile)
    if (studentDoc) {
      const companyName = event.companyDetails?.companyName || event.title;
      const role = event.companyDetails?.roles?.[0] || 'Software Engineer';
      const pkg = event.companyDetails?.packageDetails?.max || event.companyDetails?.packageDetails?.min || 0;

      const offerEntry = { company: companyName, role, package: pkg, offeredDate: new Date(), source: 'event' };

      // Add to allOffers
      const allOffers = studentDoc.allOffers || [];
      allOffers.push(offerEntry);

      // placementDetails always reflects the highest offer
      const highest = allOffers.reduce((max, o) => (o.package > max.package ? o : max), allOffers[0]);

      await Student.findByIdAndUpdate(studentDoc._id, {
        $set: {
          status: 'placed',
          placementDetails: {
            companyId: event.companyDetails?.companyId || null,
            company: highest.company,
            role: highest.role,
            package: highest.package,
            placedDate: studentDoc.placementDetails?.placedDate || new Date()
          },
          allOffers
        }
      });
    }

    // ✅ Send email + notification
    const emailCompany = event.companyDetails?.companyName || event.title;
    const emailRole = event.companyDetails?.roles?.[0] || '';
    const emailCtc = event.companyDetails?.packageDetails?.max || event.companyDetails?.packageDetails?.min || '';
    const subject = `🎉 Congratulations! You have been selected for ${emailCompany}`;
    const html = `
      <h3>Dear ${studentInfo.name || "Student"},</h3>
      <p>You have been <b>selected</b> for <b>${emailCompany}</b>!</p>
      ${emailRole ? `<p><b>Role:</b> ${emailRole}</p>` : ''}
      ${emailCtc ? `<p><b>CTC:</b> ${emailCtc} LPA</p>` : ''}
      <p>Best wishes from the Placement Team!</p>
    `;

    try {
      await sendEmail(studentInfo.email, subject, html);
    } catch (error) {
    }

await Notification.create({
  title: "Selection Update",
  message: `You have been selected in "${event.title}". Congratulations! 🎉`,
  category: "Placement", // ✅ Required for display
  senderId: req.user?._id,
  senderModel: req.userType === "tpo" ? "TPO" : "Admin",
  recipients: [
    { recipientId: studentInfo.studentId, recipientModel: "Student", isRead: false },
  ],
  relatedEntity: { entityId: event._id, entityModel: "Event" },
});

    await event.save();

    res.status(200).json({
      success: true,
      message: `✅ Selection confirmed and mail sent to ${studentInfo.email}`,
      student: studentInfo,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// ---------------------- UPLOAD SELECTED STUDENTS ----------------------
exports.uploadSelectedStudents = asyncHandler(async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const file = req.file;
    const { selectedEmails } = req.body;

    if (!selectedEmails) {
      return res.status(200).json({ success: false, message: "No selected student emails provided." });
    }

    const emails = JSON.parse(selectedEmails);
    const event = await Calendar.findById(eventId);
    if (!event) return res.status(200).json({ success: false, message: "Event not found." });

    const notifications = [];
    const sentEmails = new Set();

    const alreadySelectedEmails = new Set(
      event.selectedStudents.map((s) => s.email?.toLowerCase())
    );

    for (const email of emails) {
      const lowerEmail = email.toLowerCase();

      // ✅ Only registered students are allowed
      const registeredStudent = event.registrations.find(
        (r) => r.personalInfo.email?.toLowerCase() === lowerEmail
      );
      if (!registeredStudent) {
        continue;
      }

      // ✅ Skip already selected students
      if (alreadySelectedEmails.has(lowerEmail)) {
        continue;
      }

      if (sentEmails.has(lowerEmail)) continue;
      sentEmails.add(lowerEmail);

      const student = registeredStudent.personalInfo;
      const subject = `🎉 Congratulations! You have been selected for ${event.title}`;
      const html = `
        <h3>Dear ${student.name || "Student"},</h3>
        <p>You have been <b>selected</b> in <b>${event.title}</b>!</p>
        <p>Best wishes from the Placement Team!</p>
      `;

      try {
        await sendEmail(student.email, subject, html);
      } catch (err) {
      }

      notifications.push({
        title: "Selection Update",
        message: `You have been selected in "${event.title}". Congratulations! 🎉`,
        senderId: req.user?._id,
        senderModel: req.userType === "tpo" ? "TPO" : "Admin",
        recipients: [
          { recipientId: registeredStudent.studentId, recipientModel: "Student", isRead: false },
        ],
        relatedEntity: { entityId: event._id, entityModel: "Event" },
      });

      event.selectedStudents.push({
        studentId: registeredStudent.studentId,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        branch: student.branch,
        selectedAt: new Date(),
      });
    }

    if (notifications.length > 0) await Notification.insertMany(notifications);
    event.eventSummary.selectedStudents = event.selectedStudents.length;

    if (file) {
      try {
        // Upload file buffer to Cloudinary (no disk usage)
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, { folder: 'selected_lists' });
        event.selectedListFiles.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
          uploadedAt: new Date(),
        });
      } catch (err) {
        event.selectedListFiles.push({
          fileName: file.originalname,
          fileUrl: null,
          uploadedAt: new Date(),
          error: err.message || 'upload_failed'
        });
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: "✅ Selected students processed (only registered & unique).",
      newlyNotified: notifications.length,
      totalSelected: event.selectedStudents.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error while uploading selected students.",
      error: error.message,
    });
  }
});


// ✅ Get all selected students for event
exports.getSelectedStudentsForEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Calendar.findById(id);
    if (!event)
      return res.status(200).json({ success: false, message: "Event not found" });

    return res.status(200).json({
      success: true,
      data: event.selectedStudents || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Remove a selected student from an event and revert their placement data
exports.removeSelectedStudent = asyncHandler(async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { studentEmail } = req.body;

    if (!studentEmail) {
      return res.status(200).json({ success: false, message: "Student email is required." });
    }

    const event = await Calendar.findById(eventId);
    if (!event) {
      return res.status(200).json({ success: false, message: "Event not found." });
    }

    const lowerEmail = studentEmail.toLowerCase();
    const selectedEntry = event.selectedStudents.find(
      (s) => s.email?.toLowerCase() === lowerEmail
    );

    if (!selectedEntry) {
      return res.status(200).json({ success: false, message: "Student not found in selected list." });
    }

    // Remove from event's selectedStudents
    event.selectedStudents = event.selectedStudents.filter(
      (s) => s.email?.toLowerCase() !== lowerEmail
    );
    event.eventSummary.selectedStudents = event.selectedStudents.length;
    await event.save();

    // Revert the Student model's placement data for this company
    if (selectedEntry.studentId) {
      const studentDoc = await Student.findById(selectedEntry.studentId);
      if (studentDoc) {
        const companyName = event.companyDetails?.companyName || event.title;

        // Remove the matching offer from allOffers
        let allOffers = studentDoc.allOffers || [];
        const offerIdx = allOffers.findIndex(
          (o) => o.company === companyName
        );
        if (offerIdx !== -1) allOffers.splice(offerIdx, 1);

        if (allOffers.length > 0) {
          // Recalculate placementDetails from remaining offers (highest package)
          const highest = allOffers.reduce((max, o) => (o.package > max.package ? o : max), allOffers[0]);
          await Student.findByIdAndUpdate(studentDoc._id, {
            $set: {
              allOffers,
              placementDetails: {
                company: highest.company,
                role: highest.role,
                package: highest.package,
                placedDate: studentDoc.placementDetails?.placedDate || new Date()
              }
            }
          });
        } else {
          // No offers left — reset to pursuing
          await Student.findByIdAndUpdate(studentDoc._id, {
            $set: { status: 'pursuing', allOffers: [] },
            $unset: { placementDetails: '' }
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Removed ${selectedEntry.name || selectedEntry.email} from selected list.`,
      totalSelected: event.selectedStudents.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
});

// ✅ Upload Selected Students File and Update Count
exports.uploadSelectedStudents = asyncHandler(async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const file = req.file;
    const { selectedEmails } = req.body;

    if (!selectedEmails) {
      return res.status(200).json({ success: false, message: "No selected student emails provided." });
    }

    const emails = JSON.parse(selectedEmails);
    const event = await Calendar.findById(eventId);
    if (!event) return res.status(200).json({ success: false, message: "Event not found." });

    const notifications = [];
    const sentEmails = new Set();

    const alreadySelectedEmails = new Set(
      event.selectedStudents.map((s) => s.email?.toLowerCase())
    );

    for (const email of emails) {
      const lowerEmail = email.toLowerCase();

      // ✅ Only registered students are allowed
      const registeredStudent = event.registrations.find(
        (r) => r.personalInfo.email?.toLowerCase() === lowerEmail
      );
      if (!registeredStudent) {
        continue;
      }

      // ✅ Skip already selected students
      if (alreadySelectedEmails.has(lowerEmail)) {
        continue;
      }

      if (sentEmails.has(lowerEmail)) continue;
      sentEmails.add(lowerEmail);

      const student = registeredStudent.personalInfo;
      const bulkCompany = event.companyDetails?.companyName || event.title;
      const bulkRole = event.companyDetails?.roles?.[0] || '';
      const bulkCtc = event.companyDetails?.packageDetails?.max || event.companyDetails?.packageDetails?.min || '';
      const subject = `🎉 Congratulations! You have been selected for ${bulkCompany}`;
      const html = `
        <h3>Dear ${student.name || "Student"},</h3>
        <p>You have been <b>selected</b> in <b>${bulkCompany}</b>!</p>
        ${bulkRole ? `<p><b>Role:</b> ${bulkRole}</p>` : ''}
        ${bulkCtc ? `<p><b>CTC:</b> ${bulkCtc} LPA</p>` : ''}
        <p>Best wishes from the Placement Team!</p>
      `;

      try {
        await sendEmail(student.email, subject, html);
      } catch (err) {
      }

notifications.push({
  title: "Selection Update",
  message: `You have been selected in "${event.title}". Congratulations! 🎉`,
  category: "Placement", // ✅ REQUIRED FIELD (Fixes missing category)
  senderId: req.user?._id,
  senderModel: req.userType === "tpo" ? "TPO" : "Admin",
  recipients: [
    {
      recipientId: student.studentId,
      recipientModel: "Student",
      isRead: false,
    },
  ],
  relatedEntity: { entityId: event._id, entityModel: "Event" },
});

      event.selectedStudents.push({
        studentId: registeredStudent.studentId,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        branch: student.branch,
        selectedAt: new Date(),
      });

      // ✅ Sync placement data to Student model (for public page & student profile)
      if (registeredStudent.studentId) {
        const companyName = event.companyDetails?.companyName || event.title;
        const role = event.companyDetails?.roles?.[0] || 'Software Engineer';
        const pkg = event.companyDetails?.packageDetails?.max || event.companyDetails?.packageDetails?.min || 0;

        const offerEntry = { company: companyName, role, package: pkg, offeredDate: new Date(), source: 'event' };

        const studentDoc = await Student.findById(registeredStudent.studentId);
        if (studentDoc) {
          const allOffers = studentDoc.allOffers || [];
          allOffers.push(offerEntry);
          const highest = allOffers.reduce((max, o) => (o.package > max.package ? o : max), allOffers[0]);

          await Student.findByIdAndUpdate(studentDoc._id, {
            $set: {
              status: 'placed',
              placementDetails: {
                companyId: event.companyDetails?.companyId || null,
                company: highest.company,
                role: highest.role,
                package: highest.package,
                placedDate: studentDoc.placementDetails?.placedDate || new Date()
              },
              allOffers
            }
          });
        }
      }
    }

    if (notifications.length > 0) await Notification.insertMany(notifications);
    event.eventSummary.selectedStudents = event.selectedStudents.length;

    if (file) {
      try {
        // Upload file buffer to Cloudinary (no disk usage)
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, { folder: 'selected_lists' });
        event.selectedListFiles.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
          uploadedAt: new Date(),
        });
      } catch (err) {
        event.selectedListFiles.push({
          fileName: file.originalname,
          fileUrl: null,
          uploadedAt: new Date(),
          error: err.message || 'upload_failed'
        });
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: "✅ Selected students processed (only registered & unique).",
      newlyNotified: notifications.length,
      totalSelected: event.selectedStudents.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error while uploading selected students.",
      error: error.message,
    });
  }
});





