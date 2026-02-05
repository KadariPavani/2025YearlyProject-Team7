const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const OTP = require('../models/OTP');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const bcrypt = require('bcryptjs');
const generateOTP = require('../utils/generateOTP');
const generatePassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateToken');
const XLSX = require('xlsx');
const { ok, created, badRequest, unauthorized, notFound, serverError, forbidden } = require('../utils/http');
const { createOtp, verifyOtp, consumeOtp } = require('../utils/otp');


// @desc     Super Admin Login
// @route    POST /api/admin/super-admin-login
// @access   Public
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    console.debug('Super admin login request for:', normalizedEmail);

    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password failedLoginAttempts lockUntil');
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

    // If SMTP is configured, send the OTP email. Otherwise, keep logging the OTP to server logs.
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        console.log('Attempting to send OTP email to:', email);
        await sendEmail({
          email,
          subject: 'Admin Login Verification - InfoVerse',
          message: `Your OTP for admin login is: <strong>${otp}</strong>. It will expire in 5 minutes.`
        });
        console.log('OTP email sent to:', email);
      } catch (emailErr) {
        console.error('Failed to send OTP email:', emailErr);
        // Surface error so frontend can know OTP wasn't emailed
        return serverError(res, 'Failed to send OTP email');
      }
    } else {
      console.warn('Email not configured; OTP logged to server only.');
    }

    return ok(res, { success: true, message: process.env.EMAIL_USER ? 'OTP sent successfully' : 'OTP created and logged on server (EMAIL not configured)'});
  } catch (error) {
    console.error('❌ Error in superAdminLogin:', error && (error.stack || error.message || error));
    return serverError(res, `Internal server error${process.env.NODE_ENV === 'development' ? ': ' + (error.message || '') : ''}`);
  }
};

// @desc     Verify OTP and Login
// @route    POST /api/admin/verify-otp
// @access   Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await verifyOtp(normalizedEmail, 'login', otp);
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
    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate email exists
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const otp = await createOtp(normalizedEmail, 'login');

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendEmail({
          email,
          subject: 'Your OTP Code - InfoVerse',
          message: `Your OTP code is: <strong>${otp}</strong>. It will expire in 5 minutes.`,
        });
        return ok(res, { success: true, message: 'OTP resent successfully' });
      } catch (emailErr) {
        console.error('Failed to send OTP email on resend:', emailErr);
        return serverError(res, 'Failed to send OTP email');
      }
    } else {
      console.warn('Email not configured; OTP resent but not emailed');
      return ok(res, { success: true, message: 'OTP created and logged on server (EMAIL not configured)' });
    }
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
    // Clear cookie token if present
    try {
      res.clearCookie('token', {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (e) {
      console.warn('Failed to clear token cookie on admin logout:', e && (e.message || e));
    }

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

// @desc     Initialize Super Admin (First-time setup only)
// @route    POST /api/admin/initialize-super-admin
// @access   Public (but checks if admin already exists)
const initializeSuperAdmin = async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await Admin.findOne();
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super admin already exists. Cannot initialize again.'
      });
    }

    // Verify environment variables are set
    if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: 'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in environment variables'
      });
    }

    // Create super admin
    const admin = await Admin.create({
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      name: 'Super Admin',
    });

    console.log('✅ Super admin initialized:', admin.email);

    return res.status(201).json({
      success: true,
      message: 'Super admin created successfully. You can now login.',
      admin: {
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('❌ Error initializing super admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize super admin'
    });
  }
};

// @desc    Get all batches
// @route   GET /api/admin/batches
// @access  Private/Admin
const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('tpoId', 'name email')
      .populate('students', 'name email branch')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @route   GET /api/admin/batches/:batchId/students
