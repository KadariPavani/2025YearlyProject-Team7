const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: [true, 'Trainer ID is required']
  },
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: [0, 'Total marks cannot be negative']
  },
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'At least one batch is required']
  }],
  attachmentLink: {
    type: String,
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the attachment link']
  },
  submissions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    submissionLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the submission']
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be negative']
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', AssignmentSchema);