const mongoose = require('mongoose');

const PlacementTrainingBatchSchema = new mongoose.Schema({
  batchNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  colleges: [{
    type: String,
    enum: ['KIET', 'KIEK', 'KIEW'],
    required: true
  }],
  techStack: {
    type: String,
    enum: ['Java', 'Python', 'AI/ML', 'NonCRT'],
    required: true
  },
  year: {
    type: String,
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  tpoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', 
    required: true
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Virtual for status based on dates
PlacementTrainingBatchSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.startDate > now) return 'Not Yet Started';
  else if (this.endDate < now) return 'Completed';
  else return 'Ongoing';
});

PlacementTrainingBatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PlacementTrainingBatch', PlacementTrainingBatchSchema);