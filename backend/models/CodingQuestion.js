const mongoose = require('mongoose');

const CodingQuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Question description is required']
  },
  problemStatement: {
    type: String,
    required: [true, 'Problem statement is required']
  },
  constraints: {
    type: String,
    required: true
  },
  inputFormat: {
    type: String,
    required: true
  },
  outputFormat: {
    type: String,
    required: true
  },
  examples: [{
    input: {
      type: String,
      required: true
    },
    output: {
      type: String,
      required: true
    },
    explanation: String
  }],
  testCases: [{
    input: {
      type: String,
      required: true
    },
    expectedOutput: {
      type: String,
      required: true
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    marks: {
      type: Number,
      default: 1
    }
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  tags: [String],
  topic: {
    type: String,
    required: true,
    trim: true
  },
  allowedLanguages: [{
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'c'],
    default: ['javascript', 'python', 'java', 'cpp']
  }],
  timeLimit: {
    type: Number,
    default: 1
  },
  memoryLimit: {
    type: Number,
    default: 256
  },
  totalMarks: {
    type: Number,
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: String,
  endTime: String,
  duration: {
    type: Number,
    default: 60
  },
  submissions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    testCaseResults: [{
      testCaseIndex: Number,
      passed: Boolean,
      actualOutput: String,
      executionTime: Number,
      memoryUsed: Number
    }],
    totalScore: Number,
    percentage: Number,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['submitted', 'running', 'completed', 'error'],
      default: 'submitted'
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CodingQuestion', CodingQuestionSchema);