const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// Initialize super admin if not exists
const initializeSuperAdmin = async () => {
  try {
    const superAdmin = await Admin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    if (!superAdmin) {
      const newSuperAdmin = new Admin({
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: 'super_admin'
      });
      // Save will trigger the pre-save hook to hash the password
      await newSuperAdmin.save();
      console.log('Super admin created successfully');
    } else {
      console.log('Super admin already exists');
    }
  } catch (error) {
    console.error('Super admin initialization failed:', error);
  }
};

initializeSuperAdmin();

// @desc    Super Admin Login
// @route   POST /api/admin/super-admin-login
// @access  Public
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      console.log('Admin not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Admin found, checking password...');
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Password verified, generating OTP...');

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in database
    await OTP.create({
      email,
      otp,
      purpose: 'login'
    });

    // Send OTP via email
    await sendEmail({
      email,
      subject: 'Admin Login Verification',
      message: `Your OTP for admin login is: ${otp}`
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify OTP and Login
// @route   POST /api/admin/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the latest OTP for this email
    const otpDoc = await OTP.findOne({ 
      email,
      purpose: 'login'
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }

    // Check if OTP has expired
    if (Date.now() > otpDoc.expires.getTime()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Check attempts
    if (otpDoc.attempts >= 3) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts'
      });
    }

    // Verify OTP
    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Generate token
    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: admin.role
    });

    // Delete used OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification'
    });
  }
};

// @desc    Forgot Password (send OTP)
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const otp = generateOTP();

    await OTP.create({ email, otp, purpose: 'reset_password' });

    await sendEmail({
      email,
      subject: 'Reset your admin password',
      message: `Your OTP to reset the admin password is: ${otp}. It expires in 5 minutes.`
    });

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/admin/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const otpDoc = await OTP.findOne({ email, purpose: 'reset_password' }).sort({ createdAt: -1 });
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    if (Date.now() > otpDoc.expires.getTime()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (otpDoc.attempts >= 3) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: 'Too many failed attempts' });
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    admin.password = newPassword;
    await admin.save();

    await OTP.deleteOne({ _id: otpDoc._id });

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get Admin Dashboard Data
// @route   GET /api/admin/dashboard
// @access  Private (Super Admin only)
const getAdminDashboard = async (req, res) => {
  try {
    // In a real application, you would fetch actual data from database
    const dashboardData = {
      message: 'Hello Admin',
      totalUsers: 150,
      totalTPOs: 5,
      totalTrainers: 20,
      totalStudents: 100,
      totalCoordinators: 25,
      recentActivities: [
        { id: 1, action: 'New student registered', timestamp: new Date() },
        { id: 2, action: 'Trainer updated profile', timestamp: new Date() },
        { id: 3, action: 'TPO created new job posting', timestamp: new Date() }
      ],
      systemStats: {
        activeUsers: 45,
        pendingApprovals: 12,
        systemHealth: 'Good'
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

// @desc    Logout Admin
// @route   POST /api/admin/logout
// @access  Private
const logoutAdmin = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

module.exports = {
  superAdminLogin,
  verifyOTP,
  getAdminDashboard,
  logoutAdmin,
  forgotPassword,
  resetPassword
};