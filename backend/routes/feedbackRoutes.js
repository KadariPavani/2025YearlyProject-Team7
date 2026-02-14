const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/generalAuth');
const {
  submitFeedback,
  getStudentMyFeedback,
  getStudentTrainers,
  getTrainerReceivedFeedback,
  getTpoAllFeedback,
  getCoordinatorAllFeedback,
  respondToFeedback,
  updateFeedbackStatus,
  deleteFeedback
} = require('../controllers/feedbackRouteController');

// @route   POST /api/feedback/submit
// @desc    Submit feedback by student
// @access  Private (Student)
router.post('/submit', authenticateUser, submitFeedback);

// @route   GET /api/feedback/student/my-feedback
// @desc    Get all feedback submitted by logged-in student
// @access  Private (Student)
router.get('/student/my-feedback', authenticateUser, getStudentMyFeedback);

// @route   GET /api/feedback/student/trainers
// @desc    Get trainers assigned to student for feedback
// @access  Private (Student)
router.get('/student/trainers', authenticateUser, getStudentTrainers);

// @route   GET /api/feedback/trainer/received
// @desc    Get all feedback received by logged-in trainer
// @access  Private (Trainer)
router.get('/trainer/received', authenticateUser, getTrainerReceivedFeedback);

// @route   GET /api/feedback/tpo/all
// @desc    Get all feedback relevant to this TPO
// @access  Private (TPO)
router.get('/tpo/all', authenticateUser, getTpoAllFeedback);

// @route   GET /api/feedback/coordinator/all
// @desc    Get all feedback for coordinator
// @access  Private (Coordinator)
router.get('/coordinator/all', authenticateUser, getCoordinatorAllFeedback);

// @route   POST /api/feedback/:id/respond
// @desc    Respond to feedback
// @access  Private (Trainer/TPO/Coordinator)
router.post('/:id/respond', authenticateUser, respondToFeedback);

// @route   PUT /api/feedback/:id/status
// @desc    Update feedback status
// @access  Private (Trainer/TPO/Coordinator)
router.put('/:id/status', authenticateUser, updateFeedbackStatus);

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private (Student - can only delete their own feedback)
router.delete('/:id', authenticateUser, deleteFeedback);

module.exports = router;
