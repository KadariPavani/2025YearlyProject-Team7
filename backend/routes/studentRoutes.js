// routes/studentRoutes.js
const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Student dashboard - to be implemented' });
});

module.exports = router;