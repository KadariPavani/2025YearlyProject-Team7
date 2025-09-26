// File: backend/routes/tpoRoutes.js
const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');

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
      email: req.user.email, // Email can be viewed but not updated
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

    // Simple logic - you can enhance this based on your requirements
    const needsChange = false; // Change this logic as needed
    
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

module.exports = router;