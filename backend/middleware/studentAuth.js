const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const studentAuth = async (req, res, next) => {
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
    
    // Find student
    const student = await Student.findById(decoded.id);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Add student to request
    req.student = student;
    next();
  } catch (error) {
    console.error('Student Auth Middleware Error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = studentAuth;