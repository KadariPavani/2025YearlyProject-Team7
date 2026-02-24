const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Trainer = require('../models/Trainer');
const TPO = require('../models/TPO');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');
const generatePassword = require('../utils/generatePassword');
const Attendance = require('../models/Attendance');
const Calendar = require('../models/Calendar');
const ExcelJS = require('exceljs');
const sendEmail = require('../utils/sendEmail');
const notificationController = require("./notificationController");
const Notification = require("../models/Notification");
const { getAvailableTechStacks, getTechStackColor } = require('../utils/techStackUtils');
const mongoose = require('mongoose');

// Private helper
const isValidDate = (d) => d instanceof Date && !isNaN(d);

// GET TPO Profile
const getProfile = async (req, res) => {
  try {
    // Verify this is a TPO
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    // Return only the fields that exist in your schema
    const userProfile = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      experience: req.user.experience || 0,
      linkedIn: req.user.linkedIn || '',
      role: req.user.role,
      assignedTrainers: req.user.assignedTrainers || [],
      assignedBatches: req.user.assignedBatches || [],
      managedCompanies: req.user.managedCompanies || [],
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    };


    res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: { user: userProfile }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET TPO Batches
const getBatches = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const tpoId = req.user._id;
    const batches = await Batch.find({ tpoId })
      .populate('students', 'name email rollNo college branch')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Batches fetched successfully',
      data: batches
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches'
    });
  }
};

