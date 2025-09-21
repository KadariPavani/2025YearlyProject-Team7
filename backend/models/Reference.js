const mongoose = require('mongoose');

const ReferenceSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: [true, 'Trainer ID is required']
  },
  topicName: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true
  },
  referenceVideoLink: {
    type: String,
    required: [true, 'Reference video link is required'],
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the video link']
  },
  referenceNotesLink: {
    type: String,
    required: [true, 'Reference notes link is required'],
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'Please provide a valid URL for the notes link']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reference', ReferenceSchema);