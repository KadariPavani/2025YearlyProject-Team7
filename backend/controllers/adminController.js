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

// @desc    Super Admin Login
// @route   POST /api/admin/super-admin-login
// @access  Public
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const otp = generateOTP();
    
    await OTP.create({
      email,
      otp,
      purpose: 'login'
    });

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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: admin.role
    });

    await OTP.deleteOne({ _id: otpDoc._id });

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

// Resend OTP for login verification
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP doc with the purpose 'login'
    await OTP.create({ email, otp, purpose: 'login' });

    // Send OTP to email
    await sendEmail({
      email,
      subject: 'Your OTP Code - InfoVerse',
      message: `Your OTP code is: ${otp}`,
    });

    res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add new admin (POST /api/admin/add-admin)
const addAdmin = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!req.admin.permissions?.canAddAdmin) {
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

    res.status(201).json({
      success: true,
      data: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    });

  } catch (error) {
    console.error("Add admin error:", error);
    res.status(500).json({ success: false, message: "Failed to add admin" });
  }
};


// GET all admins (GET /api/admin/admins)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
};


// @desc    Add Trainer
// @route   POST /api/admin/add-trainer
// @access  Private (Admin with canAddTrainer permission)
const addTrainer = async (req, res) => {
  try {
    const { name, email, phone, employeeId, experience, subjectDealing, category, linkedIn } = req.body;

    // Check admin permissions
    if (!req.admin.permissions.canAddTrainer) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add trainers'
      });
    }

    // Check if trainer already exists
    const existingTrainer = await Trainer.findOne({ 
      $or: [{ email }, { employeeId }] 
    });
    
    if (existingTrainer) {
      return res.status(400).json({
        success: false,
        message: 'Trainer with this email or employee ID already exists'
      });
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

    res.status(201).json({
      success: true,
      message: 'Trainer added successfully and credentials sent via email',
      data: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        employeeId: trainer.employeeId
      }
    });

  } catch (error) {
    console.error('Add Trainer Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add TPO
// @route   POST /api/admin/add-tpo
// @access  Private (Admin with canAddTPO permission)
const addTPO = async (req, res) => {
  try {
    const { name, email, phone, experience, linkedIn } = req.body;

    // Check admin permissions
    if (!req.admin.permissions.canAddTPO) {
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

    res.status(201).json({
      success: true,
      message: 'TPO added successfully and credentials sent via email',
      data: {
        id: tpo._id,
        name: tpo.name,
        email: tpo.email
      }
    });

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
    res.status(200).json({
      success: true,
      count: trainers.length,
      data: trainers
    });
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
    res.status(200).json({
      success: true,
      count: tpos.length,
      data: tpos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// const createCrtBatch = async (req, res) => {
//   try {
//     // First validate the request body and files
//     if (!req.body || !req.files) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing request data'
//       });
//     }

//     let { batchNumber, colleges, tpoId } = req.body;
    
//     console.log('Received request body:', req.body);
//     console.log('Initial colleges value:', colleges);
    
//     // Parse colleges if it's a string
//     if (typeof colleges === 'string') {
//       try {
//         colleges = JSON.parse(colleges);
//         console.log('Parsed colleges:', colleges);
//       } catch (err) {
//         console.error('Error parsing colleges:', err);
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid colleges format'
//         });
//       }
//     }

//     // Ensure colleges is an array
//     if (!Array.isArray(colleges)) {
//       console.error('Colleges is not an array:', colleges);
//       return res.status(400).json({
//         success: false,
//         message: 'Colleges must be an array'
//       });
//     }

//     // Normalize college values
//     colleges = colleges.map(c => c.trim().toUpperCase());

//     // Check if all required fields are present
//     if (!batchNumber || !colleges || !colleges.length || !tpoId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Batch number, colleges and TPO are required'
//       });
//     }

//     // Verify TPO exists
//     const tpo = await TPO.findById(tpoId);
//     if (!tpo) {
//       return res.status(404).json({
//         success: false,
//         message: 'TPO not found'
//       });
//     }

//     // Validate file presence and type
//     if (!req.files.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'Student Excel file is required'
//       });
//     }

//     const file = req.files.file;
//     if (!file.name.match(/\.(xls|xlsx)$/)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload an Excel file (.xls or .xlsx)'
//       });
//     }

//     // Read Excel file
//     const workbook = XLSX.read(file.data, { type: 'buffer' });
//     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = XLSX.utils.sheet_to_json(worksheet);

//     if (data.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Excel file is empty'
//       });
//     }

//     // Create new CRT batch
//     const batch = await Batch.create({
//       batchNumber,
//       colleges,
//       isCrt: true,
//       tpoId,
//       createdBy: req.admin._id
//     });

//     // Validate and create students
//     const validBranches = ['AID', 'CSM', 'CAI', 'CSD', 'CSC'];
//     console.log('Selected colleges for batch:', colleges);
//     console.log('Valid branches:', validBranches);
    
//     const studentPromises = data.map(async (row) => {
//       // Normalize the data from Excel
//       const studentData = {
//         name: row.name?.trim(),
//         email: row.email?.trim(),
//         rollNumber: row['roll number']?.trim(), // Excel column name has a space
//         branch: row.branch?.trim(),
//         college: row.college?.trim(),
//         phonenumber: row.phonenumber?.toString().trim() // Convert to string if it's a number
//       };
      
//       console.log('Processing student:', studentData);

//       // Validate required fields
//       if (!studentData.name || !studentData.email || !studentData.rollNumber || 
//           !studentData.branch || !studentData.college || !studentData.phonenumber) {
//         console.log('Invalid student data:', studentData);
//         throw new Error(`Missing required fields for student: ${JSON.stringify(row)}`);
//       }

//       // First validate branch
//       if (!validBranches.includes(studentData.branch)) {
//         throw new Error(`Invalid branch ${studentData.branch} for student ${studentData.name}. Valid branches are: ${validBranches.join(', ')}`);
//       }

//       // Then validate college
//       if (!colleges.includes(studentData.college)) {
//         throw new Error(`Student's college ${studentData.college} is not in the selected colleges (${colleges.join(', ')}) for this batch. Student: ${studentData.name}`);
//       }

//       // Create student with all required fields
//       return await Student.create({
//         name: studentData.name,
//         email: studentData.email,
//         username: studentData.rollNumber, // Use roll number as username
//         rollNo: studentData.rollNumber,   // Store roll number in rollNo field
//         branch: studentData.branch,
//         college: studentData.college,
//         phonenumber: studentData.phonenumber,
//         password: studentData.rollNumber, // Will be hashed by the pre-save hook
//         batchId: batch._id,              // Link to the batch using batchId
//         yearOfPassing: batchNumber       // Use batch number as year of passing
//       });
//     });

//     try {
//       // Wait for all students to be created
//       const students = await Promise.all(studentPromises);
      
//       // Update batch with student IDs
//       batch.students = students.map(student => student._id);
//       await batch.save();

//       res.status(201).json({
//         success: true,
//         message: 'CRT batch created successfully',
//         data: {
//           batch: batch,
//           studentsCount: students.length
//         }
//       });
//     } catch (error) {
//       // If student creation fails, delete the batch and throw error
//       await Batch.findByIdAndDelete(batch._id);
//       throw error;
//     }
//   } catch (error) {
//     console.error('Error creating CRT batch:', error);
//     res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to create CRT batch'
//     });
//   }
// };

// // @desc    Update student details
// // @route   PUT /api/admin/students/:id
// // @access  Private/Admin
// const updateStudent = async (req, res) => {
//   try {
//     const studentId = req.params.id;
//     const updates = req.body;

//     // Check if student exists
//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: 'Student not found'
//       });
//     }

//     // Update student fields
//     const updatedStudent = await Student.findByIdAndUpdate(
//       studentId,
//       { $set: updates },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Student updated successfully',
//       data: updatedStudent
//     });
//   } catch (error) {
//     console.error('Error updating student:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating student',
//       error: error.message
//     });
//   }
// };

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin

const createCrtBatch = async (req, res) => {
  try {
    console.log('Batch Creation: Request received');

    if (!req.body || !req.files) {
      console.error('Batch Creation: Missing request data');
      return res.status(400).json({ success: false, message: 'Missing request data' });
    }

    let { batchNumber, colleges, tpoId, startDate, endDate } = req.body;

    try {
      if (typeof colleges === 'string') {
        colleges = JSON.parse(colleges);
      }
    } catch (err) {
      console.error('Batch Creation: Invalid colleges format', err);
      return res.status(400).json({ success: false, message: 'Invalid colleges format' });
    }

    if (!Array.isArray(colleges)) {
      console.error('Batch Creation: Colleges must be an array');
      return res.status(400).json({ success: false, message: 'Colleges must be an array' });
    }

    colleges = colleges.map(c => c.trim().toUpperCase());

    if (!batchNumber || !colleges.length || !tpoId || !startDate || !endDate) {
      console.error('Batch Creation: Missing required batch fields');
      return res.status(400).json({ success: false, message: 'Batch number, colleges, TPO, startDate, and endDate are required' });
    }

    console.log('Batch Creation: Parsed batch fields:', { batchNumber, colleges, tpoId, startDate, endDate });

    const tpo = await TPO.findById(tpoId);
    if (!tpo) {
      console.error('Batch Creation: TPO not found:', tpoId);
      return res.status(404).json({ success: false, message: 'TPO not found' });
    }
    console.log('Batch Creation: Found TPO:', tpo._id);

    if (!req.files.file) {
      console.error('Batch Creation: No Excel file uploaded');
      return res.status(400).json({ success: false, message: 'Student Excel file is required' });
    }

    const file = req.files.file;
    if (!file.name.match(/\.(xls|xlsx)$/)) {
      console.error('Batch Creation: Invalid Excel file type:', file.name);
      return res.status(400).json({ success: false, message: 'Please upload an Excel file (.xls or .xlsx)' });
    }
    console.log('Batch Creation: Excel file received:', file.name);

    const XLSX = require('xlsx');
    console.log('Batch Creation: Reading Excel file');

    const workbook = XLSX.readFile(file.tempFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Batch Creation: Parsed ${data.length} rows from Excel`);

    if (data.length === 0) {
      console.error('Batch Creation: Excel file is empty');
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    const validBranches = ['AID', 'CSM', 'CAI', 'CSD', 'CSC'];

    // Validate student data row-wise
    for (const [index, row] of data.entries()) {
      const name = row.name?.trim();
      const email = row.email?.trim();
      const rollNumber = row['roll number']?.trim();
      const branch = row.branch?.trim();
      const college = row.college?.trim();
      const phonenumber = row.phonenumber?.toString().trim();

      if (!name || !email || !rollNumber || !branch || !college || !phonenumber) {
        console.error(`Batch Creation: Missing fields in row ${index + 1}:`, row);
        return res.status(400).json({ success: false, message: `Missing fields in student row ${index + 1}` });
      }
      if (!validBranches.includes(branch)) {
        console.error(`Batch Creation: Invalid branch in row ${index + 1}: ${branch}`);
        return res.status(400).json({ success: false, message: `Invalid branch ${branch} in student ${name}` });
      }
      if (!colleges.includes(college)) {
        console.error(`Batch Creation: College not in batch colleges in row ${index + 1}: ${college}`);
        return res.status(400).json({ success: false, message: `College ${college} not in batch colleges for student ${name}` });
      }
    }

    console.log('Batch Creation: Creating batch document');
    const batch = await Batch.create({
      batchNumber,
      colleges,
      isCrt: true,
      tpoId,
      createdBy: req.admin._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    console.log('Batch Creation: Batch created with ID:', batch._id);

    console.log('Batch Creation: Bulk inserting students');
    const studentDocs = await Student.insertMany(data.map(row => ({
      name: row.name.trim(),
      email: row.email.trim(),
      username: row['roll number'].trim(),
      rollNo: row['roll number'].trim(),
      branch: row.branch.trim(),
      college: row.college.trim(),
      phonenumber: row.phonenumber.toString().trim(),
      password: row['roll number'].trim(),
      batchId: batch._id,
      yearOfPassing: batchNumber,
    })));
    console.log('Batch Creation: Inserted students count:', studentDocs.length);

    batch.students = studentDocs.map(s => s._id);
    await batch.save();
    console.log('Batch Creation: Batch updated with students');

    res.status(201).json({ success: true, message: 'CRT batch created successfully', data: { batch, studentsCount: studentDocs.length } });

  } catch (error) {
    console.error('Batch Creation Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create CRT batch' });
  }
};





// Update Student details controller
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
  getAdminDashboard,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdminProfile,
  createCrtBatch,
  updateStudent,
  deleteStudent
};
