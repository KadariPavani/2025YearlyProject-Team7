const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const {
  getBatches,
  getSubjects,
  createQuiz,
  getAllQuizzes,
  getQuizById,
  getStudentQuizList,
  getStudentQuizById,
  submitQuiz,
  updateQuiz,
  deleteQuiz,
  getBatchProgress,
  backfillScheduledTimes
} = require('../controllers/quizController');

// Get all batches for trainer (both regular and placement)
router.get('/batches', generalAuth, getBatches);

// Modified: Get trainer's subject
router.get('/subjects', generalAuth, getSubjects);

// Create a new quiz
router.post('/', generalAuth, createQuiz);

// Get all quizzes for the trainer
router.get('/', generalAuth, getAllQuizzes);

// Get a single quiz by ID for trainer
router.get('/:id', generalAuth, getQuizById);

// Get quizzes assigned to the logged-in student (list)
router.get('/student/list', generalAuth, getStudentQuizList);

// Get a single quiz by ID for student
router.get('/student/:id', generalAuth, getStudentQuizById);

// Submit a quiz (for students)
router.post('/:id/submit', generalAuth, submitQuiz);

// Update a quiz
router.put('/:id', generalAuth, updateQuiz);

// Delete a quiz
router.delete('/:id', generalAuth, deleteQuiz);

// Get batch progress for a quiz (trainer)
router.get('/:id/batch-progress', generalAuth, getBatchProgress);

// ADMIN/TRAINER: Backfill scheduledStart/scheduledEnd for existing quizzes
router.post('/backfill-scheduled-times', generalAuth, backfillScheduledTimes);

module.exports = router;
