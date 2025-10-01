// backend/routes/adminRoutes.js
const express = require('express');
const {
  superAdminLogin,
  verifyOTP,
  resendOTP,
  addAdmin,
  getAllAdmins,
  addTrainer,
  addTPO,
  getAllTrainers,
  getAllTPOs,
  getAdminDashboard,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdminProfile,
  createCrtBatch,
  updateStudent,
  deleteStudent
} = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/super-admin-login', superAdminLogin);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/dashboard', auth, getAdminDashboard);
router.post('/logout', auth, logoutAdmin);
router.post('/change-password', auth, changePassword);
router.get('/profile', auth, getAdminProfile);

// User management routes
router.post('/add-trainer', auth, addTrainer);
router.post('/add-tpo', auth, addTPO);
router.get('/trainers', auth, getAllTrainers);
router.get('/tpos', auth, getAllTPOs);
router.post('/add-admin', auth, addAdmin);
router.get('/admins', auth, getAllAdmins);
router.post('/crt-batch', auth, createCrtBatch);
router.put('/students/:id', auth, updateStudent);
router.delete('/students/:id', auth, deleteStudent);

module.exports = router;