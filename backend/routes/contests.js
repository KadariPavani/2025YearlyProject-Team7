const express = require('express');
const authenticateToken = require('../middleware/generalAuth');
const {
    getActiveContests,
    getAdminContestById,
    createContest,
    addQuestion,
    updateContest,
    deleteContest,
    updateQuestion,
    deleteQuestion,
    listAdminContests,
    getContestById,
    getQuestion,
    runCode,
    submitCode,
    finalizeContest,
    adminFinalizeAll,
    getContestParticipants,
    getContestSubmissions,
    getAdminLeaderboard,
    getPublicLeaderboard,
    getUserResult
} = require('../controllers/contestController');
const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Debugging: log incoming contest router requests
router.use((req, res, next) => {
    console.log('Contests router hit ->', req.method, req.path);
    next();
});

// Get all active contests for users
router.get('/', getActiveContests);

// Admin-specific routes (for contest management)
// Get contest details for admin (with full data including test cases)
router.get('/admin/:id', getAdminContestById);

// Create a new contest (admin / instructor)
router.post('/admin', createContest);

// Add a question to an existing contest (admin/instructor/trainer)
router.post('/admin/:id/questions', addQuestion);

// Update contest details (admin/instructor/trainer)
router.put('/admin/:id', updateContest);

// Delete a contest (admin/instructor/trainer)
router.delete('/admin/:id', deleteContest);

// Update a question inside a contest (admin/instructor/trainer)
router.put('/admin/:id/questions/:questionId', updateQuestion);

// Delete a question from a contest (admin/instructor/trainer)
router.delete('/admin/:id/questions/:questionId', deleteQuestion);

// List contests created by the current admin/instructor (admin view)
router.get('/admin', listAdminContests);

// Get contest details for participants
router.get('/:id', getContestById);

// Get specific question details
router.get('/:contestId/questions/:questionId', getQuestion);

// Run code for a question (non-saved quick run)
router.post('/:contestId/questions/:questionId/run', runCode);

// Submit code for a question
router.post('/:contestId/questions/:questionId/submit', submitCode);

// Finalize contest for current user (student)
router.post('/:id/finalize', finalizeContest);

// Finalize contest for ALL participants (admin/trainer)
router.post('/admin/:id/finalize-all', adminFinalizeAll);

// Get contest participants (admin only)
router.get('/admin/:id/participants', getContestParticipants);

// Get all contest submissions (admin only)
router.get('/admin/:id/submissions', getContestSubmissions);

// Get contest leaderboard (admin only)
router.get('/admin/:id/leaderboard', getAdminLeaderboard);

// Public leaderboard (available after contest completion) or available to finalized participants during contest
router.get('/:id/leaderboard', getPublicLeaderboard);

// Get current authenticated user's contest result and rank
router.get('/:id/user-result', getUserResult);

module.exports = router;
