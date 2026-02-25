const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');
const { ok, badRequest, notFound, serverError, unauthorized } = require('../utils/http');
const { USER_TYPES, getModelByUserType, isValidUserType } = require('../utils/userType');
const jwt = require('jsonwebtoken');

// Added imports for placement training assignment
const Admin = require('../models/Admin');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');

// Get TPO for a student (prefer TPO from student's existing batch)
async function getTPOForStudent(student) {
  let assignedTPO = null;

  // Prefer TPO from the student's academic batch if present
  if (student.batchId) {
    const existingBatch = await Batch.findById(student.batchId).populate('tpoId');
    if (existingBatch && existingBatch.tpoId) {
      assignedTPO = existingBatch.tpoId;
    }
  }

  // Fallback: first active TPO
  if (!assignedTPO) {
    assignedTPO = await TPO.findOne({ status: 'active' }).sort({ createdAt: 1 });
  }

  return assignedTPO;
}

// Assign student to a placement training batch and update crtBatchName
async function assignStudentToPlacementTrainingBatch(student) {
  try {
    if (!student.college) {
      throw new Error('Student college is required');
    }

    // Only reassign if student is CRT interested
    if (!student.crtInterested) {
      if (student.placementTrainingBatchId) {
        await PlacementTrainingBatch.findByIdAndUpdate(
          student.placementTrainingBatchId,
          { $pull: { students: student._id } }
        );
        await Student.findByIdAndUpdate(student._id, {
          $unset: {
            placementTrainingBatchId: 1,
            crtBatchId: 1,
            crtBatchName: 1
          }
        });
      }
      return null;
    }

    const tpo = await getTPOForStudent(student);
    const admin = await Admin.findOne({ status: 'active' }).sort({ createdAt: 1 });

    // Get tech stack from batch settings
    let techStack = 'NonCRT';
    if (student.crtInterested && student.techStack && student.techStack.length > 0) {
      const availableTechStacks = await student.batchId.getAvailableCRTOptions();
      const selectedTech = student.techStack.find(t => availableTechStacks.includes(t));
      if (selectedTech) {
        techStack = selectedTech;
      }
    }

    // Find or create batch
    let placementBatch = await PlacementTrainingBatch.findOne({
      colleges: student.college,
      techStack: techStack,
      year: student.yearOfPassing,
      $expr: { $lt: [{ $size: "$students" }, 80] }
    }).sort({ createdAt: 1 });

    if (!placementBatch) {
      const existingBatches = await PlacementTrainingBatch.countDocuments({
        colleges: student.college,
        techStack: techStack,
        year: student.yearOfPassing
      });

      placementBatch = new PlacementTrainingBatch({
        batchNumber: `${student.yearOfPassing}${student.college}${techStack}${existingBatches + 1}`,
        colleges: [student.college],
        techStack,
        year: student.yearOfPassing,
        tpoId: tpo._id,
        createdBy: admin._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 3600 * 1000),
        students: []
      });
      await placementBatch.save();
    }

    // Update batch and student
    if (!placementBatch.students.includes(student._id)) {
      placementBatch.students.push(student._id);
      await placementBatch.save();
    }

    await Student.findByIdAndUpdate(student._id, {
      placementTrainingBatchId: placementBatch._id,
      crtBatchId: placementBatch._id,
      crtBatchName: placementBatch.batchNumber
    });

    return placementBatch;
  } catch (error) {
    throw error;
  }
}

// @desc    Validate session token
// @route   GET /api/auth/validate-session
// @access  Public
const validateSession = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return ok(res, { valid: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    for (const userType of USER_TYPES) {
      const Model = getModelByUserType(userType);
      const user = await Model.findById(decoded.id);
      if (user) {
        return ok(res, {
          valid: true,
          user: { id: user._id, name: user.name, email: user.email, userType },
        });
      }
    }
    return ok(res, { valid: false });
  } catch (error) {
    return ok(res, { valid: false });
  }
};

// Deprecated: logic moved to utils/userType.js

