const { getTokenFromRequest, verifyToken } = require('../utils/authToken');

const protectTrainer = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = verifyToken(token);
    req.user = { id: decoded.id }; // Adjust based on your JWT payload
    next();
  } catch (error) {
    console.error('ProtectTrainer error:', error.message);
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

module.exports = protectTrainer;