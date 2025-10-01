// File: backend/middleware/generalAuth.js
const jwt = require('jsonwebtoken');
const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');

const generalAuth = async (req, res, next) => {
  try {
    console.log('Auth Middleware - Headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    });

    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'No token provided after Bearer'
      });
    }

    console.log('Token Details:', {
      length: token.length,
      startsWith: token.substring(0, 5) + '...',
      endsWith: '...' + token.substring(token.length - 5)
    });

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token.trim(), process.env.JWT_SECRET);
      console.log('Token Decoded Successfully:', decoded);
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: jwtError.message
      });
    }

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
          message: 'Invalid user type in token'
        });
    }

    // Find user
    const user = await Model.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found - token is invalid'
      });
    }

    console.log('User Authenticated:', {
      userType: decoded.userType,
      userId: user._id,
      email: user.email
    });

    // Add user to request
    req.user = user;
    req.userType = decoded.userType;
    next();

  } catch (error) {
    console.error('Auth Middleware Unexpected Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = generalAuth;