// @desc    Get students in a batch
// @access  Private/Admin
const getBatchStudents = async (req, res) => {
  try {
    console.log('Fetching students for batch:', req.params.batchId);

    // Populate tpoId so frontend receives assigned TPO details
    const batch = await Batch.findById(req.params.batchId).populate('tpoId', 'name email');
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    console.log('Found batch:', batch);
    console.log('Student IDs in batch:', batch.students);

    // Look for students where their batchId matches this batch's ID
    console.log('Finding students with batchId:', req.params.batchId);
    const students = await Student.find({ batchId: req.params.batchId })
      .select('-password -__v') // Exclude password and version fields
      .sort({ name: 1 });

    console.log('Found students:', students);

    console.log('Found students:', students);

    res.json({
      success: true,
      data: students,
      batchDetails: {
        batchNumber: batch.batchNumber,
        colleges: batch.colleges,
        tpoId: batch.tpoId || null,
        startDate: batch.startDate || null,
        endDate: batch.endDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching batch students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @route   PUT /api/admin/batches/:batchId
// @desc    Update a batch
// @access  Private/Admin
const updateBatch = async (req, res) => {
  try {
    const { batchNumber, colleges, tpoId, startDate, endDate } = req.body;

    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Validate colleges if provided
    if (colleges && !Array.isArray(colleges)) {
      return res.status(400).json({ success: false, message: 'Colleges must be an array' });
    }
    const normColleges = colleges ? colleges.map(c => c.trim().toUpperCase()) : batch.colleges;

    // Update batch fields
    // Capture original TPO (before mutation) so we can detect a true change after save
    const originalTpoId = batch.tpoId ? batch.tpoId.toString() : null;

    batch.batchNumber = batchNumber || batch.batchNumber;
    batch.colleges = normColleges;
    batch.tpoId = tpoId || batch.tpoId;
    batch.startDate = startDate ? new Date(startDate) : batch.startDate;
    batch.endDate = endDate ? new Date(endDate) : batch.endDate;

    const updatedBatch = await batch.save();

    // Cascade update: ensure PlacementTrainingBatch entries referencing this batch are updated with new tpoId
    try {
      // Find students in this regular batch
      const studentIds = (await Student.find({ batchId: updatedBatch._id }).select('_id')).map(s => s._id);

      // Update placement training batches that either have matching batchNumber OR contain any of these students
      const updateResult1 = await PlacementTrainingBatch.updateMany(
        { batchNumber: updatedBatch.batchNumber },
        { $set: { tpoId: updatedBatch.tpoId } }
      );

      const updateResult2 = await PlacementTrainingBatch.updateMany(
        { students: { $in: studentIds } },
        { $set: { tpoId: updatedBatch.tpoId } }
      );

      console.log('Cascaded TPO update to PlacementTrainingBatch:', { updateResult1, updateResult2 });

      // If TPO changed for this batch, make sure assignedBatches on TPO documents stay in sync
      const newTpoId = updatedBatch.tpoId ? updatedBatch.tpoId.toString() : null;

      if (originalTpoId !== newTpoId) {
        try {
          // Remove this regular batch id from any TPO assignedBatches arrays (old owners)
          await TPO.updateMany({ assignedBatches: updatedBatch._id }, { $pull: { assignedBatches: updatedBatch._id } });

          // Find all placement training batches affected (by batchNumber or students) and synchronize their TPO assignments
          const affectedPTBs = await PlacementTrainingBatch.find({
            $or: [
              { batchNumber: updatedBatch.batchNumber },
              { students: { $in: studentIds } }
            ]
          }).select('_id');

          const affectedPTBIds = affectedPTBs.map(b => b._id);

          if (affectedPTBIds.length > 0) {
            // Remove these placement batch ids from any TPO assignedBatches arrays where they currently exist
            await TPO.updateMany({ assignedBatches: { $in: affectedPTBIds } }, { $pull: { assignedBatches: { $in: affectedPTBIds } } });

            // Add the affected placement batch ids to the new TPO's assignedBatches
            if (newTpoId) {
              await TPO.findByIdAndUpdate(newTpoId, { $addToSet: { assignedBatches: { $each: [updatedBatch._id, ...affectedPTBIds] } } });
            }
          } else {
            // No placement batch affected, but still add the regular batch to the new TPO's assignedBatches
            if (newTpoId) {
              await TPO.findByIdAndUpdate(newTpoId, { $addToSet: { assignedBatches: updatedBatch._id } });
            }
          }

          // Also ensure old TPO does not retain this regular batch as assigned (defensive)
          if (originalTpoId) {
            await TPO.findByIdAndUpdate(originalTpoId, { $pull: { assignedBatches: updatedBatch._id } });
          }

          console.log('Synchronized TPO assignedBatches for moved batch and its placement batches');

          // --- Reassign any pending student approval requests to the new TPO (centralized helper) ---
          try {
            const reassignResult = await mongoose.model('Batch').reassignPendingApprovalsForBatch(updatedBatch._id, updatedBatch.tpoId);
            console.log('Reassign result:', { pendingCount: reassignResult.pendingCount });
          } catch (reassignErr) {
            console.error('Error reassigning pending approvals to new TPO (via Batch helper):', reassignErr);
          }
        } catch (syncErr) {
          console.error('Error synchronizing TPO assignedBatches after batch reassign:', syncErr);
        }
      }

    } catch (cascadeErr) {
      console.error('Error cascading TPO update to PlacementTrainingBatch:', cascadeErr);
      // non-fatal - continue
    }

    // Return populated batch with TPO info
    const populatedBatch = await Batch.findById(updatedBatch._id).populate('tpoId', 'name email');

    res.json({ success: true, data: populatedBatch });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ success: false, message: 'Server error updating batch' });
  }
};

// @route   DELETE /api/admin/batches/:batchId
// @desc    Delete a batch and all related data
// @access  Private/Admin
const deleteBatchAndRelated = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Step 1: Find all students in this batch
    const students = await Student.find({ batchId: batch._id });
    const studentIds = students.map(s => s._id);

    // Step 2: Delete all placement training batches related to these students
    const ptBatchesDeleted = await PlacementTrainingBatch.deleteMany({
      students: { $in: studentIds }
    });

    // Step 3: Delete all students in this batch
    const studentsDeleted = await Student.deleteMany({ batchId: batch._id });

    // Step 4: Finally delete the main batch
    await Batch.findByIdAndDelete(batch._id);

    res.json({
      success: true,
      message: 'Batch and all related data deleted successfully',
      deletedCount: {
        students: studentsDeleted.deletedCount,
        placementBatches: ptBatchesDeleted.deletedCount,
        batchId: batch._id
      }
    });

  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting batch',
      error: error.message
    });
  }
};

