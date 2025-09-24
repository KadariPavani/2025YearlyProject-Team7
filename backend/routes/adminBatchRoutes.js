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
    const batches = await Batch.find()
      .populate('tpoId', 'name email')
      .populate('students', 'name email branch')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: batches.length,
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
    console.log('Fetching students for batch:', req.params.batchId);
    
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    console.log('Found batch:', batch);
    console.log('Student IDs in batch:', batch.students);

    // Look for students where their batchId matches this batch's ID
    console.log('Finding students with batchId:', req.params.batchId);
    const students = await Student.find({ batchId: req.params.batchId })
      .select('-password -__v') // Exclude password and version fields
      .sort({ name: 1 });
    
    console.log('Found students:', students);

    console.log('Found students:', students);

    res.json({
      success: true,
      data: students,
      batchDetails: {
        batchNumber: batch.batchNumber,
        colleges: batch.colleges
      }
    });
  } catch (error) {
    console.error('Error fetching batch students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/batches/:batchId
// @desc    Update a batch
// @access  Private/Admin
router.put('/batches/:batchId', auth, async (req, res) => {
  try {
    const { batchNumber, colleges, tpoId } = req.body;
    const batch = await Batch.findById(req.params.batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      req.params.batchId,
      { batchNumber, colleges, tpoId },
      { new: true, runValidators: true }
    ).populate('tpoId', 'name email');

    res.json({
      success: true,
      data: updatedBatch
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/admin/batches/:batchId
// @desc    Delete a batch
// @access  Private/Admin
router.delete('/batches/:batchId', auth, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Remove batch references from all students in this batch
    await Student.updateMany(
      { _id: { $in: batch.students } },
      { $unset: { batch: "" } }
    );

    await Batch.findByIdAndDelete(req.params.batchId);

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;