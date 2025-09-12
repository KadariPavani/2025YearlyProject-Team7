const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  trainerAttendanceStatus: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present'
  },
  studentAttendances: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    remarks: String
  }],
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator',
    required: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  totalStudents: Number,
  presentCount: Number,
  absentCount: Number,
  attendancePercentage: Number,
  sessionNotes: String,
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

AttendanceSchema.pre('save', function(next) {
  this.totalStudents = this.studentAttendances.length;
  this.presentCount = this.studentAttendances.filter(att => att.status === 'present').length;
  this.absentCount = this.studentAttendances.filter(att => att.status === 'absent').length;
//   this.lateCount = this.studentAttendances.filter(att => att.status === 'late').length;
  this.attendancePercentage = this.totalStudents > 0 ? 
    ((this.presentCount + this.lateCount) / this.totalStudents) * 100 : 0;
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);