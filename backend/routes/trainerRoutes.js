// Updated trainer routes to include placement training batches
const express = require('express');
const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const asyncHandler = require('../middleware/asyncHandler.js');
const generalAuth = require('../middleware/generalAuth');

const router = express.Router();

// @desc Register trainer
// @route POST /api/trainer/register
// @access Public
const registerTrainer = asyncHandler(async (req, res) => {
  const {
    trainerName, // Frontend sends trainerName
    email,
    phoneNumber,
    employeeId,
    yearsOfExperience,
    subjectDealing,
    category,
    linkedProfileUrl,
    professionalPicture,
    password
  } = req.body;

  // Check if trainer already exists
  const trainerExists = await Trainer.findOne({
    $or: [
      { email },
      { employeeId }
    ]
  });

  if (trainerExists) {
    return res.status(400).json({
      success: false,
      message: 'Trainer with this email or employee ID already exists'
    });
  }

  // Create trainer - map trainerName to name
  const trainer = await Trainer.create({
    name: trainerName, // Map trainerName to name field
    email,
    phone: phoneNumber, // Map phoneNumber to phone
    employeeId,
    experience: yearsOfExperience, // Map yearsOfExperience to experience
    subjectDealing,
    category,
    linkedIn: linkedProfileUrl, // Map linkedProfileUrl to linkedIn
    password
  });

  if (trainer) {
    res.status(201).json({
      success: true,
      message: 'Trainer registration successful!',
      data: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        employeeId: trainer.employeeId,
        status: trainer.status
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid trainer data'
    });
  }
});

// @desc Auth trainer & get token
// @route POST /api/trainer/login
// @access Public
const loginTrainer = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for trainer and explicitly select password
  const trainer = await Trainer.findOne({ email }).select('+password');

  if (!trainer) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if trainer is active
  if (trainer.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Account is inactive. Please contact administrator.'
    });
  }

  // Check if password matches
  const isMatch = await trainer.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  trainer.lastLogin = new Date();
  await trainer.save();

  // Create token
  const token = jwt.sign(
    { id: trainer._id, role: 'trainer' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    data: {
      id: trainer._id,
      name: trainer.name,
      email: trainer.email,
      employeeId: trainer.employeeId,
      phone: trainer.phone,
      experience: trainer.experience,
      subjectDealing: trainer.subjectDealing,
      category: trainer.category,
      linkedIn: trainer.linkedIn,
      status: trainer.status,
      assignedBatches: trainer.assignedBatches,
      createdQuizzes: trainer.createdQuizzes,
      createdAssignments: trainer.createdAssignments,
      lastLogin: trainer.lastLogin
    }
  });
});

// @desc Get trainer profile
// @route GET /api/trainer/profile
// @access Private
const getTrainerProfile = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.user.id)
    .populate('assignedBatches')
    .populate('createdQuizzes')
    .populate('createdAssignments');

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  res.status(200).json({
    success: true,
    data: trainer
  });
});

// @desc Get assigned placement training batches
// @route GET /api/trainer/placement-training-batches
// @access Private
const getAssignedPlacementTrainingBatches = asyncHandler(async (req, res) => {
  const trainerId = req.user.id;

  // Find all placement training batches where this trainer is assigned
  const batches = await PlacementTrainingBatch.find({
    'assignedTrainers.trainer': trainerId,
    isActive: true
  })
  .populate('tpoId', 'name email')
  .populate('students', 'name email rollNo college branch techStack')
  .populate('assignedTrainers.trainer', 'name email subjectDealing category')
  .sort({ startDate: -1 });

  // Filter and format the data to show only this trainer's assignments
  const formattedBatches = batches.map(batch => {
    // Find this trainer's assignment in the batch
    const trainerAssignment = batch.assignedTrainers.find(
      assignment => assignment.trainer._id.toString() === trainerId
    );

    return {
      _id: batch._id,
      batchNumber: batch.batchNumber,
      techStack: batch.techStack,
      year: batch.year,
      colleges: batch.colleges,
      studentCount: batch.students.length,
      students: batch.students,
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status,
      isActive: batch.isActive,
      tpoId: batch.tpoId,
      // This trainer's specific assignment details
      myAssignment: trainerAssignment ? {
        timeSlot: trainerAssignment.timeSlot,
        subject: trainerAssignment.subject,
        schedule: trainerAssignment.schedule,
        assignedAt: trainerAssignment.assignedAt
      } : null,
      // All trainer assignments for context
      allAssignedTrainers: batch.assignedTrainers
    };
  });

  // Calculate statistics
  const stats = {
    totalBatches: formattedBatches.length,
    totalStudents: formattedBatches.reduce((acc, batch) => acc + batch.studentCount, 0),
    activeStatuses: formattedBatches.filter(batch => batch.status === 'Ongoing').length,
    upcomingBatches: formattedBatches.filter(batch => batch.status === 'Not Yet Started').length,
    completedBatches: formattedBatches.filter(batch => batch.status === 'Completed').length,
    timeSlotDistribution: formattedBatches.reduce((acc, batch) => {
      if (batch.myAssignment) {
        acc[batch.myAssignment.timeSlot] = (acc[batch.myAssignment.timeSlot] || 0) + 1;
      }
      return acc;
    }, { morning: 0, afternoon: 0, evening: 0 })
  };

  res.json({
    success: true,
    message: 'Assigned placement training batches fetched successfully',
    data: {
      batches: formattedBatches,
      stats: stats
    }
  });
});

