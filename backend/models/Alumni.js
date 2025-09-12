const mongoose = require('mongoose');

const AlumniSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: String,
  batchYear: {
    type: Number,
    required: [true, 'Batch year is required']
  },
  college: {
    type: String,
    required: [true, 'College is required'],
    enum: ['KIET', 'KIEK', 'KIEW']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true
  },
  currentRole: {
    type: String,
    required: [true, 'Current role is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: 0
  },
  techStack: [{
    type: String,
    trim: true
  }],
  linkedIn: {
    type: String,
    trim: true
  },
  profileImage: String,
  bio: {
    type: String,
    maxlength: 500
  },
  isFromStudent: {
    type: Boolean,
    default: false
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'addedByModel'
  },
  addedByModel: {
    type: String,
    enum: ['Admin', 'TPO']
  },
  isAvailableForMentoring: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alumni', AlumniSchema);