// @desc    General Login for TPO, Trainer, Student, Coordinator
// @route   POST /api/auth/login
// @access  Public
const generalLogin = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // input validation early to avoid throwing errors
    if (!email || !password) {
      return badRequest(res, 'Email and password are required');
    }

    if (!userType || !isValidUserType(userType)) {
      return badRequest(res, 'Invalid userType');
    }


    const Model = getModelByUserType(userType);
    if (!Model) {
      return badRequest(res, 'Invalid userType model');
    }

    const user = await Model.findOne({ email }).select('+password name email role isActive status batchId failedLoginAttempts lockUntil');

    if (!user) {
      // allow client to focus username field
      return ok(res, { success: false, message: 'User not found' });
    }

    // Check lock status
    if (user.isAccountLocked && user.isAccountLocked()) {
      return ok(res, { success: false, message: `Account locked until ${new Date(user.lockUntil).toISOString()}` });
    }

    // Special check for student login
    if (userType === 'student') {
      // Check if student has a valid batch and is active
      if (!user.batchId || !user.isActive) {
        return ok(res, { success: false, message: 'Your account has been deactivated. Please contact your administrator.' });
      }

      // Additional check to verify if batch exists
      const Batch = require('../models/Batch');
      const batch = await Batch.findById(user.batchId);
      if (!batch) {
        // If batch doesn't exist, deactivate student and deny login
        await Model.findByIdAndUpdate(user._id, {
          isActive: false,
          status: 'inactive'
        });
        return ok(res, { success: false, message: 'Your batch has been deleted. Please contact your administrator.' });
      }
    } else {
      // For other userTypes apply previous status check
      if (user.isActive === false || (user.status && user.status !== 'active')) {
        return ok(res, { success: false, message: 'Your account is inactive or suspended. Please contact administrator.' });
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // increment failed attempts and lock if necessary
      if (typeof user.incrementFailedLogin === 'function') await user.incrementFailedLogin();
      if (user.isAccountLocked && user.isAccountLocked()) {
        return ok(res, { success: false, message: `Account locked due to multiple failed attempts. Try again at ${new Date(user.lockUntil).toISOString()}` });
      }
      return ok(res, { success: false, message: 'Invalid password' });
    }

    // Successful login: reset attempts
    if (typeof user.resetFailedLogin === 'function') await user.resetFailedLogin();

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      userType,
    });


    return ok(res, {
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, userType },
    });
  } catch (error) {
    // Log stack for debugging
    // Give a bit more info in development-friendly way (non-sensitive)
    return serverError(res, `Login failed${process.env.NODE_ENV === 'development' ? ': ' + (error.message || '') : ''}`);
  }
};

