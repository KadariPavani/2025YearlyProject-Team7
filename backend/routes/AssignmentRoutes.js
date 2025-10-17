// Updated AssignmentRoutes.js - Enhanced with placement training batch support
const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const generalAuth = require('../middleware/generalAuth');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Helper function to get trainer's assigned placement batches
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

// Helper function to get trainer's regular batches
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

// Get batches for trainer (both regular and placement)
router.get('/batches', generalAuth, async (req, res) => {
  try {
    const trainerId = req.user.id;
    
    const [regularBatches, placementBatches] = await Promise.all([
      getTrainerRegularBatches(trainerId),
      getTrainerPlacementBatches(trainerId)
    ]);
    
    const allBatches = {
      regular: regularBatches,
      placement: placementBatches,
      all: [...regularBatches, ...placementBatches]
    };
    
    res.json(allBatches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
});

// Create a new assignment with file upload support
router.post('/', generalAuth, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      dueDate,
      totalMarks,
      assignedBatches,
      assignedPlacementBatches,
      batchType,
      attachmentLink,
      instructions,
      allowLateSubmission,
      lateSubmissionPenalty,
      maxAttempts,
      rubric
    } = req.body;

    const trainerId = req.user.id;

    // Validate batch assignments based on type
    let validatedRegularBatches = [];
    let validatedPlacementBatches = [];

    if (batchType === 'regular' || batchType === 'both') {
      if (assignedBatches) {
        const batches = Array.isArray(assignedBatches) ? assignedBatches : [assignedBatches];
        validatedRegularBatches = batches.filter(id => mongoose.Types.ObjectId.isValid(id));
      }
    }

    if (batchType === 'placement' || batchType === 'both') {
      if (assignedPlacementBatches) {
        const batches = Array.isArray(assignedPlacementBatches) ? assignedPlacementBatches : [assignedPlacementBatches];
        validatedPlacementBatches = batches.filter(id => mongoose.Types.ObjectId.isValid(id));
      }
    }

    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      fileUrl: `/uploads/assignments/${file.filename}`,
      fileSize: file.size,
      fileType: file.mimetype,
      uploadedAt: new Date()
    })) : [];

    // Parse rubric if provided
    let parsedRubric = [];
    if (rubric) {
      try {
        parsedRubric = typeof rubric === 'string' ? JSON.parse(rubric) : rubric;
      } catch (error) {
        console.error('Error parsing rubric:', error);
      }
    }

    const assignment = new Assignment({
      trainerId,
      title,
      description,
      subject,
      dueDate: new Date(dueDate),
      totalMarks: parseInt(totalMarks, 10),
      assignedBatches: validatedRegularBatches,
      assignedPlacementBatches: validatedPlacementBatches,
      batchType: batchType || 'regular',
      attachmentLink,
      attachments,
      instructions,
      allowLateSubmission: allowLateSubmission === 'true',
      lateSubmissionPenalty: parseInt(lateSubmissionPenalty, 10) || 0,
      maxAttempts: parseInt(maxAttempts, 10) || 1,
      rubric: parsedRubric,
      isPublished: true
    });

    const savedAssignment = await assignment.save();
    
    // Populate batch information for response
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

// Get all assignments for the trainer
router.get('/', generalAuth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ trainerId: req.user.id })
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .select('-submissions')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// Get a single assignment by ID for trainer
router.get('/:id', generalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' },
        { path: 'submissions.studentId', select: 'name rollNo email college branch' }
      ]);

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or not authorized' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Failed to fetch assignment' });
  }
});

