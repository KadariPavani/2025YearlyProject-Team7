const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const TPO = require('../models/TPO');
const Admin = require('../models/Admin');
const generalAuth = require('../middleware/generalAuth');
const { profileUpload, resumeUpload } = require('../middleware/fileUpload');
const router = express.Router();

// Function to get TPO based on student's assigned batch
async function getTPOForStudent(student) {
  let assignedTPO = null;
  
  // First, try to get TPO from student's existing batch
  if (student.batchId) {
    const existingBatch = await Batch.findById(student.batchId).populate('tpoId');
    if (existingBatch && existingBatch.tpoId) {
      assignedTPO = existingBatch.tpoId;
    }
  }
  
  // If no TPO found from existing batch, get first active TPO
  if (!assignedTPO) {
    assignedTPO = await TPO.findOne({ status: 'active' }).sort({ createdAt: 1 });
  }
  
  return assignedTPO;
}

// Add this improved helper function in studentRoutes.js
// Replace the existing assignStudentToPlacementTrainingBatch function

async function assignStudentToPlacementTrainingBatch(student) {
  try {
    if (!student.college) {
      throw new Error('Student college is required');
    }

    console.log(`Reassigning placement batch for student: ${student.name} (${student._id})`);

    // Only reassign if student is CRT interested
    if (!student.crtInterested) {
      // Remove from any existing CRT batch
      if (student.placementTrainingBatchId) {
        await PlacementTrainingBatch.findByIdAndUpdate(
          student.placementTrainingBatchId,
          { $pull: { students: student._id } }
        );
        
        // Update student to remove CRT batch references
        await Student.findByIdAndUpdate(student._id, {
          $unset: {
            placementTrainingBatchId: 1,
            crtBatchId: 1,
            crtBatchName: 1
          }
        });
      }
      return null;
    }

    // Get TPO and Admin
    const tpo = await getTPOForStudent(student);
    const admin = await Admin.findOne({ status: 'active' }).sort({ createdAt: 1 });

    if (!tpo) {
      throw new Error('No TPO found for student. Please contact administrator.');
    }
    if (!admin) {
      throw new Error('No active Admin found in system. Please contact administrator.');
    }

    const maxStudents = 80;
    const year = student.yearOfPassing;

    // Determine tech stack for placement training
    let techStack = 'NonCRT';
    if (student.crtInterested && student.techStack && student.techStack.length > 0) {
      const validTechs = ['Java', 'Python', 'AIML'];
      const selectedTech = student.techStack.find(t => validTechs.includes(t));
      if (selectedTech) {
        techStack = selectedTech;
      }
    }

    console.log(`Looking for batch with: College=${student.college}, TechStack=${techStack}, Year=${year}`);

    // Find existing placement training batch with room
    let placementBatch = await PlacementTrainingBatch.findOne({
      colleges: student.college,
      techStack: techStack,
      year: year,
      $expr: { $lt: [{ $size: "$students" }, maxStudents] }
    }).sort({ createdAt: 1 });

    if (!placementBatch) {
      // Count existing placement training batches to create new batch number
      const existingBatches = await PlacementTrainingBatch.countDocuments({
        colleges: student.college,
        techStack: techStack,
        year: year
      });

      const batchNumber = `PT${year}${student.college}${techStack}${existingBatches + 1}`;

      placementBatch = new PlacementTrainingBatch({
        batchNumber,
        colleges: [student.college],
        techStack,
        year,
        tpoId: tpo._id,
        createdBy: admin._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 3600 * 1000), // 180 days
        students: []
      });
      await placementBatch.save();
      console.log(`Created new placement training batch: ${batchNumber}`);
    }

    // Add student to placement training batch if not already present
    if (!placementBatch.students.includes(student._id)) {
      placementBatch.students.push(student._id);
      await placementBatch.save();
      console.log(`Added student to batch ${placementBatch.batchNumber}`);
    }

    // Update student with placement training batch reference
    student.placementTrainingBatchId = placementBatch._id;
    student.crtBatchId = placementBatch._id;
    student.crtBatchName = placementBatch.batchNumber;
    
    // Save student - use findByIdAndUpdate to avoid version conflicts
    await Student.findByIdAndUpdate(
      student._id,
      {
        placementTrainingBatchId: placementBatch._id,
        crtBatchId: placementBatch._id,
        crtBatchName: placementBatch.batchNumber
      },
      { new: true }
    );

    console.log(`Successfully assigned student ${student.name} to placement training batch ${placementBatch.batchNumber}`);
    
    return placementBatch;
  } catch (error) {
    console.error('Error in assignStudentToPlacementTrainingBatch:', error);
    throw error;
  }
}

// GET Student Profile
router.get('/profile', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student route only.'
      });
    }

    const student = await Student.findById(req.user._id)
      .populate('placementTrainingBatchId', 'batchNumber techStack')
      .select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile fetched successfully',
      data: student
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Replace the existing PUT /profile route in studentRoutes.js with this:

