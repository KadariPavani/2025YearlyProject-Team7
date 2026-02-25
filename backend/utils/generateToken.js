const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    // Explicit error to aid debugging when secret is missing
    throw new Error('JWT_SECRET is not set in environment');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
};

module.exports = generateToken;