const express = require('express');
const router = express.Router();

const {
  getPlacedStudents,
  getUpcomingEvents,
} = require('../controllers/publicController');

// Public endpoint: get recent placed students across all events
router.get('/placed-students', getPlacedStudents);

// Public: upcoming events (companies scheduled)
router.get('/upcoming-events', getUpcomingEvents);

module.exports = router;
