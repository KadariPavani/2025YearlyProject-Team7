// backend/routes/adminRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const {
  initializeSuperAdmin,
  superAdminLogin,
  verifyOTP,
  resendOTP,
  addAdmin,
  editAdmin,
  deleteAdmin,
  getAllAdmins,
  addTrainer,
  addTPO,
  getAllTrainers,
  getAllTPOs,
  // editTrainer,
  toggleTrainerStatus,
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
  createCrtBatch,
  updateStudent,
  deleteStudent
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const TPO = require('../models/TPO');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { excelUploadMiddleware } = require('../middleware/fileUpload'); // Import the middleware
const router = express.Router();
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Notification = require('../models/Notification');
// Public routes
router.post('/initialize-super-admin', initializeSuperAdmin);
router.post('/super-admin-login', superAdminLogin);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/dashboard', auth, getAdminDashboard);
router.post('/logout', auth, logoutAdmin);
router.post('/change-password', auth, changePassword);
router.get('/profile', auth, getAdminProfile);

// User management routes
router.post('/add-trainer', auth, addTrainer);
router.post('/add-tpo', auth, addTPO);
router.get('/trainers', auth, getAllTrainers);
router.get('/tpos', auth, getAllTPOs);
router.post('/add-admin', auth, addAdmin);
router.get('/admins', auth, getAllAdmins);
router.put('/admins/:id', auth, editAdmin);
router.delete('/admins/:id', auth, deleteAdmin);

// Trainer action routes (edit, suspend/reactivate, delete)
// router.put('/trainers/:id', auth, editTrainer);
router.patch('/trainers/:id/toggle-status', auth, toggleTrainerStatus);
router.delete('/trainers/:id', auth, deleteTrainer);

// TPO action routes (edit, suspend/reactivate, delete)
// router.put('/tpos/:id', auth, editTPO);
router.patch('/tpos/:id/toggle-status', auth, toggleTPOStatus);
router.delete('/tpos/:id', auth, deleteTPO);


// router.post('/crt-batch', auth, createCrtBatch);
router.put('/students/:id', auth, updateStudent);
router.delete('/students/:id', auth, deleteStudent);





router.get('/batches', auth, async (req, res) => {
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
});

// @route   GET /api/admin/batches/:batchId/students
// @desc    Get students in a batch
// @access  Private/Admin
router.get('/batches/:batchId/students', auth, async (req, res) => {
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
});

// @route   PUT /api/admin/batches/:batchId
// @desc    Update a batch
// @access  Private/Admin
// Update Batch API
router.put('/batches/:batchId', auth, async (req, res) => {
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
});

router.delete('/batches/:batchId', auth, async (req, res) => {
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
});

// Admin endpoint: reassign pending approvals for a batch to its current TPO
router.post('/batches/:batchId/reassign-pending-approvals', auth, async (req, res) => {
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
});

// POST /api/admin/crt-batch - Create CRT batch with dynamic tech stacks
router.post('/crt-batch', auth, excelUploadMiddleware, async (req, res) => {
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
});

// GET batch with available tech stacks
router.get('/batches/:batchId', auth, async (req, res) => {
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
});


// GET /api/admin/batches/grouped

router.get('/batches/grouped', auth, async (req, res) => {
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
});

module.exports = router;