const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  scheduledDate: { type: Date, required: true },
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
  batchType: { type: String, enum: ['regular', 'placement', 'both'], default: 'regular' },
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
  const now = new Date();
  
  // Combine scheduledDate and startTime/endTime for comparison
  const [startHours, startMinutes] = this.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.endTime.split(':').map(Number);
  
  const quizStart = new Date(this.scheduledDate);
  quizStart.setHours(startHours, startMinutes, 0, 0);
  
  const quizEnd = new Date(this.scheduledDate);
  quizEnd.setHours(endHours, endMinutes, 0, 0);
  
  // Ensure quiz is active and within time window
  const isWithinTimeWindow = this.status === 'active' && now >= quizStart && now <= quizEnd;
  
  // Check batch assignment
  const isInRegularBatch = this.batchType !== 'placement' && 
    student.batchId && 
    this.assignedBatches.map(id => id.toString()).includes(student.batchId.toString());
  
  const isInPlacementBatch = this.batchType !== 'regular' && 
    student.placementTrainingBatchId && 
    this.assignedPlacementBatches.map(id => id.toString()).includes(student.placementTrainingBatchId.toString());
  
  return isWithinTimeWindow && (isInRegularBatch || isInPlacementBatch);
};

module.exports = mongoose.model('Quiz', quizSchema);