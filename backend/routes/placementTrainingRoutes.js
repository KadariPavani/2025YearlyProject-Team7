const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllBatches, getBatchById } = require('../controllers/placementTrainingController');

// GET /api/placement-training-batches - Get all placement training batches grouped
router.get('/', auth, getAllBatches);

// GET /api/placement-training-batches/:id - Get specific batch details
router.get('/:id', auth, getBatchById);

module.exports = router;
