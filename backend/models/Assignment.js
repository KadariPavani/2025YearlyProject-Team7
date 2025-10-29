// FIXED Assignment Model with Extension Field
// models/Assignment.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assignmentSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  dueDate: { type: Date, required: true },
  totalMarks: { type: Number, required: true },
  trainerId: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
  assignedBatches: [{ type: Schema.Types.ObjectId, ref: 'Batch' }],
  assignedPlacementBatches: [{ type: Schema.Types.ObjectId, ref: 'PlacementTrainingBatch' }],
  batchType: { type: String, enum: ['regular', 'placement', 'both'], required: true },
  attachments: [{
    url: String,
    publicId: String,
    originalName: String,
    uploadedAt: Date,
    size: Number,
    mimeType: String,
    extension: String // ADDED: Store file extension separately
  }],
  submissions: [{
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    files: [{
      url: String,
      publicId: String,
      originalName: String,
      uploadedAt: Date,
      size: Number,
      mimeType: String,
      extension: String // ADDED: Store file extension separately
    }],
    submittedAt: Date,
    isLate: Boolean,
    score: Number,
    remarks: String,
    feedback: String,
    evaluatedAt: Date,
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'Trainer' }
  }],
  instructions: String,
  allowLateSubmission: { type: Boolean, default: false },
  lateSubmissionPenalty: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 1 },
  rubric: [{ criteria: String, points: Number }],
  createdAt: { type: Date, default: Date.now }
});

assignmentSchema.methods.canStudentAccess = function(student) {
  return (
    (this.batchType === 'regular' && student.batchId && this.assignedBatches.includes(student.batchId)) ||
    (this.batchType === 'placement' && student.placementTrainingBatchId && this.assignedPlacementBatches.includes(student.placementTrainingBatchId)) ||
    (this.batchType === 'both' && (
      (student.batchId && this.assignedBatches.includes(student.batchId)) ||
      (student.placementTrainingBatchId && this.assignedPlacementBatches.includes(student.placementTrainingBatchId))
    ))
  );
};

// Virtual to get submission count
assignmentSchema.virtual('submissionCount').get(function() {
  return this.submissions ? this.submissions.length : 0;
});

// Virtual to get graded submission count
assignmentSchema.virtual('gradedCount').get(function() {
  return this.submissions ? this.submissions.filter(s => s.score !== undefined && s.score !== null).length : 0;
});

// Ensure virtuals are included in JSON
assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
