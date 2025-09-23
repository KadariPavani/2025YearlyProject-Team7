const jwt = require('jsonwebtoken');
const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');

const generalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Log token info for debugging (remove in production)
    console.log('Token received:', {
      length: token.length,
      firstChars: token.substring(0, 10) + '...',
      lastChars: '...' + token.substring(token.length - 10)
    });

    // Verify token
    const decoded = jwt.verify(token.trim(), process.env.JWT_SECRET);
    
    // Get the appropriate model based on userType
    let Model;
    switch (decoded.userType) {
      case 'tpo':
        Model = TPO;
        break;
      case 'trainer':
        Model = Trainer;
        break;
      case 'student':
        Model = Student;
        break;
      case 'coordinator':
        Model = Coordinator;
        break;
      default:
        return res.status(401).json({
          success: false,
          message: 'Invalid user type'
        });
    }

    // Find user
    const user = await Model.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Add user to request
    req.user = user;
    req.userType = decoded.userType;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = generalAuth;