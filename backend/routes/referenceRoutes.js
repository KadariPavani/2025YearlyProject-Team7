// referenceRoutes.js - Thin route definitions

const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const {
  getTrainerBatches,
  createReference,
  getTrainerReferences,
  getReferenceById,
  updateReference,
  deleteReference,
  getStudentReferences,
  getStudentReferenceById,
  rateReference,
  getReferenceAnalytics,
  getPublicReferences,
} = require('../controllers/referenceController');

// Cloudinary storage for resource files (pdf/doc/ppt)
const resourceStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExt = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, fileExt)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    const extensionMap = {
      '.pdf': 'pdf',
      '.doc': 'doc',
      '.docx': 'docx',
      '.ppt': 'ppt',
      '.pptx': 'pptx',
    };
    const format = extensionMap[fileExt] || fileExt.replace('.', '');
    const publicIdWithExtension = `resource_${timestamp}_${randomString}_${cleanName}.${format}`;
    return {
      folder: 'resources',
      resource_type: 'raw',
      public_id: publicIdWithExtension,
      use_filename: false,
      unique_filename: false,
    };
  },
});

const upload = multer({
  storage: resourceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX allowed'), false);
  },
});

// Legacy public references (must be before /:id to avoid being caught by param route)
router.get('/all', getPublicReferences);

// Get batches for trainer (both regular and placement)
router.get('/batches', generalAuth, getTrainerBatches);

// Trainer uploads a resource
router.post('/', generalAuth, upload.array('files', 5), createReference);

// Get all references for the trainer
router.get('/', generalAuth, getTrainerReferences);

// Get a single reference by ID for trainer
router.get('/:id', generalAuth, getReferenceById);

// Update a reference - handle file updates
router.put('/:id', generalAuth, upload.array('files', 5), updateReference);

// Delete (archive) a reference
router.delete('/:id', generalAuth, deleteReference);


// ==================== STUDENT ENDPOINTS ====================

// Student fetches resources - Fix the query structure
router.get('/student/list', generalAuth, getStudentReferences);

// Get a single reference for student
router.get('/student/:id', generalAuth, getStudentReferenceById);

// Rate a reference (for students)
router.post('/:id/rate', generalAuth, rateReference);

// Get reference analytics for trainer
router.get('/:id/analytics', generalAuth, getReferenceAnalytics);

module.exports = router;