// GET Students by Batches
const getStudentsByBatch = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const tpoId = req.user._id;

    // Get all regular batches assigned to this TPO
    const batches = await Batch.find({ tpoId })
      .populate({
        path: 'students',
        select: 'name rollNo email phonenumber college branch yearOfPassing batchId crtInterested crtBatchName profileImageUrl resumeUrl resumeFileName gender dob currentLocation hometown bio academics techStack projects internships certifications placementDetails status createdAt lastLogin'
      })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Organize students by batch with enhanced information
    const batchesWithStudents = batches.map(batch => {
      const studentsWithBatchInfo = batch.students.map(student => ({
        ...student.toObject(),
        batchNumber: batch.batchNumber,
        batchStartDate: batch.startDate,
        batchEndDate: batch.endDate,
        batchStatus: batch.status,
        isCrt: batch.isCrt,
        crtStatus: student.crtInterested ? 'CRT' : 'Non-CRT'
      }));

      return {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        colleges: batch.colleges,
        isCrt: batch.isCrt,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        studentCount: batch.students.length,
        createdBy: batch.createdBy,
        createdAt: batch.createdAt,
        students: studentsWithBatchInfo
      };
    });

    // Calculate summary statistics
    const totalStudents = batches.reduce((acc, batch) => acc + batch.students.length, 0);
    const crtStudents = batches.reduce((acc, batch) =>
      acc + batch.students.filter(student => student.crtInterested).length, 0
    );
    const nonCrtStudents = totalStudents - crtStudents;

    const collegeDistribution = {};
    batches.forEach(batch => {
      batch.colleges.forEach(college => {
        collegeDistribution[college] = (collegeDistribution[college] || 0) + batch.students.length;
      });
    });

    const branchDistribution = {};
    batches.forEach(batch => {
      batch.students.forEach(student => {
        branchDistribution[student.branch] = (branchDistribution[student.branch] || 0) + 1;
      });
    });

    const stats = {
      totalBatches: batches.length,
      totalStudents,
      crtStudents,
      nonCrtStudents,
      collegeDistribution,
      branchDistribution,
      yearWiseDistribution: batches.reduce((acc, batch) => {
        batch.students.forEach(student => {
          acc[student.yearOfPassing] = (acc[student.yearOfPassing] || 0) + 1;
        });
        return acc;
      }, {})
    };

    res.json({
      success: true,
      message: 'Students by batch fetched successfully',
      data: {
        batches: batchesWithStudents,
        stats
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students by batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST Create student in batch
const createStudentInBatch = async (req, res) => {
  try {
    if (req.userType !== 'tpo') return res.status(200).json({ success: false, message: 'Access denied' });

    const tpoId = req.user._id.toString();
    const { batchId } = req.params;
    const { name, email, rollNo, branch, college, phonenumber } = req.body;

    if (!name || !email || !rollNo || !branch || !college || !phonenumber) {
      return res.status(200).json({ success: false, message: 'Missing required student fields' });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(200).json({ success: false, message: 'Batch not found' });

    if (String(batch.tpoId) !== tpoId) {
      return res.status(200).json({ success: false, message: 'You are not authorized to add student to this batch' });
    }

    // Ensure college belongs to batch
    if (!batch.colleges.includes(college)) {
      return res.status(200).json({ success: false, message: 'Student college does not belong to this batch' });
    }

    // Check unique constraints
    const existing = await Student.findOne({ $or: [{ email }, { rollNo }] });
    if (existing) return res.status(200).json({ success: false, message: 'Student with same email or roll number already exists' });

    const student = new Student({
      name,
      email,
      username: rollNo,
      rollNo,
      branch,
      college,
      phonenumber,
      password: rollNo, // plain text — pre-save hook will hash it once
      batchId: batch._id,
      yearOfPassing: batch.batchNumber
    });

    await student.save();

    // Attach to batch
    batch.students = batch.students || [];
    batch.students.push(student._id);
    await batch.save();

    // Send credentials email (non-blocking)
    try {
      await sendEmail({
        email,
        subject: 'Your student account created',
        message: `Your student account has been created.\nEmail: ${email}\nPassword: ${rollNo}\nPlease login and change your password.`
      });
    } catch (err) {
    }

    // Send welcome notification to the student
    await notificationController.notifyStudentAccountCreated({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      tpoName: req.user.name || 'TPO',
    });

    return res.status(201).json({ success: true, message: 'Student created', data: { id: student._id, name: student.name, email: student.email, rollNo: student.rollNo, batchId: student.batchId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while creating student', error: error.message });
  }
};

// PUT Update student
const updateStudent = async (req, res) => {
  try {
    if (req.userType !== 'tpo') return res.status(200).json({ success: false, message: 'Access denied' });

    const tpoId = req.user._id.toString();
    const studentId = req.params.id;
    const updates = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });

    // Check TPO permissions: allow if any of the following is true:
    // - The student's regular batch has tpoId === current TPO
    // - The student's placementTrainingBatch has tpoId === current TPO
    // - The TPO has this batch id in their assignedBatches

    // Load TPO document to inspect assignedBatches
    const tpo = await TPO.findById(tpoId);

    const tpoAssigned = (tpo.assignedBatches || []).map(b => b.toString());

    // Collect batch ids
    const studentBatchId = student.batchId ? (student.batchId.toString ? student.batchId.toString() : String(student.batchId)) : null;
    const placementBatchId = student.placementTrainingBatchId ? (student.placementTrainingBatchId.toString ? student.placementTrainingBatchId.toString() : String(student.placementTrainingBatchId)) : null;

    // Check regular batch's tpo
    let allowed = false;
    if (studentBatchId) {
      const batch = await Batch.findById(studentBatchId).select('tpoId');
      if (batch && batch.tpoId && batch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(studentBatchId)) allowed = true;
    }

    if (placementBatchId && !allowed) {
      const pBatch = await PlacementTrainingBatch.findById(placementBatchId).select('tpoId');
      if (pBatch && pBatch.tpoId && pBatch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(placementBatchId)) allowed = true;
    }

    if (!allowed) {
      return res.status(200).json({ success: false, message: 'Not allowed to edit this student (TPO does not manage their batch)' });
    }

    // If rollNo or email updated, check for uniqueness
    if (updates.rollNo && updates.rollNo !== student.rollNo) {
      const exists = await Student.findOne({ rollNo: updates.rollNo, _id: { $ne: studentId } });
      if (exists) return res.status(200).json({ success: false, message: 'Roll number already exists' });
      student.username = updates.rollNo;
      // Reset password to new rollNo — pre-save hook will hash it
      student.password = updates.rollNo;
    }
    if (updates.email && updates.email !== student.email) {
      const exists = await Student.findOne({ email: updates.email, _id: { $ne: studentId } });
      if (exists) return res.status(200).json({ success: false, message: 'Email already exists' });
    }

    // Apply allowed updates
    const allowedFields = ['name','email','rollNo','branch','college','phonenumber','techStack','profileImageUrl','resumeUrl','resumeFileName','crtInterested'];
    allowedFields.forEach(field => {
      if (field in updates) student[field] = updates[field];
    });

    await student.save();

    return res.json({ success: true, message: 'Student updated', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while updating student', error: error.message });
  }
};

// PATCH Suspend student
const suspendStudent = async (req, res) => {
  try {
    if (req.userType !== 'tpo') return res.status(200).json({ success: false, message: 'Access denied' });

    const tpoId = req.user._id.toString();
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });

    // Load TPO document to inspect assignedBatches
    const tpo = await TPO.findById(tpoId);
    const tpoAssigned = (tpo.assignedBatches || []).map(b => b.toString());

    const studentBatchId = student.batchId ? (student.batchId.toString ? student.batchId.toString() : String(student.batchId)) : null;
    const placementBatchId = student.placementTrainingBatchId ? (student.placementTrainingBatchId.toString ? student.placementTrainingBatchId.toString() : String(student.placementTrainingBatchId)) : null;

    let allowed = false;
    if (studentBatchId) {
      const batch = await Batch.findById(studentBatchId).select('tpoId');
      if (batch && batch.tpoId && batch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(studentBatchId)) allowed = true;
    }

    if (placementBatchId && !allowed) {
      const pBatch = await PlacementTrainingBatch.findById(placementBatchId).select('tpoId');
      if (pBatch && pBatch.tpoId && pBatch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(placementBatchId)) allowed = true;
    }

    if (!allowed) {
      return res.status(200).json({ success: false, message: 'Not allowed to suspend this student' });
    }

    student.isActive = false;
    await student.save();

    try {
      const { notifyStudentStatusChange } = require('./notificationController');
      await notifyStudentStatusChange({
        studentId: student._id,
        studentName: student.name,
        isSuspended: true,
        tpoId: req.user._id,
        tpoName: req.user.name || 'TPO',
      });
    } catch (e) {
    }

    try {
      const { notifyCoordinatorStudentSuspended } = require('./notificationController');
      const batchId = student.placementTrainingBatchId || student.batchId;
      if (batchId) {
        await notifyCoordinatorStudentSuspended({
          studentName: student.name,
          isSuspended: true,
          batchId,
          tpoId: req.user._id,
          tpoName: req.user.name || 'TPO',
        });
      }
    } catch (e) {
    }

    res.json({ success: true, message: 'Student suspended', data: { id: student._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while suspending student', error: error.message });
  }
};

// PATCH Unsuspend student
const unsuspendStudent = async (req, res) => {
  try {
    if (req.userType !== 'tpo') return res.status(200).json({ success: false, message: 'Access denied' });

    const tpoId = req.user._id.toString();
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });

    // Load TPO document to inspect assignedBatches
    const tpo = await TPO.findById(tpoId);
    const tpoAssigned = (tpo.assignedBatches || []).map(b => b.toString());

    const studentBatchId = student.batchId ? (student.batchId.toString ? student.batchId.toString() : String(student.batchId)) : null;
    const placementBatchId = student.placementTrainingBatchId ? (student.placementTrainingBatchId.toString ? student.placementTrainingBatchId.toString() : String(student.placementTrainingBatchId)) : null;

    let allowed = false;
    if (studentBatchId) {
      const batch = await Batch.findById(studentBatchId).select('tpoId');
      if (batch && batch.tpoId && batch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(studentBatchId)) allowed = true;
    }

    if (placementBatchId && !allowed) {
      const pBatch = await PlacementTrainingBatch.findById(placementBatchId).select('tpoId');
      if (pBatch && pBatch.tpoId && pBatch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(placementBatchId)) allowed = true;
    }

    if (!allowed) {
      return res.status(200).json({ success: false, message: 'Not allowed to unsuspend this student' });
    }

    student.isActive = true;
    await student.save();

    try {
      const { notifyStudentStatusChange } = require('./notificationController');
      await notifyStudentStatusChange({
        studentId: student._id,
        studentName: student.name,
        isSuspended: false,
        tpoId: req.user._id,
        tpoName: req.user.name || 'TPO',
      });
    } catch (e) {
    }

    try {
      const { notifyCoordinatorStudentSuspended } = require('./notificationController');
      const batchId = student.placementTrainingBatchId || student.batchId;
      if (batchId) {
        await notifyCoordinatorStudentSuspended({
          studentName: student.name,
          isSuspended: false,
          batchId,
          tpoId: req.user._id,
          tpoName: req.user.name || 'TPO',
        });
      }
    } catch (e) {
    }

    res.json({ success: true, message: 'Student unsuspended', data: { id: student._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while unsuspending student', error: error.message });
  }
};

// DELETE student
const deleteStudent = async (req, res) => {
  try {
    if (req.userType !== 'tpo') return res.status(200).json({ success: false, message: 'Access denied' });

    const tpoId = req.user._id.toString();
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) return res.status(200).json({ success: false, message: 'Student not found' });

    // Load TPO document to inspect assignedBatches
    const tpo = await TPO.findById(tpoId);
    const tpoAssigned = (tpo.assignedBatches || []).map(b => b.toString());

    const studentBatchId = student.batchId ? (student.batchId.toString ? student.batchId.toString() : String(student.batchId)) : null;
    const placementBatchId = student.placementTrainingBatchId ? (student.placementTrainingBatchId.toString ? student.placementTrainingBatchId.toString() : String(student.placementTrainingBatchId)) : null;

    let allowed = false;
    if (studentBatchId) {
      const batch = await Batch.findById(studentBatchId).select('tpoId');
      if (batch && batch.tpoId && batch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(studentBatchId)) allowed = true;
    }

    if (placementBatchId && !allowed) {
      const pBatch = await PlacementTrainingBatch.findById(placementBatchId).select('tpoId');
      if (pBatch && pBatch.tpoId && pBatch.tpoId.toString() === tpoId) allowed = true;
      if (tpoAssigned.includes(placementBatchId)) allowed = true;
    }

    if (!allowed) {
      return res.status(200).json({ success: false, message: 'Not allowed to delete this student' });
    }

    // Remove from associated batches
    if (studentBatchId) {
      await Batch.updateOne({ _id: studentBatchId }, { $pull: { students: student._id } });
    }
    if (placementBatchId) {
      await PlacementTrainingBatch.updateOne({ _id: placementBatchId }, { $pull: { students: student._id } });
    }

    await Student.deleteOne({ _id: student._id });

    res.json({ success: true, message: 'Student deleted', data: { id: student._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while deleting student', error: error.message });
  }
};

// GET Suspended students
const getSuspendedStudents = async (req, res) => {
  try {
    if (req.userType !== 'tpo') return res.status(200).json({ success: false, message: 'Access denied' });

    const tpoId = req.user._id.toString();
    const tpo = await TPO.findById(tpoId);
    const tpoAssigned = (tpo.assignedBatches || []).map(id => id.toString());

    // Include regular batches owned by this TPO
    const ownedBatchIds = (await Batch.find({ tpoId }).select('_id')).map(b => b._id.toString());
    // Include placement training batches owned by this TPO
    const ownedPlacementIds = (await PlacementTrainingBatch.find({ tpoId }).select('_id')).map(b => b._id.toString());

    const batchIds = Array.from(new Set([...tpoAssigned, ...ownedBatchIds]));
    const placementIds = Array.from(new Set([...ownedPlacementIds, ...tpoAssigned])); // assigned may include placement ids too

    const students = await Student.find({
      isActive: false,
      $or: [
        { batchId: { $in: batchIds } },
        { placementTrainingBatchId: { $in: placementIds } }
      ]
    })
      .select('-password -__v')
      .populate({ path: 'placementTrainingBatchId', select: 'batchNumber name techStack college' })
      .sort({ name: 1 });

    // Add placementBatchName client-friendly field
    const payload = students.map(s => ({
      ...s.toObject(),
      placementBatchName: s.placementTrainingBatchId ? (s.placementTrainingBatchId.name || s.placementTrainingBatchId.batchNumber) : (s.crtBatchName || null)
    }));

    res.json({ success: true, message: 'Suspended students fetched', data: payload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching suspended students', error: error.message });
  }
};

// GET Placement Training Batches
const getPlacementTrainingBatches = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const tpoId = req.user._id;

    // Only return placement batches that actually contain students to avoid showing empty batches in the TPO UI
    const batches = await PlacementTrainingBatch.find({ tpoId, 'students.0': { $exists: true } })
      .populate('students', 'name rollNo email college branch techStack crtInterested yearOfPassing')
      .populate('tpoId', 'name email')
      .populate('createdBy', 'name email')
      .populate({
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience'
      })
      .populate({
        path: 'coordinators',
        select: 'name email phone rollNo student',
        populate: { path: 'student', select: 'name rollNo email phonenumber' }
      })
      .sort({ year: -1, college: 1, techStack: 1 });

    // Group batches by year -> college -> techStack
    const organized = {};
    let totalBatches = 0;
    let totalStudents = 0;

    batches.forEach(batch => {
      const year = batch.year;
      batch.colleges.forEach(college => {
        const techStack = batch.techStack;

        // Initialize nested structure
        if (!organized[year]) organized[year] = {};
        if (!organized[year][college]) organized[year][college] = {};
        if (!organized[year][college][techStack]) {
          organized[year][college][techStack] = {
            totalBatches: 0,
            totalStudents: 0,
            batches: []
          };
        }

        // Add batch to structure
        organized[year][college][techStack].batches.push({
          _id: batch._id,
          batchNumber: batch.batchNumber,
          colleges: batch.colleges,
          techStack: batch.techStack,
          year: batch.year,
          studentCount: batch.students.length,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          isActive: batch.isActive,
          createdAt: batch.createdAt,
          tpoId: batch.tpoId,
          students: batch.students,
          assignedTrainers: batch.assignedTrainers,
          coordinators: (batch.coordinators || []).map(coord => ({
            _id: coord._id,
            name: coord.name || (coord.student ? coord.student.name : null),
            rollNo: coord.rollNo || (coord.student ? coord.student.rollNo : null),
            email: coord.email || (coord.student ? coord.student.email : null),
            phone: coord.phone || (coord.student ? coord.student.phonenumber : null)
          }))
        });

        organized[year][college][techStack].totalBatches += 1;
        organized[year][college][techStack].totalStudents += batch.students.length;

        totalBatches += 1;
        totalStudents += batch.students.length;
      });
    });

    // Update stats calculation to be dynamic
    const techStackStats = await PlacementTrainingBatch.getStatsByTechStack();

    const stats = {
      totalBatches,
      totalStudents,
      totalYears: Object.keys(organized).length,
      totalColleges: [...new Set(batches.flatMap(b => b.colleges))].length,
      techStackDistribution: techStackStats.reduce((acc, stat) => ({
        ...acc,
        [stat.techStack]: stat.batchCount
      }), {})
    };

    res.json({
      success: true,
      message: 'Placement training batches fetched successfully',
      data: {
        organized,
        stats,
        totalBatches,
        totalStudents
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching placement training batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET Available Trainers
const getAvailableTrainers = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    // Get all trainers - you might want to add filters for availability
    const trainers = await Trainer.find({ role: 'trainer' })
      .select('name email subjectDealing category experience phone linkedIn')
      .sort({ name: 1 });

    res.json({
      success: true,
      message: 'Available trainers fetched successfully',
      data: trainers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available trainers'
    });
  }
};

// POST Assign Trainers to Batch
const assignTrainers = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const { batchId } = req.params;
    const { trainerAssignments } = req.body;
    const tpoId = req.user._id;

    // Validate the batch belongs to this TPO
    const batch = await PlacementTrainingBatch.findOne({ _id: batchId, tpoId });
    if (!batch) {
      return res.status(200).json({
        success: false,
        message: 'Batch not found or access denied'
      });
    }

    // Validate trainer assignments
    if (!trainerAssignments || !Array.isArray(trainerAssignments) || trainerAssignments.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Valid trainer assignments are required'
      });
    }

    // Validate each assignment
    for (const assignment of trainerAssignments) {
      if (!assignment.trainerId || !assignment.timeSlot || !assignment.subject) {
        return res.status(200).json({
          success: false,
          message: 'Each assignment must have trainerId, timeSlot, and subject'
        });
      }

      // Verify trainer exists
      const trainer = await Trainer.findById(assignment.trainerId);
      if (!trainer) {
        return res.status(200).json({
          success: false,
          message: `Trainer with ID ${assignment.trainerId} not found`
        });
      }

      // Validate schedule if provided
      if (assignment.schedule && Array.isArray(assignment.schedule)) {
        for (const scheduleSlot of assignment.schedule) {
          if (!scheduleSlot.day || !scheduleSlot.startTime || !scheduleSlot.endTime) {
            return res.status(200).json({
              success: false,
              message: 'Each schedule slot must have day, startTime, and endTime'
            });
          }
        }
      }
    }

    // Update the batch with trainer assignments
    const assignedTrainers = trainerAssignments.map(assignment => ({
      trainer: assignment.trainerId,
      timeSlot: assignment.timeSlot,
      subject: assignment.subject,
      schedule: assignment.schedule || [],
      assignedAt: new Date()
    }));

const isUpdate = batch.assignedTrainers?.length > 0;

// Save the updated batch assignments
batch.assignedTrainers = assignedTrainers;
await batch.save();

if (isUpdate) {
  await notificationController.notifyTrainerReschedule(batch._id, req.user.name || "TPO");
  await notificationController.notifyStudentReschedule(batch._id, req.user.name || "TPO");
} else {
  await notificationController.notifyTrainerAssignment(batch._id, req.user.name || "TPO");
}


    // Populate the response
    await batch.populate([
      {
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience'
      }
    ]);

for (const assignment of trainerAssignments) {
  // Support multiple structures
  const trainerId =
    assignment.trainerId ||
    (assignment.trainer && (assignment.trainer._id || assignment.trainer)) ||
    null;

  if (!trainerId) {
    continue;
  }

  try {
    await Notification.create({
      title: "New Class Assigned",
      message: `You have been assigned a new class or schedule for batch ${batch.batchNumber}. Please check your "My Classes" section for details.`,
      category: "My Classes",
      senderModel: "TPO",
      senderId: req.user._id,
      recipients: [
        { recipientId: trainerId, recipientModel: "Trainer", isRead: false },
      ],
      targetRoles: ["trainer"],
      targetBatches: [batch._id],
      status: "sent",
    });

  } catch (err) {
  }
}

// Single successful response (no duplicates)
return res.json({
  success: true,
  message: 'Trainers assigned successfully',
  data: {
    batchId: batch._id,
    batchNumber: batch.batchNumber,
    assignedTrainers: batch.assignedTrainers,
    updatedAt: new Date()
  }
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while assigning trainers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET Batch Trainer Assignments
const getBatchTrainerAssignments = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const { batchId } = req.params;
    const tpoId = req.user._id;

    const batch = await PlacementTrainingBatch.findOne({ _id: batchId, tpoId })
      .populate('students', 'name email rollNo college branch techStack')
      .populate({
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience phone'
      });

    if (!batch) {
      return res.status(200).json({
        success: false,
        message: 'Batch not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Batch trainer assignments fetched successfully',
      data: {
        batchInfo: {
          _id: batch._id,
          batchNumber: batch.batchNumber,
          colleges: batch.colleges,
          techStack: batch.techStack,
          year: batch.year,
          studentCount: batch.students.length,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          isActive: batch.isActive
        },
        assignedTrainers: batch.assignedTrainers || [],
        students: batch.students
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch trainer assignments'
    });
  }
};

// GET Schedule Timetable
const getScheduleTimetable = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const tpoId = req.user._id;

    // Fetch all placement training batches assigned to this TPO with detailed trainer assignments
    const batches = await PlacementTrainingBatch.find({ tpoId })
      .populate('tpoId', 'name email')
      .populate('students', 'name email rollNo college branch techStack')
      .populate('createdBy', 'name email')
      .populate({
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience'
      })
      .sort({ year: -1, createdAt: -1 });

    // Transform the data to include complete schedule information
    const scheduleData = batches.map(batch => {
      return {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        colleges: batch.colleges,
        techStack: batch.techStack,
        year: batch.year,
        studentCount: batch.students.length,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        isActive: batch.isActive,
        createdAt: batch.createdAt,
        tpoId: batch.tpoId,
        students: batch.students,
        assignedTrainers: batch.assignedTrainers.map(assignment => ({
          trainer: assignment.trainer,
          timeSlot: assignment.timeSlot,
          subject: assignment.subject,
          schedule: assignment.schedule || [],
          assignedAt: assignment.assignedAt
        }))
      };
    });


    // Calculate dynamic tech stack stats
    const techStacks = [...new Set(batches.map(b => b.techStack))];
    const techStackStats = {};
    techStacks.forEach(tech => {
      techStackStats[tech] = batches.filter(b => b.techStack === tech).length;
    });

    const stats = {
      totalBatches: batches.length,
      totalStudents: batches.reduce((acc, batch) => acc + batch.students.length, 0),
      assignedTrainers: [...new Set(batches.flatMap(batch =>
        batch.assignedTrainers?.map(t => t.trainer?._id.toString()) || []
      ))].length,
      batchesByTechStack: techStackStats,
      batchesByCollege: {
        KIET: batches.filter(b => b.colleges.includes('KIET')).length,
        KIEK: batches.filter(b => b.colleges.includes('KIEK')).length,
        KIEW: batches.filter(b => b.colleges.includes('KIEW')).length
      }
    };

    res.json({
      success: true,
      message: 'Schedule timetable fetched successfully',
      data: scheduleData,
      stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schedule timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET Batch Schedule
const getBatchSchedule = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const { batchId } = req.params;
    const tpoId = req.user._id;

    const batch = await PlacementTrainingBatch.findOne({ _id: batchId, tpoId })
      .populate('tpoId', 'name email')
      .populate('students', 'name email rollNo college branch techStack')
      .populate({
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience'
      });

    if (!batch) {
      return res.status(200).json({
        success: false,
        message: 'Batch not found or access denied'
      });
    }

    // Generate a weekly schedule view
    const weeklySchedule = {
      Monday: { morning: [], afternoon: [], evening: [] },
      Tuesday: { morning: [], afternoon: [], evening: [] },
      Wednesday: { morning: [], afternoon: [], evening: [] },
      Thursday: { morning: [], afternoon: [], evening: [] },
      Friday: { morning: [], afternoon: [], evening: [] },
      Saturday: { morning: [], afternoon: [], evening: [] },
      Sunday: { morning: [], afternoon: [], evening: [] }
    };

    batch.assignedTrainers.forEach(assignment => {
      if (assignment.schedule && assignment.schedule.length > 0) {
        assignment.schedule.forEach(scheduleItem => {
          const day = scheduleItem.day;
          const timeSlot = assignment.timeSlot;

          if (weeklySchedule[day] && weeklySchedule[day][timeSlot]) {
            weeklySchedule[day][timeSlot].push({
              trainer: assignment.trainer,
              subject: assignment.subject,
              startTime: scheduleItem.startTime,
              endTime: scheduleItem.endTime,
              assignedAt: assignment.assignedAt
            });
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        batch: {
          _id: batch._id,
          batchNumber: batch.batchNumber,
          colleges: batch.colleges,
          techStack: batch.techStack,
          year: batch.year,
          studentCount: batch.students.length,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          isActive: batch.isActive
        },
        weeklySchedule,
        assignedTrainers: batch.assignedTrainers,
        students: batch.students
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch schedule'
    });
  }
};

// GET Export Schedule
const exportSchedule = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const tpoId = req.user._id;
    const { format = 'json' } = req.query; // json, csv options

    const batches = await PlacementTrainingBatch.find({ tpoId })
      .populate('assignedTrainers.trainer', 'name email subjectDealing category experience')
      .sort({ year: -1, createdAt: -1 });

    // Flatten the data for export
    const exportData = [];

    batches.forEach(batch => {
      if (batch.assignedTrainers && batch.assignedTrainers.length > 0) {
        batch.assignedTrainers.forEach(assignment => {
          if (assignment.schedule && assignment.schedule.length > 0) {
            assignment.schedule.forEach(scheduleItem => {
              exportData.push({
                batchNumber: batch.batchNumber,
                batchId: batch._id,
                year: batch.year,
                colleges: batch.colleges.join(', '),
                techStack: batch.techStack,
                studentCount: batch.students.length,
                day: scheduleItem.day,
                timeSlot: assignment.timeSlot,
                startTime: scheduleItem.startTime,
                endTime: scheduleItem.endTime,
                trainerName: assignment.trainer?.name || 'Not Assigned',
                trainerEmail: assignment.trainer?.email || '',
                subject: assignment.subject,
                trainerCategory: assignment.trainer?.category || '',
                trainerExperience: assignment.trainer?.experience || 0,
                assignedAt: assignment.assignedAt,
                batchStatus: batch.status,
                batchStartDate: batch.startDate,
                batchEndDate: batch.endDate
              });
            });
          }
        });
      } else {
        // Include batches without assignments
        exportData.push({
          batchNumber: batch.batchNumber,
          batchId: batch._id,
          year: batch.year,
          colleges: batch.colleges.join(', '),
          techStack: batch.techStack,
          studentCount: batch.students.length,
          day: '',
          timeSlot: '',
          startTime: '',
          endTime: '',
          trainerName: 'Not Assigned',
          trainerEmail: '',
          subject: '',
          trainerCategory: '',
          trainerExperience: 0,
          assignedAt: null,
          batchStatus: batch.status,
          batchStartDate: batch.startDate,
          batchEndDate: batch.endDate
        });
      }
    });

    if (format === 'csv') {
      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="TPO_Schedule_${new Date().toISOString().split('T')[0]}.csv"`);

      // Create CSV content
      const csvHeaders = Object.keys(exportData[0] || {}).join(',');
      const csvRows = exportData.map(row =>
        Object.values(row).map(value =>
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );

      const csvContent = [csvHeaders, ...csvRows].join('\n');
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: exportData,
        summary: {
          totalRecords: exportData.length,
          totalBatches: batches.length,
          exportedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while exporting schedule'
    });
  }
};

// GET Pending Approvals
const getPendingApprovals = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied. TPO route only.' });
    }

    const tpoId = req.user.id;

    // Find all batches managed by this TPO (both Academic and Placement batches)
    const [academicBatches, placementBatches] = await Promise.all([
      Batch.find({ tpoId }),
      PlacementTrainingBatch.find({ tpoId })
    ]);

    const tpoBatchIds = [
      ...academicBatches.map(b => b._id),
      ...placementBatches.map(b => b._id)
    ];

    // Get the list of colleges this TPO is responsible for
    const managedColleges = [
      ...new Set([
        ...academicBatches.flatMap(b => b.colleges || []),
        ...placementBatches.flatMap(b => b.colleges || [])
      ])
    ];

    // Build query to find students belonging to this TPO's batches or colleges
    // Ensure we use a proper ObjectId instance when possible; fall back to raw id string if invalid
    let tpoObjectId = tpoId;
    if (mongoose.isValidObjectId(tpoId)) {
      try {
        tpoObjectId = new mongoose.Types.ObjectId(tpoId);
      } catch (err) {
        tpoObjectId = tpoId;
      }
    }

    const studentQuery = {
      'pendingApprovals': {
        $elemMatch: {
          status: 'pending',
          requestType: { $in: ['crt_status_change', 'batch_change'] },
          $or: [
            { assignedTo: tpoObjectId },
            { assignedTo: tpoId },
            { assignedTo: { $exists: false } },
            { assignedTo: null }
          ]
        }
      }
    };

    // Add territory-based filtering
    const territoryFilter = [
      { placementTrainingBatchId: { $in: tpoBatchIds } },
      { batchId: { $in: tpoBatchIds } }
    ];

    // If TPO manages certain colleges, also show students from those colleges who have no batch yet
    if (managedColleges.length > 0) {
      territoryFilter.push({
        $and: [
          { placementTrainingBatchId: { $in: [null, undefined] } },
          { college: { $in: managedColleges } }
        ]
      });
    }

    studentQuery.$or = territoryFilter;

    // Debug: log query computation for troubleshooting

    // Find only CRT-related pending approvals within this TPO's domain
    const studentsWithPendingApprovals = await Student.find(studentQuery)
      .select('name rollNo email college branch yearOfPassing crtInterested techStack pendingApprovals placementTrainingBatchId')
      .populate('placementTrainingBatchId', 'batchNumber techStack');

    // Filter and format approval requests
    const approvalRequests = [];

    studentsWithPendingApprovals.forEach(student => {
      const pendingApprovals = student.pendingApprovals.filter(
        approval => approval.status === 'pending' &&
                   ['crt_status_change', 'batch_change'].includes(approval.requestType)
      );

      pendingApprovals.forEach(approval => {
        approvalRequests.push({
          approvalId: approval._id,
          student: {
            id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            email: student.email,
            college: student.college,
            branch: student.branch,
            yearOfPassing: student.yearOfPassing,
            currentBatch: student.placementTrainingBatchId ? {
              batchNumber: student.placementTrainingBatchId.batchNumber,
              techStack: student.placementTrainingBatchId.techStack
            } : null
          },
          requestType: approval.requestType,
          requestedChanges: approval.requestedChanges,
          requestedAt: approval.requestedAt,
          status: approval.status,
          assignedTo: approval.assignedTo || null
        });
      });
    });

    res.json({
      success: true,
      message: 'CRT-related pending approvals fetched successfully',
      data: {
        totalPending: approvalRequests.length,
        requests: approvalRequests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending approvals'
    });
  }
};

// POST Approve Request
const approveRequest = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const { studentId, approvalId, action, rejectionReason } = req.body;
    const isApproved = action === 'approve';
    const tpoId = req.user.id;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(200).json({ success: false, message: 'Student not found' });
    }

    // Verify TPO permission for this student
    const tpo = await TPO.findById(tpoId);
    if (!tpo) {
      return res.status(200).json({ success: false, message: 'TPO not found' });
    }

    const canApprove = await tpo.canApproveRequest(student);
    if (!canApprove) {
      return res.status(200).json({
        success: false,
        message: 'You do not have permission to process requests for this student'
      });
    }

    // Handle approval
    const result = await student.handleApprovalResponse(
      approvalId,
      isApproved,
      req.user._id,
      rejectionReason
    );

    // Send detailed response with batch information
    res.json({
      success: true,
      message: isApproved ? 'Request approved successfully' : 'Request rejected',
      data: {
        student: {
          id: student._id,
          name: student.name,
          crtStatus: result.crtStatus
        },
        approval: result.approval,
        batch: result.crtStatus.batchId ? {
          id: result.crtStatus.batchId,
          name: result.crtStatus.batchName
        } : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing approval'
    });
  }
};

// POST Reject Request
const rejectRequest = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied. TPO route only.' });
    }

    const { studentId, approvalId, rejectionReason } = req.body;
    const tpoId = req.user.id;

    if (!studentId || !approvalId) {
      return res.status(200).json({
        success: false,
        message: 'Student ID and Approval ID are required'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(200).json({ success: false, message: 'Student not found' });
    }

    // Verify TPO permission for this student
    const tpo = await TPO.findById(tpoId);
    if (!tpo) {
      return res.status(200).json({ success: false, message: 'TPO not found' });
    }


    let canApprove = await tpo.canApproveRequest(student);

    // If TPO currently lacks permission, attempt to auto-assign the student's batch(s) to them (transient race fix)
    if (!canApprove) {
      try {
        const batchIdsToEnsure = [];
        if (student.placementTrainingBatchId) batchIdsToEnsure.push(student.placementTrainingBatchId);
        if (student.batchId) batchIdsToEnsure.push(student.batchId);

        for (const bid of batchIdsToEnsure) {
          try {
            await tpo.ensureBatchAssignment(bid);
          } catch (e) {
          }
        }

        // Re-evaluate permission
        canApprove = await tpo.canApproveRequest(student);
      } catch (err) {
      }
    }

    if (!canApprove) {
      return res.status(200).json({
        success: false,
        message: 'You do not have permission to process requests for this student'
      });
    }

    // Find the specific approval request
    const approval = student.pendingApprovals.id(approvalId);
    if (!approval) {
      return res.status(200).json({ success: false, message: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(200).json({
        success: false,
        message: `This request has already been ${approval.status}`
      });
    }

    // Update approval status
    approval.status = 'rejected';
    approval.reviewedBy = tpoId;
    approval.reviewedAt = new Date();
    approval.rejectionReason = rejectionReason || 'No reason provided';

    await student.save();

    // Notify student about rejection
    try {
      await Notification.create({
        title: 'Request Rejected',
        message: `Your approval request (${approval.requestType}) has been rejected by ${tpo.name || 'TPO'}. Reason: ${approval.rejectionReason}`,
        category: 'Placement',
        senderId: tpo._id,
        senderModel: 'TPO',
        recipients: [{ recipientId: student._id, recipientModel: 'Student', isRead: false }],
        relatedEntity: { entityId: student._id, entityModel: 'Student' },
        status: 'sent'
      });
    } catch (notifyErr) {
    }

    res.json({
      success: true,
      message: 'Approval request rejected successfully',
      data: {
        studentId: student._id,
        studentName: student.name,
        approvalId: approval._id,
        status: approval.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET Approval History
const getApprovalHistory = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied. TPO route only.' });
    }

    const tpoId = req.user.id;

    // Find all students with approvals reviewed by this TPO
    const studentsWithApprovals = await Student.find({
      'pendingApprovals.reviewedBy': tpoId
    })
      .select('name rollNo email college branch pendingApprovals')
      .populate('pendingApprovals.reviewedBy', 'name email');

    const approvalHistory = [];

    studentsWithApprovals.forEach(student => {
      const reviewedApprovals = student.pendingApprovals.filter(
        approval => approval.reviewedBy && approval.reviewedBy._id.toString() === tpoId.toString()
      );

      reviewedApprovals.forEach(approval => {
        approvalHistory.push({
          approvalId: approval._id,
          student: {
            id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            email: student.email,
            college: student.college,
            branch: student.branch
          },
          requestType: approval.requestType,
          requestedChanges: approval.requestedChanges,
          status: approval.status,
          requestedAt: approval.requestedAt,
          reviewedAt: approval.reviewedAt,
          rejectionReason: approval.rejectionReason
        });
      });
    });

    // Sort by review date (newest first)
    approvalHistory.sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));

    res.json({
      success: true,
      message: 'Approval history fetched successfully',
      data: {
        totalRecords: approvalHistory.length,
        approvedCount: approvalHistory.filter(a => a.status === 'approved').length,
        rejectedCount: approvalHistory.filter(a => a.status === 'rejected').length,
        history: approvalHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approval history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST Assign Coordinator
const assignCoordinator = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const { studentId, batchId } = req.body;

    if (!studentId || !batchId) {
      return res.status(200).json({
        success: false,
        message: 'Student ID and Batch ID are required'
      });
    }

    // Check batch exists and belongs to TPO
    const batch = await PlacementTrainingBatch.findOne({
      _id: batchId,
      tpoId: req.user._id
    });

    if (!batch) {
      return res.status(200).json({
        success: false,
        message: 'Batch not found or unauthorized'
      });
    }

    // Check student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(200).json({
        success: false,
        message: 'Student not found'
      });
    }

    // If there's already a coordinator for this batch, remove it (we keep a single coordinator per batch)
    const existingCoordinatorForBatch = await Coordinator.findOne({ assignedPlacementBatch: batchId });

    if (existingCoordinatorForBatch) {
      // If the same student is already a coordinator, do nothing
      if (existingCoordinatorForBatch.student && existingCoordinatorForBatch.student.toString() === student._id.toString()) {
        return res.status(200).json({ success: false, message: 'Student is already assigned as coordinator for this batch' });
      }

      // Remove old coordinator record and its reference from batch
      try {
        batch.coordinators = (batch.coordinators || []).filter(id => id.toString() !== existingCoordinatorForBatch._id.toString());
        await batch.save();
        await Coordinator.deleteOne({ _id: existingCoordinatorForBatch._id });
      } catch (err) {
      }
    }

    // Generate coordinator email
    const coordinatorEmail = student.email.replace('@', '.coordinator@');

    // Use the standard password generator
    const password = generatePassword(12);

    // Create coordinator
    const coordinator = new Coordinator({
      name: student.name,
      email: coordinatorEmail,
      password: password,
      phone: student.phonenumber || student.phone,
      rollNo: student.rollNo,
      student: student._id,
      assignedPlacementBatch: batchId,
      createdBy: req.user._id
    });

    await coordinator.save();

    // Populate coordinator with batch details
    await coordinator.populate([{
      path: 'assignedPlacementBatch',
      select: 'batchNumber techStack startDate endDate year colleges assignedTrainers',
      populate: {
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience'
      }
    }]);

    // Update batch with coordinator reference
    batch.coordinators = batch.coordinators || [];
    batch.coordinators.push(coordinator._id);
    await batch.save();

    // Populate batch coordinators with student info for the response
    await batch.populate([{ path: 'coordinators', populate: { path: 'student', select: 'name rollNo email' } }]);


    // Send credentials email
    await sendEmail({
      email: student.email,
      subject: 'Student Coordinator Access - InfoVerse',
      message: `
        <h2>Welcome Student Coordinator!</h2>
        <p>You have been assigned as the student coordinator for batch ${batch.batchNumber}.</p>
        <p><strong>Login Credentials:</strong></p>
        <p>Email: ${coordinatorEmail}</p>
        <p>Password: ${password}</p>
        <p>Please change your password after first login.</p>
        <p>Note: Use these credentials specifically for coordinator access. Your student account remains unchanged.</p>
      `
    });

    try {
      const { notifyCoordinatorAssignment } = require('./notificationController');
      await notifyCoordinatorAssignment({
        coordinatorId: coordinator._id,
        coordinatorName: coordinator.name,
        batchNumber: batch.batchNumber,
        tpoId: req.user._id,
        tpoName: req.user.name || 'TPO',
      });
    } catch (e) {
    }

    res.json({
      success: true,
      message: 'Student coordinator assigned successfully',
      data: {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        coordinatorId: coordinator._id,
        coordinatorName: coordinator.name,
        coordinatorEmail: coordinatorEmail,
        assignedPlacementBatch: coordinator.assignedPlacementBatch
      }
    });

  } catch (error) {

    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(200).json({
        success: false,
        message: 'Student is already assigned as coordinator for another batch'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning coordinator',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// GET Attendance Overall Summary
const getAttendanceOverallSummary = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const tpoId = req.user._id;

    const batches = await PlacementTrainingBatch.find({ tpoId })
      .select('_id batchNumber techStack colleges students')
      .populate('students', 'name rollNo email college branch');

    const batchIds = batches.map(b => b._id);

    const attendanceRecords = await Attendance.find({ batchId: { $in: batchIds } })
      .populate('batchId', 'batchNumber techStack colleges students')
      .populate('trainerId', 'name email subjectDealing')
      .populate('studentAttendance.studentId', 'name rollNo email phonenumber college branch')
      .populate('markedBy.userId', 'name email')
      .sort({ sessionDate: -1 });

    const totalSessions = attendanceRecords.length;
    const totalStudentsMarked = attendanceRecords.reduce((sum, record) => sum + record.totalStudents, 0);
    const averageAttendance = totalSessions > 0
      ? Math.round(attendanceRecords.reduce((sum, record) => sum + record.attendancePercentance, 0) / totalSessions)
      : 0;

    const totalPresent = attendanceRecords.reduce((sum, record) => sum + record.presentCount, 0);
    const totalAbsent = attendanceRecords.reduce((sum, record) => sum + record.absentCount, 0);

    const batchSummary = {};
    attendanceRecords.forEach(record => {
      const batchId = record.batchId._id.toString();
      if (!batchSummary[batchId]) {
        batchSummary[batchId] = {
          _id: batchId,
          batchNumber: record.batchId.batchNumber,
          techStack: record.batchId.techStack,
          colleges: record.batchId.colleges,
          totalSessions: 0,
          totalStudents: record.batchId.students ? record.batchId.students.length : 0,
          averageAttendance: 0,
          totalPresent: 0,
          totalAbsent: 0,
          attendances: [],
          sessions: []
        };
      }

      batchSummary[batchId].totalSessions++;
      batchSummary[batchId].attendances.push(record.attendancePercentage);
      batchSummary[batchId].totalPresent += record.presentCount;
      batchSummary[batchId].totalAbsent += record.absentCount;

      batchSummary[batchId].sessions.push({
        _id: record._id,
        sessionDate: record.sessionDate,
        timeSlot: record.timeSlot,
        subject: record.subject,
        trainer: record.trainerId ? { name: record.trainerId.name, email: record.trainerId.email } : null,
        attendancePercentage: record.attendancePercentage,
        presentCount: record.presentCount,
        absentCount: record.absentCount
      });
    });

    Object.keys(batchSummary).forEach(batchId => {
      const batch = batchSummary[batchId];
      batch.averageAttendance = Math.round(batch.attendances.reduce((a, b) => a + b, 0) / batch.attendances.length);
      delete batch.attendances;
    });

    const studentAttendanceMap = {};
    attendanceRecords.forEach(record => {
      record.studentAttendance.forEach(sa => {
        const studentId = sa.studentId._id.toString();
        if (!studentAttendanceMap[studentId]) {
          studentAttendanceMap[studentId] = { student: sa.studentId, totalSessions: 0, present: 0, absent: 0, late: 0, percentage: 0 };
        }
        studentAttendanceMap[studentId].totalSessions++;
        if (sa.status === 'present' || sa.status === 'late') studentAttendanceMap[studentId].present++;
        if (sa.status === 'absent') studentAttendanceMap[studentId].absent++;
        if (sa.status === 'late') studentAttendanceMap[studentId].late++;
      });
    });

    const lowAttendanceStudents = [];
    Object.keys(studentAttendanceMap).forEach(studentId => {
      const data = studentAttendanceMap[studentId];
      data.percentage = Math.round((data.present / data.totalSessions) * 100);
      if (data.percentage < 75) {
        lowAttendanceStudents.push({
          student: { _id: data.student._id, name: data.student.name, rollNo: data.student.rollNo, email: data.student.email, college: data.student.college, branch: data.student.branch },
          totalSessions: data.totalSessions, present: data.present, absent: data.absent, late: data.late, percentage: data.percentage
        });
      }
    });

    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    res.json({
      success: true,
      data: {
        overallStats: {
          totalSessions, totalStudentsMarked, totalPresent, totalAbsent, averageAttendance,
          totalBatches: Object.keys(batchSummary).length,
          lowAttendanceCount: lowAttendanceStudents.length
        },
        batchWiseStats: Object.values(batchSummary),
        lowAttendanceStudents: lowAttendanceStudents.slice(0, 20),
        recentSessions: attendanceRecords.slice(0, 10).map(record => ({
          _id: record._id, sessionDate: record.sessionDate, timeSlot: record.timeSlot,
          startTime: record.startTime, endTime: record.endTime, subject: record.subject,
          batch: { _id: record.batchId._id, batchNumber: record.batchId.batchNumber, techStack: record.batchId.techStack },
          trainer: record.trainerId ? { name: record.trainerId.name, email: record.trainerId.email } : null,
          attendancePercentage: record.attendancePercentage, presentCount: record.presentCount,
          absentCount: record.absentCount, totalStudents: record.totalStudents,
          markedBy: record.markedBy ? { name: record.markedBy.name, userType: record.markedBy.userType } : null
        }))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// GET Attendance by Batch
const getAttendanceBatch = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const { batchId } = req.params;
    const { startDate, endDate } = req.query;

    const batch = await PlacementTrainingBatch.findOne({ _id: batchId, tpoId: req.user._id });
    if (!batch) {
      return res.status(200).json({ success: false, message: 'Batch not found or access denied' });
    }

    const dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isValidDate(start) && isValidDate(end)) {
        dateFilter.sessionDate = { $gte: start, $lte: end };
      }
    }

    const attendanceRecords = await Attendance.find({ batchId: batchId, ...dateFilter })
      .populate('trainerId', 'name email subjectDealing')
      .populate('batchId', 'batchNumber techStack colleges')
      .sort({ sessionDate: -1 });

    res.json({
      success: true,
      data: {
        batch: { _id: batch._id, batchNumber: batch.batchNumber, techStack: batch.techStack, colleges: batch.colleges },
        attendance: attendanceRecords,
        statistics: {
          totalSessions: attendanceRecords.length,
          averageAttendance: attendanceRecords.length > 0
            ? Math.round(attendanceRecords.reduce((sum, r) => sum + r.attendancePercentage, 0) / attendanceRecords.length)
            : 0
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET Attendance by Date Range
const getAttendanceDateRange = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const { startDate, endDate } = req.query;
    const tpoId = req.user._id;

    if (!startDate || !endDate) {
      return res.status(200).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isValidDate(start) || !isValidDate(end)) {
      return res.status(200).json({ success: false, message: 'Invalid date format' });
    }

    const batches = await PlacementTrainingBatch.find({ tpoId }).select('_id');
    const batchIds = batches.map(b => b._id);

    const attendanceRecords = await Attendance.find({
      batchId: { $in: batchIds },
      sessionDate: { $gte: start, $lte: end }
    })
      .populate('batchId', 'batchNumber techStack colleges')
      .populate('trainerId', 'name')
      .sort({ sessionDate: -1 });

    res.json({
      success: true,
      data: { attendance: attendanceRecords, count: attendanceRecords.length, dateRange: { startDate, endDate } }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET Complete Attendance Report
const getAttendanceCompleteReport = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const tpoId = req.user._id;
    const { startDate, endDate, batchId } = req.query;

    let batchQuery = { tpoId };
    if (batchId) { batchQuery._id = batchId; }

    const batches = await PlacementTrainingBatch.find(batchQuery)
      .populate({ path: 'students', select: 'name rollNo email phone college branch year section' })
      .populate('tpoId', 'name email')
      .populate({ path: 'assignedTrainers.trainer', select: 'name email phone subjectDealing' })
      .lean();

    if (!batches || batches.length === 0) {
      return res.json({
        success: true,
        data: { batches: [], attendanceData: [], summary: { totalBatches: 0, totalStudents: 0, totalSessions: 0, averageAttendance: 0 } }
      });
    }

    const batchIds = batches.map(b => b._id);

    let attendanceQuery = { batchId: { $in: batchIds } };
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isValidDate(start) && isValidDate(end)) {
        attendanceQuery.sessionDate = { $gte: start, $lte: end };
      }
    }

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate({ path: 'batchId', select: 'batchNumber techStack colleges year' })
      .populate({ path: 'trainerId', select: 'name email phone subjectDealing' })
      .populate({ path: 'studentAttendance.studentId', select: 'name rollNo email phone college branch year section' })
      .populate({ path: 'markedBy.userId', select: 'name email' })
      .sort({ sessionDate: -1, timeSlot: 1 })
      .lean();

    const studentWiseReport = {};
    const sessionWiseReport = [];

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    attendanceRecords.forEach(record => {
      const sessionData = {
        _id: record._id,
        date: record.sessionDate,
        day: new Date(record.sessionDate).toLocaleDateString('en-US', { weekday: 'long' }),
        timeSlot: record.timeSlot,
        startTime: record.startTime,
        endTime: record.endTime,
        subject: record.subject || 'N/A',
        batch: { _id: record.batchId._id, batchNumber: record.batchId.batchNumber, techStack: record.batchId.techStack, year: record.batchId.year },
        trainer: record.trainerId ? { name: record.trainerId.name, email: record.trainerId.email, phone: record.trainerId.phone, subject: record.trainerId.subjectDealing } : null,
        trainerStatus: record.trainerStatus,
        totalStudents: record.totalStudents,
        presentCount: record.presentCount,
        absentCount: record.absentCount,
        attendancePercentage: record.attendancePercentage,
        markedBy: record.markedBy ? { name: record.markedBy.name, userType: record.markedBy.userType } : null,
        students: []
      };

      record.studentAttendance.forEach(sa => {
        if (!sa.studentId) return;

        const student = sa.studentId;
        const studentId = student._id.toString();

        if (!studentWiseReport[studentId]) {
          studentWiseReport[studentId] = {
            student: { _id: student._id, name: student.name, rollNo: student.rollNo, email: student.email, phone: student.phone || 'N/A', college: student.college, branch: student.branch, year: student.year || 'N/A', section: student.section || 'N/A' },
            totalSessions: 0, present: 0, absent: 0, late: 0, percentage: 0, sessions: []
          };
        }

        studentWiseReport[studentId].totalSessions++;
        if (sa.status === 'present') { studentWiseReport[studentId].present++; totalPresent++; }
        else if (sa.status === 'absent') { studentWiseReport[studentId].absent++; totalAbsent++; }
        else if (sa.status === 'late') { studentWiseReport[studentId].late++; totalPresent++; }

        studentWiseReport[studentId].sessions.push({
          date: record.sessionDate, timeSlot: record.timeSlot, subject: record.subject || 'N/A',
          status: sa.status, remarks: sa.remarks || '', trainer: record.trainerId ? record.trainerId.name : 'N/A'
        });

        sessionData.students.push({
          _id: student._id, name: student.name, rollNo: student.rollNo, email: student.email,
          phone: student.phone || 'N/A', college: student.college, branch: student.branch,
          status: sa.status, remarks: sa.remarks || ''
        });
      });

      sessionWiseReport.push(sessionData);
    });

    // Merge scheduled sessions
    const attendanceMap = {};
    attendanceRecords.forEach(rec => {
      const key = `${rec.batchId._id.toString()}_${new Date(rec.sessionDate).toISOString().split('T')[0]}_${rec.timeSlot}`;
      attendanceMap[key] = rec;
    });

    const now = new Date();
    const defaultStart = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
    const defaultEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const rangeStart = (startDate ? new Date(startDate) : defaultStart);
    const rangeEnd = (endDate ? new Date(endDate) : defaultEnd);

    const dayNameToIndex = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

    const getDatesForDayInRange = (dayName, start, end) => {
      const dates = [];
      const dayNum = dayNameToIndex[dayName];
      if (dayNum === undefined) return dates;
      const cur = new Date(start);
      const diff = (dayNum + 7 - cur.getDay()) % 7;
      cur.setDate(cur.getDate() + diff);
      while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
      return dates;
    };

    // Generate scheduled but unrecorded sessions — only within valid date bounds
    batches.forEach(batch => {
      const batchStart = batch.startDate ? new Date(batch.startDate) : null;
      const batchEnd = batch.endDate ? new Date(batch.endDate) : null;

      (batch.assignedTrainers || []).forEach(assignment => {
        const trainer = assignment.trainer || null;
        const timeSlot = assignment.timeSlot;
        const subject = assignment.subject || 'N/A';
        const assignedAt = assignment.assignedAt ? new Date(assignment.assignedAt) : null;

        // Effective start: latest of rangeStart, batchStart, assignedAt
        let effectiveStart = new Date(rangeStart);
        if (batchStart && batchStart > effectiveStart) effectiveStart = new Date(batchStart);
        if (assignedAt && assignedAt > effectiveStart) effectiveStart = new Date(assignedAt);

        // Effective end: earliest of rangeEnd, batchEnd
        let effectiveEnd = new Date(rangeEnd);
        if (batchEnd && batchEnd < effectiveEnd) effectiveEnd = new Date(batchEnd);

        if (effectiveStart > effectiveEnd) return;

        (assignment.schedule || []).forEach(sch => {
          const dates = getDatesForDayInRange(sch.day, effectiveStart, effectiveEnd);
          dates.forEach(dt => {
            const dateISO = dt.toISOString().split('T')[0];
            const key = `${batch._id.toString()}_${dateISO}_${timeSlot}`;
            if (!attendanceMap[key]) {
              const sessionData = {
                _id: `scheduled_${batch._id.toString()}_${dateISO}_${timeSlot}`,
                date: new Date(dateISO),
                day: dt.toLocaleDateString('en-US', { weekday: 'long' }),
                timeSlot: timeSlot, startTime: sch.startTime, endTime: sch.endTime, subject: subject,
                batch: { _id: batch._id, batchNumber: batch.batchNumber, techStack: batch.techStack, year: batch.year },
                trainer: trainer ? { name: trainer.name, email: trainer.email, phone: trainer.phone, subject: trainer.subjectDealing } : null,
                trainerStatus: 'not_marked',
                totalStudents: (batch.students || []).length,
                presentCount: 0, absentCount: 0, attendancePercentage: null,
                recorded: false, markedBy: null, students: []
              };
              sessionWiseReport.push(sessionData);
            }
          });
        });
      });
    });

    sessionWiseReport.sort((a, b) => {
      const ad = new Date(a.date);
      const bd = new Date(b.date);
      if (bd - ad !== 0) return bd - ad;
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });

    Object.values(studentWiseReport).forEach(student => {
      student.percentage = student.totalSessions > 0
        ? Math.round(((student.present + student.late) / student.totalSessions) * 100)
        : 0;
    });

    const studentArray = Object.values(studentWiseReport);
    const lowAttendanceStudents = studentArray.filter(s => s.percentage < 75).sort((a, b) => a.percentage - b.percentage);

    const batchStats = batches.map(batch => {
      const batchSessions = sessionWiseReport.filter(s => s.batch._id.toString() === batch._id.toString());
      const batchStudents = studentArray.filter(s => batch.students.some(bs => bs._id.toString() === s.student._id.toString()));
      const avgAttendance = batchStudents.length > 0
        ? Math.round(batchStudents.reduce((sum, s) => sum + s.percentage, 0) / batchStudents.length)
        : 0;

      return {
        _id: batch._id, batchNumber: batch.batchNumber, techStack: batch.techStack,
        colleges: batch.colleges, year: batch.year, totalStudents: batch.students.length,
        totalSessions: batchSessions.length, averageAttendance: avgAttendance,
        lowAttendanceCount: batchStudents.filter(s => s.percentage < 75).length
      };
    });

    const totalStudents = studentArray.length;
    const totalSessions = sessionWiseReport.length;
    const averageAttendance = totalStudents > 0
      ? Math.round(studentArray.reduce((sum, s) => sum + s.percentage, 0) / totalStudents)
      : 0;

    res.json({
      success: true,
      data: {
        summary: { totalBatches: batches.length, totalStudents, totalSessions, totalPresent, totalAbsent, totalLate, averageAttendance, lowAttendanceCount: lowAttendanceStudents.length },
        batchStats, studentWiseReport: studentArray, sessionWiseReport,
        lowAttendanceStudents: lowAttendanceStudents.slice(0, 50),
        dateRange: { start: startDate || 'All', end: endDate || 'All' }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// GET Download Attendance Excel
const downloadAttendanceExcel = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const tpoId = req.user._id;
    const { startDate, endDate, batchId } = req.query;

    let start = null;
    let end = null;

    if (startDate) {
      start = new Date(startDate);
      if (!isValidDate(start)) {
        return res.status(200).json({ success: false, message: 'Invalid startDate format' });
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (!isValidDate(end)) {
        return res.status(200).json({ success: false, message: 'Invalid endDate format' });
      }
    }

    let batchQuery = { tpoId };
    if (batchId) { batchQuery._id = batchId; }

    const batches = await PlacementTrainingBatch.find(batchQuery)
      .populate('students', 'name rollNo email phone college branch year section')
      .lean();

    if (!batches || batches.length === 0) {
      return res.status(200).json({ success: false, message: 'No batches found' });
    }

    const batchIds = batches.map(b => b._id);

    let attendanceQuery = { batchId: { $in: batchIds } };
    if (start && end) {
      attendanceQuery.sessionDate = { $gte: start, $lte: end };
    }

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('batchId', 'batchNumber techStack colleges')
      .populate('trainerId', 'name email subjectDealing')
      .populate('studentAttendance.studentId', 'name rollNo email phone college branch')
      .sort({ sessionDate: 1, timeSlot: 1 })
      .lean();

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(200).json({ success: false, message: 'No attendance records found for the given criteria' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TPO Attendance System';
    workbook.created = new Date();

    // SHEET 1: TRAINER ATTENDANCE
    const trainerSheet = workbook.addWorksheet('Trainer Attendance');

    trainerSheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Day', key: 'day', width: 10 },
      { header: 'Time Slot', key: 'timeSlot', width: 12 },
      { header: 'Start Time', key: 'startTime', width: 10 },
      { header: 'End Time', key: 'endTime', width: 10 },
      { header: 'Trainer Name', key: 'trainerName', width: 25 },
      { header: 'Subject', key: 'subject', width: 20 },
      { header: 'Batch', key: 'batch', width: 15 },
      { header: 'Trainer Status', key: 'trainerStatus', width: 15 },
      { header: 'Total Students', key: 'totalStudents', width: 15 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Absent', key: 'absent', width: 10 },
      { header: 'Attendance %', key: 'percentage', width: 12 }
    ];

    trainerSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    trainerSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    trainerSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    attendanceRecords.forEach(record => {
      const dateStr = new Date(record.sessionDate).toLocaleDateString('en-US');
      const dayStr = new Date(record.sessionDate).toLocaleDateString('en-US', { weekday: 'long' });

      const row = trainerSheet.addRow({
        date: dateStr, day: dayStr,
        timeSlot: record.timeSlot || 'N/A', startTime: record.startTime || '', endTime: record.endTime || '',
        trainerName: record.trainerId ? record.trainerId.name : 'N/A',
        subject: record.subject || 'N/A', batch: record.batchId.batchNumber,
        trainerStatus: record.trainerStatus || 'present',
        totalStudents: record.totalStudents, present: record.presentCount,
        absent: record.absentCount, percentage: record.attendancePercentage + '%'
      });

      const statusCell = row.getCell('trainerStatus');
      if (record.trainerStatus === 'present') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
      } else if (record.trainerStatus === 'absent') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
      }
    });

    // SHEETS 2+: BATCH-WISE ATTENDANCE
    batches.forEach(batch => {
      const batchRecords = attendanceRecords.filter(r => r.batchId._id.toString() === batch._id.toString());
      if (batchRecords.length === 0) return;

      const batchSheet = workbook.addWorksheet(`Batch ${batch.batchNumber}`);

      batchSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Day', key: 'day', width: 10 },
        { header: 'Time Slot', key: 'timeSlot', width: 12 },
        { header: 'Subject', key: 'subject', width: 20 },
        { header: 'Trainer', key: 'trainer', width: 20 },
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Roll Number', key: 'rollNo', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'College', key: 'college', width: 20 },
        { header: 'Branch', key: 'branch', width: 15 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Remarks', key: 'remarks', width: 25 }
      ];

      batchSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      batchSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      batchSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      batchRecords.forEach(record => {
        const dateStr = new Date(record.sessionDate).toLocaleDateString('en-US');
        const dayStr = new Date(record.sessionDate).toLocaleDateString('en-US', { weekday: 'long' });

        record.studentAttendance.forEach(sa => {
          if (!sa.studentId) return;

          const row = batchSheet.addRow({
            date: dateStr, day: dayStr, timeSlot: record.timeSlot || 'N/A',
            subject: record.subject || 'N/A',
            trainer: record.trainerId ? record.trainerId.name : 'N/A',
            studentName: sa.studentId.name, rollNo: sa.studentId.rollNo,
            email: sa.studentId.email, college: sa.studentId.college,
            branch: sa.studentId.branch, status: sa.status.toUpperCase(),
            remarks: sa.remarks || ''
          });

          const statusCell = row.getCell('status');
          if (sa.status === 'present') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
          } else if (sa.status === 'absent') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
          } else if (sa.status === 'late') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
          }
        });
      });
    });

    // LAST SHEET: SUMMARY
    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.columns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Roll Number', key: 'rollNo', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'College', key: 'college', width: 20 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Batch', key: 'batch', width: 15 },
      { header: 'Total Sessions', key: 'totalSessions', width: 15 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Absent', key: 'absent', width: 10 },
      { header: 'Late', key: 'late', width: 10 },
      { header: 'Attendance %', key: 'percentage', width: 15 }
    ];

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B35' } };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const studentMap = {};
    attendanceRecords.forEach(record => {
      record.studentAttendance.forEach(sa => {
        if (!sa.studentId) return;
        const sid = sa.studentId._id.toString();
        if (!studentMap[sid]) {
          studentMap[sid] = { student: sa.studentId, batch: record.batchId.batchNumber, total: 0, present: 0, absent: 0, late: 0 };
        }
        studentMap[sid].total++;
        if (sa.status === 'present') studentMap[sid].present++;
        else if (sa.status === 'absent') studentMap[sid].absent++;
        else if (sa.status === 'late') studentMap[sid].late++;
      });
    });

    Object.values(studentMap).forEach(data => {
      const percentage = data.total > 0 ? Math.round(((data.present + data.late) / data.total) * 100) : 0;

      const row = summarySheet.addRow({
        name: data.student.name, rollNo: data.student.rollNo, email: data.student.email,
        college: data.student.college, branch: data.student.branch, batch: data.batch,
        totalSessions: data.total, present: data.present, absent: data.absent, late: data.late,
        percentage: percentage + '%'
      });

      if (percentage < 75) {
        row.getCell('percentage').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
        row.getCell('percentage').font = { bold: true, color: { argb: 'FFFFFFFF' } };
      }
    });

    const dateStr = start && end
      ? `${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`
      : 'All_Dates';
    const filename = `Attendance_Report_${dateStr}_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating Excel file', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// GET Tech Stacks
const getTechStacks = async (req, res) => {
  try {
    if (!['tpo','coordinator','trainer'].includes(req.userType)) {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const techStacks = await getAvailableTechStacks();
    const stats = await PlacementTrainingBatch.getStatsByTechStack();

    res.json({
      success: true,
      data: {
        techStacks,
        stats,
        colors: techStacks.reduce((acc, tech) => ({
          ...acc,
          [tech]: getTechStackColor(tech)
        }), {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET Placed Students
const getPlacedStudents = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied. TPO route only.' });
    }

    const tpoId = req.user._id;

    const events = await Calendar.find({ 'selectedStudents.0': { $exists: true } })
    .populate({ path: 'selectedStudents.studentId', select: 'name rollNo email phonenumber branch yearOfPassing' })
    .populate({ path: 'selectedStudents.batchId', select: 'batchNumber colleges _id' })
    .lean();


    if (!events || events.length === 0) {
      return res.json({
        success: true,
        message: 'No placed students found',
        data: { groupedByCompany: {}, totalCompanies: 0, totalPlacedStudents: 0 }
      });
    }

    const groupedByCompany = {};
    let totalPlacedStudents = 0;

    events.forEach(event => {
      const companyName = event.companyDetails?.companyName || event.title || 'Unknown Company';

      if (!groupedByCompany[companyName]) {
        groupedByCompany[companyName] = {
          companyName,
          eventDate: event.startDate,
          eventEndDate: event.endDate,
          jobRole: event.eventType || 'Position Not Specified',
          students: [],
          totalSelected: 0
        };
      }

      if (event.selectedStudents && event.selectedStudents.length > 0) {
        event.selectedStudents.forEach(selectedStudent => {
          const student = {
            studentId: selectedStudent.studentId?._id || selectedStudent.studentId,
            name: selectedStudent.name || selectedStudent.studentId?.name,
            rollNumber: selectedStudent.rollNo || selectedStudent.studentId?.rollNo,
            email: selectedStudent.email || selectedStudent.studentId?.email,
            phone: selectedStudent.personalInfo?.phonenumber || selectedStudent.studentId?.phonenumber || 'N/A',
            branch: selectedStudent.branch || selectedStudent.studentId?.branch,
            batch: selectedStudent.personalInfo?.yearOfPassing || selectedStudent.studentId?.yearOfPassing || 'N/A',
            batchNumber: selectedStudent.batchNumber || selectedStudent.batchId?.batchNumber || 'N/A',
            colleges: selectedStudent.colleges?.length > 0 ? selectedStudent.colleges.join(', ') : (selectedStudent.batchId?.colleges?.length > 0 ? selectedStudent.batchId.colleges.join(', ') : 'N/A'),
            selectionDate: selectedStudent.selectedAt
          };

          groupedByCompany[companyName].students.push(student);
          groupedByCompany[companyName].totalSelected++;
          totalPlacedStudents++;
        });
      }
    });

    res.json({
      success: true,
      message: 'Placed students fetched successfully',
      data: {
        groupedByCompany,
        totalCompanies: Object.keys(groupedByCompany).length,
        totalPlacedStudents
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching placed students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET Download Placed Students Excel (All Companies)
const downloadPlacedStudentsExcel = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const tpoId = req.user._id;

    const events = await Calendar.find({ 'selectedStudents.0': { $exists: true } })
    .populate('selectedStudents.studentId', 'name rollNo email phonenumber branch yearOfPassing')
    .populate('selectedStudents.batchId', 'batchNumber colleges _id')
    .lean();


    const workbook = new ExcelJS.Workbook();

    const groupedByCompany = {};

    events.forEach(event => {
      const companyName = event.companyDetails?.companyName || event.title || 'Unknown';
      if (!groupedByCompany[companyName]) {
        groupedByCompany[companyName] = { event, students: [] };
      }
      if (event.selectedStudents) {
        groupedByCompany[companyName].students = event.selectedStudents;
      }
    });

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Company Name', key: 'company', width: 30 },
      { header: 'Total Selected', key: 'count', width: 15 },
      { header: 'Event Date', key: 'date', width: 15 },
      { header: 'Position', key: 'role', width: 20 }
    ];

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF208B3A' } };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    let summaryRowNum = 2;
    Object.entries(groupedByCompany).forEach(([companyName, data]) => {
      const row = summarySheet.getRow(summaryRowNum++);
      row.values = {
        company: companyName,
        count: data.students.length,
        date: new Date(data.event.startDate).toLocaleDateString(),
        role: data.event.eventType || 'N/A'
      };
    });

    // Add detailed sheets per company
    Object.entries(groupedByCompany).forEach(([companyName, data]) => {
      const sheetName = companyName.substring(0, 31);
      const sheet = workbook.addWorksheet(sheetName);

      sheet.columns = [
        { header: 'Student Name', key: 'name', width: 25 },
        { header: 'Roll Number', key: 'rollNo', width: 15 },
        { header: 'Branch', key: 'branch', width: 15 },
        { header: 'Batch', key: 'batch', width: 12 },
        { header: 'Batch Number', key: 'batchNumber', width: 18 },
        { header: 'College', key: 'colleges', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Selection Date', key: 'selectionDate', width: 15 }
      ];

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF208B3A' } };
      sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      let rowNum = 2;
      data.students.forEach(student => {
        const row = sheet.getRow(rowNum++);
        row.values = {
          name: student.name || student.studentId?.name,
          rollNo: student.rollNo || student.studentId?.rollNo,
          branch: student.branch || student.studentId?.branch,
          batch: student.personalInfo?.yearOfPassing || student.studentId?.yearOfPassing || 'N/A',
          batchNumber: student.batchNumber || student.batchId?.batchNumber || 'N/A',
          colleges: Array.isArray(student.colleges) ? student.colleges.join(', ') : (student.batchId?.colleges ? student.batchId.colleges.join(', ') : 'N/A'),
          email: student.email || student.studentId?.email,
          phone: student.personalInfo?.phonenumber || student.studentId?.phonenumber || 'N/A',
          selectionDate: student.selectedAt ? new Date(student.selectedAt).toLocaleDateString() : 'N/A'
        };
      });
    });

    const filename = `All_Companies_Placed_Students_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating Excel file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET Download Placed Students by Company
const downloadPlacedStudentsByCompany = async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(200).json({ success: false, message: 'Access denied' });
    }

    const tpoId = req.user._id;
    const companyName = (req.params.companyName || '').trim();

    const events = await Calendar.find({ 'selectedStudents.0': { $exists: true } })
    .populate('selectedStudents.studentId', 'name rollNo email phonenumber branch yearOfPassing')
    .populate('selectedStudents.batchId', 'batchNumber colleges _id')
    .lean();


    const workbook = new ExcelJS.Workbook();

    const event = events.find(e => {
      const name = (e.companyDetails?.companyName || e.title || '').trim();
      return name.toLowerCase() === (companyName || '').toLowerCase();
    });

    if (!event || !event.selectedStudents?.length) {
      return res.status(200).json({ success: false, message: 'No data found for this company' });
    }

    const sheet = workbook.addWorksheet(companyName.substring(0, 31));

    sheet.columns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Roll Number', key: 'rollNo', width: 15 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Batch', key: 'batch', width: 12 },
      { header: 'Batch Number', key: 'batchNumber', width: 18 },
      { header: 'College', key: 'colleges', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Selection Date', key: 'selectionDate', width: 15 }
    ];

    // Style header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF208B3A' } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add company info
    sheet.insertRow(1, null);
    sheet.insertRow(1, null);
    const companyCell = sheet.getCell('A1');
    companyCell.value = `Company: ${companyName}`;
    companyCell.font = { bold: true, size: 14 };
    sheet.getCell('B2').value = `Event Date: ${new Date(event.startDate).toLocaleDateString()}`;
    sheet.getCell('B3').value = `Position: ${event.eventType || 'N/A'}`;

    // Add student data
    let rowNum = 5;
    event.selectedStudents.forEach(student => {
      const row = sheet.getRow(rowNum++);
      row.values = {
        name: student.name || student.studentId?.name,
        rollNo: student.rollNo || student.studentId?.rollNo,
        branch: student.branch || student.studentId?.branch,
        batch: student.personalInfo?.yearOfPassing || student.studentId?.yearOfPassing || 'N/A',
        batchNumber: student.batchNumber || student.batchId?.batchNumber || 'N/A',
        colleges: Array.isArray(student.colleges) ? student.colleges.join(', ') : (student.batchId?.colleges ? student.batchId.colleges.join(', ') : 'N/A'),
        email: student.email || student.studentId?.email,
        phone: student.personalInfo?.phonenumber || student.studentId?.phonenumber || 'N/A',
        selectionDate: student.selectedAt ? new Date(student.selectedAt).toLocaleDateString() : 'N/A'
      };
    });

    const filename = `${companyName}_Placed_Students_${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating Excel file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProfile,
  getBatches,
  getStudentsByBatch,
  createStudentInBatch,
  updateStudent,
  suspendStudent,
  unsuspendStudent,
  deleteStudent,
  getSuspendedStudents,
  getPlacementTrainingBatches,
  getAvailableTrainers,
  assignTrainers,
  getBatchTrainerAssignments,
  getScheduleTimetable,
  getBatchSchedule,
  exportSchedule,
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  getApprovalHistory,
  assignCoordinator,
  getAttendanceOverallSummary,
  getAttendanceBatch,
  getAttendanceDateRange,
  getAttendanceCompleteReport,
  downloadAttendanceExcel,
  getTechStacks,
  getPlacedStudents,
  downloadPlacedStudentsExcel,
  downloadPlacedStudentsByCompany
};
