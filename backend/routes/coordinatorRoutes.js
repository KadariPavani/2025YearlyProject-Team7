// routes/coordinatorRoutes.js
const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Coordinator dashboard - to be implemented' });
});

module.exports = router;
