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

    // First delete all related placement training batches
    const placementBatches = await PlacementTrainingBatch.find({
      students: { $in: studentIds }
    });

    // Remove each placement batch
    for (const batch of placementBatches) {
      await batch.remove();
    }

    // Update all affected students - set isActive to false and remove references
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { 
        $unset: { 
          batchId: 1,
          placementTrainingBatchId: 1,
          crtBatchId: 1,
          crtBatchName: 1
        },
        $set: {
          isActive: false,
          status: 'inactive'
        }
      }
    );

    next();
  } catch (error) {
    next(error);
  }
});

BatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Batch', BatchSchema);