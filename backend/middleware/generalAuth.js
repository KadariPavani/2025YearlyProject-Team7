// File: backend/middleware/generalAuth.js
const { getModelByUserType, isValidUserType } = require('../utils/userType');
const { getTokenFromRequest, verifyToken } = require('../utils/authToken');

const generalAuth = async (req, res, next) => {
  try {
    console.log('Auth Middleware - Headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    });

    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Support tokens that carry either userType or role (e.g., trainer login)
    const effectiveUserType = decoded.userType || decoded.role;
    if (!effectiveUserType || !isValidUserType(effectiveUserType)) {
      return res.status(401).json({ success: false, message: 'Invalid user type in token' });
    }

    // Get the appropriate model based on userType/role
    const Model = getModelByUserType(effectiveUserType);
    if (!Model) {
      return res.status(401).json({ success: false, message: 'Invalid user type in token' });
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
      userType: effectiveUserType,
      userId: user._id,
      email: user.email
    });

    // Add user to request
    req.user = user;
    req.userType = effectiveUserType;
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