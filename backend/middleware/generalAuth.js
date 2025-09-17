const jwt = require('jsonwebtoken');
const TPO = require('../models/TPO');
const Trainer = require('../models/Trainer');
// Add other models as needed
// const Student = require('../models/Student');
// const Coordinator = require('../models/Coordinator');

const generalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get the appropriate model based on userType
    let Model;
    switch (decoded.userType) {
      case 'tpo':
        Model = TPO;
        break;
      case 'trainer':
        Model = Trainer;
        break;
      // case 'student':
      //   Model = Student;
      //   break;
      // case 'coordinator':
      //   Model = Coordinator;
      //   break;
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