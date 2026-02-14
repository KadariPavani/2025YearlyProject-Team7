const { getTokenFromRequest, verifyToken } = require('../utils/authToken');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Find admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Add admin to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = auth;
module.exports.verifyAdmin = auth;