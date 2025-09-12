
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true
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
  profileImage: {
    type: String,
    default: null
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return !email || /^\S+@\S+\.\S+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Phone number must be 10 digits']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  dob: {
    type: Date
  },
  currentLocation: {
    type: String,
    trim: true
  },
  hometown: {
    type: String,
    trim: true
  },
  academics: {
    btechCGPA: {
      type: Number,
      min: 0,
      max: 10
    },
    interDetails: {
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      board: String,
      passedYear: Number
    },
    diplomaDetails: {
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      board: String,
      passedYear: Number
    }
  },
  yearOfPassing: {
    type: Number,
    required: [true, 'Year of passing is required']
  },
  backlogs: {
    type: Number,
    default: 0,
    min: 0
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  projects: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    techStack: [String],
    description: {
      type: String,
      maxlength: 1000
    },
    links: {
      github: String,
      live: String,
      demo: String
    },
    image: String,
    startDate: Date,
    endDate: Date,
    verificationStatus: {
      type: String,
      enum: ['pending', 'coordinator_approved', 'tpo_approved', 'rejected'],
      default: 'pending'
    },
    verifiedByCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coordinator'
    },
    approvedByTPO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TPO'
    }
  }],
  internships: [{
    company: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    location: String,
    startDate: Date,
    endDate: Date,
    experience: {
      type: String,
      maxlength: 1000
    },
    techStack: [String],
    verificationStatus: {
      type: String,
      enum: ['pending', 'coordinator_approved', 'tpo_approved', 'rejected'],
      default: 'pending'
    },
    verifiedByCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coordinator'
    },
    approvedByTPO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TPO'
    }
  }],
  appreciations: [{
    title: String,
    description: String,
    dateReceived: Date,
    givenBy: String
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuer: {
      type: String,
      required: true,
      trim: true
    },
    credentialId: String,
    dateIssued: Date,
    expiryDate: Date,
    imageUrl: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'coordinator_approved', 'tpo_approved', 'rejected'],
      default: 'pending'
    },
    verifiedByCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coordinator'
    },
    approvedByTPO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TPO'
    }
  }],
  resumeUrl: String,
  videoResumeUrl: String,
  socialLinks: [{
    platform: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  }],
  crtInterested: {
    type: Boolean,
    default: false
  },
  crtBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  status: {
    type: String,
    enum: ['pursuing', 'placed', 'completed'],
    default: 'pursuing'
  },
  placementDetails: {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    company: String,
    role: String,
    location: String,
    package: Number,
    placedDate: Date
  },
  panCard: String,
  abcId: String,
  otherClubs: [{
    type: String,
    enum: ['GCC', 'k-hub', 'robotics', 'cyber crew', 'toastmasters', 'ncc', 'nss', 'google', 'smart city']
  }],
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  passedOutBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coordinator'
    }
  }],
  submittedAssignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  givenFeedbacks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }],
  quizScores: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    totalMarks: Number,
    completedAt: Date
  }],
  codingScores: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingQuestion'
    },
    score: Number,
    totalMarks: Number,
    completedAt: Date,
    submissionCode: String
  }],
  lastLogin: Date
}, {
  timestamps: true
});

StudentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

StudentSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);