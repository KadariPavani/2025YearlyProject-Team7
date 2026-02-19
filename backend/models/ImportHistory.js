const mongoose = require('mongoose');

const ImportHistorySchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'uploadedByModel',
    required: true
  },
  uploadedByModel: {
    type: String,
    enum: ['Admin', 'TPO'],
    required: true
  },
  fileName: String,
  fileHash: String, // MD5 hash to detect duplicate uploads
  totalRows: Number,
  successful: Number,
  failed: Number,
  errors: [{
    row: Number,
    rollNo: String,
    field: String,
    error: String,
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'critical'
    }
  }],
  validRows: [{ type: Object }], // Store validated rows for preview
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rolled-back'],
    default: 'pending'
  },
  importedData: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }] // Track what was created/updated
}, {
  timestamps: true
});

// Index for faster queries
ImportHistorySchema.index({ uploadedBy: 1, createdAt: -1 });
ImportHistorySchema.index({ status: 1 });

module.exports = mongoose.model('ImportHistory', ImportHistorySchema);
