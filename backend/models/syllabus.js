const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Syllabus title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  topics: [{
    topicName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    }
  }],
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
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
    enum: ['noncrt', 'placement', 'both', 'regular'],
    default: 'placement'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if a student can access the syllabus
syllabusSchema.methods.canStudentAccess = function(student) {
  // Check non-CRT (former regular) batch assignment
  const isInNonCrtBatch = (this.batchType !== 'placement') &&
    student.batchId &&
    this.assignedBatches.map(id => id.toString()).includes(student.batchId.toString());

  // Check placement batch assignment
  const isInPlacementBatch = (this.batchType !== 'noncrt') &&
    student.placementTrainingBatchId &&
    this.assignedPlacementBatches.map(id => id.toString()).includes(student.placementTrainingBatchId.toString());

  return (isInNonCrtBatch || isInPlacementBatch) && this.status === 'published';
};

module.exports = mongoose.model('Syllabus', syllabusSchema);
