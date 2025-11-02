const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    unique: true
  },
  colleges: [{
    type: String,
    enum: ['KIET', 'KIEK', 'KIEW'],
    required: true
  }],
  isCrt: {
    type: Boolean,
    default: false
  },
  // NEW FIELD: Dynamic tech stacks allowed for this batch
  allowedTechStacks: [{
    type: String,
    trim: true,
    // No enum - completely dynamic!
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
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for status based on dates
BatchSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.startDate > now) return 'Not Yet Started';
  else if (this.endDate < now) return 'Completed';
  else return 'Ongoing';
});

// Method to get available CRT batch options for students
BatchSchema.methods.getAvailableCRTOptions = function() {
  // Always include NonCRT as an option
  const options = ['NonCRT'];
  
  // Add configured tech stacks
  if (this.allowedTechStacks && this.allowedTechStacks.length > 0) {
    options.push(...this.allowedTechStacks);
  }
  
  return options;
};

// Add pre-remove middleware for cascading deletion
BatchSchema.pre('remove', async function(next) {
  try {
    const PlacementTrainingBatch = mongoose.model('PlacementTrainingBatch');
    const Student = mongoose.model('Student');

    // Get all students in this batch
    const students = await Student.find({ batchId: this._id });
    const studentIds = students.map(s => s._id);

    // Delete all related placement training batches
    await PlacementTrainingBatch.deleteMany({
      students: { $in: studentIds }
    });

    // Delete all students
    await Student.deleteMany({ batchId: this._id });

    next();
  } catch (error) {
    next(error);
  }
});

BatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Batch', BatchSchema);