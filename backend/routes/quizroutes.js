const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Batch = require('../models/Batch');
const protectTrainer = require('../middleware/protectTrainer');
const mongoose = require('mongoose');

// Mock batch data as fallback (temporary)
const mockBatches = [
  { 
    _id: new mongoose.Types.ObjectId(), 
    name: 'Batch A (CSE)', 
    college: 'KIET', 
    branch: 'CSE', 
    academicYear: '2023-2024', 
    trainerId: null, 
    tpoId: new mongoose.Types.ObjectId(), 
    createdBy: new mongoose.Types.ObjectId(), 
    startDate: new Date(), 
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    students: [
      { _id: new mongoose.Types.ObjectId(), name: 'John Doe', email: 'john@example.com' },
      { _id: new mongoose.Types.ObjectId(), name: 'Jane Smith', email: 'jane@example.com' },
      { _id: new mongoose.Types.ObjectId(), name: 'Mike Johnson', email: 'mike@example.com' }
    ]
  },
  { 
    _id: new mongoose.Types.ObjectId(), 
    name: 'Batch B (ECE)', 
    college: 'KIEK', 
    branch: 'ECE', 
    academicYear: '2023-2024', 
    trainerId: null, 
    tpoId: new mongoose.Types.ObjectId(), 
    createdBy: new mongoose.Types.ObjectId(), 
    startDate: new Date(), 
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    students: [
      { _id: new mongoose.Types.ObjectId(), name: 'Alice Brown', email: 'alice@example.com' },
      { _id: new mongoose.Types.ObjectId(), name: 'Bob Wilson', email: 'bob@example.com' }
    ]
  },
  { 
    _id: new mongoose.Types.ObjectId(), 
    name: 'Batch C (ME)', 
    college: 'KIEW', 
    branch: 'ME', 
    academicYear: '2023-2024', 
    trainerId: null, 
    tpoId: new mongoose.Types.ObjectId(), 
    createdBy: new mongoose.Types.ObjectId(), 
    startDate: new Date(), 
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    students: [
      { _id: new mongoose.Types.ObjectId(), name: 'Sarah Davis', email: 'sarah@example.com' },
      { _id: new mongoose.Types.ObjectId(), name: 'Tom Miller', email: 'tom@example.com' },
      { _id: new mongoose.Types.ObjectId(), name: 'Lisa Garcia', email: 'lisa@example.com' },
      { _id: new mongoose.Types.ObjectId(), name: 'David Martinez', email: 'david@example.com' }
    ]
  }
];

// Create a new quiz
router.post('/', protectTrainer, async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      scheduledDate,
      startTime,
      endTime,
      duration,
      questions,
      totalMarks,
      passingMarks,
      assignedBatches,
      shuffleQuestions,
      showResultsImmediately,
      allowRetake
    } = req.body;

    const trainerId = req.user.id;

    // Fetch available batches for the trainer
    let availableBatches = await Batch.find({ trainerId }).select('_id name');
    if (availableBatches.length === 0) {
      console.warn('No batches found for trainer, using mock batches');
      availableBatches = mockBatches;
    }

    // Validate assignedBatches
    let validatedBatches = [];
    if (Array.isArray(assignedBatches) && assignedBatches.length > 0) {
      validatedBatches = assignedBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validatedBatches.length !== assignedBatches.length) {
        return res.status(400).json({ message: 'Invalid batch IDs provided' });
      }
      // Verify batches belong to the trainer (for real batches) or exist in mock data
      if (availableBatches !== mockBatches) {
        const validBatches = await Batch.find({
          _id: { $in: validatedBatches },
          trainerId
        });
        if (validBatches.length !== validatedBatches.length) {
          return res.status(400).json({ message: 'Some batch IDs are not assigned to this trainer' });
        }
      } else {
        // For mock batches, just validate they exist in our mock data
        validatedBatches = validatedBatches.filter(id => 
          mockBatches.some(b => b._id.toString() === id)
        );
        if (validatedBatches.length === 0) {
          return res.status(400).json({ message: 'No valid batches selected from available mock batches' });
        }
      }
    } else {
      // Assign a random batch if none provided
      const randomBatch = availableBatches[Math.floor(Math.random() * availableBatches.length)];
      validatedBatches = [randomBatch._id];
    }

    const quiz = new Quiz({
      title,
      description,
      subject,
      scheduledDate,
      startTime,
      endTime,
      duration,
      questions,
      totalMarks,
      passingMarks,
      trainerId,
      assignedBatches: validatedBatches,
      shuffleQuestions,
      showResultsImmediately,
      allowRetake
    });

    const savedQuiz = await quiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error('Error creating quiz:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to create quiz' });
  }
});

