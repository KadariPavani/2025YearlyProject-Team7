// routes/trainerRoutes.js
const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Trainer dashboard - to be implemented' });
});

module.exports = router;