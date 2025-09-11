const express = require('express');
const {
  superAdminLogin,
  verifyOTP,
  getAdminDashboard,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdminProfile  // Add this import
} = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/super-admin-login', superAdminLogin);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/dashboard', auth, getAdminDashboard);
router.post('/logout', auth, logoutAdmin);
router.post('/change-password', auth, changePassword);
router.get('/profile', auth, getAdminProfile);  // Add this route

module.exports = router;