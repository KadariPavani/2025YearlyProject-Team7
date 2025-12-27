const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');
const Syllabus = require('../models/Syllabus');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// =====================================================
// TRAINER ROUTES (Create, Read, Update, Delete)
// =====================================================

// Create a new syllabus (trainer only)
router.post('/', generalAuth, async (req, res) => {
  try {
    const { title, description, topics, assignedBatches, assignedPlacementBatches, batchType } = req.body;
    const trainerId = req.user.id;

    // Validate topics
    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ message: 'Topics array is required and must not be empty' });
    }

    const validTopics = topics.every(topic => topic.topicName && topic.duration);
    if (!validTopics) {
      return res.status(400).json({ message: 'Each topic must have a name and duration' });
    }

    // Validate batch assignments
    let validatedRegularBatches = [];
    let validatedPlacementBatches = [];

    // Support both 'noncrt' (new) and legacy 'regular'
    if (batchType === 'noncrt' || batchType === 'regular' || batchType === 'both') {
      if (assignedBatches && assignedBatches.length > 0) {
        validatedRegularBatches = assignedBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
      }
    }

    if (batchType === 'placement' || batchType === 'both') {
      if (assignedPlacementBatches && assignedPlacementBatches.length > 0) {
        validatedPlacementBatches = assignedPlacementBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
      }
    }

    const syllabus = new Syllabus({
      title,
      description,
      topics,
      trainerId,
      assignedBatches: validatedRegularBatches,
      assignedPlacementBatches: validatedPlacementBatches,
      batchType: batchType || 'placement', // Default to placement if not provided
      status: 'published' // Ensure published by default
    });

    const savedSyllabus = await syllabus.save();

    // Populate for response
    await savedSyllabus.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);

    res.status(201).json(savedSyllabus);
  } catch (error) {
    console.error('Error creating syllabus:', error);
    res.status(400).json({ message: error.message || 'Failed to create syllabus' });
  }
});

// Get all syllabi for the trainer
router.get('/', generalAuth, async (req, res) => {
  try {
    const syllabi = await Syllabus.find({ trainerId: req.user.id })
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json(syllabi);
  } catch (error) {
    console.error('Error fetching syllabi:', error);
    res.status(500).json({ message: 'Failed to fetch syllabi' });
  }
});

// Get a single syllabus by ID for trainer
router.get('/:id', generalAuth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ]);

    if (!syllabus || syllabus.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Syllabus not found or not authorized' });
    }

    res.json(syllabus);
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    res.status(500).json({ message: 'Failed to fetch syllabus' });
  }
});

// Update syllabus (trainer only)
router.put('/:id', generalAuth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus || syllabus.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Syllabus not found or not authorized' });
    }

    const { title, description, topics, assignedBatches, assignedPlacementBatches, batchType } = req.body;

    // Validate topics if provided
    if (topics) {
      if (!Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ message: 'Topics array is required and must not be empty' });
      }
      const validTopics = topics.every(topic => topic.topicName && topic.duration);
      if (!validTopics) {
        return res.status(400).json({ message: 'Each topic must have a name and duration' });
      }
    }

    // Update fields
    if (title) syllabus.title = title;
    if (description !== undefined) syllabus.description = description;
    if (topics) syllabus.topics = topics;
    if (batchType) syllabus.batchType = batchType;

    if (assignedBatches) {
      syllabus.assignedBatches = assignedBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
    }
    if (assignedPlacementBatches) {
      syllabus.assignedPlacementBatches = assignedPlacementBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
    }

    const updatedSyllabus = await syllabus.save();

    // Populate for response
    await updatedSyllabus.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);

    res.json(updatedSyllabus);
  } catch (error) {
    console.error('Error updating syllabus:', error);
    res.status(400).json({ message: error.message || 'Failed to update syllabus' });
  }
});

// Delete syllabus (trainer only)
router.delete('/:id', generalAuth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus || syllabus.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Syllabus not found or not authorized' });
    }

    await Syllabus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    res.status(500).json({ message: 'Failed to delete syllabus' });
  }
});

// =====================================================
// STUDENT ROUTES (Read Only - Filtered by Batch)
// =====================================================

// Get syllabi assigned to the logged-in student (list)
router.get('/student/list', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student information to check their batch assignments
    const student = await Student.findById(studentId)
      .select('batchId placementTrainingBatchId')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Build query to find syllabi accessible to this student
    const query = { $or: [], status: 'published' }; // Only published syllabi

    // Add regular batch condition if student has a batchId
    if (student.batchId) {
      query.$or.push({
        batchType: { $in: ['noncrt', 'regular', 'both'] },
        assignedBatches: student.batchId
      });
    }

    // Add placement batch condition if student has placementTrainingBatchId
    if (student.placementTrainingBatchId) {
      query.$or.push({
        batchType: { $in: ['placement', 'both'] },
        assignedPlacementBatches: student.placementTrainingBatchId
      });
    }

    // If student has no batch assignments, return empty array
    if (query.$or.length === 0) {
      return res.json([]);
    }

    const syllabi = await Syllabus.find(query)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json(syllabi);
  } catch (error) {
    console.error('Error fetching syllabi for student:', error);
    res.status(500).json({ message: 'Failed to fetch syllabi for student' });
  }
});

// Get a single syllabus by ID for student
router.get('/student/:id', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const syllabusId = req.params.id;

    const [syllabus, student] = await Promise.all([
      Syllabus.findById(syllabusId),
      Student.findById(studentId).select('batchId placementTrainingBatchId')
    ]);

    if (!syllabus || !student) {
      return res.status(404).json({ message: 'Syllabus or student not found' });
    }

    // Check if student can access this syllabus
    const canAccess = syllabus.canStudentAccess(student);
    if (!canAccess) {
      return res.status(403).json({ message: 'You are not authorized to access this syllabus' });
    }

    // Populate and return
    await syllabus.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);

    res.json(syllabus);
  } catch (error) {
    console.error('Error fetching syllabus for student:', error);
    res.status(500).json({ message: 'Failed to fetch syllabus for student' });
  }
});

module.exports = router;
