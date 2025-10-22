const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TPOSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  linkedIn: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    default: 'tpo',
    immutable: true
  },
  assignedTrainers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  }],
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  managedCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
TPOSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

TPOSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

TPOSchema.methods.canApproveRequest = async function(student) {
  try {
    if (!student) {
      console.log('Student object is null or undefined');
      return false;
    }

    // For debugging
    console.log('Checking permissions for:', {
      tpoId: this._id,
      studentId: student._id,
      tpoBatches: this.assignedBatches,
      studentBatchId: student.batchId,
      studentPlacementBatchId: student.placementTrainingBatchId
    });

    // Always allow TPO to approve if student has no batch
    if (!student.batchId && !student.placementTrainingBatchId) {
      console.log('Student has no batch assignments - allowing approval');
      return true;
    }

    // Get batch IDs as strings for comparison
    const tpoAssignedBatches = this.assignedBatches.map(id => 
      id instanceof mongoose.Types.ObjectId ? id.toString() : id
    );

    const studentBatchIds = [];
    if (student.batchId) {
      const batchId = student.batchId instanceof mongoose.Types.ObjectId 
        ? student.batchId.toString() 
        : student.batchId;
      studentBatchIds.push(batchId);
    }
    if (student.placementTrainingBatchId) {
      const placementBatchId = student.placementTrainingBatchId instanceof mongoose.Types.ObjectId 
        ? student.placementTrainingBatchId.toString() 
        : student.placementTrainingBatchId;
      studentBatchIds.push(placementBatchId);
    }

    // Check if TPO manages any of student's batches
    const hasPermission = studentBatchIds.some(batchId => 
      tpoAssignedBatches.includes(batchId)
    );

    if (!hasPermission) {
      // Attempt to auto-assign batch to TPO if not already assigned
      for (const batchId of studentBatchIds) {
        if (!tpoAssignedBatches.includes(batchId)) {
          try {
            await this.ensureBatchAssignment(batchId);
            return true;
          } catch (error) {
            console.error('Error assigning batch:', error);
          }
        }
      }
      console.log(`TPO ${this._id} does not have permission for student ${student._id}'s batches`);
    }

    return hasPermission;
  } catch (error) {
    console.error('Error in canApproveRequest:', error);
    return false;
  }
};

TPOSchema.methods.ensureBatchAssignment = async function(batchId) {
  try {
    if (!batchId) return false;

    // Handle string or ObjectId input
    const batchIdStr = batchId instanceof mongoose.Types.ObjectId 
      ? batchId.toString() 
      : batchId;

    // Check if batch is already assigned
    const isAssigned = this.assignedBatches.some(id => 
      id.toString() === batchIdStr
    );

    if (!isAssigned) {
      // Convert to ObjectId before pushing
      const batchObjectId = new mongoose.Types.ObjectId(batchIdStr);
      this.assignedBatches.push(batchObjectId);
      await this.save();
      console.log(`Successfully assigned batch ${batchIdStr} to TPO ${this._id}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in ensureBatchAssignment:', error);
    throw error;
  }
};

// Add virtual for pending approvals count
TPOSchema.virtual('pendingApprovalsCount').get(function() {
  return this.pendingApprovals ? this.pendingApprovals.length : 0;
});

// Add method to handle batch assignments
TPOSchema.methods.assignBatch = async function(batchId) {
  if (!this.assignedBatches.includes(batchId)) {
    this.assignedBatches.push(batchId);
    await this.save();
  }
};

module.exports = mongoose.model('TPO', TPOSchema);