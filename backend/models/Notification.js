const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'announcement'],
    default: 'info'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    enum: ['Admin', 'TPO', 'Trainer', 'Coordinator'],
    required: true
  },
  recipients: [{
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipients.recipientModel'
    },
    recipientModel: {
      type: String,
      enum: ['Student', 'Trainer', 'TPO', 'Coordinator', 'Alumni']
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date
  }],
  targetBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  targetRoles: [{
    type: String,
    enum: ['student', 'trainer', 'tpo', 'coordinator', 'alumni']
  }],
  isGlobal: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  scheduleFor: Date,
  expiresAt: Date,
  relatedEntity: {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityModel'
    },
    entityModel: {
      type: String,
      enum: ['Quiz', 'Assignment', 'Company', 'Event']
    }
  },
  actionButton: {
    text: String,
    url: String,
    action: String
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'scheduled'],
    default: 'sent'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);