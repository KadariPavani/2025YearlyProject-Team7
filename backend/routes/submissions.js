const express = require('express');
const authenticateToken = require('../middleware/generalAuth');
const {
    runCode,
    submitCode,
    getSubmissionById,
    getUserContestSubmissions,
    getUserQuestionSubmissions
} = require('../controllers/submissionController');

const router = express.Router();

// Apply authentication middleware to most routes
// router.use(authenticateToken);

// Debug middleware
router.use((req, res, next) => {
    console.log(`\u{1f4e8} Submissions route: ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    next();
});

// Run code for testing (without submitting) - temporarily no auth for debugging
router.post('/run', runCode);

// Submit code for evaluation
router.post('/', authenticateToken, submitCode);

// Get submission result
router.get('/:id', authenticateToken, getSubmissionById);

// Get user's submissions for a contest
router.get('/contest/:contestId/user', authenticateToken, getUserContestSubmissions);

// Get user's submissions for a specific question
router.get('/contest/:contestId/question/:questionId/user', authenticateToken, getUserQuestionSubmissions);

module.exports = router;
