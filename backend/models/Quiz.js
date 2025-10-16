// Updated Quiz.js - Supports both regular batches and placement training batches
const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required']
  },
  questions: [{
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    questionType: {
      type: String,
      enum: ['mcq', 'true-false', 'fill-blank'],
      default: 'mcq'
    },
    options: [{
      text: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    correctAnswer: String,
    marks: {
      type: Number,
      default: 1
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    explanation: String
  }],
  totalMarks: {
    type: Number,
    required: true
  },
  passingMarks: {
    type: Number,
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  
  // UPDATED: Support both batch types
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'  // For regular batches
  }],
  assignedPlacementBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementTrainingBatch'  // For CRT placement training batches
  }],
  
  // NEW: Batch type indicator
  batchType: {
    type: String,
    enum: ['regular', 'placement', 'both'],
    default: 'regular'
  },
  
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showResultsImmediately: {
    type: Boolean,
    default: true
  },
  allowRetake: {
    type: Boolean,
    default: false
  },
  submissions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    answers: [{
      questionIndex: Number,
      selectedOption: String,
      answer: String,
      isCorrect: Boolean
    }],
    score: Number,
    percentage: Number,
    timeSpent: Number,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    performanceCategory: {
      type: String,
      enum: ['green', 'yellow', 'red'],
      default: 'red'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Virtual to get all assigned batches (both regular and placement)
QuizSchema.virtual('allAssignedBatches').get(function() {
  return [...(this.assignedBatches || []), ...(this.assignedPlacementBatches || [])];
});

// Method to check if a student can access this quiz
QuizSchema.methods.canStudentAccess = function(student) {
  // Check if student's batch is in assigned batches
  if (this.assignedBatches.some(batchId => 
    student.batchId && student.batchId.toString() === batchId.toString())) {
    return true;
  }
  
  // Check if student's placement batch is in assigned placement batches
  if (this.assignedPlacementBatches.some(batchId => 
    student.placementTrainingBatchId && student.placementTrainingBatchId.toString() === batchId.toString())) {
    return true;
  }
  
  return false;
};

QuizSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Quiz', QuizSchema);