// Update an assignment
router.put('/:id', generalAuth, upload.array('newAttachments', 5), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or not authorized' });
    }

    // Update basic fields
    const updateFields = [
      'title', 'description', 'subject', 'dueDate', 'totalMarks',
      'attachmentLink', 'instructions', 'allowLateSubmission', 
      'lateSubmissionPenalty', 'maxAttempts', 'isPublished'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'dueDate') {
          assignment[field] = new Date(req.body[field]);
        } else if (field === 'totalMarks' || field === 'lateSubmissionPenalty' || field === 'maxAttempts') {
          assignment[field] = parseInt(req.body[field], 10);
        } else if (field === 'allowLateSubmission' || field === 'isPublished') {
          assignment[field] = req.body[field] === 'true';
        } else {
          assignment[field] = req.body[field];
        }
      }
    });

    // Update batch assignments
    if (req.body.batchType) {
      assignment.batchType = req.body.batchType;
    }

    if (req.body.assignedBatches) {
      const batches = Array.isArray(req.body.assignedBatches) ? req.body.assignedBatches : [req.body.assignedBatches];
      assignment.assignedBatches = batches.filter(id => mongoose.Types.ObjectId.isValid(id));
    }

    if (req.body.assignedPlacementBatches) {
      const batches = Array.isArray(req.body.assignedPlacementBatches) ? req.body.assignedPlacementBatches : [req.body.assignedPlacementBatches];
      assignment.assignedPlacementBatches = batches.filter(id => mongoose.Types.ObjectId.isValid(id));
    }

    // Add new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        fileUrl: `/uploads/assignments/${file.filename}`,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadedAt: new Date()
      }));
      
      assignment.attachments = [...assignment.attachments, ...newAttachments];
    }

    // Update rubric
    if (req.body.rubric) {
      try {
        assignment.rubric = typeof req.body.rubric === 'string' ? JSON.parse(req.body.rubric) : req.body.rubric;
      } catch (error) {
        console.error('Error parsing rubric:', error);
      }
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

// Delete an assignment
router.delete('/:id', generalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or not authorized' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

// Get assignments for students
router.get('/student/list', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get student information
    const student = await Student.findById(studentId)
      .select('batchId placementTrainingBatchId');
      
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Build query to find assignments accessible to this student
    const query = {
      isPublished: true,
      $or: []
    };

    // Add regular batch condition if student has a batchId
    if (student.batchId) {
      query.$or.push({
        batchType: { $in: ['regular', 'both'] },
        assignedBatches: student.batchId
      });
    }

    // Add placement batch condition if student has placementTrainingBatchId
    if (student.placementTrainingBatchId) {
      query.$or.push({
        batchType: { $in: ['placement', 'both'] },
        assignedPlacementBatches: student.placementTrainingBatchId
      });
    }

    // If student has no batch assignments, return empty array
    if (query.$or.length === 0) {
      return res.json([]);
    }

    const assignments = await Assignment.find(query)
      .populate([
        { path: 'trainerId', select: 'name' },
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year' }
      ])
      .select('-submissions')
      .sort({ dueDate: 1 });

    // Add submission status for each assignment
    const assignmentList = assignments.map(assignment => {
      const submission = assignment.submissions.find(sub => 
        sub.studentId.toString() === studentId
      );

      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        dueDate: assignment.dueDate,
        totalMarks: assignment.totalMarks,
        trainer: assignment.trainerId,
        attachmentLink: assignment.attachmentLink,
        attachments: assignment.attachments,
        instructions: assignment.instructions,
        allowLateSubmission: assignment.allowLateSubmission,
        maxAttempts: assignment.maxAttempts,
        batchType: assignment.batchType,
        assignedBatches: assignment.assignedBatches,
        assignedPlacementBatches: assignment.assignedPlacementBatches,
        hasSubmitted: !!submission,
        submissionCount: assignment.submissions.filter(sub => sub.studentId.toString() === studentId).length,
        lastSubmission: submission ? {
          submittedAt: submission.submittedAt,
          score: submission.score,
          percentage: submission.percentage,
          grade: submission.grade,
          isLate: submission.isLate
        } : null,
        isOverdue: new Date() > new Date(assignment.dueDate),
        canSubmit: assignment.maxAttempts > (assignment.submissions.filter(sub => sub.studentId.toString() === studentId).length)
      };
    });

    res.json(assignmentList);
  } catch (error) {
    console.error('Error fetching assignments for student:', error);
    res.status(500).json({ message: 'Failed to fetch assignments for student' });
  }
});

// Get a single assignment for student
router.get('/student/:id', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const assignmentId = req.params.id;
    
    const [assignment, student] = await Promise.all([
      Assignment.findById(assignmentId)
        .populate([
          { path: 'trainerId', select: 'name email' },
          { path: 'assignedBatches', select: 'name' },
          { path: 'assignedPlacementBatches', select: 'batchNumber techStack year' }
        ]),
      Student.findById(studentId).select('batchId placementTrainingBatchId')
    ]);

    if (!assignment || !student) {
      return res.status(404).json({ message: 'Assignment or student not found' });
    }

    // Check if student can access this assignment
    if (!assignment.canStudentAccess(student)) {
      return res.status(403).json({ message: 'You are not authorized to access this assignment' });
    }

    // Get student's submissions for this assignment
    const studentSubmissions = assignment.submissions.filter(sub => 
      sub.studentId.toString() === studentId
    );

    const assignmentData = {
      _id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      trainer: assignment.trainerId,
      attachmentLink: assignment.attachmentLink,
      attachments: assignment.attachments,
      instructions: assignment.instructions,
      allowLateSubmission: assignment.allowLateSubmission,
      lateSubmissionPenalty: assignment.lateSubmissionPenalty,
      maxAttempts: assignment.maxAttempts,
      rubric: assignment.rubric,
      createdAt: assignment.createdAt,
      submissions: studentSubmissions,
      submissionCount: studentSubmissions.length,
      canSubmit: assignment.maxAttempts > studentSubmissions.length,
      isOverdue: new Date() > new Date(assignment.dueDate)
    };

    res.json(assignmentData);
  } catch (error) {
    console.error('Error fetching assignment for student:', error);
    res.status(500).json({ message: 'Failed to fetch assignment for student' });
  }
});

