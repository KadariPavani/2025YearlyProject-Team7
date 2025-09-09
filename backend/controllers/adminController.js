const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');

// Initialize super admin if not exists
const initializeSuperAdmin = async () => {
  try {
    const superAdmin = await Admin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
    if (!superAdmin) {
      await Admin.create({
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: 'super_admin'
      });
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
    if (!admin || password !== admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

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
  logoutAdmin
};