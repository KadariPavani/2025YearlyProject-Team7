// backend/routes/authRoutes.js
const express = require('express');
const {
  generalLogin,
  validateSession,
  getDashboard,
  getProfile,
  updateProfile,
  changePassword,
  checkPasswordChange,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/generalAuthController');
const generalAuth = require('../middleware/generalAuth');
const User = require('../models/User'); // <-- Add this line

const router = express.Router();

// Public routes
router.post('/login', generalLogin);
router.get('/validate-session', validateSession);
router.post('/forgot-password/:userType', forgotPassword);
router.post('/reset-password/:userType', resetPassword);

// Protected routes
router.get('/dashboard/:userType', generalAuth, getDashboard);
router.get('/profile/:userType', generalAuth, getProfile);
router.put('/profile/:userType', generalAuth, updateProfile);
router.post('/change-password/:userType', generalAuth, changePassword);
router.get('/check-password-change/:userType', generalAuth, checkPasswordChange);
router.post('/logout', generalAuth, logout);
router.get('/password-status', generalAuth, async (req, res) => {
  try {
    // Example: return password status for logged-in user
    const userId = req.user._id;
    // Find user and return password status (customize as needed)
    const user = await User.findById(userId);
    res.json({ passwordChanged: user.passwordChanged || false });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check password status' });
  }
});

module.exports = router;
