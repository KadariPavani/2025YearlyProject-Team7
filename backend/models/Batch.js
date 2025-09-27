// // const mongoose = require('mongoose');

// // const BatchSchema = new mongoose.Schema({
// //   name: {
// //     type: String,
// //     required: [true, 'Batch name is required'],
// //     trim: true
// //   },
// //   college: {
// //     type: String,
// //     required: [true, 'College is required'],
// //     enum: ['KIET', 'KIEK', 'KIEW']
// //   },
// //   isCrt: {
// //     type: Boolean,
// //     default: false
// //   },
// //   branch: {
// //     type: String,
// //     required: [true, 'Branch is required'],
// //     trim: true
// //   },
// //   academicYear: {
// //     type: String,
// //     required: [true, 'Academic year is required']
// //   },
// //   students: [{
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Student'
// //   }],
// //   trainerId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Trainer',
// //     required: true
// //   },
// //   coordinatorId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Coordinator'
// //   },
// //   tpoId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'TPO',
// //     required: true
// //   },
// //   maxStudents: {
// //     type: Number,
// //     default: 60
// //   },
// //   startDate: {
// //     type: Date,
// //     required: true
// //   },
// //   endDate: {
// //     type: Date,
// //     required: true
// //   },
// //   status: {
// //     type: String,
// //     enum: ['active', 'completed', 'suspended'],
// //     default: 'active'
// //   },
// //   createdBy: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Admin',
// //     required: true
// //   },
// //   isPassedOut: {
// //     type: Boolean,
// //     default: false
// //   }
// // }, {
// //   timestamps: true
// // });

// // module.exports = mongoose.model('Batch', BatchSchema);
// const mongoose = require('mongoose');

// const BatchSchema = new mongoose.Schema({
//   batchNumber: { type: String, required: true, trim: true },
//   colleges: [{
//     type: String,
//     enum: ['KIET', 'KIEK', 'KIEW'],
//     required: true
//   }],
//   isCrt: { type: Boolean, default: true },
//   students: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Student'
//   }],
//   tpoId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'TPO',
//     required: true
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin',
//     required: true
//   },
//   startDate: { type: Date, required: true },  // Starting date of batch
//   endDate: { type: Date, required: true },    // End date of batch (can be extended)
//   createdAt: { type: Date, default: Date.now }
// });

// // Virtual property for batch status
// BatchSchema.virtual('status').get(function() {
//   const now = new Date();
//   if (this.startDate && now < this.startDate) return 'Not Yet Started';
//   if (this.endDate && now > this.endDate) return 'Completed';
//   return 'Ongoing';
// });

// BatchSchema.set('toJSON', { virtuals: true });

// module.exports = mongoose.model('Batch', BatchSchema);
// This is your updated Batch.js - Using the original (commented) schema with trainerId for consistency with quiz routes.
// I've uncommented and used the first version, as the new one lacks trainerId, causing issues with trainer-specific batches.

const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true
  },
  college: {
    type: String,
    required: [true, 'College is required'],
    enum: ['KIET', 'KIEK', 'KIEW']
  },
  isCrt: {
    type: Boolean,
    default: false
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator'
  },
  tpoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: true
  },
  maxStudents: {
    type: Number,
    default: 60
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isPassedOut: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// REMOVE or RENAME this virtual if you already have a real 'status' field
// BatchSchema.virtual('status', { ... });

BatchSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Batch', BatchSchema);