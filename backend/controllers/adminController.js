const Admin = require('../models/Admin');
const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const OTP = require('../models/OTP');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const bcrypt = require('bcryptjs');
const generateOTP = require('../utils/generateOTP');
const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');
const XLSX = require('xlsx');
const { ok, created, badRequest, unauthorized, notFound, serverError, forbidden } = require('../utils/http');
const { createOtp, verifyOtp, consumeOtp } = require('../utils/otp');


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
      await newSuperAdmin.save();
      console.log('Super admin created successfully');
    }
  } catch (error) {
    console.error('Super admin initialization failed:', error);
  }
};
initializeSuperAdmin();

// @desc     Super Admin Login
// @route    POST /api/admin/super-admin-login
// @access   Public
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password failedLoginAttempts lockUntil');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check lock
    if (admin.isAccountLocked && admin.isAccountLocked()) {
      return res.status(401).json({ success: false, message: `Account locked until ${new Date(admin.lockUntil).toISOString()}` });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      if (typeof admin.incrementFailedLogin === 'function') await admin.incrementFailedLogin();
      if (admin.isAccountLocked && admin.isAccountLocked()) {
        return res.status(401).json({ success: false, message: `Account locked due to multiple failed attempts. Try again at ${new Date(admin.lockUntil).toISOString()}` });
      }
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // successful password: reset attempts
    if (typeof admin.resetFailedLogin === 'function') await admin.resetFailedLogin();

    const otp = generateOTP();

    // ✅ Log OTP to terminal for testing/debugging
    console.log(`🔐 OTP for ${email}: ${otp}`);

    await OTP.create({
      email,
      otp,
      purpose: 'login'
    });

    // await sendEmail({
    //   email,
    //   subject: 'Admin Login Verification',
    //   message: `Your OTP for admin login is: ${otp}`
    // });

    return ok(res, { success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Error in superAdminLogin:', error);
    return serverError(res, 'Internal server error');
  }
};

// @desc     Verify OTP and Login
// @route    POST /api/admin/verify-otp
// @access   Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOtp(email, 'login', otp);
    if (!result.valid) {
      const map = {
        not_found_or_expired: 'OTP not found or expired',
        expired: 'OTP has expired',
        too_many_attempts: 'Too many failed attempts',
        invalid: 'Invalid OTP',
      };
      return badRequest(res, map[result.reason] || 'Invalid OTP');
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.isAccountLocked && admin.isAccountLocked()) {
      return res.status(401).json({ success: false, message: `Account locked until ${new Date(admin.lockUntil).toISOString()}` });
    }

    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: admin.role
    });

    await consumeOtp(result.otpDoc);

    admin.lastLogin = new Date();
    await admin.save();

    return ok(res, { success: true, token, admin: { id: admin._id, email: admin.email, role: admin.role, permissions: admin.permissions } });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    return serverError(res, 'Internal server error during OTP verification');
  }
};

// Resend OTP for login verification
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const otp = await createOtp(email, 'login');

    // Send OTP to email
    await sendEmail({
      email,
      subject: 'Your OTP Code - InfoVerse',
      message: `Your OTP code is: ${otp}`,
    });

    return ok(res, { success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return serverError(res, 'Server error');
  }
};

// Add new admin (POST /api/admin/add-admin)
const addAdmin = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!req.admin.permissions?.adminControls?.add) {
      return res.status(403).json({ success: false, message: "No permission to add admin" });
    }
    if (!email || !role) {
      return res.status(400).json({ success: false, message: "Email and role are required" });
    }
    if (await Admin.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Admin with this email already exists" });
    }

    // Generate strong random password
    const generatedPassword = generatePassword();

    const newAdmin = new Admin({
      email,
      password: generatedPassword,
      role,
      createdBy: req.admin.id
    });

    await newAdmin.save();

    // Send credentials email
    await sendEmail({
      email,
      subject: "Your Admin Account Credentials - InfoVerse",
      message: `
        <h2>Welcome to InfoVerse!</h2>
        <p>Your admin account has been created.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${generatedPassword}</p>
        <p>Please login and change your password immediately.</p>
      `
    });

    return created(res, { success: true, data: { id: newAdmin._id, email: newAdmin.email, role: newAdmin.role, permissions: newAdmin.permissions } });

  } catch (error) {
    console.error("Add admin error:", error);
    res.status(500).json({ success: false, message: "Failed to add admin" });
  }
};

