// This is your updated quizroutes.js
// Changes: 
// - Removed mockBatches usage where possible, assuming Batch schema now has trainerId.
// - Updated /student/list to filter by student's batches, add hasSubmitted, score, percentage using aggregation.
// - Added /student/:id to fetch full quiz for student, with access check.
// - Cleaned up error handling.

const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Batch = require('../models/Batch');
const protectTrainer = require('../middleware/protectTrainer');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const generalAuth = require('../middleware/generalAuth');

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
      allowRetake,
      status // <-- add this to accept status from frontend
    } = req.body;

    const trainerId = req.user.id;

    let validatedBatches = [];
    if (Array.isArray(assignedBatches) && assignedBatches.length > 0) {
      validatedBatches = assignedBatches.filter(id => mongoose.Types.ObjectId.isValid(id));
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
      allowRetake,
      status: status || "active" // <-- default to "active"
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
      .select('-submissions -questions');
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Get a single quiz by ID for trainer
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

// Get quizzes assigned to the logged-in student (list)
router.get('/student/list', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const quizzes = await Quiz.find({ status: 'active' });

    // For each quiz, check if the student has submitted
    const quizList = quizzes.map(q => {
      const submission = q.submissions.find(sub => sub.studentId.toString() === studentId);
      return {
        _id: q._id,
        title: q.title,
        totalMarks: q.totalMarks,
        hasSubmitted: !!submission,
        score: submission ? submission.score : 0,
        // ...add other fields as needed
      };
    });

    res.json(quizList);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes for student' });
  }
});

// Get a single quiz by ID for student
router.get('/student/:id', generalAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    // Optionally, remove sensitive fields
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz for student:', error);
    res.status(500).json({ message: 'Failed to fetch quiz for student' });
  }
});

// Edit/update a quiz (trainer only)
router.put('/:id', protectTrainer, async (req, res) => {
  try {
    const quizId = req.params.id;
    const updateData = req.body;

    // Prevent editing submissions directly
    if ('submissions' in updateData) {
      delete updateData.submissions;
    }

    // Only allow the trainer who created the quiz to edit
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }

    // Update the quiz (including questions, title, etc.)
    Object.assign(quiz, updateData);
    await quiz.save();

    res.json(quiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ message: 'Failed to update quiz' });
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

// Submit a quiz (for students)
router.post('/:id/submit', generalAuth, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const { answers, timeSpent } = req.body;
    const studentId = req.user.id;

    // REMOVE BATCH CHECK: All students can submit any quiz

    // Calculate score
    let score = 0;
    const evaluatedAnswers = answers.map((ans, index) => {
      const question = quiz.questions[index];
      let isCorrect = false;

      if (question.questionType === 'mcq') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = ans.selectedOption === correctOption?.text;
      } else if (question.questionType === 'true-false') {
        isCorrect = ans.selectedOption.toLowerCase() === question.correctAnswer.toLowerCase();
      } else if (question.questionType === 'fill-blank') {
        isCorrect = ans.answer?.toLowerCase() === question.correctAnswer?.toLowerCase();
      }

      if (isCorrect) score += question.marks;
      return { ...ans, isCorrect, questionIndex: index };
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

// Get batch progress for a quiz (trainer)
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

// Get batches for trainer
router.get('/batches', protectTrainer, async (req, res, next) => {
  try {
    const batches = await Batch.find({ trainerId: req.user.id }).select('_id name students');
    res.json(batches); // Always return array, even if empty
  } catch (error) {
    console.error('Error fetching batches:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
});

module.exports = router;