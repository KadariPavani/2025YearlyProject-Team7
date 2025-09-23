const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

// @route   GET /api/admin/batches
// @desc    Get all batches
// @access  Private/Admin
router.get('/batches', auth, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/batches/:batchId/students
// @desc    Get students in a batch
// @access  Private/Admin
router.get('/batches/:batchId/students', auth, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const students = await Student.find({ batch: req.params.batchId })
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching batch students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/batches
// @desc    Create a new batch
// @access  Private/Admin
router.post('/batches', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const batch = await Batch.create({
      name,
      description,
      createdBy: req.admin._id
    });

    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;