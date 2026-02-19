const { getTokenFromRequest, verifyToken } = require('../utils/authToken');
const Student = require('../models/Student');

const pastStudentAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (decoded.userType !== 'past_student') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const student = await Student.findById(decoded.id);
    if (!student) {
      return res.status(401).json({ success: false, message: 'Student not found' });
    }

    req.studentId = student._id;
    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

module.exports = pastStudentAuth;
