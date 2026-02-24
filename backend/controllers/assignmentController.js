// ============================================
// Assignment Controller
// Extracted from routes/AssignmentRoutes.js
// ============================================

const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const { createNotification, notifyAssignmentCreated } = require('./notificationController');
const { notifyAssignmentDeleted } = require('./notificationController');

// ============================================
// Helper: Process uploaded file
// ============================================
const processUploadedFile = (file) => {
  if (!file) return null;

  // Get clean URL from Cloudinary
  const secureUrl = file.path.replace('http://', 'https://');

  // Extract file extension from original filename
  const fileExt = path.extname(file.originalname).toLowerCase();

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

// ============================================
// Helper: Get trainer's placement batches
// ============================================
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
    return [];
  }
};


// ============================================
// Helper: Get trainer's subject
// ============================================
const getTrainerSubject = async (trainerId) => {
  try {
    const trainer = await Trainer.findById(trainerId).select('subjectDealing');
    return trainer?.subjectDealing ? [trainer.subjectDealing] : [];
  } catch (error) {
    return [];
  }
};

// ============================================
// GET /batches - Get trainer placement batches (flat array)
// ============================================
const getBatches = async (req, res) => {
  try {
    const placementBatches = await getTrainerPlacementBatches(req.user.id);
    res.json(placementBatches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch batches', error: error.message });
  }
};

// ============================================
// GET /subjects - Get trainer subjects
// ============================================
const getSubjects = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const subject = await getTrainerSubject(trainerId);
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subject', error: error.message });
  }
};

// ============================================
// POST / - Create assignment
// ============================================
const createAssignment = async (req, res) => {
  try {
    const {
      title, description, subject, dueDate, totalMarks,
      assignedBatches, assignedPlacementBatches, batchType,
      instructions, allowLateSubmission, lateSubmissionPenalty,
      maxAttempts, rubric
    } = req.body;

    const trainerId = req.user.id;

    if (!title || !subject || !dueDate || !totalMarks || !batchType) {
      return res.status(200).json({ message: 'Missing required fields' });
    }

    const parsedAssignedBatches = typeof assignedBatches === 'string'
      ? JSON.parse(assignedBatches) : assignedBatches;
    const parsedAssignedPlacementBatches = typeof assignedPlacementBatches === 'string'
      ? JSON.parse(assignedPlacementBatches) : assignedPlacementBatches;
    const parsedRubric = typeof rubric === 'string' ? JSON.parse(rubric) : rubric;

    const trainerSubject = await getTrainerSubject(trainerId);
    if (!trainerSubject.includes(subject)) {
      return res.status(200).json({ message: 'Invalid subject for this trainer' });
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
            return found._id.toString();
          }

          // Regex match
          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await Batch.findOne({ $or: [{ batchNumber: regex }, { name: regex }] }).select('_id batchNumber name');
          if (found && found._id) {
            return found._id.toString();
          }

          return null;
        } catch (err) {
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
            return found._id.toString();
          }

          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await PlacementTrainingBatch.findOne({ batchNumber: regex }).select('_id batchNumber');
          if (found && found._id) {
            return found._id.toString();
          }

          return null;
        } catch (err) {
          return null;
        }
      }));
      validatedPlacementBatches = resolvedPlacement.filter(Boolean);
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
        }
      } catch (err) {
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
      return res.status(200).json({ message: 'At least one batch must be selected' });
    }

    const attachments = req.files
      ? req.files.map(processUploadedFile).filter(f => f !== null)
      : [];


    // DEBUG: show resolved batches and final batchType before saving

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
    res.status(200).json({ message: error.message || 'Failed to create assignment' });
  }
};

// ============================================
// GET / - Get all assignments for trainer
// ============================================
const getAssignments = async (req, res) => {
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
};

// ============================================
// DELETE /:id - Delete assignment
// ============================================
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(200).json({ message: 'Assignment not found or unauthorized' });
    }

    // Delete all attachments from Cloudinary
    for (const attachment of assignment.attachments) {
      try {
        const resourceType = attachment.mimeType?.startsWith('image/') ? 'image' : 'raw';
        await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });
      } catch (err) {
      }
    }

    // Delete all submitted files from Cloudinary
    for (const submission of assignment.submissions) {
      for (const file of submission.files) {
        try {
          const resourceType = file.mimeType?.startsWith('image/') ? 'image' : 'raw';
          await cloudinary.uploader.destroy(file.publicId, { resource_type: resourceType });
        } catch (err) {
        }
      }
    }

    // Send cancellation notifications before deleting

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
    res.status(500).json({ message: 'Failed to delete assignment', error: error.message });
  }
};

// ============================================
// GET /student/list - Get assignments for student
// ============================================
const getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findById(studentId).select('batchId placementTrainingBatchId');

    if (!student) {
      return res.status(200).json({ message: 'Student not found' });
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
};

// ============================================
// POST /:id/submit - Submit assignment
// ============================================
const submitAssignment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const assignment = await Assignment.findById(req.params.id);
    const student = await Student.findById(studentId);

    if (!assignment || !student || !assignment.canStudentAccess(student)) {
      return res.status(200).json({ message: 'Unauthorized or assignment not found' });
    }

    if (assignment.submissions.some(sub => sub.studentId.toString() === studentId)) {
      return res.status(200).json({ message: 'Assignment already submitted' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(200).json({ message: 'At least one file is required for submission' });
    }

    const files = req.files.map(processUploadedFile).filter(f => f !== null);


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
};

// ============================================
// GET /:id/submissions - Get assignment submissions
// ============================================
const getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('submissions.studentId', 'name rollNo email');

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(200).json({ message: 'Unauthorized or assignment not found' });
    }

    res.json({ submissions: assignment.submissions, assignment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
};

// ============================================
// PUT /:assignmentId/submissions/:submissionId/grade - Grade submission
// ============================================
const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { score, feedback } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(200).json({ message: 'Unauthorized or assignment not found' });
    }

    const submission = assignment.submissions.id(submissionId);

    if (!submission) {
      return res.status(200).json({ message: 'Submission not found' });
    }

    if (score < 0 || score > assignment.totalMarks) {
      return res.status(200).json({
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
};

module.exports = {
  getBatches,
  getSubjects,
  createAssignment,
  getAssignments,
  deleteAssignment,
  getStudentAssignments,
  submitAssignment,
  getSubmissions,
  gradeSubmission
};
