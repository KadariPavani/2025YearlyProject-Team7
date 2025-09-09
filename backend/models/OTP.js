const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['login', 'reset_password'],
    default: 'login'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  expires: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
  }
}, {
  timestamps: true
});

// Index to automatically delete expired OTPs
OTPSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', OTPSchema);