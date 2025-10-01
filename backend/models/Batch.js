const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true, trim: true },
  colleges: [{
    type: String,
    enum: ['KIET', 'KIEK', 'KIEW'],
    required: true
  }],
  isCrt: { type: Boolean, default: true },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  tpoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  startDate: { type: Date, required: true },  // Starting date of batch
  endDate: { type: Date, required: true },    // End date of batch (can be extended)
  createdAt: { type: Date, default: Date.now }
});

// Virtual property for batch status
BatchSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.startDate && now < this.startDate) return 'Not Yet Started';
  if (this.endDate && now > this.endDate) return 'Completed';
  return 'Ongoing';
});

BatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Batch', BatchSchema);