// @route   POST /api/admin/batches/:batchId/reassign-pending-approvals
// @desc    Reassign pending approvals for a batch to its current TPO
// @access  Private/Admin
const reassignPendingApprovals = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Call centralized Batch helper
    const result = await mongoose.model('Batch').reassignPendingApprovalsForBatch(batch._id, batch.tpoId);

    res.json({
      success: true,
      message: 'Reassignment completed',
      data: result
    });
  } catch (err) {
    console.error('Error in reassign-pending-approvals:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/admin/crt-batch
// @desc    Create CRT batch with dynamic tech stacks
// @access  Private/Admin
const createCrtBatch = async (req, res) => {
  try {
    console.log('Batch Creation: Request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Student Excel file is required',
        details: 'No file uploaded'
      });
    }

    let { batchNumber, colleges, tpoId, startDate, endDate, allowedTechStacks } = req.body;

    // Parse colleges if string
    if (typeof colleges === 'string') {
      try {
        colleges = JSON.parse(colleges);
      } catch (err) {
        console.error('Invalid colleges format', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid colleges format'
        });
      }
    }

    // NEW: Parse allowedTechStacks if string
    if (typeof allowedTechStacks === 'string') {
      try {
        allowedTechStacks = JSON.parse(allowedTechStacks);
      } catch (err) {
        console.error('Invalid tech stacks format', err);
        return res.status(400).json({
          success: false,
          message: 'Invalid tech stacks format'
        });
      }
    }

    if (!Array.isArray(colleges)) {
      return res.status(400).json({
        success: false,
        message: 'Colleges must be an array'
      });
    }

    // NEW: Validate allowedTechStacks
    if (!allowedTechStacks || !Array.isArray(allowedTechStacks)) {
      return res.status(400).json({
        success: false,
        message: 'Allowed tech stacks must be provided as an array'
      });
    }

    if (allowedTechStacks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one tech stack must be specified'
      });
    }

    // Sanitize tech stacks
    allowedTechStacks = allowedTechStacks.map(ts => ts.trim()).filter(ts => ts.length > 0);

    colleges = colleges.map(c => c.trim().toUpperCase());

    // Validate required fields
    if (!batchNumber || !colleges.length || !tpoId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: Batch number, colleges, TPO, startDate, endDate, and tech stacks are required',
        details: {
          batchNumber: !!batchNumber,
          colleges: colleges.length > 0,
          tpoId: !!tpoId,
          startDate: !!startDate,
          endDate: !!endDate,
          allowedTechStacks: allowedTechStacks.length > 0
        }
      });
    }

    // Verify TPO exists
    const tpo = await TPO.findById(tpoId);
    if (!tpo) {
      return res.status(404).json({
        success: false,
        message: 'TPO not found'
      });
    }

    // Validate file
    const file = req.files.file;
    if (!file.name.match(/\.(xls|xlsx)$/)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file (.xls or .xlsx)'
      });
    }

    console.log('Batch Creation: Excel file received:', file.name);

    // Read Excel file
    const workbook = XLSX.readFile(file.tempFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty'
      });
    }

    const validBranches = ['AID', 'CSM', 'CAI', 'CSD', 'CSC'];

    // Validate student data rows
    for (let [index, row] of data.entries()) {
      const name = row.name?.trim();
      const email = row.email?.trim();
      const rollNumber = row['roll number']?.trim();
      const branch = row.branch?.trim();
      const college = row.college?.trim();
      const phonenumber = row.phonenumber?.toString().trim();

      if (!name || !email || !rollNumber || !branch || !college || !phonenumber) {
        return res.status(400).json({
          success: false,
          message: `Missing fields in student row ${index + 1}. Required: name, email, roll number, branch, college, phonenumber`,
          details: `Row ${index + 1}: ${JSON.stringify(row)}`
        });
      }

      if (!validBranches.includes(branch)) {
        return res.status(400).json({
          success: false,
          message: `Invalid branch '${branch}' in student ${name}. Valid branches: ${validBranches.join(', ')}`
        });
      }

      if (!colleges.includes(college)) {
        return res.status(400).json({
          success: false,
          message: `College '${college}' not in batch colleges for student ${name}`
        });
      }
    }

    // Create Batch with allowedTechStacks
    const batch = await Batch.create({
      batchNumber,
      colleges,
      isCrt: true,
      tpoId,
      createdBy: req.admin._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allowedTechStacks: allowedTechStacks // NEW FIELD
    });

    console.log('Batch Creation: Batch created:', batch._id);
    console.log('Allowed Tech Stacks:', allowedTechStacks);

    // Hash passwords and prepare student data
    const studentsData = [];
    for (let row of data) {
      const hashedPassword = await bcrypt.hash(row['roll number'].trim(), 10);
      studentsData.push({
        name: row.name.trim(),
        email: row.email.trim(),
        username: row['roll number'].trim(),
        rollNo: row['roll number'].trim(),
        branch: row.branch.trim(),
        college: row.college.trim(),
        phonenumber: row.phonenumber.toString().trim(),
        password: hashedPassword,
        batchId: batch._id,
        yearOfPassing: batchNumber,
      });
    }

    let studentDocs;
    try {
      studentDocs = await Student.insertMany(studentsData, { ordered: true });
      console.log(`Batch Creation: Inserted ${studentDocs.length} students`);
    } catch (err) {
      console.error('Batch Creation: Error inserting students', err);
      await Batch.findByIdAndDelete(batch._id);
      return res.status(500).json({
        success: false,
        message: 'Error inserting students',
        error: err.message
      });
    }

    batch.students = studentDocs.map(student => student._id);
    await batch.save();

    console.log('Batch Creation: Batch updated with students');

    return res.status(201).json({
      success: true,
      message: 'CRT batch created successfully',
      data: {
        batch,
        studentsCount: studentDocs.length,
        allowedTechStacks: allowedTechStacks
      }
    });

  } catch (error) {
    console.error('Batch Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create CRT batch',
      details: error.stack
    });
  }
};

