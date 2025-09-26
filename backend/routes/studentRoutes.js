// File: routes/studentRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const Student = require('../models/Student');
const generalAuth = require('../middleware/generalAuth'); // import your auth middleware

const router = express.Router();

// Multer storage config for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profile-images/'),
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// GET /api/student/profile
router.get('/profile', generalAuth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const student = await Student.findById(req.user._id);
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

    res.json({ success: true, data: updatedStudent });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to update profile' });
  }
});

// POST /api/student/profile-image
router.post('/profile-image', generalAuth, upload.single('profileImage'), async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!req.file) {
      console.error('No file received');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    console.log('Received file:', req.file);

    const imageUrl = `/uploads/profile-images/${req.file.filename}`;
    const updatedStudent = await Student.findByIdAndUpdate(req.user._id, { profileImageUrl: imageUrl }, { new: true });

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.json({ success: true, data: imageUrl });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload profile image' });
  }
});


module.exports = router;
