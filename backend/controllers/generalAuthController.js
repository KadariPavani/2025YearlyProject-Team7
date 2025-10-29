const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');
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
  if (!student.college) throw new Error('Student college is required');

  // Remove student from prior placement training batch if exists
  if (student.placementTrainingBatchId) {
    await PlacementTrainingBatch.findByIdAndUpdate(student.placementTrainingBatchId, {
      $pull: { students: student._id }
    });
  }

  const tpo = await getTPOForStudent(student);
  const admin = await Admin.findOne({ status: 'active' }).sort({ createdAt: 1 });

  if (!tpo) throw new Error('No TPO found for student. Please contact administrator.');
  if (!admin) throw new Error('No active Admin found in system. Please contact administrator.');

  const maxStudents = 80;
  const year = student.yearOfPassing;

  // Determine tech stack (default NonCRT)
  let techStack = 'NonCRT';
  if (student.crtInterested && student.techStack && student.techStack.length > 0) {
    const validTechs = ['Java', 'Python', 'AIML'];
    const selectedTech = student.techStack.find(t => validTechs.includes(t));
    if (selectedTech) techStack = selectedTech;
  }

  // Find existing batch with capacity
  let placementBatch = await PlacementTrainingBatch.findOne({
    colleges: student.college,
    techStack: techStack,
    year: year,
    $expr: { $lt: [{ $size: "$students" }, maxStudents] }
  }).sort({ createdAt: 1 });

  // Or create a new one
  if (!placementBatch) {
    const existingBatches = await PlacementTrainingBatch.countDocuments({
      colleges: student.college,
      techStack: techStack,
      year: year
    });

    const batchNumber = `PT_${year}_${student.college}_${techStack}_${existingBatches + 1}`;

    placementBatch = new PlacementTrainingBatch({
      batchNumber,
      colleges: [student.college],
      techStack,
      year,
      tpoId: tpo._id,
      createdBy: admin._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 3600 * 1000),
      students: []
    });
    await placementBatch.save();
  }

  // Add student to batch if not present
  if (!placementBatch.students.includes(student._id)) {
    placementBatch.students.push(student._id);
    await placementBatch.save();
  }

  // Update student references and crt batch name
  student.placementTrainingBatchId = placementBatch._id;
  student.crtBatchId = placementBatch._id; // compatibility
  student.crtBatchName = placementBatch.batchNumber;
  await student.save();
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
    console.error('Session validation error:', error);
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
    console.log('Login attempt:', { email, userType });

    if (!userType || !isValidUserType(userType)) {
      console.log('Invalid userType:', userType);
      return badRequest(res, 'Invalid userType');
    }

    const Model = getModelByUserType(userType);
    const user = await Model.findOne({ email }).select('+password isActive status');
    if (!user) {
      console.log('User not found:', email);
      return unauthorized(res, 'Invalid credentials');
    }

    // Apply status check only for 'student'
    if (userType === 'student') {
      if (user.isActive === false || (user.status && !['pursuing', 'placed', 'completed'].includes(user.status))) {
        console.log('Student user inactive or suspended:', { isActive: user.isActive, status: user.status });
        return unauthorized(res, 'Your account is inactive or suspended. Please contact administrator.');
      }
    } else {
      // For other userTypes apply previous status check if needed or just check isActive
      if (user.isActive === false || (user.status && user.status !== 'active')) {
        console.log(`User inactive or suspended for userType ${userType}:`, { isActive: user.isActive, status: user.status });
        return unauthorized(res, 'Your account is inactive or suspended. Please contact administrator.');
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch:', email);
      return unauthorized(res, 'Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      userType,
    });

    console.log('Login successful:', email);

    return ok(res, {
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, userType },
    });
  } catch (error) {
    console.error('General Login Error:', error);
    return serverError(res, 'Login failed');
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
              { path: 'students', select: 'name rollNo email college branch techStack yearOfPassing' },
              { path: 'tpoId', select: 'name email' }
            ]
          });
        return ok(res, { success: true, data: { user: coordinator, message: 'Welcome to Coordinator Dashboard' } });
    }

    return ok(res, { success: true, data: dashboardData });

  } catch (error) {
    console.error('Dashboard Error:', error);
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
    console.error('Get Profile Error:', error);
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
    console.error('Change Password Error:', error);
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
    console.error('Forgot Password Error:', error);
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
    console.error('Reset Password Error:', error);
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
      return res.status(404).json({
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
    console.error('Check Password Change Error:', error);
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
    console.error('Update Profile Error:', error);
    return serverError(res, 'Failed to update profile');
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
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