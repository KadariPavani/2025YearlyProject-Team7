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

// STATIC: Reassign pending approvals for this batch to a new TPO (used on admin reassigns and model hooks)
BatchSchema.statics.reassignPendingApprovalsForBatch = async function(batchId, newTpoId) {
  const Student = mongoose.model('Student');
  const PlacementTrainingBatch = mongoose.model('PlacementTrainingBatch');
  const Notification = require('./Notification');

  try {
    const approvalTypes = ['crt_status_change', 'batch_change'];

    // Normalize newTpoObjectId
    let newTpoObjectId = newTpoId || null;
    if (newTpoObjectId && typeof newTpoObjectId === 'string' && mongoose.isValidObjectId(newTpoObjectId)) {
      newTpoObjectId = new mongoose.Types.ObjectId(newTpoObjectId);
    }

    // Find students that belong to this batch
    const studentIds = (await Student.find({ batchId }).select('_id')).map(s => s._id);

    // Find impacted placement training batches
    const affectedPTBs = await PlacementTrainingBatch.find({
      $or: [
        { batchNumber: (await this.findById(batchId)).batchNumber },
        { students: { $in: studentIds } }
      ]
    }).select('_id');

    const affectedPTBIds = affectedPTBs.map(b => b._id);

    // Primary update for specific approval types
    const res1 = await Student.updateMany(
      { batchId },
      { $set: { 'pendingApprovals.$[elem].assignedTo': newTpoObjectId } },
      { arrayFilters: [{ 'elem.status': 'pending', 'elem.requestType': { $in: approvalTypes } }] }
    );

    // Fallback for any pending approvals without assignedTo
    const res1fb = await Student.updateMany(
      { batchId },
      { $set: { 'pendingApprovals.$[elem].assignedTo': newTpoObjectId } },
      { arrayFilters: [{ 'elem.status': 'pending', $or: [{ 'elem.assignedTo': null }, { 'elem.assignedTo': { $exists: false } }] }] }
    );

    let res2 = { matchedCount: 0, modifiedCount: 0 }, res2fb = { matchedCount: 0, modifiedCount: 0 };
    if (affectedPTBIds.length) {
      res2 = await Student.updateMany(
        { placementTrainingBatchId: { $in: affectedPTBIds } },
        { $set: { 'pendingApprovals.$[elem].assignedTo': newTpoObjectId } },
        { arrayFilters: [{ 'elem.status': 'pending', 'elem.requestType': { $in: approvalTypes } }] }
      );

      res2fb = await Student.updateMany(
        { placementTrainingBatchId: { $in: affectedPTBIds } },
        { $set: { 'pendingApprovals.$[elem].assignedTo': newTpoObjectId } },
        { arrayFilters: [{ 'elem.status': 'pending', $or: [{ 'elem.assignedTo': null }, { 'elem.assignedTo': { $exists: false } }] }] }
      );
    }

    // Notification to new TPO (if any)
    let pendingCount = 0;
    if (newTpoObjectId) {
      pendingCount = await Student.countDocuments({
        $or: [{ batchId }, { placementTrainingBatchId: { $in: affectedPTBIds } }],
        pendingApprovals: { $elemMatch: { status: 'pending', requestType: { $in: approvalTypes }, assignedTo: newTpoObjectId } }
      });

      if (pendingCount > 0) {
        await Notification.create({
          title: 'Pending Approvals Reassigned',
          message: `${pendingCount} pending approval request(s) for batch have been reassigned to you.`,
          category: 'Placement',
          senderId: null,
          senderModel: 'Admin',
          recipients: [{ recipientId: newTpoObjectId, recipientModel: 'TPO', isRead: false }],
          status: 'sent'
        });
      }
    }

    // Return summary
    const updatedStudents = await Student.find({ $or: [{ batchId }, { placementTrainingBatchId: { $in: affectedPTBIds } }] }).select('name rollNo pendingApprovals').lean();

    return { res1, res1fb, res2, res2fb, pendingCount, updatedStudents };
  } catch (err) {
    throw err;
  }
};

// Hook: handle updates via findOneAndUpdate (e.g., direct Mongoose updates)
BatchSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery()).select('tpoId');
    this._originalTpoId = docToUpdate ? (docToUpdate.tpoId ? docToUpdate.tpoId.toString() : null) : null;
    next();
  } catch (err) {
    next(err);
  }
});

BatchSchema.post('findOneAndUpdate', async function(result) {
  try {
    const original = this._originalTpoId;
    const updated = result && result.tpoId ? result.tpoId.toString() : null;

    if (original !== updated) {
      // Reassign pending approvals
      await mongoose.model('Batch').reassignPendingApprovalsForBatch(result._id, result.tpoId);
    }
  } catch (err) {
  }
});

// Hook: handle save (document changes via .save())
BatchSchema.pre('save', function(next) {
  this._tpoWillChange = this.isModified('tpoId');
  next();
});

BatchSchema.post('save', async function(doc) {
  try {
    if (this._tpoWillChange) {
      await mongoose.model('Batch').reassignPendingApprovalsForBatch(doc._id, doc.tpoId);
    }
  } catch (err) {
  }
});

BatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Batch', BatchSchema);