const express = require('express');
const router = express.Router();
const Syllabus = require('../models/syllabus');
const protectTrainer = require('../middleware/protectTrainer');

router.post('/', protectTrainer, async (req, res, next) => {
  try {
    const { courseId, title, description, topics } = req.body;
    const createdBy = req.user.id;

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ message: 'Topics array is required and must not be empty' });
    }

    const validTopics = topics.every(topic => 
      topic.topicName && topic.duration
    );
    if (!validTopics) {
      return res.status(400).json({ message: 'Each topic must have a name and duration' });
    }

    // Validate or set courseId to null if invalid
    const courseIdValue = courseId && /^[0-9a-fA-F]{24}$/.test(courseId) ? courseId : null;

    const syllabus = new Syllabus({
      courseId: courseIdValue,
      title,
      description,
      topics,
      createdBy
    });

    const savedSyllabus = await syllabus.save();
    res.status(201).json(savedSyllabus);
  } catch (error) {
    console.error('Error creating syllabus:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to create syllabus' });
  }
});

router.get('/', protectTrainer, async (req, res, next) => {
  try {
    const syllabi = await Syllabus.find({ createdBy: req.user.id })
      .populate('courseId', 'name')
      .select('-__v');
    res.json(syllabi);
  } catch (error) {
    console.error('Error fetching syllabi:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch syllabi', error: error.message });
  }
});

// Public endpoint for students to view all syllabi
router.get('/public', async (req, res, next) => {
  try {
    const syllabi = await Syllabus.find({})
      .populate('courseId', 'name')
      .select('-__v');
    res.json(syllabi);
  } catch (error) {
    console.error('Error fetching public syllabi:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch syllabi', error: error.message });
  }
});

router.put('/:id', protectTrainer, async (req, res, next) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus || syllabus.createdBy.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Syllabus not found or not authorized' });
    }

    const { courseId, topics } = req.body;
    if (topics && (!Array.isArray(topics) || topics.length === 0 || !topics.every(topic => topic.topicName && topic.duration))) {
      return res.status(400).json({ message: 'Each topic must have a name and duration' });
    }

    // Validate or set courseId to null if invalid
    const courseIdValue = courseId && /^[0-9a-fA-F]{24}$/.test(courseId) ? courseId : null;

    const updatedSyllabus = await Syllabus.findByIdAndUpdate(req.params.id, {
      ...req.body,
      courseId: courseIdValue
    }, {
      new: true,
      runValidators: true
    }).populate('courseId', 'name');
    res.json(updatedSyllabus);
  } catch (error) {
    console.error('Error updating syllabus:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to update syllabus' });
  }
});

router.delete('/:id', protectTrainer, async (req, res, next) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus || syllabus.createdBy.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Syllabus not found or not authorized' });
    }
    await Syllabus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Error deleting syllabus:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to delete syllabus' });
  }
});

module.exports = router;