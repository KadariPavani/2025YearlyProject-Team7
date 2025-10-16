// Updated Assignment.js - Supports both regular batches and placement training batches
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
  
  attachmentLink: {
    type: String,
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the attachment link']
  },
  
  // NEW: File attachments support
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number
    },
    fileType: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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
    submissionText: {
      type: String,
      trim: true
    },
    submissionLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the submission']
    },
    submissionFiles: [{
      filename: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileSize: {
        type: Number
      },
      fileType: {
        type: String
      }
    }],
    score: {
      type: Number,
      min: [0, 'Score cannot be negative']
    },
    maxScore: {
      type: Number
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    },
    remarks: {
      type: String,
      trim: true
    },
    feedback: {
      type: String,
      trim: true
    },
    isLate: {
      type: Boolean,
      default: false
    },
    evaluatedAt: {
      type: Date
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer'
    }
  }],
  
  // NEW: Assignment settings
  allowLateSubmission: {
    type: Boolean,
    default: true
  },
  lateSubmissionPenalty: {
    type: Number,
    default: 0, // Percentage penalty
    min: 0,
    max: 100
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  instructions: {
    type: String,
    trim: true
  },
  
  // NEW: Grading rubric
  rubric: [{
    criteria: {
      type: String,
      required: true,
      trim: true
    },
    maxPoints: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Virtual to get all assigned batches (both regular and placement)
AssignmentSchema.virtual('allAssignedBatches').get(function() {
  return [...(this.assignedBatches || []), ...(this.assignedPlacementBatches || [])];
});

// Method to check if a student can access this assignment
AssignmentSchema.methods.canStudentAccess = function(student) {
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

// Method to calculate if submission is late
AssignmentSchema.methods.isSubmissionLate = function(submissionDate) {
  return new Date(submissionDate) > new Date(this.dueDate);
};

// Method to calculate grade based on percentage
AssignmentSchema.methods.calculateGrade = function(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 65) return 'D';
  return 'F';
};

// Pre-save middleware to calculate submission statistics
AssignmentSchema.pre('save', function(next) {
  if (this.submissions && this.submissions.length > 0) {
    this.submissions.forEach(submission => {
      if (submission.score !== undefined && this.totalMarks > 0) {
        submission.percentage = (submission.score / this.totalMarks) * 100;
        submission.grade = this.calculateGrade(submission.percentage);
      }
      
      if (!submission.isLate) {
        submission.isLate = this.isSubmissionLate(submission.submittedAt);
      }
    });
  }
  next();
});

AssignmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);