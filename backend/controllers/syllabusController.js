// ============================================
// Syllabus Controller
// Extracted from routes/syllabusRoutes.js
// ============================================

const Syllabus = require('../models/syllabus');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// =====================================================
// TRAINER HANDLERS (Create, Read, Update, Delete)
// =====================================================

// Create a new syllabus (trainer only)
const createSyllabus = async (req, res) => {
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

    // Resolve batch identifiers robustly (accept names/numbers or ids)
    let validatedRegularBatches = [];
    let validatedPlacementBatches = [];

    if (assignedBatches && assignedBatches.length > 0) {
      const resolved = await Promise.all(assignedBatches.map(async (candidateRaw) => {
        const candidate = (candidateRaw || '').toString().trim();
        try {
          if (!candidate) return null;
          if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

          let found = await Batch.findOne({ $or: [{ batchNumber: candidate }, { name: candidate }] }).select('_id batchNumber name');
          if (found && found._id) return found._id.toString();

          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await Batch.findOne({ $or: [{ batchNumber: regex }, { name: regex }] }).select('_id batchNumber name');
          if (found && found._id) return found._id.toString();

          console.warn(`Could not resolve regular batch candidate: '${candidateRaw}'`);
          return null;
        } catch (err) {
          console.error('Error resolving regular batch candidate:', candidateRaw, err.message || err);
          return null;
        }
      }));
      validatedRegularBatches = resolved.filter(Boolean);
    }

    if (assignedPlacementBatches && assignedPlacementBatches.length > 0) {
      const resolvedPlacement = await Promise.all(assignedPlacementBatches.map(async (candidateRaw) => {
        const candidate = (candidateRaw || '').toString().trim();
        try {
          if (!candidate) return null;
          if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

          let found = await PlacementTrainingBatch.findOne({ batchNumber: candidate }).select('_id batchNumber');
          if (found && found._id) return found._id.toString();

          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await PlacementTrainingBatch.findOne({ batchNumber: regex }).select('_id batchNumber');
          if (found && found._id) return found._id.toString();

          console.warn(`Could not resolve placement batch candidate: '${candidateRaw}'`);
          return null;
        } catch (err) {
          console.error('Error resolving placement batch candidate:', candidateRaw, err.message || err);
          return null;
        }
      }));
      validatedPlacementBatches = resolvedPlacement.filter(Boolean);
      console.log('Resolved placement batch ids:', validatedPlacementBatches);
    }

    // Reconcile placement ids accidentally passed in validatedRegularBatches
    if (validatedRegularBatches.length > 0) {
      try {
        const placementMatches = await PlacementTrainingBatch.find({ _id: { $in: validatedRegularBatches } }).select('_id');
        const placementIds = placementMatches.map(p => p._id.toString());
        if (placementIds.length > 0) {
          validatedRegularBatches = validatedRegularBatches.filter(id => !placementIds.includes(id));
          validatedPlacementBatches = Array.from(new Set([...(validatedPlacementBatches || []), ...placementIds]));
          console.log(`Moved ${placementIds.length} id(s) from validatedRegularBatches to validatedPlacementBatches because they belong to placement batches:` , placementIds);
        }
      } catch (err) {
        console.error('Error reconciling regular vs placement batch ids in syllabus:', err);
      }
    }

    // Determine final batchType
    let finalBatchType = batchType || 'placement';
    if ((validatedPlacementBatches && validatedPlacementBatches.length > 0) && (validatedRegularBatches && validatedRegularBatches.length > 0)) {
      finalBatchType = 'both';
    } else if (validatedPlacementBatches && validatedPlacementBatches.length > 0) {
      finalBatchType = 'placement';
    } else if (validatedRegularBatches && validatedRegularBatches.length > 0) {
      finalBatchType = 'noncrt';
    }

    const syllabus = new Syllabus({
      title,
      description,
      topics,
      trainerId,
      assignedBatches: validatedRegularBatches,
      assignedPlacementBatches: validatedPlacementBatches,
      batchType: finalBatchType || 'placement', // Default to placement if not provided
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
};

// Get all syllabi for the trainer
const getAllSyllabi = async (req, res) => {
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
};

// Get a single syllabus by ID for trainer
const getSyllabusById = async (req, res) => {
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
};

// Update syllabus (trainer only)
const updateSyllabus = async (req, res) => {
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
};

// Delete syllabus (trainer only)
const deleteSyllabus = async (req, res) => {
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
};

// =====================================================
// STUDENT HANDLERS (Read Only - Filtered by Batch)
// =====================================================

// Get syllabi assigned to the logged-in student (list)
const getStudentSyllabi = async (req, res) => {
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
};

// Get a single syllabus by ID for student
const getStudentSyllabusById = async (req, res) => {
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
};

module.exports = {
  createSyllabus,
  getAllSyllabi,
  getSyllabusById,
  updateSyllabus,
  deleteSyllabus,
  getStudentSyllabi,
  getStudentSyllabusById
};
