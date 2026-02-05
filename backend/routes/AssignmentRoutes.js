// ============================================
// FINAL FIX: Include Extension in public_id
// This ensures files are saved as "filename.pdf" instead of just "filename"
// routes/AssignmentRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const {
  getBatches,
  getSubjects,
  createAssignment,
  getAssignments,
  deleteAssignment,
  getStudentAssignments,
  submitAssignment,
  getSubmissions,
  gradeSubmission
} = require('../controllers/assignmentController');

// ============================================
// CRITICAL FIX: CloudinaryStorage Configuration
// Include extension IN the public_id itself!
// ============================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    // Extract file extension
    const fileExt = path.extname(file.originalname).toLowerCase();

    // Clean filename WITHOUT extension
    const cleanName = path.basename(file.originalname, fileExt)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');

    // Determine resource type
    let resourceType = 'auto';
    if (file.mimetype === 'application/pdf' ||
        file.mimetype.includes('document') ||
        file.mimetype.includes('word') ||
        file.mimetype.includes('text') ||
        file.mimetype.includes('zip') ||
        file.mimetype.includes('rar')) {
      resourceType = 'raw';
    }

    // Map extensions
    const extensionMap = {
      '.pdf': 'pdf',
      '.doc': 'doc',
      '.docx': 'docx',
      '.txt': 'txt',
      '.zip': 'zip',
      '.rar': 'rar',
      '.jpg': 'jpg',
      '.jpeg': 'jpeg',
      '.png': 'png'
    };

    const format = extensionMap[fileExt] || fileExt.replace('.', '');

    // CRITICAL FIX: Include extension in public_id itself!
    // This ensures the file is saved as "filename.pdf" not just "filename"
    const publicIdWithExtension = `file_${timestamp}_${randomString}_${cleanName}.${format}`;

    return {
      folder: 'assignments',
      resource_type: resourceType,
      public_id: publicIdWithExtension,  // ← INCLUDES .pdf extension!
      use_filename: false,
      unique_filename: false,  // We're making it unique ourselves
      // Note: Don't use 'format' parameter separately when extension is in public_id
    };
  }
});

// Multer configuration
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
      'application/vnd.rar'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
});

// Error handling
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
  next();
};

// Conditional upload middleware
const conditionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    upload.array('files', 5)(req, res, err => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  } else {
    next();
  }
};

// ============================================
// API Routes
// ============================================

router.get('/batches', generalAuth, getBatches);

router.get('/subjects', generalAuth, getSubjects);

router.post('/', generalAuth, conditionalUpload, handleMulterError, createAssignment);

router.get('/', generalAuth, getAssignments);

router.delete('/:id', generalAuth, deleteAssignment);

router.get('/student/list', generalAuth, getStudentAssignments);

router.post('/:id/submit', generalAuth, upload.array('files', 5), handleMulterError, submitAssignment);

router.get('/:id/submissions', generalAuth, getSubmissions);

router.put('/:assignmentId/submissions/:submissionId/grade', generalAuth, gradeSubmission);

module.exports = router;
