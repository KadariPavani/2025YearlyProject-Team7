// models/Attendance.js - CORRECTED VERSION
// REPLACE your existing Attendance.js with this

const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  // Session Date (NOT 'date')
  sessionDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Batch Information
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementTrainingBatch',
    required: true,
    index: true
  },
  
  batchType: {
    type: String,
    enum: ['regular', 'placement'],
    default: 'placement'
  },
  
  // Time Slot Information
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true
  },
  
  startTime: {
    type: String,
    required: true
  },
  
  endTime: {
    type: String,
    required: true
  },
  
  // Trainer Information
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: false
  },
  
  subject: {
    type: String,
    required: false
  },
  
  trainerStatus: {
    type: String,
    enum: ['present', 'absent', 'not_marked'],
    default: 'not_marked'
  },
  
  trainerRemarks: {
    type: String,
    default: ''
  },
  
  // Student Attendance Records (Array)
  studentAttendance: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'not_marked'],
      default: 'not_marked'
    },
    remarks: {
      type: String,
      default: ''
    },
    markedAt: {
      type: Date
    }
  }],
  
  // Marking Information - SUBDOCUMENT (not just a string!)
  markedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'markedBy.userType',
      required: true
    },
    userType: {
      type: String,
      enum: ['Coordinator', 'TPO', 'Trainer'],
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  
  // Auto-calculated Statistics
  totalStudents: {
    type: Number,
    default: 0
  },
  
  presentCount: {
    type: Number,
    default: 0
  },
  
  absentCount: {
    type: Number,
    default: 0
  },
  
  attendancePercentage: {
    type: Number,
    default: 0
  },
  
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  sessionNotes: {
    type: String,
    default: ''
  }
  
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================
AttendanceSchema.index({ sessionDate: 1, batchId: 1, timeSlot: 1 });
AttendanceSchema.index({ 'studentAttendance.studentId': 1 });
AttendanceSchema.index({ trainerId: 1, sessionDate: 1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================
AttendanceSchema.pre('save', function(next) {
  if (this.studentAttendance && this.studentAttendance.length > 0) {
    // Calculate total students
    this.totalStudents = this.studentAttendance.length;
    
    // Calculate present count (includes 'late' as present)
    this.presentCount = this.studentAttendance.filter(s => 
      s.status === 'present' || s.status === 'late'
    ).length;
    
    // Calculate absent count
    this.absentCount = this.studentAttendance.filter(s => 
      s.status === 'absent'
    ).length;
    
    // Calculate attendance percentage
    if (this.totalStudents > 0) {
      this.attendancePercentage = Math.round(
        (this.presentCount / this.totalStudents) * 100
      );
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
