const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  attachments: [{
    filename: String,
    fileUrl: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  instructions: {
    type: String,
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxMarks: {
    type: Number,
    required: [true, 'Maximum marks is required']
  },
  submissionFormat: {
    type: String,
    enum: ['file', 'text', 'both'],
    default: 'file'
  },
  allowedFileTypes: [String],
  maxFileSize: {
    type: Number,
    default: 10
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
  submissions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    submissionText: String,
    attachments: [{
      filename: String,
      fileUrl: String,
      fileSize: Number
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    isLateSubmission: {
      type: Boolean,
      default: false
    },
    grade: {
      marks: Number,
      feedback: String,
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer'
      }
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'assigned', 'completed'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', AssignmentSchema);