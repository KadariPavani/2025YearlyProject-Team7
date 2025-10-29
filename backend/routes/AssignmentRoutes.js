// ============================================
// FINAL FIX: Include Extension in public_id
// This ensures files are saved as "filename.pdf" instead of just "filename"
// routes/AssignmentRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const generalAuth = require('../middleware/generalAuth');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

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

// ============================================
// Process uploaded file
// ============================================
const processUploadedFile = (file) => {
  if (!file) return null;
  
  // Get clean URL from Cloudinary
  const secureUrl = file.path.replace('http://', 'https://');
  
  // Extract file extension from original filename
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  console.log('Processed file:', {
    originalName: file.originalname,
    cloudinaryUrl: secureUrl,
    publicId: file.filename,
    extension: fileExt
  });
  
  return {
    url: secureUrl,  // Should now include .pdf extension
    publicId: file.filename,
    originalName: file.originalname,
    uploadedAt: new Date(),
    size: file.size,
    mimeType: file.mimetype,
    extension: fileExt.replace('.', '')
  };
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

// Helper functions
const getTrainerPlacementBatches = async (trainerId) => {
  try {
    const batches = await PlacementTrainingBatch.find({
      'assignedTrainers.trainer': trainerId,
      isActive: true
    }).select('_id batchNumber techStack year colleges students');
    
    return batches.map(batch => ({
      _id: batch._id,
      name: `${batch.batchNumber} - ${batch.techStack} (${batch.year})`,
      batchNumber: batch.batchNumber,
      techStack: batch.techStack,
      year: batch.year,
      colleges: batch.colleges,
      studentCount: batch.students.length,
      type: 'placement'
    }));
  } catch (error) {
    console.error('Error fetching placement batches:', error);
    return [];
  }
};

const getTrainerRegularBatches = async (trainerId) => {
  try {
    const batches = await Batch.find({ trainerId }).select('_id name students');
    return batches.map(batch => ({
      _id: batch._id,
      name: batch.name,
      studentCount: batch.students?.length || 0,
      type: 'regular'
    }));
  } catch (error) {
    console.error('Error fetching regular batches:', error);
    return [];
  }
};

const getTrainerSubject = async (trainerId) => {
  try {
    const trainer = await Trainer.findById(trainerId).select('subjectDealing');
    return trainer?.subjectDealing ? [trainer.subjectDealing] : [];
  } catch (error) {
    console.error('Error fetching trainer subject:', error);
    return [];
  }
};

// ============================================
// API Routes
// ============================================

router.get('/batches', generalAuth, async (req, res) => {
  try {
    const trainerId = req.user.id;
    const regular = await getTrainerRegularBatches(trainerId);
    const placement = await getTrainerPlacementBatches(trainerId);
    const all = [...regular, ...placement];
    
    res.json({ regular, placement, all });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch batches', error: error.message });
  }
});

router.get('/subjects', generalAuth, async (req, res) => {
  try {
    const trainerId = req.user.id;
    const subject = await getTrainerSubject(trainerId);
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subject', error: error.message });
  }
});

router.post('/', generalAuth, conditionalUpload, handleMulterError, async (req, res) => {
  try {
    console.log('Creating assignment...');
    console.log('Files received:', req.files?.map(f => ({
      name: f.originalname,
      type: f.mimetype,
      cloudinaryPath: f.path,
      publicId: f.filename
    })));
    
    const {
      title, description, subject, dueDate, totalMarks,
      assignedBatches, assignedPlacementBatches, batchType,
      instructions, allowLateSubmission, lateSubmissionPenalty,
      maxAttempts, rubric
    } = req.body;
    
    const trainerId = req.user.id;
    
    if (!title || !subject || !dueDate || !totalMarks || !batchType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const parsedAssignedBatches = typeof assignedBatches === 'string' 
      ? JSON.parse(assignedBatches) : assignedBatches;
    const parsedAssignedPlacementBatches = typeof assignedPlacementBatches === 'string' 
      ? JSON.parse(assignedPlacementBatches) : assignedPlacementBatches;
    const parsedRubric = typeof rubric === 'string' ? JSON.parse(rubric) : rubric;
    
    const trainerSubject = await getTrainerSubject(trainerId);
    if (!trainerSubject.includes(subject)) {
      return res.status(400).json({ message: 'Invalid subject for this trainer' });
    }
    
    let validatedRegularBatches = [];
    let validatedPlacementBatches = [];
    
    if (batchType === 'regular' || batchType === 'both') {
      validatedRegularBatches = Array.isArray(parsedAssignedBatches)
        ? parsedAssignedBatches.filter(id => mongoose.Types.ObjectId.isValid(id))
        : [];
    }
    
    if (batchType === 'placement' || batchType === 'both') {
      validatedPlacementBatches = Array.isArray(parsedAssignedPlacementBatches)
        ? parsedAssignedPlacementBatches.filter(id => mongoose.Types.ObjectId.isValid(id))
        : [];
    }
    
    if (
      (batchType === 'regular' && validatedRegularBatches.length === 0) ||
      (batchType === 'placement' && validatedPlacementBatches.length === 0) ||
      (batchType === 'both' && validatedRegularBatches.length === 0 && validatedPlacementBatches.length === 0)
    ) {
      return res.status(400).json({ message: 'At least one batch must be selected' });
    }
    
    const attachments = req.files 
      ? req.files.map(processUploadedFile).filter(f => f !== null) 
      : [];
    
    console.log('Processed attachments with extensions:', attachments);
    
    const assignment = new Assignment({
      title, description, subject,
      dueDate: new Date(dueDate),
      totalMarks: parseInt(totalMarks),
      trainerId,
      assignedBatches: validatedRegularBatches,
      assignedPlacementBatches: validatedPlacementBatches,
      batchType,
      attachments,
      instructions,
      allowLateSubmission: allowLateSubmission === 'true' || allowLateSubmission === true,
      lateSubmissionPenalty: parseInt(lateSubmissionPenalty) || 0,
      maxAttempts: parseInt(maxAttempts) || 1,
      rubric: parsedRubric || []
    });
    
    const savedAssignment = await assignment.save();
    await savedAssignment.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);
    
    res.status(201).json(savedAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(400).json({ message: error.message || 'Failed to create assignment' });
  }
});

router.get('/', generalAuth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ trainerId: req.user.id })
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .sort({ createdAt: -1 });
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
});

