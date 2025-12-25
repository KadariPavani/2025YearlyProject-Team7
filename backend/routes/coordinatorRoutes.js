// routes/coordinatorRoutes.js - COMPLETE FILE (REPLACE EXISTING)
const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const Coordinator = require('../models/Coordinator');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const Attendance = require('../models/Attendance');
const { getTechStackColor } = require('../utils/techStackUtils');

// ============================================
// COORDINATOR PROFILE & DASHBOARD
// ============================================

// GET Coordinator Profile
router.get('/profile', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coordinator route only.' 
      });
    }

    const coordinator = await Coordinator.findById(req.user.id)
      .populate({
        path: 'assignedPlacementBatch',
        populate: [
          { path: 'students', select: 'name rollNo email college branch techStack' },
          { path: 'tpoId', select: 'name email phone' },
          { 
            path: 'assignedTrainers.trainer', 
            select: 'name email subjectDealing category experience' 
          }
        ]
      })
      .select('-password');

    if (!coordinator) {
      return res.status(404).json({ 
        success: false, 
        message: 'Coordinator not found' 
      });
    }

    res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: { user: coordinator }
    });
  } catch (error) {
    console.error('Error fetching coordinator profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching profile' 
    });
  }
});

// GET Coordinator Dashboard
router.get('/dashboard', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const coordinator = await Coordinator.findById(req.user.id)
      .populate({
        path: 'assignedPlacementBatch',
        populate: [
          { path: 'students' },
          { path: 'tpoId' },
          { path: 'assignedTrainers.trainer' }
        ]
      })
      .select('-password');

    // Get tech stack statistics
    const techStackStats = await PlacementTrainingBatch.getStatsByTechStack();
    
    res.json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: { 
        user: coordinator,
        techStackStats,
        techStackColors: techStackStats.reduce((acc, stat) => ({
          ...acc,
          [stat.techStack]: getTechStackColor(stat.techStack)
        }), {})
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ============================================
// ATTENDANCE MANAGEMENT - MARK ATTENDANCE
// ============================================

// GET Scheduled Sessions for Today
router.get('/attendance/today-sessions', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const coordinator = await Coordinator.findById(req.user.id);
    if (!coordinator || !coordinator.assignedPlacementBatch) {
      return res.status(404).json({ 
        success: false, 
        message: 'No batch assigned' 
      });
    }

    const batch = await PlacementTrainingBatch.findById(coordinator.assignedPlacementBatch)
      .populate('students', 'name rollNo email college branch')
      .populate('assignedTrainers.trainer', 'name email subjectDealing category');

    if (!batch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaySessions = [];

    // Get scheduled sessions for today
    batch.assignedTrainers.forEach(assignment => {
      if (assignment.schedule && assignment.schedule.length > 0) {
        assignment.schedule.forEach(slot => {
          if (slot.day === today) {
            todaySessions.push({
              trainerId: assignment.trainer._id,
              trainerName: assignment.trainer.name,
              subject: assignment.subject,
              timeSlot: assignment.timeSlot,
              startTime: slot.startTime,
              endTime: slot.endTime,
              day: slot.day
            });
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        students: batch.students,
        todaySessions: todaySessions.sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        )
      }
    });
  } catch (error) {
    console.error('Error fetching today sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST Mark Attendance
router.post('/attendance/mark', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const {
      batchId,
      sessionDate,
      timeSlot,
      startTime,
      endTime,
      trainerId,
      subject,
      trainerStatus,
      trainerRemarks,
      studentAttendance, // Array of { studentId, status, remarks }
      sessionNotes
    } = req.body;

    // Validation
    if (!batchId || !sessionDate || !timeSlot || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields missing' 
      });
    }

    // Verify coordinator has access to this batch
    const coordinator = await Coordinator.findById(req.user.id);
    if (coordinator.assignedPlacementBatch.toString() !== batchId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized for this batch' 
      });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      batchId,
      sessionDate: new Date(sessionDate),
      timeSlot,
      trainerId: trainerId || null
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Attendance already marked for this session' 
      });
    }

    // Mark timestamp for each student
    const processedStudentAttendance = studentAttendance.map(s => ({
      ...s,
      markedAt: new Date()
    }));

    // Create new attendance record
    const attendance = new Attendance({
      sessionDate: new Date(sessionDate),
      batchId,
      batchType: 'placement',
      timeSlot,
      startTime,
      endTime,
      trainerId: trainerId || null,
      subject: subject || '',
      trainerStatus: trainerStatus || 'not_marked',
      trainerRemarks: trainerRemarks || '',
      studentAttendance: processedStudentAttendance,
      markedBy: {
        userId: req.user.id,
        userType: 'Coordinator',
        name: coordinator.name
      },
      sessionNotes: sessionNotes || '',
      isCompleted: true
    });

    await attendance.save();

    // Populate the response
    await attendance.populate([
      { path: 'studentAttendance.studentId', select: 'name rollNo email' },
      { path: 'trainerId', select: 'name email subjectDealing' }
    ]);

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error while marking attendance' 
    });
  }
});

