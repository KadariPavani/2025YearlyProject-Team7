// const mongoose = require('mongoose');

// const BatchSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Batch name is required'],
//     trim: true
//   },
//   college: {
//     type: String,
//     required: [true, 'College is required'],
//     enum: ['KIET', 'KIEK', 'KIEW']
//   },
//   isCrt: {
//     type: Boolean,
//     default: false
//   },
//   branch: {
//     type: String,
//     required: [true, 'Branch is required'],
//     trim: true
//   },
//   academicYear: {
//     type: String,
//     required: [true, 'Academic year is required']
//   },
//   students: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Student'
//   }],
//   trainerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Trainer',
//     required: true
//   },
//   coordinatorId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Coordinator'
//   },
//   tpoId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'TPO',
//     required: true
//   },
//   maxStudents: {
//     type: Number,
//     default: 60
//   },
//   startDate: {
//     type: Date,
//     required: true
//   },
//   endDate: {
//     type: Date,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['active', 'completed', 'suspended'],
//     default: 'active'
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin',
//     required: true
//   },
//   isPassedOut: {
//     type: Boolean,
//     default: false
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Batch', BatchSchema);


const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true, trim: true }, // e.g. "2025"
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', BatchSchema);
