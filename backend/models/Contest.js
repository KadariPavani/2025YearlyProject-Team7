const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    expectedOutput: {
        type: String,
        required: true
    },
    marks: {
        type: Number,
        required: true,
        min: 0
    },
    isHidden: {
        type: Boolean,
        default: false
    }
});

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    constraints: {
        type: String,
        default: ''
    },
    inputFormat: {
        type: String,
        required: true
    },
    outputFormat: {
        type: String,
        required: true
    },
    sampleInput: {
        type: String,
        required: true
    },
    sampleOutput: {
        type: String,
        required: true
    },
    testCases: [testCaseSchema],
    timeLimit: {
        type: Number,
        default: 2000, // milliseconds
        min: 1000,
        max: 10000
    },
    memoryLimit: {
        type: Number,
        default: 256, // MB
        min: 128,
        max: 512
    },
    totalMarks: {
        type: Number,
        default: 0
    }
});

const contestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    questions: [questionSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    allowedLanguages: [{
        type: String,
        enum: ['c', 'cpp', 'java', 'python', 'javascript'],
        default: ['c', 'cpp', 'java', 'python']
    }],
    maxAttempts: {
        type: Number,
        default: 1,
        min: 1
    },
    // Whether contest is public or restricted to specific batches
    accessLevel: {
        type: String,
        enum: ['public', 'batch'],
        default: 'public'
    },
    // Optional list of target batch IDs (could be regular or placement batch ids)
    targetBatchIds: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate total marks for each question and set defaults when needed
questionSchema.pre('save', function(next) {
    // Sum existing marks (if any)
    let sum = (this.testCases || []).reduce((total, testCase) => total + (testCase.marks || 0), 0);

    // If there are test cases but none have marks, assign default distribution (50 total)
    if ((this.testCases || []).length > 0 && sum === 0) {
        const DEFAULT_TOTAL = 50;
        const n = this.testCases.length;
        const base = Math.floor(DEFAULT_TOTAL / n);
        let remainder = DEFAULT_TOTAL - base * n;

        // Assign marks to each test case (distribute remainder to the first few)
        this.testCases = this.testCases.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            marks: base + (remainder > 0 ? 1 : 0),
            isHidden: tc.isHidden || false
        })).map((tc, idx) => {
            if (remainder > 0) remainder -= 1;
            return tc;
        });

        sum = DEFAULT_TOTAL;
    }

    this.totalMarks = sum;
    next();
});

module.exports = mongoose.model('Contest', contestSchema);
