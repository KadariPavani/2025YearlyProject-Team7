const jwt = require('jsonwebtoken');

const getTokenFromRequest = (req) => {
  const authHeader = req.headers && req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token.trim() !== '') return token.trim();
  }
  if (req.cookies && req.cookies.token) {
    const cookieToken = String(req.cookies.token || '').trim();
    if (cookieToken) return cookieToken;
  }
  return null;
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  getTokenFromRequest,
  verifyToken,
};


