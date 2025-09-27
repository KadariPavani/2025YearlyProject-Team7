const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const TPO = require('../models/TPO');
const Admin = require('../models/Admin');
const generalAuth = require('../middleware/generalAuth');
const cloudinary = require('../config/cloudinary');

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
          select: 'name email'
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
router.post('/profile-image', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') return res.status(403).json({ success: false, message: 'Access denied' });
    if (!req.files || !req.files.profileImage) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const profileImage = req.files.profileImage;

    const result = await cloudinary.uploader.upload(profileImage.tempFilePath, {
      folder: 'profile-images',
      public_id: `student_${req.user._id}_${Date.now()}`,
    });

    const updatedStudent = await Student.findByIdAndUpdate(
      req.user._id,
      { profileImageUrl: result.secure_url },
      { new: true }
    );

    res.json({ success: true, data: updatedStudent.profileImageUrl });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile image' });
  }
});

// POST /api/student/resume
router.post('/resume', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const resumeFile = req.files.resume;

    // Check file type
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = resumeFile.name.toLowerCase().substring(resumeFile.name.lastIndexOf('.'));

    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({ success: false, message: 'Only PDF, DOC, and DOCX files are allowed' });
    }

    const result = await cloudinary.uploader.upload(resumeFile.tempFilePath, {
      folder: 'resumes',
      resource_type: 'auto',
      public_id: `student_resume_${req.user._id}_${Date.now()}`,
      format: fileExtension.substring(1)
    });

    const updatedStudent = await Student.findByIdAndUpdate(
      req.user._id,
      {
        resumeUrl: result.secure_url,
        resumeFileName: resumeFile.name
      },
      { new: true }
    );

    return res.json({
      success: true,
      data: {
        url: updatedStudent.resumeUrl,
        fileName: resumeFile.name
      }
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ success: false, message: 'Failed to upload resume' });
  }
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

module.exports = router;