// Submit assignment (for students)
router.post('/:id/submit', generalAuth, upload.array('submissionFiles', 5), async (req, res) => {
  try {
    const studentId = req.user.id;
    const assignmentId = req.params.id;
    const { submissionText, submissionLink } = req.body;

    const [assignment, student] = await Promise.all([
      Assignment.findById(assignmentId),
      Student.findById(studentId).select('batchId placementTrainingBatchId name rollNo')
    ]);

    if (!assignment || !student) {
      return res.status(404).json({ message: 'Assignment or student not found' });
    }

    // Check if student can access this assignment
    if (!assignment.canStudentAccess(student)) {
      return res.status(403).json({ message: 'You are not authorized to submit this assignment' });
    }

    // Check submission limits
    const existingSubmissions = assignment.submissions.filter(sub => 
      sub.studentId.toString() === studentId
    );

    if (existingSubmissions.length >= assignment.maxAttempts) {
      return res.status(400).json({ message: 'Maximum submission attempts reached' });
    }

    // Check if late submission is allowed
    const isLate = new Date() > new Date(assignment.dueDate);
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({ message: 'Late submissions are not allowed for this assignment' });
    }

    // Process uploaded files
    const submissionFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      fileUrl: `/uploads/assignments/${file.filename}`,
      fileSize: file.size,
      fileType: file.mimetype
    })) : [];

    const submission = {
      studentId,
      submittedAt: new Date(),
      submissionText,
      submissionLink,
      submissionFiles,
      isLate,
      maxScore: assignment.totalMarks
    };

    assignment.submissions.push(submission);
    await assignment.save();

    res.json({
      message: 'Assignment submitted successfully',
      submissionId: assignment.submissions[assignment.submissions.length - 1]._id,
      isLate,
      submittedAt: submission.submittedAt
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Failed to submit assignment' });
  }
});

// Grade assignment submission (for trainers)
router.put('/:assignmentId/submissions/:submissionId/grade', generalAuth, async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { score, remarks, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or not authorized' });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update submission with grade
    submission.score = parseInt(score, 10);
    submission.remarks = remarks;
    submission.feedback = feedback;
    submission.evaluatedAt = new Date();
    submission.evaluatedBy = req.user.id;

    // Calculate percentage and grade (done automatically by pre-save middleware)
    await assignment.save();

    res.json({
      message: 'Assignment graded successfully',
      submission: submission
    });
  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({ message: 'Failed to grade assignment' });
  }
});

// Get assignment submissions for trainer
router.get('/:id/submissions', generalAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate([
        { path: 'submissions.studentId', select: 'name rollNo email college branch' },
        { path: 'submissions.evaluatedBy', select: 'name' }
      ]);

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or not authorized' });
    }

    const submissions = assignment.submissions.map(sub => ({
      _id: sub._id,
      student: sub.studentId,
      submittedAt: sub.submittedAt,
      submissionText: sub.submissionText,
      submissionLink: sub.submissionLink,
      submissionFiles: sub.submissionFiles,
      score: sub.score,
      percentage: sub.percentage,
      grade: sub.grade,
      remarks: sub.remarks,
      feedback: sub.feedback,
      isLate: sub.isLate,
      evaluatedAt: sub.evaluatedAt,
      evaluatedBy: sub.evaluatedBy
    }));

    const stats = {
      totalSubmissions: submissions.length,
      gradedSubmissions: submissions.filter(s => s.score !== undefined).length,
      pendingSubmissions: submissions.filter(s => s.score === undefined).length,
      lateSubmissions: submissions.filter(s => s.isLate).length,
      averageScore: submissions.length > 0 && submissions.filter(s => s.score !== undefined).length > 0 ?
        submissions.filter(s => s.score !== undefined).reduce((acc, s) => acc + s.score, 0) / 
        submissions.filter(s => s.score !== undefined).length : 0
    };

    res.json({
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate
      },
      submissions,
      stats
    });
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({ message: 'Failed to fetch assignment submissions' });
  }
});

module.exports = router;