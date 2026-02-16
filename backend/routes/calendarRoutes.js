const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const generalAuth = require('../middleware/generalAuth');
const multer = require("multer");
// Use memory storage to avoid writing to read-only filesystem in serverless
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
router.use(generalAuth);

router.post('/:id/register', calendarController.registerStudent);
router.get('/registered', calendarController.getRegisteredEvents); // <-- move this UP
router.post('/', calendarController.createEvent);
router.get('/', calendarController.getEvents);
router.put('/:id/status', calendarController.updateEventStatus);
router.put('/:id/upload-selected', upload.single("file"), calendarController.uploadSelectedStudents);

router.get('/:id', calendarController.getEventById);
router.put('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);
router.get('/student/:id', calendarController.getStudentById);

// ✅ Export registered students as Excel (must be before the general route)
router.get('/:id/registered-students/export', calendarController.exportRegisteredStudents);
// ✅ Fetch registered students for completed event
router.get('/:id/registered-students', calendarController.getRegisteredStudentsForCompleted);

// ✅ Mark selected student and send notification/mail
router.put('/:id/select-student', calendarController.selectStudentForEvent);
// ✅ Fetch selected students for an event
router.get('/:id/selected-students', calendarController.getSelectedStudentsForEvent);
router.get('/:id', calendarController.getEventById);

module.exports = router;