// @desc    Student Login
// @route   POST /api/auth/student-login
// @access  Public
exports.studentLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(200).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find student and include password field for comparison
    const student = await Student.findOne({ username }).select('+password');

    if (!student) {
      return res.status(200).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if student can login
    if (!student.canLogin()) {
      return res.status(200).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.'
      });
    }

    // Check lock status
    if (student.isAccountLocked && student.isAccountLocked()) {
      return res.status(200).json({
        success: false,
        message: `Account locked until ${new Date(student.lockUntil).toISOString()}`
      });
    }

    // Check password
    const isMatch = await student.matchPassword(password);
    if (!isMatch) {
      // increment attempts
      if (typeof student.incrementFailedLogin === 'function') await student.incrementFailedLogin();
      if (student.isAccountLocked && student.isAccountLocked()) {
        return res.status(200).json({
          success: false,
          message: `Account locked due to multiple failed attempts. Try again at ${new Date(student.lockUntil).toISOString()}`
        });
      }
      return res.status(200).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Successful login: reset attempts
    if (typeof student.resetFailedLogin === 'function') await student.resetFailedLogin();

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Create token
    if (!process.env.JWT_SECRET) {
      return serverError(res, 'Authentication configuration error');
    }

    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '1h'
    });

    res.status(200).json({
      success: true,
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
        college: student.college,
        branch: student.branch,
        batchId: student.batchId,
        placementTrainingBatchId: student.placementTrainingBatchId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    General Dashboard
// @route   GET /api/auth/dashboard/:userType
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const { userType } = req.params;
    const userId = req.user.id;

    const Model = getModelByUserType(userType);
    const user = await Model.findById(userId).select('-password');
    if (!user) return notFound(res, 'User not found');

    // Customize dashboard data based on user type
    let dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      lastLogin: user.lastLogin,
      message: `Welcome ${user.name}!`
    };

    // Add user-type specific data
    switch (userType) {
      case 'student':
        dashboardData.user = {
          ...dashboardData.user,
          phonenumber: user.phonenumber,
          gender: user.gender,
          dob: user.dob,
          college: user.college,
          branch: user.branch,
          yearOfPassing: user.yearOfPassing,
          currentLocation: user.currentLocation,
          hometown: user.hometown,
          crtInterested: user.crtInterested,
          crtBatchChoice: user.crtBatchChoice,
          crtBatchName: user.crtBatchName,
          placementTrainingBatchId: user.placementTrainingBatchId,
        };
        break;
      case 'tpo':
        dashboardData = {
          ...dashboardData,
          assignedTrainers: user.assignedTrainers?.length || 0,
          assignedBatches: user.assignedBatches?.length || 0,
          managedCompanies: user.managedCompanies?.length || 0
        };
        break;
      case 'trainer':
        dashboardData = {
          ...dashboardData,
          experience: user.experience,
          subjects: user.subjects?.length || 0,
          assignedBatches: user.assignedBatches?.length || 0,
          createdQuizzes: user.createdQuizzes?.length || 0
        };
        break;

        case 'coordinator':
        const coordinator = await Coordinator.findById(userId)
          .populate({
            path: 'assignedPlacementBatch',
            populate: [
              { path: 'students' },
              { path: 'tpoId', select: 'name email' }
            ]
          });
        return ok(res, { success: true, data: { user: coordinator, message: 'Welcome to Coordinator Dashboard' } });
    }

    return ok(res, { success: true, data: dashboardData });

  } catch (error) {
    return serverError(res, 'Failed to fetch dashboard data');
  }
};

// @desc    Get User Profile
// @route   GET /api/auth/profile/:userType
// @access  Private
const getProfile = async (req, res) => {
  try {
    const { userType } = req.params;
    if (!req.user || !req.user.id) return unauthorized(res, 'User not authenticated');
    if (!userType || !isValidUserType(userType)) return badRequest(res, 'Invalid user type');

    const userId = req.user.id;
    const Model = getModelByUserType(userType);

    let user;
    if (userType === 'coordinator') {
      user = await Model.findById(userId)
        .select('-password')
        .populate({
          path: 'assignedPlacementBatch',
          select: 'batchNumber techStack startDate endDate year colleges assignedTrainers',
          populate: {
            path: 'assignedTrainers.trainer',
            select: 'name email subjectDealing category experience'
          }
        })
        .populate('createdBy', 'name email');
    } else {
      user = await Model.findById(userId)
        .select('-password')
        .populate('createdBy', 'name email');
    }

    if (!user) return notFound(res, 'User not found');

    return ok(res, { success: true, data: user });

  } catch (error) {
    const errorMessage = error.name === 'CastError' ? 'Invalid user ID format' : 'Failed to fetch profile';
    return serverError(res, errorMessage);
  }
};

// @desc    Change Password
// @route   POST /api/auth/change-password/:userType
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { userType } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return badRequest(res, 'Current password and new password are required');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[@$.!%*?&])[a-z\d@$.!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return badRequest(
        res,
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character'
      );
    }

    const userId = req.user.id;
    const Model = getModelByUserType(userType);

    const user = await Model.findById(userId).select('+password');
    if (!user) return notFound(res, 'User not found');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return unauthorized(res, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();

    return ok(res, { success: true, message: 'Password updated successfully' });

  } catch (error) {
    return serverError(res, 'Failed to change password');
  }
};

