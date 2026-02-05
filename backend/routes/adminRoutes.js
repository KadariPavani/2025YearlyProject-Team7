// backend/routes/adminRoutes.js
const express = require('express');
const {
  initializeSuperAdmin,
  superAdminLogin,
  verifyOTP,
  resendOTP,
  addAdmin,
  editAdmin,
  deleteAdmin,
  getAllAdmins,
  addTrainer,
  addTPO,
  getAllTrainers,
  getAllTPOs,
  // editTrainer,
  toggleTrainerStatus,
  deleteTrainer,
  // editTPO,
  toggleTPOStatus,
  deleteTPO,
  getAdminDashboard,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdminProfile,
  createCrtBatch,
  updateStudent,
  deleteStudent,
  getAllBatches,
  getBatchStudents,
  updateBatch,
  deleteBatchAndRelated,
  reassignPendingApprovals,
  getBatchById,
  getBatchesGrouped
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { excelUploadMiddleware } = require('../middleware/fileUpload'); // Import the middleware
const router = express.Router();

// Public routes
router.post('/initialize-super-admin', initializeSuperAdmin);
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
router.put('/admins/:id', auth, editAdmin);
router.delete('/admins/:id', auth, deleteAdmin);

// Trainer action routes (edit, suspend/reactivate, delete)
// router.put('/trainers/:id', auth, editTrainer);
router.patch('/trainers/:id/toggle-status', auth, toggleTrainerStatus);
router.delete('/trainers/:id', auth, deleteTrainer);

// TPO action routes (edit, suspend/reactivate, delete)
// router.put('/tpos/:id', auth, editTPO);
router.patch('/tpos/:id/toggle-status', auth, toggleTPOStatus);
router.delete('/tpos/:id', auth, deleteTPO);


// router.post('/crt-batch', auth, createCrtBatch);
router.put('/students/:id', auth, updateStudent);
router.delete('/students/:id', auth, deleteStudent);

// Batch routes
router.get('/batches', auth, getAllBatches);
router.get('/batches/:batchId/students', auth, getBatchStudents);
router.put('/batches/:batchId', auth, updateBatch);
router.delete('/batches/:batchId', auth, deleteBatchAndRelated);
router.post('/batches/:batchId/reassign-pending-approvals', auth, reassignPendingApprovals);

// POST /api/admin/crt-batch - Create CRT batch with dynamic tech stacks
router.post('/crt-batch', auth, excelUploadMiddleware, createCrtBatch);

// GET batch with available tech stacks
router.get('/batches/:batchId', auth, getBatchById);

// GET /api/admin/batches/grouped
router.get('/batches/grouped', auth, getBatchesGrouped);

module.exports = router;