// ============================================
// ATTENDANCE VIEWING & MANAGEMENT
// ============================================

// GET Attendance History
router.get('/attendance/history', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const coordinator = await Coordinator.findById(req.user.id);
    const { startDate, endDate, timeSlot } = req.query;

    const query = {
      batchId: coordinator.assignedPlacementBatch
    };

    if (startDate && endDate) {
      query.sessionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (timeSlot) {
      query.timeSlot = timeSlot;
    }

    let attendanceRecords = await Attendance.find(query)
      .populate('trainerId', 'name email subjectDealing')
      .populate('studentAttendance.studentId', 'name rollNo email')
      .sort({ sessionDate: -1, timeSlot: 1 });

    // Convert to plain objects and mark as recorded
    attendanceRecords = attendanceRecords.map(r => ({ ...r.toObject(), recorded: true }));

    // Build a lookup map for existing attendance records by batchId_date_timeSlot
    const attendanceMap = {};
    attendanceRecords.forEach(rec => {
      const key = `${rec.batchId.toString()}_${new Date(rec.sessionDate).toISOString().split('T')[0]}_${rec.timeSlot}`;
      attendanceMap[key] = true;
    });

    // Fetch batch and its assigned trainer schedules
    const batch = await PlacementTrainingBatch.findById(coordinator.assignedPlacementBatch)
      .populate('assignedTrainers.trainer', 'name email subjectDealing')
      .populate('students', 'name rollNo email')
      .lean();

    // Determine date window
    const now = new Date();
    const defaultStart = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
    const defaultEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    // Use startDate/endDate from query params if provided, else default window
    const rangeStart = (startDate && startDate !== 'All') ? new Date(startDate) : defaultStart;
    const rangeEnd = (endDate && endDate !== 'All') ? new Date(endDate) : defaultEnd;

    const dayNameToIndex = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const getDatesForDayInRange = (dayName, start, end) => {
      const dates = [];
      const dayNum = dayNameToIndex[dayName];
      if (dayNum === undefined) return dates;

      const cur = new Date(start);
      // Move to first occurrence on/after start
      const diff = (dayNum + 7 - cur.getDay()) % 7;
      cur.setDate(cur.getDate() + diff);
      while (cur <= end) {
        dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 7);
      }
      return dates;
    };

    // Generate scheduled occurrences that have no attendance recorded
    if (batch && batch.assignedTrainers) {
      (batch.assignedTrainers || []).forEach(assignment => {
        const trainer = assignment.trainer || null;
        const timeSlot = assignment.timeSlot;
        const subject = assignment.subject || 'N/A';

        (assignment.schedule || []).forEach(sch => {
          const dates = getDatesForDayInRange(sch.day, rangeStart, rangeEnd);
          dates.forEach(dt => {
            const dateISO = dt.toISOString().split('T')[0];
            const key = `${batch._id.toString()}_${dateISO}_${timeSlot}`;
            if (!attendanceMap[key]) {
              // Add synthetic unrecorded session record
              attendanceRecords.push({
                _id: `scheduled_${batch._id.toString()}_${dateISO}_${timeSlot}`,
                sessionDate: new Date(dateISO),
                day: dt.toLocaleDateString('en-US', { weekday: 'long' }),
                timeSlot: timeSlot,
                startTime: sch.startTime,
                endTime: sch.endTime,
                subject: subject,
                batchId: batch._id,
                trainerId: trainer ? { name: trainer.name, email: trainer.email } : null,
                trainerStatus: 'not_marked',
                totalStudents: (batch.students || []).length,
                presentCount: 0,
                absentCount: 0,
                attendancePercentage: null,
                recorded: false
              });
            }
          });
        });
      });
    }

    // Sort final records by date desc then timeSlot
    attendanceRecords.sort((a, b) => {
      const ad = new Date(a.sessionDate);
      const bd = new Date(b.sessionDate);
      if (bd - ad !== 0) return bd - ad;
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });

    res.json({
      success: true,
      data: {
        totalRecords: attendanceRecords.length,
        records: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET Attendance for Specific Date
router.get('/attendance/date/:date', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const coordinator = await Coordinator.findById(req.user.id);
    const requestedDate = new Date(req.params.date);

    let attendanceRecords = await Attendance.find({
      batchId: coordinator.assignedPlacementBatch,
      sessionDate: {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(requestedDate.setHours(23, 59, 59, 999))
      }
    })
    .populate('trainerId', 'name email subjectDealing')
    .populate('studentAttendance.studentId', 'name rollNo email')
    .sort({ timeSlot: 1 });

    attendanceRecords = attendanceRecords.map(r => ({ ...r.toObject(), recorded: true }));

    // Fetch batch and schedules
    const batch = await PlacementTrainingBatch.findById(coordinator.assignedPlacementBatch)
      .populate('assignedTrainers.trainer', 'name email subjectDealing')
      .populate('students', 'name rollNo email')
      .lean();

    const dateISO = requestedDate.toISOString().split('T')[0];
    const timeSlotSet = new Set(attendanceRecords.map(r => r.timeSlot));

    if (batch && batch.assignedTrainers) {
      (batch.assignedTrainers || []).forEach(assignment => {
        const trainer = assignment.trainer || null;
        const timeSlot = assignment.timeSlot;
        (assignment.schedule || []).forEach(sch => {
          if (sch.day === requestedDate.toLocaleDateString('en-US', { weekday: 'long' })) {
            // If no attendance exists for this timeslot, add scheduled record
            const exists = attendanceRecords.some(r => r.timeSlot === timeSlot);
            if (!exists) {
              attendanceRecords.push({
                _id: `scheduled_${batch._id.toString()}_${dateISO}_${timeSlot}`,
                sessionDate: new Date(dateISO),
                day: sch.day,
                timeSlot: timeSlot,
                startTime: sch.startTime,
                endTime: sch.endTime,
                subject: assignment.subject || 'N/A',
                batchId: batch._id,
                trainerId: trainer ? { name: trainer.name, email: trainer.email } : null,
                trainerStatus: 'not_marked',
                totalStudents: (batch.students || []).length,
                presentCount: 0,
                absentCount: 0,
                attendancePercentage: null,
                recorded: false
              });
            }
          }
        });
      });
    }

    attendanceRecords.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

    res.json({
      success: true,
      data: {
        date: req.params.date,
        sessionsCount: attendanceRecords.length,
        records: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Error fetching date attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PUT Update Attendance
router.put('/attendance/:attendanceId', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const { attendanceId } = req.params;
    const updateData = req.body;

    const coordinator = await Coordinator.findById(req.user.id);
    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attendance record not found' 
      });
    }

    // Verify coordinator has access
    if (attendance.batchId.toString() !== coordinator.assignedPlacementBatch.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Update fields
    if (updateData.trainerStatus) attendance.trainerStatus = updateData.trainerStatus;
    if (updateData.trainerRemarks) attendance.trainerRemarks = updateData.trainerRemarks;
    if (updateData.studentAttendance) attendance.studentAttendance = updateData.studentAttendance;
    if (updateData.sessionNotes) attendance.sessionNotes = updateData.sessionNotes;

    await attendance.save();

    await attendance.populate([
      { path: 'studentAttendance.studentId', select: 'name rollNo email' },
      { path: 'trainerId', select: 'name email subjectDealing' }
    ]);

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET Attendance Summary Statistics
router.get('/attendance/summary', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const coordinator = await Coordinator.findById(req.user.id);
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.sessionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find({
      batchId: coordinator.assignedPlacementBatch,
      ...dateFilter
    });

    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const totalStudentRecords = attendanceRecords.reduce((sum, record) => 
      sum + record.studentAttendance.length, 0
    );
    const totalPresent = attendanceRecords.reduce((sum, record) => 
      sum + record.presentCount, 0
    );
    const totalAbsent = attendanceRecords.reduce((sum, record) => 
      sum + record.absentCount, 0
    );

    const overallPercentage = totalStudentRecords > 0 
      ? Math.round((totalPresent / totalStudentRecords) * 100) 
      : 0;

    // Time slot distribution
    const timeSlotStats = {
      morning: attendanceRecords.filter(r => r.timeSlot === 'morning').length,
      afternoon: attendanceRecords.filter(r => r.timeSlot === 'afternoon').length,
      evening: attendanceRecords.filter(r => r.timeSlot === 'evening').length
    };

    res.json({
      success: true,
      data: {
        totalSessions,
        totalStudentRecords,
        totalPresent,
        totalAbsent,
        overallPercentage,
        timeSlotStats
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET Detailed Student Attendance
router.get('/attendance/student-details/:attendanceId', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'coordinator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const attendance = await Attendance.findById(req.params.attendanceId)
      .populate('studentAttendance.studentId', 'name rollNo email')
      .populate('trainerId', 'name email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Get all attendance records for these students to calculate overall stats
    const allAttendance = await Attendance.find({
      batchId: attendance.batchId,
      sessionDate: { $lte: attendance.sessionDate }
    });

    // Calculate cumulative statistics for each student
    const detailedStats = attendance.studentAttendance.map(record => {
      const studentAttendance = allAttendance.map(a => 
        a.studentAttendance.find(s => 
          s.studentId._id.toString() === record.studentId._id.toString()
        )
      ).filter(Boolean);

      const totalSessions = studentAttendance.length;
      const sessionsPresent = studentAttendance.filter(a => 
        a.status === 'present' || a.status === 'late'
      ).length;

      return {
        _id: record.studentId._id,
        name: record.studentId.name,
        rollNo: record.studentId.rollNo,
        email: record.studentId.email,
        status: record.status,
        remarks: record.remarks,
        totalSessions,
        sessionsPresent,
        sessionsAbsent: totalSessions - sessionsPresent,
        attendancePercentage: Math.round((sessionsPresent / totalSessions) * 100) || 0,
        lastUpdated: attendance.sessionDate
      };
    });

    res.json({
      success: true,
      data: detailedStats
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
