const express = require('express');
const {
  superAdminLogin,
  verifyOTP,
  getAdminDashboard,
  logoutAdmin
} = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/super-admin-login', superAdminLogin);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.get('/dashboard', auth, getAdminDashboard);
router.post('/logout', auth, logoutAdmin);

module.exports = router;