// GET all admins (GET /api/admin/admins)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
    return ok(res, { success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
};

// Edit Admin
const editAdmin = async (req, res) => {
  try {
    // Must have permission
    if (!req.admin.permissions?.adminControls?.edit) {
      return res.status(403).json({ success: false, message: "No permission to edit admin" });
    }

    const { email, role, permissions, status } = req.body;
    const adminToUpdate = await Admin.findById(req.params.id);
    
    if (!adminToUpdate) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Update fields if provided
    if (email) adminToUpdate.email = email.trim().toLowerCase();
    if (role) adminToUpdate.role = role;
    if (permissions) adminToUpdate.permissions = permissions;
    if (status) adminToUpdate.status = status;

    await adminToUpdate.save();
    
    // Return updated admin without password
    const updatedAdmin = await Admin.findById(adminToUpdate._id).select('-password');
    res.json({ success: true, data: updatedAdmin });
  } catch (error) {
    console.error("Edit Admin Error:", error);
    res.status(500).json({ success: false, message: "Server error editing admin" });
  }
};

// Delete Admin  
const deleteAdmin = async (req, res) => {
  try {
    // Must have permission
    if (!req.admin.permissions?.adminControls?.delete) {
      return res.status(403).json({ success: false, message: "No permission to delete admin" });
    }

    // Prevent self-deletion
    if (req.admin._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: "Admins cannot delete themselves" });
    }

    const adminToDelete = await Admin.findById(req.params.id);
    if (!adminToDelete) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    res.status(500).json({ success: false, message: "Server error deleting admin" });
  }
};


// @desc     Add Trainer
// @route    POST /api/admin/add-trainer
// @access   Private (Admin with trainerControls.add)
const addTrainer = async (req, res) => {
  try {
    const { name, email, phone, employeeId, experience, subjectDealing, category, linkedIn } = req.body;

    // Check admin permissions
    if (!req.admin.permissions?.trainerControls?.add) {
      return forbidden(res, 'You do not have permission to add trainers');
    }

    // Check if trainer already exists
    const existingTrainer = await Trainer.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingTrainer) {
      return badRequest(res, 'Trainer with this email or employee ID already exists');
    }

    // Generate temporary password
    const tempPassword = generatePassword();

    // Create trainer
    const trainer = new Trainer({
      name,
      email,
      password: tempPassword,
      phone,
      employeeId,
      experience,
      subjectDealing,
      category,
      linkedIn,
      createdBy: req.admin.id
    });

    await trainer.save();

    // Send credentials via email
    await sendEmail({
      email,
      subject: 'Your Trainer Account Credentials - InfoVerse',
      message: `
        <h2>Welcome to InfoVerse!</h2>
        <p>Your trainer account has been created successfully.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/trainer-login</p>
        <br>
        <p>Best regards,<br>InfoVerse Team</p>
      `
    });

    return created(res, { success: true, message: 'Trainer added successfully and credentials sent via email', data: { id: trainer._id, name: trainer.name, email: trainer.email, employeeId: trainer.employeeId } });

  } catch (error) {
    console.error('Add Trainer Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc     Add TPO
// @route    POST /api/admin/add-tpo
// @access   Private (Admin with tpoControls.add)
const addTPO = async (req, res) => {
  try {
    const { name, email, phone, experience, linkedIn } = req.body;

    // Check admin permissions
    if (!req.admin.permissions?.tpoControls?.add) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add TPOs'
      });
    }

    // Check if TPO already exists
    const existingTPO = await TPO.findOne({ email });

    if (existingTPO) {
      return res.status(400).json({
        success: false,
        message: 'TPO with this email already exists'
      });
    }

    // Generate temporary password
    const tempPassword = generatePassword();

    // Create TPO
    const tpo = new TPO({
      name,
      email,
      password: tempPassword,
      phone,
      experience,
      linkedIn,
      createdBy: req.admin.id
    });

    await tpo.save();

    // Send credentials via email
    await sendEmail({
      email,
      subject: 'Your TPO Account Credentials - InfoVerse',
      message: `
        <h2>Welcome to InfoVerse!</h2>
        <p>Your TPO account has been created successfully.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p>Please login and change your password immediately.</p>
        <p>Login URL: ${process.env.FRONTEND_URL}/tpo-login</p>
        <br>
        <p>Best regards,<br>InfoVerse Team</p>
      `
    });

    return created(res, { success: true, message: 'TPO added successfully and credentials sent via email', data: { id: tpo._id, name: tpo.name, email: tpo.email } });

  } catch (error) {
    console.error('Add TPO Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Get All Trainers
// @route GET /api/admin/trainers
// @access Private
const getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find().select('-password').sort({ createdAt: -1 });
    return ok(res, { success: true, count: trainers.length, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get All TPOs
// @route GET /api/admin/tpos
// @access Private
const getAllTPOs = async (req, res) => {
  try {
    const tpos = await TPO.find().select('-password').sort({ createdAt: -1 });
    return ok(res, { success: true, count: tpos.length, data: tpos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Suspend/Activate Trainer
const toggleTrainerStatus = async (req, res) => {
  try {
    if (!req.admin.permissions?.trainerControls?.suspend) {
      return res.status(403).json({ success: false, message: "No permission to change trainer status" });
    }
    const { id } = req.params;
    const trainer = await Trainer.findById(id);
    if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });

    trainer.status = trainer.status === 'active' ? 'inactive' : 'active';
    await trainer.save();

    res.json({ success: true, message: `Trainer ${trainer.status === 'active' ? 'activated' : 'suspended'}`, data: { id: trainer._id, status: trainer.status } });
  } catch (error) {
    console.error("Toggle Trainer Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update trainer status" });
  }
};

// Delete Trainer
const deleteTrainer = async (req, res) => {
  try {
    if (!req.admin.permissions?.trainerControls?.delete) {
      return res.status(403).json({ success: false, message: "No permission to delete trainer" });
    }
    const { id } = req.params;
    const deleted = await Trainer.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Trainer not found" });

    res.json({ success: true, message: "Trainer deleted successfully" });
  } catch (error) {
    console.error("Delete Trainer Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete trainer" });
  }
};



// Suspend/Activate TPO
const toggleTPOStatus = async (req, res) => {
  try {
    if (!req.admin.permissions?.tpoControls?.suspend) {
      return res.status(403).json({ success: false, message: "No permission to change TPO status" });
    }
    const { id } = req.params;
    const tpo = await TPO.findById(id);
    if (!tpo) return res.status(404).json({ success: false, message: "TPO not found" });

    tpo.status = tpo.status === 'active' ? 'inactive' : 'active';
    await tpo.save();

    res.json({ success: true, message: `TPO ${tpo.status === 'active' ? 'activated' : 'suspended'}`, data: { id: tpo._id, status: tpo.status } });
  } catch (error) {
    console.error("Toggle TPO Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update TPO status" });
  }
};

// Delete TPO
const deleteTPO = async (req, res) => {
  try {
    if (!req.admin.permissions?.tpoControls?.delete) {
      return res.status(403).json({ success: false, message: "No permission to delete TPO" });
    }
    const { id } = req.params;
    const deleted = await TPO.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "TPO not found" });

    res.json({ success: true, message: "TPO deleted successfully" });
  } catch (error) {
    console.error("Delete TPO Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete TPO" });
  }
};

