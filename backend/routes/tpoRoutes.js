const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Trainer = require('../models/Trainer');
const TPO = require('../models/TPO');
const Student = require('../models/Student');
// GET TPO Profile
router.get('/profile', generalAuth, async (req, res) => {
  try {
    console.log('TPO Profile Request Received:', {
      userType: req.userType,
      userId: req.user._id,
      email: req.user.email
    });

    // Verify this is a TPO
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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

    console.log('TPO Profile Response:', userProfile);

    res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: { user: userProfile }
    });

  } catch (error) {
    console.error('Error fetching TPO profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET TPO Batches
router.get('/batches', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches'
    });
  }
});


// GET Students by Batches (Regular Batches - not placement training) for TPO
router.get('/students-by-batch', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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
    console.error('Error fetching students by batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students by batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// GET Placement Training Batches for TPO
router.get('/placement-training-batches', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const tpoId = req.user._id;
    
    const batches = await PlacementTrainingBatch.find({ tpoId })
      .populate('students', 'name rollNo email college branch techStack crtInterested yearOfPassing')
      .populate('tpoId', 'name email')
      .populate('createdBy', 'name email')
      .populate({
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience'
      })
      .sort({ year: -1, college: 1, techStack: 1 });

    // Group batches by year → college → techStack
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
          assignedTrainers: batch.assignedTrainers
        });

        organized[year][college][techStack].totalBatches += 1;
        organized[year][college][techStack].totalStudents += batch.students.length;

        totalBatches += 1;
        totalStudents += batch.students.length;
      });
    });

    const stats = {
      totalBatches,
      totalStudents,
      totalYears: Object.keys(organized).length,
      totalColleges: [...new Set(batches.flatMap(b => b.colleges))].length,
      techStackDistribution: {
        Java: batches.filter(b => b.techStack === 'Java').length,
        Python: batches.filter(b => b.techStack === 'Python').length,
        'AIML': batches.filter(b => b.techStack === 'AIML').length,
        NonCRT: batches.filter(b => b.techStack === 'NonCRT').length
      }
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
    console.error('Error fetching placement training batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching placement training batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET Available Trainers for assignment
router.get('/available-trainers', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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
    console.error('Error fetching available trainers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available trainers'
    });
  }
});

// POST Assign Trainers to Batch
router.post('/assign-trainers/:batchId', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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
      return res.status(404).json({
        success: false,
        message: 'Batch not found or access denied'
      });
    }

    // Validate trainer assignments
    if (!trainerAssignments || !Array.isArray(trainerAssignments) || trainerAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid trainer assignments are required'
      });
    }

    // Validate each assignment
    for (const assignment of trainerAssignments) {
      if (!assignment.trainerId || !assignment.timeSlot || !assignment.subject) {
        return res.status(400).json({
          success: false,
          message: 'Each assignment must have trainerId, timeSlot, and subject'
        });
      }

      // Verify trainer exists
      const trainer = await Trainer.findById(assignment.trainerId);
      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: `Trainer with ID ${assignment.trainerId} not found`
        });
      }

      // Validate schedule if provided
      if (assignment.schedule && Array.isArray(assignment.schedule)) {
        for (const scheduleSlot of assignment.schedule) {
          if (!scheduleSlot.day || !scheduleSlot.startTime || !scheduleSlot.endTime) {
            return res.status(400).json({
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

    batch.assignedTrainers = assignedTrainers;
    await batch.save();

    // Populate the response
    await batch.populate([
      {
        path: 'assignedTrainers.trainer',
        select: 'name email subjectDealing category experience'
      }
    ]);

    res.json({
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
    console.error('Error assigning trainers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning trainers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET Batch Trainer Assignments
router.get('/batch-trainer-assignments/:batchId', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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
      return res.status(404).json({
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
    console.error('Error fetching batch trainer assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch trainer assignments'
    });
  }
});

// GET Overall Schedule Timetable
router.get('/schedule-timetable', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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

    // Calculate summary statistics
    const stats = {
      totalBatches: batches.length,
      totalStudents: batches.reduce((acc, batch) => acc + batch.students.length, 0),
      totalClasses: batches.reduce((acc, batch) => {
        return acc + (batch.assignedTrainers?.reduce((trainerAcc, trainer) => {
          return trainerAcc + (trainer.schedule?.length || 0);
        }, 0) || 0);
      }, 0),
      assignedTrainers: [...new Set(batches.flatMap(batch => 
        batch.assignedTrainers?.map(t => t.trainer?._id.toString()) || []
      ))].length,
      batchesByTechStack: {
        Java: batches.filter(b => b.techStack === 'Java').length,
        Python: batches.filter(b => b.techStack === 'Python').length,
        'AIML': batches.filter(b => b.techStack === 'AIML').length,
        NonCRT: batches.filter(b => b.techStack === 'NonCRT').length
      },
      batchesByCollege: {
        KIET: batches.filter(b => b.colleges.includes('KIET')).length,
        KIEK: batches.filter(b => b.colleges.includes('KIEK')).length,
        KIEW: batches.filter(b => b.colleges.includes('KIEW')).length
      },
      timeSlotDistribution: {
        morning: batches.reduce((acc, batch) => {
          return acc + (batch.assignedTrainers?.filter(t => t.timeSlot === 'morning').length || 0);
        }, 0),
        afternoon: batches.reduce((acc, batch) => {
          return acc + (batch.assignedTrainers?.filter(t => t.timeSlot === 'afternoon').length || 0);
        }, 0),
        evening: batches.reduce((acc, batch) => {
          return acc + (batch.assignedTrainers?.filter(t => t.timeSlot === 'evening').length || 0);
        }, 0)
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
    console.error('Error fetching schedule timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schedule timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET Detailed Schedule for a specific batch
router.get('/batch-schedule/:batchId', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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
      return res.status(404).json({
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
    console.error('Error fetching batch schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch schedule'
    });
  }
});

// Export schedule data for Excel download
router.get('/export-schedule', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
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
    console.error('Error exporting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting schedule'
    });
  }
});

// GET /api/tpo/pending-approvals - Get all pending approval requests
router.get('/pending-approvals', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({ success: false, message: 'Access denied. TPO route only.' });
    }

    const tpoId = req.user.id;

    // Find only CRT-related pending approvals
    const studentsWithPendingApprovals = await Student.find({
      'pendingApprovals': {
        $elemMatch: {
          status: 'pending',
          requestType: { $in: ['crt_status_change', 'batch_change'] }
        }
      }
    }).select('name rollNo email college branch yearOfPassing crtInterested techStack pendingApprovals placementTrainingBatchId')
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
          status: approval.status
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
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending approvals'
    });
  }
});

router.post('/approve-request', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { studentId, approvalId, action, rejectionReason } = req.body;
    const isApproved = action === 'approve';

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
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
    console.error('Approval error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing approval'
    });
  }
});

// POST /api/tpo/reject-request - Reject a change request
router.post('/reject-request', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({ success: false, message: 'Access denied. TPO route only.' });
    }

    const { studentId, approvalId, rejectionReason } = req.body;
    const tpoId = req.user.id;

    if (!studentId || !approvalId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Approval ID are required'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Find the specific approval request
    const approval = student.pendingApprovals.id(approvalId);
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
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
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/tpo/approval-history - Get approval history (approved/rejected requests)
router.get('/approval-history', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({ success: false, message: 'Access denied. TPO route only.' });
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
    console.error('Error fetching approval history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approval history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;