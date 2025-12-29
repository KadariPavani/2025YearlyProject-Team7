const OTP = require('../models/OTP');

// Create and persist a new OTP document for an email/purpose
async function createOtp(email, purpose) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const doc = await OTP.create({ email: normalizedEmail, otp, purpose });
  // Log created OTP for debugging (safe in development, in production ensure logs are protected)
  console.log(`🔐 Created OTP for ${normalizedEmail} (purpose: ${purpose}): ${otp} - id: ${doc._id}`);
  return otp;
}

// Verify an OTP for a given email/purpose with basic limits
// Returns: { valid: boolean, reason?: string, otpDoc?: any }
async function verifyOtp(email, purpose, providedOtp) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const otpDoc = await OTP.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });
  if (!otpDoc) {
    console.warn(`OTP verify failed for ${normalizedEmail} (purpose: ${purpose}): not_found_or_expired`);
    return { valid: false, reason: 'not_found_or_expired' };
  }

  if (Date.now() > otpDoc.expires.getTime()) {
    console.warn(`OTP expired for ${email} (purpose: ${purpose}) - deleting`);
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, reason: 'expired' };
  }

  if (otpDoc.attempts >= 3) {
    console.warn(`OTP too many attempts for ${email} (purpose: ${purpose}) - deleting`);
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, reason: 'too_many_attempts' };
  }

  if (otpDoc.otp !== providedOtp) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    console.warn(`OTP invalid for ${email} (purpose: ${purpose}) - attempts now ${otpDoc.attempts}`);
    return { valid: false, reason: 'invalid' };
  }

  console.log(`OTP verified for ${email} (purpose: ${purpose})`);
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


