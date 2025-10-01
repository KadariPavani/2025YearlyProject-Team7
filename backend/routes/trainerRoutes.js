const express = require('express');
const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const asyncHandler = require('../middleware/asyncHandler.js');
const router = express.Router();

// @desc    Register trainer
// @route   POST /api/trainer/register
// @access  Public
const registerTrainer = asyncHandler(async (req, res) => {
  const {
    trainerName,  // Frontend sends trainerName
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
    name: trainerName,  // Map trainerName to name field
    email,
    phone: phoneNumber,  // Map phoneNumber to phone
    employeeId,
    experience: yearsOfExperience,  // Map yearsOfExperience to experience
    subjectDealing,
    category,
    linkedIn: linkedProfileUrl,  // Map linkedProfileUrl to linkedIn
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

// @desc    Auth trainer & get token
// @route   POST /api/trainer/login
// @access  Public
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

// @desc    Get trainer profile
// @route   GET /api/trainer/profile
// @access  Private
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

// @desc    Update trainer profile
// @route   PUT /api/trainer/profile
// @access  Private
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

// @desc    Change trainer password
// @route   PUT /api/trainer/change-password
// @access  Private
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

// @desc    Logout trainer
// @route   POST /api/trainer/logout
// @access  Private
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
router.post('/logout', protect, logoutTrainer);
router.get('/profile', protect, getTrainerProfile);
router.put('/profile', protect, updateTrainerProfile);
router.put('/change-password', protect, changePassword);

// Middleware to protect routes
function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
}

// Middleware to authorize specific roles
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
}

module.exports = router;