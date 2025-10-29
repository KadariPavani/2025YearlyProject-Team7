// Updated Reference.js - Enhanced with batch support and better organization
const mongoose = require('mongoose');

const ReferenceSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: [true, 'Trainer ID is required']
  },
  topicName: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true
  },
  
  // NEW: Enhanced resource organization
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  module: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  
  // NEW: Multiple resource types
  resources: [{
    type: {
      type: String,
      enum: ['video', 'document', 'link', 'presentation', 'code', 'image'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL']
    },
    description: {
      type: String,
      trim: true
    },
    duration: {
      type: String, // For videos: "45 minutes", "2 hours"
      trim: true
    },
    size: {
      type: String, // For files: "2.5 MB", "150 KB"
      trim: true
    }
  }],
  
  // Legacy fields for backward compatibility
  referenceVideoLink: {
    type: String,
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the video link']
  },
  referenceNotesLink: {
    type: String,
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the notes link']
  },
  
  // NEW: Batch assignments
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
    enum: ['regular', 'placement', 'both', 'public'],
    default: 'public' // Public by default, can be seen by all students
  },
  
  // NEW: Access settings
  isPublic: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'batch-specific', 'student-specific'],
    default: 'public'
  },
  
  // NEW: Learning objectives
  learningObjectives: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  
  // NEW: Tags for better organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // NEW: View statistics
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedBy: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // NEW: Feedback and ratings
  ratings: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      trim: true
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // NEW: Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // NEW: Scheduling
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual to get all assigned batches (both regular and placement)
ReferenceSchema.virtual('allAssignedBatches').get(function() {
  return [...(this.assignedBatches || []), ...(this.assignedPlacementBatches || [])];
});

// Virtual for average rating
ReferenceSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual for total resources count
ReferenceSchema.virtual('resourceCount').get(function() {
  let count = (this.resources || []).length;
  if (this.referenceVideoLink) count++;
  if (this.referenceNotesLink) count++;
  return count;
});

// Method to check if a student can access this reference
ReferenceSchema.methods.canStudentAccess = function(student) {
  // Public resources are accessible to all
  if (this.isPublic || this.accessLevel === 'public') {
    return true;
  }
  
  // Check batch-specific access
  if (this.accessLevel === 'batch-specific') {
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
  }
  
  return false;
};

// Method to record a view
ReferenceSchema.methods.recordView = function(studentId) {
  // Remove existing view record for this student
  this.lastViewedBy = this.lastViewedBy.filter(
    view => view.studentId.toString() !== studentId.toString()
  );
  
  // Add new view record
  this.lastViewedBy.push({
    studentId: studentId,
    viewedAt: new Date()
  });
  
  // Keep only last 50 views
  if (this.lastViewedBy.length > 50) {
    this.lastViewedBy = this.lastViewedBy.slice(-50);
  }
  
  this.viewCount += 1;
};

// Method to add a rating
ReferenceSchema.methods.addRating = function(studentId, rating, feedback = '') {
  // Remove existing rating from this student
  this.ratings = this.ratings.filter(
    r => r.studentId.toString() !== studentId.toString()
  );
  
  // Add new rating
  this.ratings.push({
    studentId: studentId,
    rating: rating,
    feedback: feedback,
    ratedAt: new Date()
  });
};

// Index for better search performance
ReferenceSchema.index({ topicName: 'text', subject: 'text', tags: 'text' });
ReferenceSchema.index({ trainerId: 1, status: 1 });
ReferenceSchema.index({ createdAt: -1 });

ReferenceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Reference', ReferenceSchema);