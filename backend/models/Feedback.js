const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Feedback title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Feedback content is required'],
    maxlength: 2000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  category: {
    type: String,
    enum: ['training', 'placement', 'facilities', 'coordinator', 'general'],
    required: true
  },
  fromStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  toTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  otherTrainerName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  toTPO: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO'
  },
  toCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  suggestions: {
    type: String,
    maxlength: 1000
  },
  response: {
    content: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'responseByModel'
    },
    responseByModel: {
      type: String,
      enum: ['Trainer', 'TPO', 'Coordinator']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'responded'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);