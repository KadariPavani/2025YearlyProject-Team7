const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: String,
  endTime: String,
  isAllDay: {
    type: Boolean,
    default: false
  },
  eventType: {
    type: String,
    enum: ['company_visit', 'assessment', 'training', 'seminar', 'workshop', 'meeting', 'holiday', 'exam', 'other'],
    required: true
  },
  venue: {
    type: String,
    trim: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: String,
  companyDetails: {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    companyName: String,
    roles: [String],
    eligibilityCriteria: {
      minCGPA: Number,
      allowedBranches: [String],
      maxBacklogs: Number
    },
    contactPerson: {
      name: String,
      email: String,
      phone: String,
      designation: String
    },
    packageDetails: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'INR'
      }
    },
    registrationRequired: {
      type: Boolean,
      default: true
    },
    registrationDeadline: Date,
    maxApplicants: Number
  },
  assessmentDetails: {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    codingQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingQuestion'
    },
    duration: Number,
    totalMarks: Number,
    passingMarks: Number
  },
  trainingDetails: {
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer'
    },
    subject: String,
    topics: [String],
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['pdf', 'video', 'link', 'document']
      }
    }]
  },
  targetAudience: [{
    type: String,
    enum: ['all_students', 'crt_students', 'specific_batches', 'specific_branches', 'placed_students', 'alumni']
  }],
  targetBatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  targetBranches: [String],
  registrations: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'cancelled'],
      default: 'registered'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true
  },
  createdByModel: {
    type: String,
    enum: ['Admin', 'TPO', 'Trainer'],
    required: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'batch_specific', 'role_specific'],
    default: 'public'
  },
  sendNotification: {
    type: Boolean,
    default: true
  },
  reminderTime: {
    type: Number,
    default: 60
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: Number,
    endDate: Date,
    daysOfWeek: [Number]
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [String],
  eventFeedback: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  eventSummary: {
    totalAttendees: Number,
    selectedStudents: Number,
    averageRating: Number,
    notes: String
  }
}, {
  timestamps: true
});

CalendarSchema.index({ startDate: 1, endDate: 1 });
CalendarSchema.index({ eventType: 1, status: 1 });
CalendarSchema.index({ 'companyDetails.companyId': 1 });

module.exports = mongoose.model('Calendar', CalendarSchema);