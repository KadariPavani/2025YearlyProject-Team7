// trainer.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TrainerSchema = new mongoose.Schema({
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
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  subjectDealing: { 
    type: String, 
    required: true, 
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['technical', 'non-technical'], 
    required: true 
  },
  linkedIn: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    default: 'trainer',
    immutable: true
  },
  assignedBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  createdQuizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  createdCodingQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingQuestion'
  }],
  createdAssignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
    // Removed required: true to allow direct trainer registration
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
}, {
  timestamps: true
});

TrainerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

TrainerSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Lockout helpers
TrainerSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

TrainerSchema.methods.incrementFailedLogin = async function() {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= 3) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save();
};

TrainerSchema.methods.resetFailedLogin = async function() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

module.exports = mongoose.model('Trainer', TrainerSchema);