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
  getPasswordStatus,
  logout
} = require('../controllers/generalAuthController');
const generalAuth = require('../middleware/generalAuth');

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
router.get('/password-status', generalAuth, getPasswordStatus);

module.exports = router;