// @route   GET /api/admin/batches/:batchId
// @desc    Get batch with available tech stacks
// @access  Private/Admin
const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId)
      .populate('tpoId', 'name email')
      .populate('students', 'name email branch college');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...batch.toJSON(),
        availableCRTOptions: batch.getAvailableCRTOptions()
      }
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @route   GET /api/admin/batches/grouped
// @desc    Get batches grouped by year, college, and type
// @access  Private/Admin
const getBatchesGrouped = async (req, res) => {
  try {
    if (req.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Aggregation pipeline
    const result = await Batch.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'students',
          foreignField: '_id',
          as: 'studentsInfo'
        }
      },
      {
        $addFields: {
          yearOfStart: { $year: "$startDate" }
        }
      },
      {
        $group: {
          _id: {
            year: "$yearOfStart",
            college: { $arrayElemAt: ["$colleges", 0] }, // assuming one college per batch
            isCrt: "$isCrt"
          },
          totalBatches: { $sum: 1 },
          totalStudents: { $sum: { $size: "$students" } },
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          college: "$_id.college",
          isCrt: "$_id.isCrt",
          totalBatches: 1,
          totalStudents: 1
        }
      },
      {
        $sort: { year: -1, college: 1 }
      }
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error in batch grouping:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  initializeSuperAdmin,
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
  deleteStudent,
  getAllBatches,
  getBatchStudents,
  updateBatch,
  deleteBatchAndRelated,
  reassignPendingApprovals,
  createCrtBatch,
  getBatchById,
  getBatchesGrouped
};
