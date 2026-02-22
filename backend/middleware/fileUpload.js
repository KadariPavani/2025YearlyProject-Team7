const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Your cloudinary config
const fileUpload = require('express-fileupload');
const path = require('path');

// ==========================================
// EXCEL FILE UPLOAD (for batch creation)
// ==========================================
const excelUploadMiddleware = fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  abortOnLimit: true,
  createParentPath: true
});

// ==========================================
// CLOUDINARY - PROFILE IMAGE UPLOAD
// ==========================================
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    resource_type: 'image'
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('profileImage');

// ==========================================
// CLOUDINARY - RESUME UPLOAD
// ==========================================
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    
    // Extract file extension
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Clean filename without extension
    const cleanName = path.basename(file.originalname, fileExt)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Map extensions
    const extensionMap = {
      '.pdf': 'pdf',
      '.doc': 'doc',
      '.docx': 'docx'
    };
    
    const format = extensionMap[fileExt] || fileExt.replace('.', '');
    
    // Include extension in public_id
    const publicIdWithExtension = `resume_${timestamp}_${randomString}_${cleanName}.${format}`;
    
    return {
      folder: 'resumes',
      resource_type: 'raw',
      public_id: publicIdWithExtension,
      use_filename: false,
      unique_filename: false
    };
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'), false);
    }
  }
}).single('resume');

// ==========================================
// CLOUDINARY - LANDING PAGE IMAGE UPLOAD
// ==========================================
const landingImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'landing-content',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    resource_type: 'image'
  }
});

const landingImageUpload = multer({
  storage: landingImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('image');

module.exports = {
  excelUploadMiddleware,
  profileUpload,
  resumeUpload,
  landingImageUpload
};
