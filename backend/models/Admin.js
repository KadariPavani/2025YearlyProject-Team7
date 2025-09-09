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
    canAddAdmin: { type: Boolean, default: false },
    canAddTPO: { type: Boolean, default: false },
    canAddTrainer: { type: Boolean, default: false },
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
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password if modified
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Set permissions based on role
AdminSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'super_admin':
        this.permissions = {
          canAddAdmin: true,
          canAddTPO: true,
          canAddTrainer: true,
          canViewActivity: true
        };
        break;
      case 'admin_level_1':
        this.permissions = {
          canAddAdmin: false,
          canAddTPO: true,
          canAddTrainer: true,
          canViewActivity: true
        };
        break;
      case 'admin_level_2':
        this.permissions = {
          canAddAdmin: false,
          canAddTPO: false,
          canAddTrainer: true,
          canViewActivity: true
        };
        break;
      case 'admin_level_3':
        this.permissions = {
          canAddAdmin: false,
          canAddTPO: false,
          canAddTrainer: false,
          canViewActivity: true
        };
        break;
    }
  }
  next();
});

// Compare password method
AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);