const express = require('express');
const router = express.Router();

const {
  getPlacedStudents,
  getUpcomingEvents,
  getPlacementStatistics,
  downloadPlacementsExcel
} = require('../controllers/publicController');

// Public endpoint: get recent placed students across all events
router.get('/placed-students', getPlacedStudents);

// Public: upcoming events (companies scheduled)
router.get('/upcoming-events', getUpcomingEvents);

// Public: placement statistics for charts
router.get('/placed-students-statistics', getPlacementStatistics);

// Public: download all placements as Excel
router.get('/download-placements-excel', downloadPlacementsExcel);

module.exports = router;
