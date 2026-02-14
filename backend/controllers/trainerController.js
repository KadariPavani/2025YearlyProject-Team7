const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Attendance = require('../models/Attendance');

// @desc Register trainer
// @route POST /api/trainer/register
// @access Public
const registerTrainer = async (req, res) => {
  try {
    const {
      trainerName,
      email,
      phoneNumber,
      employeeId,
      yearsOfExperience,
      subjectDealing,
      category,
      linkedProfileUrl,
      professionalPicture,
      password
    } = req.body;

    const trainerExists = await Trainer.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (trainerExists) {
      return res.status(400).json({
        success: false,
        message: 'Trainer with this email or employee ID already exists'
      });
    }

    const trainer = await Trainer.create({
      name: trainerName,
      email,
      phone: phoneNumber,
      employeeId,
      experience: yearsOfExperience,
      subjectDealing,
      category,
      linkedIn: linkedProfileUrl,
      password
    });

    if (trainer) {
      res.status(201).json({
        success: true,
        message: 'Trainer registration successful!',
        data: {
          id: trainer._id,
          name: trainer.name,
          email: trainer.email,
          employeeId: trainer.employeeId,
          status: trainer.status
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid trainer data' });
    }
  } catch (error) {
    console.error('Register Trainer Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Auth trainer & get token
// @route POST /api/trainer/login
// @access Public
const loginTrainer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const trainer = await Trainer.findOne({ email }).select('+password failedLoginAttempts lockUntil');

    if (!trainer) {
      return res.status(401).json({ success: false, message: 'Trainer not found' });
    }

    if (trainer.isAccountLocked && trainer.isAccountLocked()) {
      return res.status(401).json({ success: false, message: `Account locked until ${new Date(trainer.lockUntil).toISOString()}` });
    }

    if (trainer.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    const isMatch = await trainer.matchPassword(password);
    if (!isMatch) {
      if (typeof trainer.incrementFailedLogin === 'function') await trainer.incrementFailedLogin();
      if (trainer.isAccountLocked && trainer.isAccountLocked()) {
        return res.status(401).json({ success: false, message: `Account locked due to multiple failed attempts. Try again at ${new Date(trainer.lockUntil).toISOString()}` });
      }
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Successful login: reset attempts
    if (typeof trainer.resetFailedLogin === 'function') await trainer.resetFailedLogin();

    trainer.lastLogin = new Date();
    await trainer.save();

    const token = jwt.sign({ id: trainer._id, role: 'trainer' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        employeeId: trainer.employeeId,
        phone: trainer.phone,
        experience: trainer.experience,
        subjectDealing: trainer.subjectDealing,
        category: trainer.category,
        linkedIn: trainer.linkedIn,
        status: trainer.status,
        assignedBatches: trainer.assignedBatches,
        createdQuizzes: trainer.createdQuizzes,
        createdAssignments: trainer.createdAssignments,
        lastLogin: trainer.lastLogin
      }
    });
  } catch (error) {
    console.error('Login Trainer Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get trainer profile
// @route GET /api/trainer/profile
// @access Private
const getTrainerProfile = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.user.id)
      .populate('assignedBatches')
      .populate('createdQuizzes')
      .populate('createdAssignments');

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    console.error('Get Trainer Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get assigned placement training batches
// @route GET /api/trainer/placement-training-batches
// @access Private
const getPlacementTrainingBatches = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const batches = await PlacementTrainingBatch.find({
      'assignedTrainers.trainer': trainerId,
      isActive: true
    })
      .populate('tpoId', 'name email')
      .populate('students', 'name email rollNo college branch techStack')
      .populate('assignedTrainers.trainer', 'name email subjectDealing category')
      .sort({ startDate: -1 });

    const formattedBatches = batches.map(batch => {
      const trainerAssignment = batch.assignedTrainers.find(
        assignment => assignment.trainer._id.toString() === trainerId
      );

      return {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        techStack: batch.techStack,
        year: batch.year,
        colleges: batch.colleges,
        studentCount: batch.students.length,
        students: batch.students,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        isActive: batch.isActive,
        tpoId: batch.tpoId,
        myAssignment: trainerAssignment
          ? {
              timeSlot: trainerAssignment.timeSlot,
              subject: trainerAssignment.subject,
              schedule: trainerAssignment.schedule,
              assignedAt: trainerAssignment.assignedAt
            }
          : null,
        allAssignedTrainers: batch.assignedTrainers
      };
    });

    const stats = {
      totalBatches: formattedBatches.length,
      totalStudents: formattedBatches.reduce((acc, batch) => acc + batch.studentCount, 0),
      activeStatuses: formattedBatches.filter(batch => batch.status === 'Ongoing').length,
      upcomingBatches: formattedBatches.filter(batch => batch.status === 'Not Yet Started').length,
      completedBatches: formattedBatches.filter(batch => batch.status === 'Completed').length,
      timeSlotDistribution: formattedBatches.reduce((acc, batch) => {
        if (batch.myAssignment) {
          acc[batch.myAssignment.timeSlot] = (acc[batch.myAssignment.timeSlot] || 0) + 1;
        }
        return acc;
      }, { morning: 0, afternoon: 0, evening: 0 })
    };

    res.json({
      success: true,
      message: 'Assigned placement training batches fetched successfully',
      data: { batches: formattedBatches, stats }
    });
  } catch (error) {
    console.error('Get Assigned Batches Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get detailed batch information for trainer
// @route GET /api/trainer/placement-batch-details/:batchId
// @access Private
const getPlacementBatchDetails = async (req, res) => {
  try {
    const { batchId } = req.params;
    const trainerId = req.user.id;
    const batch = await PlacementTrainingBatch.findById(batchId)
      .populate('tpoId', 'name email phone')
      .populate('students', 'name email rollNo college branch techStack phone')
      .populate('assignedTrainers.trainer', 'name email subjectDealing category experience phone')
      .populate('createdBy', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Placement training batch not found' });
    }

    const trainerAssignment = batch.assignedTrainers.find(
      assignment => assignment.trainer._id.toString() === trainerId
    );

    if (!trainerAssignment) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this batch' });
    }

    res.json({
      success: true,
      data: {
        batchInfo: {
          _id: batch._id,
          batchNumber: batch.batchNumber,
          techStack: batch.techStack,
          year: batch.year,
          colleges: batch.colleges,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          isActive: batch.isActive,
          tpoId: batch.tpoId,
          createdBy: batch.createdBy,
          studentCount: batch.students.length
        },
        students: batch.students,
        myAssignment: {
          timeSlot: trainerAssignment.timeSlot,
          subject: trainerAssignment.subject,
          schedule: trainerAssignment.schedule,
          assignedAt: trainerAssignment.assignedAt
        },
        allTrainers: batch.assignedTrainers
      }
    });
  } catch (error) {
    console.error('Get Placement Batch Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Update trainer profile
// @route PUT /api/trainer/profile
// @access Private
const updateTrainerProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.trainerName || req.body.name,
      phone: req.body.phoneNumber || req.body.phone,
      experience: req.body.yearsOfExperience || req.body.experience,
      subjectDealing: req.body.subjectDealing,
      category: req.body.category,
      linkedIn: req.body.linkedProfileUrl || req.body.linkedIn
    };

    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) delete fieldsToUpdate[key];
    });

    const trainer = await Trainer.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    console.error('Update Trainer Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Change trainer password
// @route PUT /api/trainer/change-password
// @access Private
const changeTrainerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const trainer = await Trainer.findById(req.user.id).select('+password');

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const isCurrentPasswordCorrect = await trainer.matchPassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    trainer.password = newPassword;
    await trainer.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Logout trainer
// @route POST /api/trainer/logout
// @access Private
const logoutTrainer = async (req, res) => {
  try {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (e) {
      console.warn('Failed to clear token cookie on trainer logout:', e && (e.message || e));
    }

    res.status(200).json({ success: true, message: 'Trainer logged out successfully' });
  } catch (error) {
    console.error('Logout Trainer Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get trainer's own attendance
// @route GET /api/trainer/attendance/my-attendance
// @access Private
const getMyAttendance = async (req, res) => {
  try {
    if (req.userType !== 'trainer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { startDate, endDate } = req.query;
    const trainerId = req.user.id;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.sessionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find({
      trainerId: trainerId,
      ...dateFilter
    })
    .populate('batchId', 'batchNumber techStack colleges')
    .sort({ sessionDate: -1 });

    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a =>
      a.trainerStatus === 'present'
    ).length;
    const absentCount = attendanceRecords.filter(a =>
      a.trainerStatus === 'absent'
    ).length;
    const attendancePercentage = totalSessions > 0
      ? Math.round((presentCount / totalSessions) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords,
        statistics: {
          totalSessions,
          presentCount,
          absentCount,
          attendancePercentage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching trainer attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Get sessions taught by trainer
// @route GET /api/trainer/attendance/sessions-taught
// @access Private
const getSessionsTaught = async (req, res) => {
  try {
    if (req.userType !== 'trainer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const trainerId = req.user.id;
    const { month, year } = req.query;

    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter.sessionDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const sessions = await Attendance.find({
      trainerId: trainerId,
      ...dateFilter
    })
    .populate('batchId', 'batchNumber techStack')
    .sort({ sessionDate: -1 });

    const summary = {
      totalSessions: sessions.length,
      totalStudentsAttended: sessions.reduce((sum, s) => sum + s.presentCount, 0),
      averageAttendance: sessions.length > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + s.attendancePercentage, 0) / sessions.length
          )
        : 0
    };

    res.json({
      success: true,
      data: {
        sessions,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching sessions taught:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  registerTrainer,
  loginTrainer,
  getTrainerProfile,
  getPlacementTrainingBatches,
  getPlacementBatchDetails,
  updateTrainerProfile,
  changeTrainerPassword,
  logoutTrainer,
  getMyAttendance,
  getSessionsTaught
};