router.put('/profile', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.user._id;
    const updateData = req.body;
    
    // Find student and handle version conflicts
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Handle CRT and batch changes independently
    const crtStatusChanged = updateData.crtInterested !== undefined && 
                           updateData.crtInterested !== student.crtInterested;
    const crtBatchChanged = updateData.crtBatchChoice !== undefined && 
                          updateData.crtBatchChoice !== student.crtBatchChoice;

    // Handle tech stack changes separately from CRT changes
    const techStackUpdate = updateData.techStack !== undefined ? 
      { techStack: updateData.techStack } : {};

    if (crtStatusChanged || crtBatchChanged) {
      const hasPendingCrtApproval = student.pendingApprovals.some(
        approval => approval.status === 'pending' && 
                   approval.requestType === 'crt_status_change'
      );

      if (hasPendingCrtApproval) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending CRT-related approval request'
        });
      }

      // Create approval request for CRT changes only
      await student.createApprovalRequest('crt_status_change', {
        crtInterested: updateData.crtInterested,
        crtBatchChoice: updateData.crtBatchChoice,
        originalCrtInterested: student.crtInterested,
        originalCrtBatchChoice: student.crtBatchChoice
      });

      // Remove CRT fields from direct update
      delete updateData.crtInterested;
      delete updateData.crtBatchChoice;
    }

    // Apply tech stack and other updates directly
    const allowedFields = [
      'name', 'email', 'phonenumber', 'gender', 'dob', 'currentLocation', 
      'hometown', 'bio', 'academics', 'backlogs', 'projects', 
      'internships', 'appreciations', 'certifications', 'socialLinks', 
      'otherClubs', 'profileImageUrl', 'resumeUrl', 'resumeFileName'
    ];

    const updateObject = {
      ...techStackUpdate,  // Apply tech stack changes directly
      ...Object.fromEntries(
        Object.entries(updateData)
          .filter(([key]) => allowedFields.includes(key))
      )
    };

    // Apply updates with version control
    const savedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateObject },
      { 
        new: true, 
        runValidators: true,
        populate: [
          { path: 'batchId', select: 'batchNumber colleges' },
          { path: 'placementTrainingBatchId', select: 'batchNumber techStack' }
        ]
      }
    ).select('-password');

    return res.json({
      success: true,
      message: crtStatusChanged || crtBatchChanged
        ? 'Profile updated. CRT-related changes have been sent for approval.'
        : 'Profile updated successfully',
      data: savedStudent,
      requiresApproval: crtStatusChanged || crtBatchChanged
    });

  } catch (error) {
    console.error('Error updating student profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating profile'
    });
  }
});

// GET Pending Approvals for Student
router.get('/pending-approvals', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student route only.'
      });
    }

    const student = await Student.findById(req.user._id)
      .select('pendingApprovals')
      .populate('pendingApprovals.reviewedBy', 'name email');

    const pendingApprovals = student.pendingApprovals.filter(
      approval => approval.status === 'pending'
    );

    const approvedApprovals = student.pendingApprovals.filter(
      approval => approval.status === 'approved'
    );

    const rejectedApprovals = student.pendingApprovals.filter(
      approval => approval.status === 'rejected'
    );

    res.json({
      success: true,
      data: {
        pending: pendingApprovals,
        approved: approvedApprovals,
        rejected: rejectedApprovals,
        totalPending: pendingApprovals.length
      }
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approvals'
    });
  }
});


