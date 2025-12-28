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
// ✅ Add this code right below the populate()
const { createNotification,notifyAssignmentCreated  } = require("../controllers/notificationController");
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
    const batches = await Batch.find({ trainerId }).select('_id batchNumber isCrt students');
    return batches.map(batch => ({
      _id: batch._id,
      name: batch.batchNumber || `Batch ${batch._id}`,
      batchNumber: batch.batchNumber,
      isCrt: batch.isCrt,
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

    // Resolve regular batch candidates (ObjectId or batchNumber/name)
    if (Array.isArray(parsedAssignedBatches) && parsedAssignedBatches.length > 0) {
      const resolved = await Promise.all(parsedAssignedBatches.map(async (candidateRaw) => {
        const candidate = (candidateRaw || '').toString().trim();
        try {
          if (!candidate) return null;
          if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

          // Exact match by batchNumber or name
          let found = await Batch.findOne({ $or: [{ batchNumber: candidate }, { name: candidate }] }).select('_id batchNumber name');
          if (found && found._id) {
            console.log(`Resolved regular candidate '${candidate}' -> ${found._id} (${found.batchNumber||found.name})`);
            return found._id.toString();
          }

          // Regex match
          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await Batch.findOne({ $or: [{ batchNumber: regex }, { name: regex }] }).select('_id batchNumber name');
          if (found && found._id) {
            console.log(`Resolved regular candidate by regex '${candidate}' -> ${found._id}`);
            return found._id.toString();
          }

          console.warn(`Could not resolve regular batch candidate: '${candidateRaw}'`);
          return null;
        } catch (err) {
          console.error('Error resolving regular batch candidate:', candidateRaw, err.message || err);
          return null;
        }
      }));
      validatedRegularBatches = resolved.filter(Boolean);
    }

    // Resolve placement batch candidates (ObjectId or batchNumber)
    if (Array.isArray(parsedAssignedPlacementBatches) && parsedAssignedPlacementBatches.length > 0) {
      const resolvedPlacement = await Promise.all(parsedAssignedPlacementBatches.map(async (candidateRaw) => {
        const candidate = (candidateRaw || '').toString().trim();
        try {
          if (!candidate) return null;
          if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

          let found = await PlacementTrainingBatch.findOne({ batchNumber: candidate }).select('_id batchNumber');
          if (found && found._id) {
            console.log(`Resolved placement candidate '${candidate}' -> ${found._id} (${found.batchNumber})`);
            return found._id.toString();
          }

          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await PlacementTrainingBatch.findOne({ batchNumber: regex }).select('_id batchNumber');
          if (found && found._id) {
            console.log(`Resolved placement candidate by regex '${candidate}' -> ${found._id} (${found.batchNumber})`);
            return found._id.toString();
          }

          console.warn(`Could not resolve placement batch candidate: '${candidateRaw}'`);
          return null;
        } catch (err) {
          console.error('Error resolving placement batch candidate:', candidateRaw, err.message || err);
          return null;
        }
      }));
      validatedPlacementBatches = resolvedPlacement.filter(Boolean);
      console.log('Resolved placement batch ids:', validatedPlacementBatches);
    }

    // SAFEGUARD: If any of the resolved "regular" ids actually exist in PlacementTrainingBatch,
    // move them to validatedPlacementBatches so assignments reach placement students correctly.
    if (validatedRegularBatches.length > 0) {
      try {
        const placementMatches = await PlacementTrainingBatch.find({ _id: { $in: validatedRegularBatches } }).select('_id');
        const placementIds = placementMatches.map(p => p._id.toString());
        if (placementIds.length > 0) {
          // Remove these ids from validatedRegularBatches
          validatedRegularBatches = validatedRegularBatches.filter(id => !placementIds.includes(id));
          // Add to placement list (avoid duplicates)
          validatedPlacementBatches = Array.from(new Set([...(validatedPlacementBatches || []), ...placementIds]));
          console.log(`Moved ${placementIds.length} id(s) from validatedRegularBatches to validatedPlacementBatches because they belong to placement batches:` , placementIds);
        }
      } catch (err) {
        console.error('Error reconciling regular vs placement batch ids:', err);
      }
    }

    // Determine final batchType based on what actually got resolved
    let finalBatchType = batchType || 'placement';
    if ((validatedPlacementBatches && validatedPlacementBatches.length > 0) && (validatedRegularBatches && validatedRegularBatches.length > 0)) {
      finalBatchType = 'both';
    } else if (validatedPlacementBatches && validatedPlacementBatches.length > 0) {
      finalBatchType = 'placement';
    } else if (validatedRegularBatches && validatedRegularBatches.length > 0) {
      finalBatchType = 'noncrt';
    }

    if ((validatedRegularBatches.length === 0 && validatedPlacementBatches.length === 0)) {
      return res.status(400).json({ message: 'At least one batch must be selected' });
    }

    const attachments = req.files
      ? req.files.map(processUploadedFile).filter(f => f !== null)
      : [];

    console.log('Processed attachments with extensions:', attachments);

    // DEBUG: show resolved batches and final batchType before saving
    console.log('Saving assignment with resolved batches:', { validatedRegularBatches, validatedPlacementBatches, finalBatchType });

    const assignment = new Assignment({
      title, description, subject,
      dueDate: new Date(dueDate),
      totalMarks: parseInt(totalMarks),
      trainerId,
      assignedBatches: validatedRegularBatches,
      assignedPlacementBatches: validatedPlacementBatches,
      batchType: finalBatchType || 'placement',
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



if (validatedPlacementBatches.length > 0) {
  for (const batchId of validatedPlacementBatches) {
    await notifyAssignmentCreated(batchId, req.user.name, title, req.user.id || req.user.userId);
  }
}

if (validatedRegularBatches.length > 0) {
  for (const batchId of validatedRegularBatches) {
    await notifyAssignmentCreated(batchId, req.user.name, title, req.user.id || req.user.userId);
  }
}



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

    // 🧹 Delete all attachments from Cloudinary
    for (const attachment of assignment.attachments) {
      try {
        const resourceType = attachment.mimeType?.startsWith('image/') ? 'image' : 'raw';
        await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error(`Failed to delete Cloudinary file ${attachment.publicId}:`, err);
      }
    }

    // 🧹 Delete all submitted files from Cloudinary
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

    // 🗑️ Send cancellation notifications before deleting
    const { notifyAssignmentDeleted } = require("../controllers/notificationController");

    // Notify placement batch students
    if (assignment.assignedPlacementBatches?.length > 0) {
      for (const batchId of assignment.assignedPlacementBatches) {
        await notifyAssignmentDeleted(batchId, req.user.name, assignment.title, req.user.id || req.user.userId);
      }
    }

    // Notify regular batch students
    if (assignment.assignedBatches?.length > 0) {
      for (const batchId of assignment.assignedBatches) {
        await notifyAssignmentDeleted(batchId, req.user.name, assignment.title, req.user.id || req.user.userId);
      }
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Assignment deleted successfully and students notified' });
  } catch (error) {
    console.error("❌ Error deleting assignment:", error);
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
        batchType: { $in: ['noncrt', 'regular', 'both'] },
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
