const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  scheduledDate: { type: Date, required: true },
  // Preferred: explicit start/end datetimes (ISO UTC) set at creation to avoid timezone ambiguity
  scheduledStart: { type: Date },
  scheduledEnd: { type: Date },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true }, 
  duration: { type: Number, required: true, min: 1 },
  questions: [{
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ['mcq', 'true-false', 'fill-blank'], required: true },
    options: [{ text: String, isCorrect: Boolean }],
    correctAnswer: String,
    marks: { type: Number, default: 1 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    explanation: String
  }],
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
  assignedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  assignedPlacementBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlacementTrainingBatch' }],
  batchType: { type: String, enum: ['noncrt', 'placement', 'both', 'regular'], default: 'placement' },
  shuffleQuestions: { type: Boolean, default: false },
  showResultsImmediately: { type: Boolean, default: true },
  allowRetake: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    answers: [{
      questionIndex: Number,
      selectedOption: String,
      answer: String,
      isCorrect: Boolean
    }],
    score: Number,
    percentage: Number,
    timeSpent: Number,
    performanceCategory: String,
    attemptNumber: Number,
    submittedAt: Date
  }],
  createdAt: { type: Date, default: Date.now }
});

// Method to check if a student can access the quiz
quizSchema.methods.canStudentAccess = function(student) {
  const result = this.checkStudentAccess(student);
  return result.allowed;
};

// Returns an object with allowed:boolean and reason:string for diagnostics
quizSchema.methods.checkStudentAccess = function(student) {
  const now = new Date();
  const [startHours, startMinutes] = this.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.endTime.split(':').map(Number);

  // Helper that builds start/end Date for two interpretations:
  // 1) Treat scheduledDate as UTC date (use UTC components)
  // 2) Treat scheduledDate as local date (use local components)
  const buildWindowUTC = () => {
    const sd = new Date(this.scheduledDate);
    const y = sd.getUTCFullYear();
    const m = sd.getUTCMonth();
    const d = sd.getUTCDate();
    const start = new Date(Date.UTC(y, m, d, startHours, startMinutes, 0));
    let end = new Date(Date.UTC(y, m, d, endHours, endMinutes, 0));
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    return { start, end, interpret: 'utc' };
  };

  const buildWindowLocal = () => {
    const sd = new Date(this.scheduledDate);
    const y = sd.getFullYear();
    const m = sd.getMonth();
    const d = sd.getDate();
    const start = new Date(y, m, d, startHours, startMinutes, 0);
    let end = new Date(y, m, d, endHours, endMinutes, 0);
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    return { start, end, interpret: 'local' };
  };

  const windows = [buildWindowUTC(), buildWindowLocal()];

  const statusActive = this.status === 'active';
  const withinAnyWindow = windows.some(w => now >= w.start && now <= w.end);

  const inRegular = this.batchType !== 'placement' && 
    student.batchId && 
    this.assignedBatches.map(id => id.toString()).includes(student.batchId.toString());

  const inPlacement = this.batchType !== 'noncrt' && 
    student.placementTrainingBatchId && 
    this.assignedPlacementBatches.map(id => id.toString()).includes(student.placementTrainingBatchId.toString());

  if (!statusActive || !withinAnyWindow) {
    // Log both windows to help debug deployment timezone mismatches
    console.warn(`[Quiz Access TIME] quiz:${this._id} now:${now.toISOString()} windows:${windows.map(w => `{${w.interpret}:${w.start.toISOString()}->${w.end.toISOString()}}`).join(',')}`);
    return { allowed: false, reason: 'time', windows };
  }

  if (!inRegular && !inPlacement) {
    console.warn(`[Quiz Access BATCH] quiz:${this._id} student:${student._id} batchType:${this.batchType} assignedBatches:${this.assignedBatches?.length||0} assignedPlacementBatches:${this.assignedPlacementBatches?.length||0} studentBatch:${student.batchId||student.placementTrainingBatchId}`);
    return { allowed: false, reason: 'batch' };
  }

  return { allowed: true, reason: 'ok' };
};

module.exports = mongoose.model('Quiz', quizSchema);