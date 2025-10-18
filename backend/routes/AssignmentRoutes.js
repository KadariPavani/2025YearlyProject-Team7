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

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'assignments',
      allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar'],
      resource_type: 'auto',
      public_id: `assignment_${req.user.id}_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`
    };
  }
});

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
      'application/x-rar-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: jpg, png, pdf, doc, docx, txt, zip, rar`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5
  }
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  }
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  next();
};

// Conditional multer middleware for create route
const conditionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.array('files', 5)(req, res, err => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  } else {
    next(); // Skip multer for non-multipart requests
  }
};

// Helper functions (unchanged)
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

// Get batches for assignment creation
router.get('/batches', generalAuth, async (req, res) => {
  try {
    const trainerId = req.user.id;
    const regular = await getTrainerRegularBatches(trainerId);
    const placement = await getTrainerPlacementBatches(trainerId);
    const all = [...regular, ...placement];
    console.log(`Fetched batches for trainer ${trainerId}:`, { regular, placement, all });
    res.json({ regular, placement, all });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Failed to fetch batches', error: error.message });
  }
});

// Get trainer's subject
router.get('/subjects', generalAuth, async (req, res) => {
  try {
    const trainerId = req.user.id;
    const subject = await getTrainerSubject(trainerId);
    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ message: 'Failed to fetch subject', error: error.message });
  }
});

// Create new assignment
router.post('/', generalAuth, conditionalUpload, handleMulterError, async (req, res) => {
  try {
    console.log('Creating assignment, request body:', req.body);
    console.log('Request files:', req.files ? req.files.map(f => f.originalname) : 'No files');

    const {
      title,
      description,
      subject,
      dueDate,
      totalMarks,
      assignedBatches,
      assignedPlacementBatches,
      batchType,
      instructions,
      allowLateSubmission,
      lateSubmissionPenalty,
      maxAttempts,
      rubric
    } = req.body;

    const trainerId = req.user.id;

    // Validate inputs
    if (!title || !subject || !dueDate || !totalMarks || !batchType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse JSON fields if they are strings
    const parsedAssignedBatches = typeof assignedBatches === 'string' ? JSON.parse(assignedBatches) : assignedBatches;
    const parsedAssignedPlacementBatches = typeof assignedPlacementBatches === 'string' ? JSON.parse(assignedPlacementBatches) : assignedPlacementBatches;
    const parsedRubric = typeof rubric === 'string' ? JSON.parse(rubric) : rubric;

    // Validate subject
    const trainerSubject = await getTrainerSubject(trainerId);
    if (!trainerSubject.includes(subject)) {
      return res.status(400).json({ message: 'Invalid subject for this trainer' });
    }

    // Validate batches
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

    // Validate at least one batch is selected
    if (
      (batchType === 'regular' && validatedRegularBatches.length === 0) ||
      (batchType === 'placement' && validatedPlacementBatches.length === 0) ||
      (batchType === 'both' && validatedRegularBatches.length === 0 && validatedPlacementBatches.length === 0)
    ) {
      return res.status(400).json({ message: 'At least one batch must be selected' });
    }

    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      uploadedAt: new Date()
    })) : [];

    const assignment = new Assignment({
      title,
      description,
      subject,
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

// Get all assignments for trainer
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
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
});

// Update assignment
router.put('/:id', generalAuth, conditionalUpload, handleMulterError, async (req, res) => {
  try {
    console.log('Updating assignment, request body:', req.body);
    console.log('Request files:', req.files ? req.files.map(f => f.originalname) : 'No files');

    const { id } = req.params;
    const {
      title,
      description,
      subject,
      dueDate,
      totalMarks,
      assignedBatches,
      assignedPlacementBatches,
      batchType,
      instructions,
      allowLateSubmission,
      lateSubmissionPenalty,
      maxAttempts,
      rubric
    } = req.body;
    const trainerId = req.user.id;

    const assignment = await Assignment.findById(id);
    if (!assignment || assignment.trainerId.toString() !== trainerId) {
      return res.status(403).json({ message: 'Unauthorized or assignment not found' });
    }

    // Validate subject
    const trainerSubject = await getTrainerSubject(trainerId);
    if (subject && !trainerSubject.includes(subject)) {
      return res.status(400).json({ message: 'Invalid subject for this trainer' });
    }

    // Parse JSON fields if they are strings
    const parsedAssignedBatches = typeof assignedBatches === 'string' ? JSON.parse(assignedBatches) : assignedBatches;
    const parsedAssignedPlacementBatches = typeof assignedPlacementBatches === 'string' ? JSON.parse(assignedPlacementBatches) : assignedPlacementBatches;
    const parsedRubric = typeof rubric === 'string' ? JSON.parse(rubric) : rubric;

    // Validate batches
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

    // Update fields
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.subject = subject || assignment.subject;
    assignment.dueDate = dueDate ? new Date(dueDate) : assignment.dueDate;
    assignment.totalMarks = totalMarks ? parseInt(totalMarks) : assignment.totalMarks;
    assignment.batchType = batchType || assignment.batchType;
    assignment.instructions = instructions || assignment.instructions;
    assignment.allowLateSubmission = allowLateSubmission !== undefined ? (allowLateSubmission === 'true' || allowLateSubmission === true) : assignment.allowLateSubmission;
    assignment.lateSubmissionPenalty = lateSubmissionPenalty ? parseInt(lateSubmissionPenalty) : assignment.lateSubmissionPenalty;
    assignment.maxAttempts = maxAttempts ? parseInt(maxAttempts) : assignment.maxAttempts;
    assignment.rubric = parsedRubric || assignment.rubric;
    if (validatedRegularBatches.length > 0) assignment.assignedBatches = validatedRegularBatches;
    if (validatedPlacementBatches.length > 0) assignment.assignedPlacementBatches = validatedPlacementBatches;

    // Add new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        uploadedAt: new Date()
      }));
      assignment.attachments = [...assignment.attachments, ...newAttachments];
    }

    const updatedAssignment = await assignment.save();
    await updatedAssignment.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(400).json({ message: error.message || 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', generalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or unauthorized' });
    }

    // Delete associated Cloudinary files
    for (const attachment of assignment.attachments) {
      try {
        await cloudinary.uploader.destroy(attachment.publicId, { resource_type: 'raw' });
      } catch (err) {
        console.error(`Failed to delete Cloudinary file ${attachment.publicId}:`, err);
      }
    }
    for (const submission of assignment.submissions) {
      for (const file of submission.files) {
        try {
          await cloudinary.uploader.destroy(file.publicId, { resource_type: 'raw' });
        } catch (err) {
          console.error(`Failed to delete Cloudinary file ${file.publicId}:`, err);
        }
      }
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Failed to delete assignment', error: error.message });
  }
});