router.delete('/:id', generalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or unauthorized' });
    }
    
    for (const attachment of assignment.attachments) {
      try {
        const resourceType = attachment.mimeType?.startsWith('image/') ? 'image' : 'raw';
        await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error(`Failed to delete Cloudinary file ${attachment.publicId}:`, err);
      }
    }
    
    for (const submission of assignment.submissions) {
      for (const file of submission.files) {
        try {
          const resourceType = file.mimeType?.startsWith('image/') ? 'image' : 'raw';
          await cloudinary.uploader.destroy(file.publicId, { resource_type: resourceType });
        } catch (err) {
          console.error(`Failed to delete Cloudinary file ${file.publicId}:`, err);
        }
      }
    }
    
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete assignment', error: error.message });
  }
});

router.get('/student/list', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId).select('batchId placementTrainingBatchId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const query = { $or: [] };
    
    if (student.batchId) {
      query.$or.push({
        batchType: { $in: ['regular', 'both'] },
        assignedBatches: student.batchId
      });
    }
    
    if (student.placementTrainingBatchId) {
      query.$or.push({
        batchType: { $in: ['placement', 'both'] },
        assignedPlacementBatches: student.placementTrainingBatchId
      });
    }
    
    if (query.$or.length === 0) {
      return res.json([]);
    }
    
    const assignments = await Assignment.find(query)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year' }
      ])
      .sort({ dueDate: 1 });
    
    const list = assignments.map(assignment => {
      const studentSubmission = assignment.submissions.find(
        sub => sub.studentId.toString() === studentId
      );
      
      return {
        ...assignment.toJSON(),
        hasSubmitted: !!studentSubmission,
        canSubmit: assignment.canStudentAccess(student),
        submissions: studentSubmission ? [studentSubmission] : []
      };
    });
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
});

router.post('/:id/submit', generalAuth, upload.array('files', 5), handleMulterError, async (req, res) => {
  try {
    const studentId = req.user.id;
    const assignment = await Assignment.findById(req.params.id);
    const student = await Student.findById(studentId);
    
    if (!assignment || !student || !assignment.canStudentAccess(student)) {
      return res.status(403).json({ message: 'Unauthorized or assignment not found' });
    }
    
    if (assignment.submissions.some(sub => sub.studentId.toString() === studentId)) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required for submission' });
    }
    
    const files = req.files.map(processUploadedFile).filter(f => f !== null);
    
    console.log('Student submission files:', files);
    
    assignment.submissions.push({
      studentId,
      files,
      submittedAt: new Date(),
      isLate: new Date() > new Date(assignment.dueDate)
    });
    
    await assignment.save();
    
    res.json({ 
      message: 'Assignment submitted successfully', 
      submission: assignment.submissions[assignment.submissions.length - 1] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
});

router.get('/:id/submissions', generalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('submissions.studentId', 'name rollNo email');
    
    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized or assignment not found' });
    }
    
    res.json({ submissions: assignment.submissions, assignment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
});

router.put('/:assignmentId/submissions/:submissionId/grade', generalAuth, async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { score, feedback } = req.body;
    
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized or assignment not found' });
    }
    
    const submission = assignment.submissions.id(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    if (score < 0 || score > assignment.totalMarks) {
      return res.status(400).json({ 
        message: `Score must be between 0 and ${assignment.totalMarks}` 
      });
    }
    
    submission.score = parseFloat(score);
    submission.feedback = feedback || '';
    submission.evaluatedAt = new Date();
    submission.evaluatedBy = req.user.id;
    
    await assignment.save();
    
    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    res.status(500).json({ message: 'Failed to grade submission', error: error.message });
  }
});

module.exports = router;
