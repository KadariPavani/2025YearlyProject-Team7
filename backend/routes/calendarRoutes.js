const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const generalAuth = require('../middleware/generalAuth');

router.use(generalAuth);

router.post('/:id/register', calendarController.registerStudent);
router.get('/registered', calendarController.getRegisteredEvents); // <-- move this UP
router.post('/', calendarController.createEvent);
router.get('/', calendarController.getEvents);
router.put('/:id/status', calendarController.updateEventStatus);
router.put('/:id/upload-selected', calendarController.uploadSelectedStudents);
router.get('/:id/registrations', calendarController.getEventRegistrations);
router.get('/:id', calendarController.getEventById);
router.put('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);
router.get('/student/:id', calendarController.getStudentById);


module.exports = router;
