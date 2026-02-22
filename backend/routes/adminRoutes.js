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
  getBatchesGrouped,
  downloadPlacementTemplate,
  uploadPastPlacements,
  previewImport,
  confirmImport,
  getImportHistory,
  migrateAllOffers,
  deleteAllPastStudents
} = require('../controllers/adminController');
const {
  getAdminLandingContent,
  addHeroSlide, updateHeroSlide, deleteHeroSlide,
  addFAQ, updateFAQ, deleteFAQ
} = require('../controllers/landingContentController');
const auth = require('../middleware/auth');
const { excelUploadMiddleware, landingImageUpload } = require('../middleware/fileUpload');
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

// Placement import routes
router.get('/placement-import/template', auth, downloadPlacementTemplate);
router.post('/placement-import/upload', auth, excelUploadMiddleware, uploadPastPlacements);
router.get('/placement-import/:importId/preview', auth, previewImport);
router.post('/placement-import/:importId/confirm', auth, confirmImport);
router.get('/placement-import/history', auth, getImportHistory);
router.delete('/placement-import/past-students', auth, deleteAllPastStudents);

// Migration route - populate allOffers for existing students
router.post('/migrate-all-offers', auth, migrateAllOffers);

// ────────── Landing Page Content Management ──────────
router.get('/landing-content', auth, getAdminLandingContent);

// Hero Slides
router.post('/landing-content/hero-slides', auth, landingImageUpload, addHeroSlide);
router.put('/landing-content/hero-slides/:id', auth, landingImageUpload, updateHeroSlide);
router.delete('/landing-content/hero-slides/:id', auth, deleteHeroSlide);

// FAQs
router.post('/landing-content/faqs', auth, addFAQ);
router.put('/landing-content/faqs/:id', auth, updateFAQ);
router.delete('/landing-content/faqs/:id', auth, deleteFAQ);

module.exports = router;
