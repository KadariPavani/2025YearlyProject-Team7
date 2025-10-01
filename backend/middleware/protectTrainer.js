const jwt = require('jsonwebtoken');

const protectTrainer = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = { id: decoded.id }; // Adjust based on your JWT payload
    next();
  } catch (error) {
    console.error('ProtectTrainer error:', error.message, error.stack);
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

module.exports = protectTrainer;