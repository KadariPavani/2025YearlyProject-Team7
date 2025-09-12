const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Complaint description is required'],
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['technical', 'academic', 'facilities', 'harassment', 'discrimination', 'other'],
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  againstTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  againstCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator'
  },
  againstTPO: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  attachments: [{
    filename: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'assignedToModel'
  },
  assignedToModel: {
    type: String,
    enum: ['Admin', 'TPO']
  },
  resolution: {
    content: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resolvedByModel'
    },
    resolvedByModel: {
      type: String,
      enum: ['Admin', 'TPO']
    },
    actionTaken: String
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', ComplaintSchema);