// Get assignments for student
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

    const list = assignments.map(assignment => ({
      ...assignment.toJSON(),
      hasSubmitted: assignment.submissions.some(sub => sub.studentId.toString() === studentId),
      canSubmit: assignment.canStudentAccess(student)
    }));

    res.json(list);
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
});

// Get single assignment for student
router.get('/student/:id', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const assignment = await Assignment.findById(req.params.id);
    const student = await Student.findById(studentId).select('batchId placementTrainingBatchId');

    if (!assignment || !student || !assignment.canStudentAccess(student)) {
      return res.status(403).json({ message: 'Unauthorized or assignment not found' });
    }

    const submissions = assignment.submissions.filter(sub => sub.studentId.toString() === studentId);
    res.json({
      ...assignment.toJSON(),
      submissions,
      canSubmit: assignment.canStudentAccess(student)
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Failed to fetch assignment', error: error.message });
  }
});

// Submit assignment
router.post('/:id/submit', generalAuth, upload.array('files', 5), handleMulterError, async (req, res) => {
  try {
    console.log('Submitting assignment, request body:', req.body);
    console.log('Request files:', req.files ? req.files.map(f => f.originalname) : 'No files');

    const studentId = req.user.id;
    const assignment = await Assignment.findById(req.params.id);
    const student = await Student.findById(studentId);

    if (!assignment || !student || !assignment.canStudentAccess(student)) {
      return res.status(403).json({ message: 'Unauthorized or assignment not found' });
    }

    // Check if already submitted
    if (assignment.submissions.some(sub => sub.studentId.toString() === studentId)) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }

    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required for submission' });
    }

    // Process submission files
    const files = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      uploadedAt: new Date()
    }));

    assignment.submissions.push({
      studentId,
      files,
      submittedAt: new Date(),
      isLate: new Date() > new Date(assignment.dueDate)
    });

    await assignment.save();
    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
});

// Get submissions for trainer
router.get('/:id/submissions', generalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('submissions.studentId', 'name rollNo');
    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized or assignment not found' });
    }
    res.json({ submissions: assignment.submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
});

// Grade submission
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

    submission.score = score;
    submission.feedback = feedback;

    await assignment.save();
    res.json({ message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Failed to grade submission', error: error.message });
  }
});

module.exports = router;