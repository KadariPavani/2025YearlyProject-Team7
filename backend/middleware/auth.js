const { getTokenFromRequest, verifyToken } = require('../utils/authToken');
const Admin = require('../models/Admin');
const TPO = require('../models/TPO');

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

    // Try to find admin first
    let admin = await Admin.findById(decoded.id);
    if (admin) {
      // Add admin to request
      req.admin = admin;
      req.userId = admin._id;
      req.userType = 'admin';
      return next();
    }

    // If not admin, try to find TPO
    const tpo = await TPO.findById(decoded.id);
    if (tpo) {
      // Add TPO to request
      req.tpo = tpo;
      req.userId = tpo._id;
      req.userType = 'tpo';
      return next();
    }

    // If neither admin nor TPO found
    return res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
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