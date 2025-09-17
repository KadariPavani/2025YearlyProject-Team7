const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');

// Helper function to get model and type based on userType
const getModelAndType = (userType) => {
  switch (userType) {
    case 'tpo':
      return { Model: TPO, type: 'TPO' };
    case 'trainer':
      return { Model: Trainer, type: 'Trainer' };
    case 'student':
      return { Model: Student, type: 'Student' };
    case 'coordinator':
      return { Model: Coordinator, type: 'Coordinator' };
    default:
      throw new Error('Invalid user type');
  }
};

// @desc    General Login for TPO, Trainer, Student, Coordinator
// @route   POST /api/auth/login
// @access  Public
const generalLogin = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!userType || !['tpo', 'trainer', 'student', 'coordinator'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    const { Model } = getModelAndType(userType);

    // Find user
    const user = await Model.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
      userType
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType
      }
    });

  } catch (error) {
    console.error('General Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
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

    const { Model } = getModelAndType(userType);

    const user = await Model.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// @desc    Get User Profile
// @route   GET /api/auth/profile/:userType
// @access  Private
const getProfile = async (req, res) => {
  try {
    const { userType } = req.params;
    const userId = req.user.id;

    const { Model } = getModelAndType(userType);

    const user = await Model.findById(userId)
      .select('-password')
      .populate('createdBy', 'email role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// @desc    Change Password
// @route   POST /api/auth/change-password/:userType
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { userType } = req.params;
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const { Model } = getModelAndType(userType);

    // Find user
    const user = await Model.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// @desc    Forgot Password (send OTP)
// @route   POST /api/auth/forgot-password/:userType
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { userType } = req.params;
    const { email } = req.body;

    const { Model, type } = getModelAndType(userType);

    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`
      });
    }

    const otp = generateOTP();

    await OTP.create({ 
      email, 
      otp, 
      purpose: 'reset_password' 
    });

    await sendEmail({
      email,
      subject: `Reset your ${type} password`,
      message: `Your OTP to reset your ${type} password is: ${otp}. It expires in 5 minutes.`
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to email'
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password/:userType
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { userType } = req.params;
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const { Model, type } = getModelAndType(userType);

    const otpDoc = await OTP.findOne({ 
      email, 
      purpose: 'reset_password' 
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }

    if (Date.now() > otpDoc.expires.getTime()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (otpDoc.attempts >= 3) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts'
      });
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    const user = await Model.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`
      });
    }

    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpDoc._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// @desc    Check if user needs to change password
// @route   GET /api/auth/check-password-change/:userType
// @access  Private
const checkPasswordChange = async (req, res) => {
  try {
    const { userType } = req.params;
    const userId = req.user.id;

    const { Model } = getModelAndType(userType);

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
    const updateData = req.body;

    const { Model } = getModelAndType(userType);

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.createdBy;
    delete updateData.status;

    const user = await Model.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  generalLogin,
  getDashboard,
  getProfile,
  updateProfile,
  changePassword,
  checkPasswordChange,
  forgotPassword,
  resetPassword,
  logout
};