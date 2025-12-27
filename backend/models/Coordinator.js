// File: backend/models/Coordinator.js (Updated)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CoordinatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
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
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required']
    // Remove unique constraint
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  assignedPlacementBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementTrainingBatch',
    required: [true, 'Placement batch reference is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: [true, 'TPO reference is required']
  },
  lastLogin: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add compound unique index for rollNo and assignedPlacementBatch
CoordinatorSchema.index({ rollNo: 1, assignedPlacementBatch: 1 }, { unique: true });

// Pre-save middleware for password hashing
CoordinatorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Add method to get original student email
CoordinatorSchema.methods.getStudentEmail = function() {
  return this.email.replace('.coordinator@', '@');
};

// Modify password verification to work with both hashed and unhashed passwords
CoordinatorSchema.methods.matchPassword = async function(enteredPassword) {
  const password = this.password;
  if (!password) return false;
  return await bcrypt.compare(enteredPassword, password);
};

// Lockout helpers
CoordinatorSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

CoordinatorSchema.methods.incrementFailedLogin = async function() {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= 3) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save();
};

CoordinatorSchema.methods.resetFailedLogin = async function() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Add virtual for batch details
CoordinatorSchema.virtual('batchDetails').get(function() {
  if (!this.assignedPlacementBatch) return null;
  return {
    batchNumber: this.assignedPlacementBatch.batchNumber,
    techStack: this.assignedPlacementBatch.techStack,
    startDate: this.assignedPlacementBatch.startDate,
    endDate: this.assignedPlacementBatch.endDate
  };
});

module.exports = mongoose.model('Coordinator', CoordinatorSchema);