// FIXED Reference.js - Complete Schema with All Issues Resolved

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
  // Only subject, no courseId, set from backend/trainer
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  // Files uploaded to Cloudinary (pdf/docx/ppt etc)
  files: [{
    filename: { type: String, required: true },
    url: { type: String, required: true, trim: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true }, // in bytes
    uploadedAt: { type: Date, default: Date.now }
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
  // Batch assignments
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  assignedPlacementBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementTrainingBatch'
  }],
  batchType: {
    type: String,
    enum: ['noncrt', 'placement', 'both', 'regular', 'public'],
    default: 'public'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'batch-specific', 'student-specific'],
    default: 'public'
  },
  // Learning objectives, prerequisites, tags
  learningObjectives: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // View statistics
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
  // Feedback and ratings
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
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  // Scheduling
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

// Virtual for average rating
ReferenceSchema.virtual('averageRating').get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual for total resources count (files + legacy links)
ReferenceSchema.virtual('resourceCount').get(function() {
  let count = (this.files || []).length;
  if (this.referenceVideoLink) count++;
  if (this.referenceNotesLink) count++;
  return count;
});

// Method to check if a student can access this reference
ReferenceSchema.methods.canStudentAccess = function(student) {
  // Public resources are accessible to everyone
  if (this.isPublic || this.accessLevel === 'public') {
    return true;
  }

  // Batch-specific access
  if (this.accessLevel === 'batch-specific') {
    // Check non-CRT (former regular) batches
    if (this.assignedBatches && this.assignedBatches.length > 0) {
      const hasNonCrtBatchAccess = this.assignedBatches.some(batchId =>
        student.batchId && student.batchId.toString() === batchId.toString()
      );
      if (hasNonCrtBatchAccess) {
        return true;
      }
    }
    
    // Check placement batches
    if (this.assignedPlacementBatches && this.assignedPlacementBatches.length > 0) {
      const hasPlacementBatchAccess = this.assignedPlacementBatches.some(batchId =>
        student.placementTrainingBatchId && 
        student.placementTrainingBatchId.toString() === batchId.toString()
      );
      if (hasPlacementBatchAccess) {
        return true;
      }
    }
  }

  // No access granted
  return false;
};

// Method to record a view
ReferenceSchema.methods.recordView = function(studentId) {
  // Remove previous view by this student
  this.lastViewedBy = this.lastViewedBy.filter(
    view => view.studentId.toString() !== studentId.toString()
  );
  
  // Add new view
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
  // Remove previous rating by this student
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

// Indexes for better query performance
ReferenceSchema.index({ topicName: 'text', subject: 'text', tags: 'text' });
ReferenceSchema.index({ trainerId: 1, status: 1 });
ReferenceSchema.index({ createdAt: -1 });
ReferenceSchema.index({ assignedBatches: 1 });
ReferenceSchema.index({ assignedPlacementBatches: 1 });
ReferenceSchema.index({ accessLevel: 1, isPublic: 1 });

// Enable virtuals in JSON
ReferenceSchema.set('toJSON', { virtuals: true });
ReferenceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reference', ReferenceSchema);
