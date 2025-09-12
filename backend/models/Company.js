const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Company description is required'],
    maxlength: 2000
  },
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  roles: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    package: {
      min: Number,
      max: Number
    },
    location: [String],
    eligibility: {
      minCGPA: Number,
      allowedBranches: [String],
      maxBacklogs: Number,
      passingYear: [Number]
    },
    technicalSkills: [String],
    requiredExperience: {
      type: String,
      enum: ['fresher', '0-1 years', '1-3 years', '3+ years']
    }
  }],
  assessmentPattern: {
    aptitudeTopics: [String],
    technicalTopics: [String],
    codingTopics: [String],
    hasGroupDiscussion: {
      type: Boolean,
      default: false
    },
    hasHRRound: {
      type: Boolean,
      default: true
    },
    totalRounds: {
      type: Number,
      default: 3
    }
  },
  contactInfo: {
    hrName: String,
    hrEmail: String,
    hrPhone: String,
    address: String
  },
  visitSchedule: {
    tentativeDate: Date,
    confirmedDate: Date,
    duration: String,
    venue: String
  },
  registrationDeadline: Date,
  maxApplications: Number,
  currentApplications: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  tpoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TPO',
    required: true
  },
  applicants: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'selected', 'rejected'],
      default: 'applied'
    },
    appliedRole: String
  }],
  results: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    role: String,
    package: Number,
    joiningDate: Date,
    status: {
      type: String,
      enum: ['selected', 'offer_accepted', 'offer_declined']
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', CompanySchema);