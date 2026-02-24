const OTP = require('../models/OTP');

// Create and persist a new OTP document for an email/purpose
async function createOtp(email, purpose) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const doc = await OTP.create({ email: normalizedEmail, otp, purpose });
  // Log created OTP for debugging (safe in development, in production ensure logs are protected)
  return otp;
}

// Verify an OTP for a given email/purpose with basic limits
// Returns: { valid: boolean, reason?: string, otpDoc?: any }
async function verifyOtp(email, purpose, providedOtp) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const otpDoc = await OTP.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });
  if (!otpDoc) {
    return { valid: false, reason: 'not_found_or_expired' };
  }

  if (Date.now() > otpDoc.expires.getTime()) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, reason: 'expired' };
  }

  if (otpDoc.attempts >= 3) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, reason: 'too_many_attempts' };
  }

  if (otpDoc.otp !== providedOtp) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return { valid: false, reason: 'invalid' };
  }

  return { valid: true, otpDoc };
}

async function consumeOtp(otpDoc) {
  if (otpDoc?._id) {
    await OTP.deleteOne({ _id: otpDoc._id });
  }
}

module.exports = {
  createOtp,
  verifyOtp,
  consumeOtp,
};


