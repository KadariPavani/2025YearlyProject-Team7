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

// STATIC: Reassign pending approvals for this placement training batch to new TPO
PlacementTrainingBatchSchema.statics.reassignPendingApprovalsForPlacementBatch = async function(batchId, newTpoId) {
  const Student = mongoose.model('Student');
  const Notification = require('./Notification');

  try {
    const approvalTypes = ['crt_status_change', 'batch_change'];

    let newTpoObjectId = newTpoId || null;
    if (newTpoObjectId && typeof newTpoObjectId === 'string' && mongoose.isValidObjectId(newTpoObjectId)) {
      newTpoObjectId = new mongoose.Types.ObjectId(newTpoObjectId);
    }

    // Update pending approvals for students in this placement batch
    const res1 = await Student.updateMany(
      { placementTrainingBatchId: batchId },
      { $set: { 'pendingApprovals.$[elem].assignedTo': newTpoObjectId } },
      { arrayFilters: [{ 'elem.status': 'pending', 'elem.requestType': { $in: approvalTypes } }] }
    );

    // Fallback for approvals without assignedTo
    const res1fb = await Student.updateMany(
      { placementTrainingBatchId: batchId },
      { $set: { 'pendingApprovals.$[elem].assignedTo': newTpoObjectId } },
      { arrayFilters: [{ 'elem.status': 'pending', $or: [{ 'elem.assignedTo': null }, { 'elem.assignedTo': { $exists: false } }] }] }
    );

    // Notify new TPO
    let pendingCount = 0;
    if (newTpoObjectId) {
      pendingCount = await Student.countDocuments({
        placementTrainingBatchId: batchId,
        pendingApprovals: { $elemMatch: { status: 'pending', requestType: { $in: approvalTypes }, assignedTo: newTpoObjectId } }
      });

      if (pendingCount > 0) {
        await Notification.create({
          title: 'Pending Approvals Reassigned',
          message: `${pendingCount} pending approval request(s) for a placement batch have been reassigned to you.`,
          category: 'Placement',
          senderId: null,
          senderModel: 'Admin',
          recipients: [{ recipientId: newTpoObjectId, recipientModel: 'TPO', isRead: false }],
          status: 'sent'
        });
      }
    }

    const updatedStudents = await Student.find({ placementTrainingBatchId: batchId }).select('name rollNo pendingApprovals').lean();

    return { res1, res1fb, pendingCount, updatedStudents };
  } catch (err) {
    console.error('Error in reassignPendingApprovalsForPlacementBatch:', err);
    throw err;
  }
};

// Hooks to catch updates that change tpoId
PlacementTrainingBatchSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery()).select('tpoId');
    this._originalTpoId = docToUpdate ? (docToUpdate.tpoId ? docToUpdate.tpoId.toString() : null) : null;
    next();
  } catch (err) {
    next(err);
  }
});

PlacementTrainingBatchSchema.post('findOneAndUpdate', async function(result) {
  try {
    const original = this._originalTpoId;
    const updated = result && result.tpoId ? result.tpoId.toString() : null;

    if (original !== updated) {
      await mongoose.model('PlacementTrainingBatch').reassignPendingApprovalsForPlacementBatch(result._id, result.tpoId);
    }
  } catch (err) {
    console.error('Error in post findOneAndUpdate hook for PlacementTrainingBatch:', err);
  }
});

PlacementTrainingBatchSchema.pre('save', function(next) {
  this._tpoWillChange = this.isModified('tpoId');
  next();
});

PlacementTrainingBatchSchema.post('save', async function(doc) {
  try {
    if (this._tpoWillChange) {
      await mongoose.model('PlacementTrainingBatch').reassignPendingApprovalsForPlacementBatch(doc._id, doc.tpoId);
    }
  } catch (err) {
    console.error('Error in post save hook for PlacementTrainingBatch:', err);
  }
});

PlacementTrainingBatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PlacementTrainingBatch', PlacementTrainingBatchSchema);
