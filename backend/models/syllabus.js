const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, required: false },
  title: { type: String, required: true },
  description: { type: String },
  topics: [
    {
      topicName: { type: String, required: true },
      description: { type: String },
      duration: { type: String, required: true }, // e.g., "2 hours"
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

module.exports = Syllabus;