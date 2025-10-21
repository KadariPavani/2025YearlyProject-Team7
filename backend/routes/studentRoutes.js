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

// Placement training batch assignment function
async function assignStudentToPlacementTrainingBatch(student) {
  if (!student.college) throw new Error('Student college is required');

  // Remove student from any existing placement training batch
  if (student.placementTrainingBatchId) {
    await PlacementTrainingBatch.findByIdAndUpdate(student.placementTrainingBatchId, {
      $pull: { students: student._id }
    });
  }

  // Get TPO based on student's batch assignment and Admin
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
    const validTechs = ['Java', 'Python', 'AI/ML'];
    const selectedTech = student.techStack.find(t => validTechs.includes(t));
    if (selectedTech) {
      techStack = selectedTech;
    }
  }

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

    const batchNumber = `PT_${year}_${student.college}_${techStack}_${existingBatches + 1}`;

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
    console.log('Created new placement training batch:', batchNumber);
  }

  // Add student to placement training batch if not already present
  if (!placementBatch.students.includes(student._id)) {
    placementBatch.students.push(student._id);
    await placementBatch.save();
  }

  // Update student with placement training batch reference
  student.placementTrainingBatchId = placementBatch._id;
  // Keep crtBatchId for compatibility, but now it points to placement training batch
  student.crtBatchId = placementBatch._id;
  student.crtBatchName = placementBatch.batchNumber;
  await student.save();

  console.log(`Assigned student ${student.name} to placement training batch ${placementBatch.batchNumber} with TPO ${tpo.name}`);
}

// GET /api/student/profile
router.get('/profile', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const student = await Student.findById(req.user._id)
      .populate({
        path: 'placementTrainingBatchId',
        model: 'PlacementTrainingBatch',
        select: 'batchNumber colleges techStack startDate endDate year',
        populate: {
          path: 'tpoId',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'batchId',
        model: 'Batch',
        select: 'batchNumber colleges'
      });
      
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    res.json({ success: true, data: student });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// PUT /api/student/profile
router.put('/profile', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Assign student to placement training batch (separate from regular batches)
    await assignStudentToPlacementTrainingBatch(updatedStudent);

    // Fetch the updated student with placement training batch info
    const finalStudent = await Student.findById(req.user._id)
      .populate({
        path: 'placementTrainingBatchId',
        model: 'PlacementTrainingBatch',
        select: 'batchNumber colleges techStack startDate endDate year',
        populate: {
          path: 'tpoId',
          select: 'name email'
        }
      })
      .populate({
        path: 'batchId',
        model: 'Batch',
        select: 'batchNumber colleges'
      });

    res.json({ success: true, data: finalStudent });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update profile' });
  }
});

// POST /api/student/profile-image
router.post('/profile-image', generalAuth, (req, res) => {
  profileUpload(req, res, async (err) => {
    if (err) {
      console.error('Profile upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }

    try {
      if (req.userType !== 'student') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        req.user._id,
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
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload profile image' 
      });
    }
  });
});

// POST /api/student/resume
router.post('/resume', generalAuth, (req, res) => {
  resumeUpload(req, res, async (err) => {
    if (err) {
      console.error('Resume upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }

    try {
      if (req.userType !== 'student') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        req.user._id,
        {
          resumeUrl: req.file.path,
          resumeFileName: req.file.originalname
        },
        { new: true }
      );

      if (!updatedStudent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found' 
        });
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
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload resume' 
      });
    }
  });
});

// GET /api/student/check-password-change
router.get('/check-password-change', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const needsPasswordChange = !student.lastLogin || student.password === student.username;

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

    const studentId = req.user._id;

    const student = await Student.findById(studentId).populate({
      path: 'batchId',
      populate: { path: 'tpoId', select: 'name email phone' }
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
          _id: student.batchId._id,
          batchNumber: student.batchId.batchNumber,
          colleges: student.batchId.colleges,
          startDate: student.batchId.startDate,
          endDate: student.batchId.endDate,
        },
        tpo: student.batchId.tpoId || null,
      },
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

    const studentId = req.user._id;
    
    // Find student with placement training batch info
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
            _id: assignment.trainer._id,
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
          _id: student._id,
          name: student.name,
          email: student.email,
          college: student.college,
          branch: student.branch,
          yearOfPassing: student.yearOfPassing
        },
        placementBatch: {
          _id: placementBatch._id,
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

    const studentId = req.user._id;
    
    // Find student's placement training batch
    const student = await Student.findById(studentId);
    
    if (!student || !student.placementTrainingBatchId) {
      return res.status(404).json({
        success: false,
        message: 'No placement training batch found'
      });
    }

    const placementBatch = await PlacementTrainingBatch.findById(student.placementTrainingBatchId)
      .populate('assignedTrainers.trainer', 'name email phone subjectDealing category');

    if (!placementBatch) {
      return res.status(404).json({
        success: false,
        message: 'Placement training batch not found'
      });
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
    res.status(500).json({
      success: false,
      message: 'Server error fetching trainer schedule'
    });
  }
});

module.exports = router;
