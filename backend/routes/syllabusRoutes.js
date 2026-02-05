const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const {
  createSyllabus,
  getAllSyllabi,
  getSyllabusById,
  updateSyllabus,
  deleteSyllabus,
  getStudentSyllabi,
  getStudentSyllabusById
} = require('../controllers/syllabusController');

// =====================================================
// TRAINER ROUTES (Create, Read, Update, Delete)
// =====================================================

// Create a new syllabus (trainer only)
router.post('/', generalAuth, createSyllabus);

// Get all syllabi for the trainer
router.get('/', generalAuth, getAllSyllabi);

// Get a single syllabus by ID for trainer
router.get('/:id', generalAuth, getSyllabusById);

// Update syllabus (trainer only)
router.put('/:id', generalAuth, updateSyllabus);

// Delete syllabus (trainer only)
router.delete('/:id', generalAuth, deleteSyllabus);

// =====================================================
// STUDENT ROUTES (Read Only - Filtered by Batch)
// =====================================================

// Get syllabi assigned to the logged-in student (list)
router.get('/student/list', generalAuth, getStudentSyllabi);

// Get a single syllabus by ID for student
router.get('/student/:id', generalAuth, getStudentSyllabusById);

module.exports = router;
