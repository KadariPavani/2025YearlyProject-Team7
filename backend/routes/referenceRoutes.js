const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');
const protectTrainer = require('../middleware/protectTrainer');
const mongoose = require('mongoose');

// Create a new reference (trainer only)
router.post('/', protectTrainer, async (req, res, next) => {
  try {
    const { topicName, referenceVideoLink, referenceNotesLink } = req.body;
    const trainerId = req.user.id;

    const reference = new Reference({
      trainerId,
      topicName,
      referenceVideoLink,
      referenceNotesLink
    });

    const savedReference = await reference.save();
    res.status(201).json(savedReference);
  } catch (error) {
    console.error('Error creating reference:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to create reference' });
  }
});

// Get all references for the trainer
router.get('/', protectTrainer, async (req, res, next) => {
  try {
    const references = await Reference.find({ trainerId: req.user.id }).select('topicName referenceVideoLink referenceNotesLink createdAt');
    res.json(references);
  } catch (error) {
    console.error('Error fetching references:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch references' });
  }
});

// Update a reference
router.put('/:id', protectTrainer, async (req, res, next) => {
  try {
    const reference = await Reference.findById(req.params.id);
    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Reference not found or not authorized' });
    }

    const { topicName, referenceVideoLink, referenceNotesLink } = req.body;
    reference.topicName = topicName || reference.topicName;
    reference.referenceVideoLink = referenceVideoLink || reference.referenceVideoLink;
    reference.referenceNotesLink = referenceNotesLink || reference.referenceNotesLink;

    const updatedReference = await reference.save();
    res.json(updatedReference);
  } catch (error) {
    console.error('Error updating reference:', error.message, error.stack);
    res.status(400).json({ message: error.message || 'Failed to update reference' });
  }
});

// Delete a reference
router.delete('/:id', protectTrainer, async (req, res, next) => {
  try {
    const reference = await Reference.findById(req.params.id);
    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Reference not found or not authorized' });
    }
    await Reference.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reference deleted successfully' });
  } catch (error) {
    console.error('Error deleting reference:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to delete reference' });
  }
});

// Get all references for students (public)
router.get('/all', async (req, res, next) => {
  try {
    const references = await Reference.find().select('topicName referenceVideoLink referenceNotesLink createdAt');
    res.json(references);
  } catch (error) {
    console.error('Error fetching references for students:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch references' });
  }
});

module.exports = router;