// @desc Get detailed batch information for trainer
// @route GET /api/trainer/placement-batch-details/:batchId
// @access Private
const getPlacementBatchDetails = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const trainerId = req.user.id;

  const batch = await PlacementTrainingBatch.findById(batchId)
    .populate('tpoId', 'name email phone')
    .populate('students', 'name email rollNo college branch techStack phone')
    .populate('assignedTrainers.trainer', 'name email subjectDealing category experience phone')
    .populate('createdBy', 'name email');

  if (!batch) {
    return res.status(404).json({
      success: false,
      message: 'Placement training batch not found'
    });
  }

  // Check if this trainer is assigned to this batch
  const trainerAssignment = batch.assignedTrainers.find(
    assignment => assignment.trainer._id.toString() === trainerId
  );

  if (!trainerAssignment) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this batch'
    });
  }

  res.json({
    success: true,
    data: {
      batchInfo: {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        techStack: batch.techStack,
        year: batch.year,
        colleges: batch.colleges,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        isActive: batch.isActive,
        tpoId: batch.tpoId,
        createdBy: batch.createdBy,
        studentCount: batch.students.length
      },
      students: batch.students,
      myAssignment: {
        timeSlot: trainerAssignment.timeSlot,
        subject: trainerAssignment.subject,
        schedule: trainerAssignment.schedule,
        assignedAt: trainerAssignment.assignedAt
      },
      allTrainers: batch.assignedTrainers
    }
  });
});

// @desc Update trainer profile
// @route PUT /api/trainer/profile
// @access Private
const updateTrainerProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.trainerName || req.body.name,
    phone: req.body.phoneNumber || req.body.phone,
    experience: req.body.yearsOfExperience || req.body.experience,
    subjectDealing: req.body.subjectDealing,
    category: req.body.category,
    linkedIn: req.body.linkedProfileUrl || req.body.linkedIn
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const trainer = await Trainer.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: trainer
  });
});

// @desc Change trainer password
// @route PUT /api/trainer/change-password
// @access Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get trainer with password
  const trainer = await Trainer.findById(req.user.id).select('+password');

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  // Check current password
  const isCurrentPasswordCorrect = await trainer.matchPassword(currentPassword);

  if (!isCurrentPasswordCorrect) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  trainer.password = newPassword;
  await trainer.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc Logout trainer
// @route POST /api/trainer/logout
// @access Private
const logoutTrainer = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Trainer logged out successfully'
  });
});

// Routes
router.post('/register', registerTrainer);
router.post('/login', loginTrainer);
router.post('/logout', generalAuth, logoutTrainer);
router.get('/profile', generalAuth, getTrainerProfile);
router.put('/profile', generalAuth, updateTrainerProfile);
router.put('/change-password', generalAuth, changePassword);

// New routes for placement training batches
router.get('/placement-training-batches', generalAuth, getAssignedPlacementTrainingBatches);
router.get('/placement-batch-details/:batchId', generalAuth, getPlacementBatchDetails);

module.exports = router;