// Get all quizzes for the trainer
router.get('/', protectTrainer, async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ trainerId: req.user.id })
      .populate('assignedBatches', 'name')
      .select('-submissions');
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Get a single quiz by ID
router.get('/:id', protectTrainer, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('assignedBatches', 'name')
      .select('-submissions');
    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

// Update a quiz
router.put('/:id', protectTrainer, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
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

      if (availableBatches !== mockBatches) {
        const validBatches = await Batch.find({
          _id: { $in: validatedBatches },
          trainerId: req.user.id
        });
        if (validBatches.length !== validatedBatches.length) {
          return res.status(400).json({ message: 'Some batch IDs are not assigned to this trainer' });
        }
      }
      req.body.assignedBatches = validatedBatches;
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedBatches', 'name');
    res.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/:id', protectTrainer, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
});

// Submit a quiz (for students; placeholder for student auth)
router.post('/:id/submit', async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const { answers, studentId, timeSpent } = req.body;

    // Calculate score
    let score = 0;
    const evaluatedAnswers = answers.map((ans, index) => {
      const question = quiz.questions[index];
      let isCorrect = false;

      if (question.questionType === 'mcq') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = ans.selectedOption === correctOption?.text;
      } else if (question.questionType === 'true-false') {
        isCorrect = ans.selectedOption === question.correctAnswer;
      } else if (question.questionType === 'fill-blank') {
        isCorrect = ans.answer?.toLowerCase() === question.correctAnswer?.toLowerCase();
      }

      if (isCorrect) score += question.marks;
      return { ...ans, isCorrect };
    });

    const percentage = (score / quiz.totalMarks) * 100;
    let performanceCategory;
    if (percentage >= 80) performanceCategory = 'green';
    else if (percentage >= 60) performanceCategory = 'yellow';
    else performanceCategory = 'red';

    const submission = {
      studentId,
      answers: evaluatedAnswers,
      score,
      percentage,
      timeSpent,
      performanceCategory,
      attemptNumber: quiz.submissions.filter(sub => sub.studentId.toString() === studentId).length + 1
    };

    quiz.submissions.push(submission);
    await quiz.save();

    res.json({ score, percentage, performanceCategory });
  } catch (error) {
    console.error('Error submitting quiz:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

// Get batch progress for a quiz
router.get('/:id/batch-progress', protectTrainer, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('submissions.studentId', 'name')
      .populate('assignedBatches', 'name')
      .select('submissions assignedBatches trainerId');
    
    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }

    const progress = quiz.submissions.map(sub => ({
      studentId: sub.studentId._id,
      studentName: sub.studentId.name,
      score: sub.score,
      percentage: sub.percentage,
      performanceCategory: sub.performanceCategory,
      timeSpent: sub.timeSpent,
      submittedAt: sub.submittedAt
    }));

    res.json({ progress, batches: quiz.assignedBatches });
  } catch (error) {
    console.error('Error fetching batch progress:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch batch progress' });
  }
});

// Get batches for trainer (MUST be before '/:id' routes)
router.get('/batches', protectTrainer, async (req, res, next) => {
  try {
    let batches = await Batch.find({ trainerId: req.user.id }).select('_id name students');
    if (batches.length === 0) {
      console.warn('No batches found for trainer, returning mock batches');
      batches = mockBatches.map(batch => ({
        _id: batch._id,
        name: batch.name,
        students: batch.students || []
      }));
    }
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
});

module.exports = router;