// @desc    Forgot Password (send OTP)
// @route   POST /api/auth/forgot-password/:userType
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { userType } = req.params;
    const { email } = req.body;

    const Model = getModelByUserType(userType);
    const user = await Model.findOne({ email });
    
    if (!user) return notFound(res, `${userType} not found`);

    // For coordinators, get the original student email
    const sendToEmail = userType === 'coordinator' ? user.getStudentEmail() : email;

    const otp = generateOTP();
    await OTP.create({ email, otp, purpose: 'reset_password' });

    await sendEmail({
      email: sendToEmail,
      subject: `Reset your ${userType} password`,
      message: `Your OTP to reset your ${userType} password is: ${otp}. It expires in 5 minutes.`
    });

    return ok(res, { success: true, message: 'OTP sent to email' });

  } catch (error) {
    return serverError(res, 'Failed to send OTP');
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password/:userType
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { userType } = req.params;
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) return badRequest(res, 'Missing required fields');

    const Model = getModelByUserType(userType);

    const otpDoc = await OTP.findOne({ email, purpose: 'reset_password' }).sort({ createdAt: -1 });
    if (!otpDoc) return badRequest(res, 'OTP not found or expired');

    if (Date.now() > otpDoc.expires.getTime()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return badRequest(res, 'OTP has expired');
    }

    if (otpDoc.attempts >= 3) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return badRequest(res, 'Too many failed attempts');
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return badRequest(res, 'Invalid OTP');
    }

    const user = await Model.findOne({ email }).select('+password');
    if (!user) return notFound(res, `${userType} not found`);

    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpDoc._id });

    return ok(res, { success: true, message: 'Password reset successful' });

  } catch (error) {
    return serverError(res, 'Failed to reset password');
  }
};

// @desc    Check if user needs to change password
// @route   GET /api/auth/check-password-change/:userType
// @access  Private
const checkPasswordChange = async (req, res) => {
  try {
    const { userType } = req.params;
    const userId = req.user.id;

    const Model = getModelByUserType(userType);

    const user = await Model.findById(userId).select('lastLogin createdAt');
    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is logging in for the first time or hasn't changed password in 90 days
    const now = new Date();
    const daysSinceCreation = Math.floor((now - user.createdAt) / (1000 * 60 * 60 * 24));
    const daysSinceLastLogin = user.lastLogin ?
      Math.floor((now - user.lastLogin) / (1000 * 60 * 60 * 24)) : 0;

    const needsPasswordChange = daysSinceCreation > 90 || daysSinceLastLogin > 90;

    res.status(200).json({
      success: true,
      needsPasswordChange,
      daysSinceCreation,
      daysSinceLastLogin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check password change status'
    });
  }
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile/:userType
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { userType } = req.params;
    const userId = req.user.id;
    const updateData = req.body || {};

    const Model = getModelByUserType(userType);

    // Disallow sensitive fields
    delete updateData.password;
    delete updateData.role;
    delete updateData.createdBy;
    delete updateData.status;

    // Update basic profile fields first
    let user = await Model.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return notFound(res, 'User not found');

    // If student, ensure placement training batch assignment based on updated profile
    if (userType === 'student') {
      await assignStudentToPlacementTrainingBatch(user);

      // Re-fetch with placement training batch populated for UI
      user = await Student.findById(userId)
        .select('-password')
        .populate({
          path: 'placementTrainingBatchId',
          model: 'PlacementTrainingBatch',
          select: 'batchNumber colleges techStack startDate endDate year',
          populate: { path: 'tpoId', select: 'name email' }
        })
        .populate({ path: 'batchId', model: 'Batch', select: 'batchNumber colleges' });
    }

    return ok(res, { success: true, message: 'Profile updated successfully', data: user });

  } catch (error) {
    return serverError(res, 'Failed to update profile');
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear auth cookie if set
    try {
      res.clearCookie('token', {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (e) {
      // non-fatal: clearing cookie failed
    }

    return ok(res, { success: true, message: 'Logged out successfully' });
  } catch (error) {
    return serverError(res, 'Logout failed');
  }
};

module.exports = {
  generalLogin,
  validateSession,
  getDashboard,
  getProfile,
  updateProfile,
  changePassword,
  checkPasswordChange,
  forgotPassword,
  resetPassword,
  logout
};