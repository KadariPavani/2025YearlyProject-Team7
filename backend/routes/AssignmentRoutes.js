const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Batch = require('../models/Batch');
const protectTrainer = require('../middleware/protectTrainer');
const mongoose = require('mongoose');

// Mock batches from quizroutes.js
const mockBatches = [
  { 
    _id: new mongoose.Types.ObjectId(), 
    name: 'Batch A', 
    college: 'KIET', 
    branch: 'CSE', 
    academicYear: '2023-2024', 
    trainerId: null, 
    tpoId: new mongoose.Types.ObjectId(), 
    createdBy: new mongoose.Types.ObjectId(), 
    startDate: new Date(), 
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
  },
  { 
    _id: new mongoose.Types.ObjectId(), 
    name: 'Batch B', 
    college: 'KIEK', 
    branch: 'ECE', 
    academicYear: '2023-2024', 
    trainerId: null, 
    tpoId: new mongoose.Types.ObjectId(), 
    createdBy: new mongoose.Types.ObjectId(), 
    startDate: new Date(), 
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
  },
  { 
    _id: new mongoose.Types.ObjectId(), 
    name: 'Batch C', 
    college: 'KIEW', 
    branch: 'ME', 
    academicYear: '2023-2024', 
    trainerId: null, 
    tpoId: new mongoose.Types.ObjectId(), 
    createdBy: new mongoose.Types.ObjectId(), 
    startDate: new Date(), 
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
  }
];

// Create a new assignment
router.post('/', protectTrainer, async (req, res, next) => {
  try {
    const { title, description, subject, dueDate, totalMarks, assignedBatches, attachmentLink } = req.body;
    const trainerId = req.user.id;

    // Fetch available batches for the trainer
    let availableBatches = await Batch.find({ trainerId }).select('_id name');
    if (availableBatches.length === 0) {
      console.warn('No batches found for trainer, using mock batches exclusively');
      availableBatches = mockBatches;
    }

    // Validate assignedBatches using available batches (mock or real)
    let validatedBatches = [];
    if (Array.isArray(assignedBatches) && assignedBatches.length > 0) {
      validatedBatches = assignedBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validatedBatches.length !== assignedBatches.length) {
        return res.status(400).json({ message: 'Invalid batch IDs provided' });
      }
      // Validate against available batches (mock if no real ones)
      validatedBatches = validatedBatches.filter(id => 
        availableBatches.some(b => b._id.toString() === id)
      );
      if (validatedBatches.length === 0) {
        return res.status(400).json({ message: 'No valid batches selected' });
      }
    } else {
      const randomBatch = availableBatches[Math.floor(Math.random() * availableBatches.length)];
      validatedBatches = [randomBatch._id];
    }

    const assignment = new Assignment({
      trainerId,
      title,
      description,
      subject,
      dueDate,
      totalMarks,
      assignedBatches: validatedBatches,
      attachmentLink
    });

    const savedAssignment = await assignment.save();
    res.status(201).json(savedAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to create assignment' });
  }
});

// Get all assignments for the trainer
router.get('/', protectTrainer, async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ trainerId: req.user.id })
      .populate('assignedBatches', 'name')
      .select('-submissions');
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// Update an assignment
router.put('/:id', protectTrainer, async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or not authorized' });
    }

    // Validate assignedBatches if provided
    if (req.body.assignedBatches) {
      let availableBatches = await Batch.find({ trainerId: req.user.id }).select('_id name');
      if (availableBatches.length === 0) {
        console.warn('No batches found for trainer, using mock batches');
        availableBatches = mockBatches;
      }

      const validatedBatches = req.body.assignedBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validatedBatches.length !== req.body.assignedBatches.length) {
        return res.status(400).json({ message: 'Invalid batch IDs provided' });
      }
      validatedBatches = validatedBatches.filter(id => 
        availableBatches.some(b => b._id.toString() === id)
      );
      if (validatedBatches.length === 0) {
        return res.status(400).json({ message: 'No valid batches selected' });
      }
      req.body.assignedBatches = validatedBatches;
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedBatches', 'name');
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to update assignment' });
  }
});

// Delete an assignment
router.delete('/:id', protectTrainer, async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || assignment.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Assignment not found or not authorized' });
    }
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

// Get batches for trainer (reusing quiz routes for consistency)
router.get('/batches', protectTrainer, async (req, res, next) => {
  try {
    let batches = await Batch.find({ trainerId: req.user.id }).select('_id name');
    if (batches.length === 0) {
      console.warn('No batches found for trainer, returning mock batches');
      batches = mockBatches;
    }
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
});

// Public endpoint for students to view assignments
router.get('/public', async (req, res, next) => {
  try {
    const assignments = await Assignment.find({})
      .populate('trainerId', 'name')
      .populate('assignedBatches', 'name')
      .select('-submissions');
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching public assignments:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

module.exports = router;