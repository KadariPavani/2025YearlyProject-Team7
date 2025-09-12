
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CoordinatorSchema = new mongoose.Schema({
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
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
  },
  role: {
    type: String,
    default: 'coordinator',
    immutable: true
  },
  assignedBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  managedFeedbacks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }],
  verifiedCertificates: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId
    },
    verificationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['verified', 'rejected', 'pending'],
      default: 'pending'
    }
  }],
  verifiedProjects: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId
    },
    verificationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['verified', 'rejected', 'pending'],
      default: 'pending'
    }
  }],
  verifiedInternships: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    internshipId: {
      type: mongoose.Schema.Types.ObjectId
    },
    verificationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['verified', 'rejected', 'pending'],
      default: 'pending'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
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

CoordinatorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

CoordinatorSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Coordinator', CoordinatorSchema);