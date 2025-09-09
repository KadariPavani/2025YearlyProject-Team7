// routes/authRoutes.js
const express = require('express');
const router = express.Router();

// General auth routes for other dashboards will be implemented here
router.post('/login', (req, res) => {
  res.json({ message: 'General login endpoint - to be implemented' });
});

module.exports = router;