// POST /api/student/profile-image
router.post('/profile-image', generalAuth, (req, res) => {
  profileUpload(req, res, async (err) => {
    if (err) {
      console.error('Profile upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      if (req.userType !== 'student') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        req.user.id,
        { profileImageUrl: req.file.path },
        { new: true }
      );

      if (!updatedStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      res.json({
        success: true,
        data: updatedStudent.profileImageUrl,
        message: 'Profile image uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ success: false, message: 'Failed to upload profile image' });
    }
  });
});

// POST /api/student/resume
router.post('/resume', generalAuth, (req, res) => {
  resumeUpload(req, res, async (err) => {
    if (err) {
      console.error('Resume upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      if (req.userType !== 'student') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        req.user.id,
        { 
          resumeUrl: req.file.path,
          resumeFileName: req.file.originalname 
        },
        { new: true }
      );

      if (!updatedStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      return res.json({
        success: true,
        data: { 
          url: updatedStudent.resumeUrl, 
          fileName: req.file.originalname 
        },
        message: 'Resume uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      res.status(500).json({ success: false, message: 'Failed to upload resume' });
    }
  });
});

// GET /api/student/check-password-change
router.get('/check-password-change', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const needsPasswordChange = !student.lastLogin && student.password === student.username;

    res.json({
      success: true,
      needsPasswordChange: needsPasswordChange
    });
  } catch (err) {
    console.error('Check password change error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/student/my-batch
router.get('/my-batch', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.user.id;
    const student = await Student.findById(studentId).populate({
      path: 'batchId',
      populate: {
        path: 'tpoId',
        select: 'name email phone'
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.batchId) {
      return res.status(404).json({ 
        success: false, 
        message: 'No batch assigned yet. Please contact your administrator.' 
      });
    }

    res.json({
      success: true,
      data: {
        batch: {
          id: student.batchId._id,
          batchNumber: student.batchId.batchNumber,
          colleges: student.batchId.colleges,
          startDate: student.batchId.startDate,
          endDate: student.batchId.endDate,
        },
        tpo: student.batchId.tpoId || null,
      }
    });
  } catch (error) {
    console.error('Error fetching student batch info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching batch information',
      error: error.message 
    });
  }
});

// GET /api/student/placement-training-batch-info
router.get('/placement-training-batch-info', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.user.id;

    const student = await Student.findById(studentId)
      .populate({
        path: 'placementTrainingBatchId',
        model: 'PlacementTrainingBatch',
        select: 'batchNumber colleges techStack year startDate endDate isActive assignedTrainers',
        populate: [
          {
            path: 'tpoId',
            select: 'name email phone'
          },
          {
            path: 'assignedTrainers.trainer',
            select: 'name email phone subjectDealing category experience'
          }
        ]
      });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.placementTrainingBatchId) {
      return res.status(404).json({ 
        success: false, 
        message: 'No placement training batch assigned yet. Please complete your profile to get assigned to a batch.' 
      });
    }

    const placementBatch = student.placementTrainingBatchId;

    // Organize trainer information by time slots
    const trainerSchedule = {
      morning: [],
      afternoon: [],
      evening: []
    };

    if (placementBatch.assignedTrainers && placementBatch.assignedTrainers.length > 0) {
      placementBatch.assignedTrainers.forEach(assignment => {
        const timeSlot = assignment.timeSlot;
        trainerSchedule[timeSlot].push({
          trainer: {
            id: assignment.trainer._id,
            name: assignment.trainer.name,
            email: assignment.trainer.email,
            phone: assignment.trainer.phone,
            subjectDealing: assignment.trainer.subjectDealing,
            category: assignment.trainer.category,
            experience: assignment.trainer.experience
          },
          subject: assignment.subject,
          schedule: assignment.schedule,
          assignedAt: assignment.assignedAt
        });
      });
    }

    // Get weekly schedule organized by days
    const weeklySchedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
      weeklySchedule[day] = [];
    });

    if (placementBatch.assignedTrainers && placementBatch.assignedTrainers.length > 0) {
      placementBatch.assignedTrainers.forEach(assignment => {
        if (assignment.schedule && assignment.schedule.length > 0) {
          assignment.schedule.forEach(slot => {
            weeklySchedule[slot.day].push({
              trainer: assignment.trainer,
              subject: assignment.subject,
              timeSlot: assignment.timeSlot,
              startTime: slot.startTime,
              endTime: slot.endTime
            });
          });
        }
      });
    }

    // Sort each day's schedule by start time
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          college: student.college,
          branch: student.branch,
          yearOfPassing: student.yearOfPassing
        },
        placementBatch: {
          id: placementBatch._id,
          batchNumber: placementBatch.batchNumber,
          colleges: placementBatch.colleges,
          techStack: placementBatch.techStack,
          year: placementBatch.year,
          startDate: placementBatch.startDate,
          endDate: placementBatch.endDate,
          isActive: placementBatch.isActive,
          tpoId: placementBatch.tpoId
        },
        trainerSchedule: trainerSchedule,
        weeklySchedule: weeklySchedule,
        totalTrainers: placementBatch.assignedTrainers ? placementBatch.assignedTrainers.length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching placement training batch info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching placement training batch information',
      error: error.message 
    });
  }
});

// GET /api/student/my-trainers-schedule
router.get('/my-trainers-schedule', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.user.id;

    // Find student's placement training batch
    const student = await Student.findById(studentId);
    if (!student || !student.placementTrainingBatchId) {
      return res.status(404).json({ success: false, message: 'No placement training batch found' });
    }

    const placementBatch = await PlacementTrainingBatch.findById(student.placementTrainingBatchId)
      .populate('assignedTrainers.trainer', 'name email phone subjectDealing category');

    if (!placementBatch) {
      return res.status(404).json({ success: false, message: 'Placement training batch not found' });
    }

    // Create today's schedule
    const today = new Date();
    const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todaySchedule = [];

    if (placementBatch.assignedTrainers && placementBatch.assignedTrainers.length > 0) {
      placementBatch.assignedTrainers.forEach(assignment => {
        if (assignment.schedule && assignment.schedule.length > 0) {
          assignment.schedule.forEach(slot => {
            if (slot.day === todayName) {
              todaySchedule.push({
                trainer: assignment.trainer,
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
    }

    // Sort by start time
    todaySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

    res.json({
      success: true,
      data: {
        today: todayName,
        todaySchedule: todaySchedule,
        batchInfo: {
          batchNumber: placementBatch.batchNumber,
          techStack: placementBatch.techStack
        }
      }
    });
  } catch (error) {
    console.error('Error fetching trainer schedule:', error);
    res.status(500).json({ success: false, message: 'Server error fetching trainer schedule' });
  }
});

module.exports = router;
