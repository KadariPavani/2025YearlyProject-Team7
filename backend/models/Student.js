// File: models/Student.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  // Basic Information
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^\S+@\S+\.\S+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  phonenumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    trim: true
  },

  // College Information
  college: {
    type: String,
    enum: ['KIET', 'KIEK', 'KIEW'],
    required: [true, 'College is required']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: ['AID', 'CSM', 'CAI', 'CSD', 'CSC'],
    trim: true
  },
  yearOfPassing: {
    type: String,
    required: [true, 'Year of passing is required'],
    trim: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  passedOutBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },

  // Profile Information
  isActive: {
    type: Boolean,
    default: true
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
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
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },

  // Academic Information
  academics: {
    btechCGPA: {
      type: Number,
      min: 0,
      max: 10
    },
    educationType: {
      type: String,
      enum: ['inter', 'diploma'],
    },
    inter: {
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      board: String,
      passedYear: Number
    },
    diploma: {
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      board: String,
      passedYear: Number
    }
  },
  backlogs: {
    type: Number,
    default: 0,
    min: 0
  },

  // Tech Stack and Skills - NEW FIELD
  techStack: [{
    type: String,
    enum: ['Java', 'Python', 'C/C++', 'JavaScript', 'AI/ML'],
    trim: true
  }],

  // Projects and Experience
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
// Add this field to your Student schema
placementTrainingBatchId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'PlacementTrainingBatch'
},


  // Documents and Links
  resumeUrl: String,
  // Add this to your Student schema
resumeFileName: String, // Add this line after resumeUrl

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

  // CRT and Placement Information
  crtInterested: {
    type: Boolean,
    default: false
  },
  crtBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  crtBatchName: {  // NEW FIELD - stores assigned CRT batch name
    type: String,
    trim: true
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

  // Additional Information
  panCard: String,
  abcId: String,
  otherClubs: [{
    type: String,
    enum: ['GCC', 'k-hub', 'robotics', 'cyber crew', 'toastmasters', 'ncc', 'nss', 'google', 'smart city']
  }],

  // Academic Progress
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

  // System Information
  lastLogin: Date
}, {
  timestamps: true
});

StudentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

StudentSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);