// @desc    Forgot Password (send OTP)
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return notFound(res, 'Admin not found');

    const otp = await createOtp(email, 'reset_password');

    await sendEmail({
      email,
      subject: 'Reset your admin password',
      message: `Your OTP to reset the admin password is: ${otp}. It expires in 5 minutes.`
    });

    return ok(res, { success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return serverError(res, 'Server error');
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/admin/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) return badRequest(res, 'Missing fields');

    const result = await verifyOtp(email, 'reset_password', otp);
    if (!result.valid) {
      const map = {
        not_found_or_expired: 'OTP not found or expired',
        expired: 'OTP has expired',
        too_many_attempts: 'Too many failed attempts',
        invalid: 'Invalid OTP',
      };
      return badRequest(res, map[result.reason] || 'Invalid OTP');
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) return notFound(res, 'Admin not found');

    admin.password = newPassword;
    await admin.save();

    await consumeOtp(result.otpDoc);

    return ok(res, { success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return serverError(res, 'Server error');
  }
};

// @desc    Get Admin Dashboard Data
// @route   GET /api/admin/dashboard
// @access  Private
// @desc Get Admin Dashboard Data (Analytics)
// @route GET /api/admin/dashboard
// @access Private
const getAdminDashboard = async (req, res) => {
  try {
    const totalTrainers = await Trainer.countDocuments();
    const totalTPOs = await TPO.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalTrainers,
        totalTPOs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Logout Admin
// @route   POST /api/admin/logout
// @access  Private
const logoutAdmin = async (req, res) => {
  try {
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

// @desc    Change Admin Password
// @route   POST /api/admin/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    admin.password = newPassword;
    await admin.save();

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

// @desc    Get Admin Profile
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



const updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const updates = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get the batch ID before deleting the student
    const batchId = student.batchId;

    // Delete the student
    await Student.findByIdAndDelete(studentId);

    // Remove student reference from batch
    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, {
        $pull: { students: studentId }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Get all students in this batch before deletion
    const students = await Student.find({ batchId: batch._id });
    const studentIds = students.map(s => s._id);

    // Delete the main batch (this will trigger the pre-remove middleware)
    await batch.remove();

    // Double-check cleanup - ensure all students are properly deactivated
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { 
        isActive: false,
        status: 'inactive',
        $unset: { 
          batchId: 1,
          placementTrainingBatchId: 1,
          crtBatchId: 1,
          crtBatchName: 1
        }
      }
    );

    res.json({
      success: true,
      message: 'Batch and all related data deleted successfully',
      data: {
        batchId: batch._id,
        deactivatedStudents: studentIds.length
      }
    });

  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete batch and related data'
    });
  }
};

module.exports = {
  superAdminLogin,
  verifyOTP,
  resendOTP,
  addAdmin,
  getAllAdmins,
  addTrainer,
  addTPO,
  getAllTrainers,
  getAllTPOs,
  // editTrainer,
  toggleTrainerStatus,
  editAdmin,
  deleteAdmin,
  deleteTrainer,
  // editTPO,
  toggleTPOStatus,
  deleteTPO,
  getAdminDashboard,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdminProfile,
  // createCrtBatch,
  updateStudent,
  deleteStudent
};
