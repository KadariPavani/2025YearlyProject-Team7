const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ['super_admin', 'admin_level_1', 'admin_level_2', 'admin_level_3'],
    default: 'admin_level_3'
  },
  permissions: {
    adminControls: {       // For admin-related controls: add/edit/delete admin
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    trainerControls: {     // For trainer-related controls: add/edit/delete/suspend trainer
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      suspend: { type: Boolean, default: false },
    },
    tpoControls: {         // For TPO-related controls: add/edit/delete/suspend TPO
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      suspend: { type: Boolean, default: false },
    },
    canViewActivity: { type: Boolean, default: true }
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: { type: Date },
  // Security: track failed login attempts and account lock
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
}, { timestamps: true });

AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Set permissions for role
AdminSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'super_admin':
        this.permissions = {
          adminControls: { add: true, edit: true, delete: true },
          trainerControls: { add: true, edit: true, delete: true, suspend: true },
          tpoControls: { add: true, edit: true, delete: true, suspend: true },
          canViewActivity: true,
        };
        break;
      case 'admin_level_1':
        this.permissions = {
          adminControls: { add: false, edit: false, delete: false },
          trainerControls: { add: true, edit: true, delete: true, suspend: true },
          tpoControls: { add: true, edit: true, delete: true, suspend: true },
          canViewActivity: true,
        };
        break;
      case 'admin_level_2':
        this.permissions = {
          adminControls: { add: false, edit: false, delete: false },
          trainerControls: { add: true, edit: true, delete: true, suspend: true },
          tpoControls: { add: false, edit: false, delete: false, suspend: false },
          canViewActivity: true,
        };
        break;
      case 'admin_level_3':
        this.permissions = {
          adminControls: { add: false, edit: false, delete: false },
          trainerControls: { add: false, edit: false, delete: false, suspend: false },
          tpoControls: { add: false, edit: false, delete: false, suspend: false },
          canViewActivity: true,
        };
        break;
      default:
        // Defaults
        this.permissions = {
          adminControls: { add: false, edit: false, delete: false },
          trainerControls: { add: false, edit: false, delete: false, suspend: false },
          tpoControls: { add: false, edit: false, delete: false, suspend: false },
          canViewActivity: true,
        };
    }
  }
  next();
});

AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Lockout helpers
AdminSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

AdminSchema.methods.incrementFailedLogin = async function() {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= 3) {
    // Lock for 2 hours
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save();
};

AdminSchema.methods.resetFailedLogin = async function() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

module.exports = mongoose.model('Admin', AdminSchema);
