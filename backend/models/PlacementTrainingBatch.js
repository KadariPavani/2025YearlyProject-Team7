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
  // UPDATED: No enum restriction - completely dynamic!
  techStack: {
    type: String,
    required: true,
    trim: true
    // Removed enum to make it dynamic
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
  coordinators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator'
  }],
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
  },
  assignedTrainers: [{
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
      }
    }],
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }]
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

// Virtual for getting assigned trainer count
PlacementTrainingBatchSchema.virtual('trainerCount').get(function() {
  return this.assignedTrainers ? this.assignedTrainers.length : 0;
});

// Virtual for getting time slot distribution
PlacementTrainingBatchSchema.virtual('timeSlotDistribution').get(function() {
  if (!this.assignedTrainers || this.assignedTrainers.length === 0) {
    return { morning: 0, afternoon: 0, evening: 0 };
  }
  
  return this.assignedTrainers.reduce((acc, assignment) => {
    acc[assignment.timeSlot] = (acc[assignment.timeSlot] || 0) + 1;
    return acc;
  }, { morning: 0, afternoon: 0, evening: 0 });
});

// Add method to get batch statistics by tech stack
PlacementTrainingBatchSchema.statics.getStatsByTechStack = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$techStack',
        count: { $sum: 1 },
        totalStudents: { $sum: { $size: '$students' } }
      }
    },
    {
      $project: {
        techStack: '$_id',
        batchCount: '$count',
        studentCount: '$totalStudents',
        _id: 0
      }
    }
  ]);
  return stats;
};

// Add static method to get available tech stacks
PlacementTrainingBatchSchema.statics.getAvailableTechStacks = async function() {
  const techStacks = await this.distinct('techStack');
  return techStacks.filter(tech => tech && tech !== 'NonCRT');
};

PlacementTrainingBatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PlacementTrainingBatch', PlacementTrainingBatchSchema);
