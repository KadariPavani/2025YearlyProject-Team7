// File: backend/routes/tpoRoutes.js
const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch'); // Add this import

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
      status: req.user.status,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };

    res.json({
      success: true,
      message: 'TPO profile fetched successfully',
      data: userProfile,
      userType: req.userType
    });

  } catch (error) {
    console.error('TPO Profile Error Details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching TPO profile'
    });
  }
});

// UPDATE TPO Profile
router.put('/profile', generalAuth, async (req, res) => {
  try {
    console.log('TPO Profile Update Request:', {
      userId: req.user._id,
      updateData: req.body
    });

    if (req.userType !== 'tpo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow updates to these specific fields from your schema
    const allowedUpdates = ['name', 'phone', 'experience', 'linkedIn'];
    const requestedUpdates = Object.keys(req.body);
    
    // Validate updates
    const isValidOperation = requestedUpdates.every(field => allowedUpdates.includes(field));
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fields for update',
        allowedFields: allowedUpdates
      });
    }

    // Apply updates
    requestedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();

    // Return updated profile with only schema fields
    const updatedProfile = {
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
      status: req.user.status,
      updatedAt: req.user.updatedAt
    };

    res.json({
      success: true,
      message: 'TPO profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error('TPO Profile Update Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating TPO profile'
    });
  }
});

// Check if password change is required
router.get('/check-password-change', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const needsChange = false;
    
    res.json({
      success: true,
      needsPasswordChange: needsChange
    });

  } catch (error) {
    console.error('Password change check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking password change status'
    });
  }
});

// GET Regular Batches (existing functionality)
router.get('/batches', generalAuth, async (req, res) => {
  try {
    const tpoId = req.user._id;

    const batches = await Batch.find({ tpoId })
      .populate('tpoId', 'name email')
      .populate('students', 'name email branch')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    console.error('Error fetching TPO batches:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET Placement Training Batches (NEW ROUTE)
router.get('/placement-training-batches', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'tpo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. TPO route only.'
      });
    }

    const tpoId = req.user._id;

    // Fetch all placement training batches assigned to this TPO
    const batches = await PlacementTrainingBatch.find({ tpoId })
      .populate('tpoId', 'name email')
      .populate('students', 'name email rollNo college branch techStack')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Organize batches hierarchically (Year -> College -> Tech Stack)
    const organized = {};
    let totalStudents = 0;
    let crtBatches = 0;
    let nonCrtBatches = 0;

    batches.forEach(batch => {
      const year = batch.year;
      const studentCount = batch.students.length;
      totalStudents += studentCount;

      // Count CRT vs Non-CRT
      if (batch.techStack === 'NonCRT') {
        nonCrtBatches++;
      } else {
        crtBatches++;
      }

      // Process each college in the batch
      batch.colleges.forEach(college => {
        if (!organized[year]) {
          organized[year] = {};
        }
        if (!organized[year][college]) {
          organized[year][college] = {};
        }
        if (!organized[year][college][batch.techStack]) {
          organized[year][college][batch.techStack] = {
            batches: [],
            totalBatches: 0,
            totalStudents: 0
          };
        }

        organized[year][college][batch.techStack].batches.push({
          _id: batch._id,
          batchNumber: batch.batchNumber,
          studentCount: studentCount,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          isActive: batch.isActive,
          createdAt: batch.createdAt,
          tpoId: batch.tpoId,
          students: batch.students,
          techStack: batch.techStack
        });

        organized[year][college][batch.techStack].totalBatches++;
        organized[year][college][batch.techStack].totalStudents += studentCount;
      });
    });

    res.json({
      success: true,
      message: 'Placement training batches fetched successfully',
      data: {
        organized,
        stats: {
          totalBatches: batches.length,
          totalStudents,
          crtBatches,
          nonCrtBatches
        },
        allBatches: batches
      }
    });

  } catch (error) {
    console.error('Error fetching TPO placement training batches:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching placement training batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;