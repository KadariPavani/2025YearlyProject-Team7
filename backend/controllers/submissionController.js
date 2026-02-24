const compilex = require('compilex');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Execute code function
const executeCode = (code, language, input, timeLimit) => {
    return new Promise((resolve) => {
        const startTime = Date.now();


        if (language === 'python') {
            const inputStr = String(input || '').trim();

            // For Python execution - prepare code with input handling
            const pythonCode = `
# Simulated input
input_lines = ${JSON.stringify(inputStr.split('\n'))}
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

${code}`;

            // Use compilex with OS-specific configuration
            compilex.compilePython(
                { OS: process.platform === 'win32' ? 'windows' : 'linux' },
                pythonCode,
                function(data) {
                    const executionTime = Date.now() - startTime;

                    if (data.error) {
                        resolve({
                            status: 'error',
                            error: data.error,
                            executionTime,
                            memoryUsed: 0,
                            output: data.output || ''
                        });
                    } else if (executionTime > timeLimit) {
                        resolve({
                            status: 'timeout',
                            error: 'Time limit exceeded',
                            executionTime,
                            memoryUsed: 0,
                            output: data.output || ''
                        });
                    } else {
                        resolve({
                            status: 'success',
                            error: '',
                            executionTime,
                            memoryUsed: 0,
                            output: data.output || ''
                        });
                    }
                }
            );
        } else {
            // For other languages, use existing compilex setup
            const compilexLang = {
                'c': 'C',
                'cpp': 'Cpp',
                'java': 'Java',
                'javascript': 'node'
            }[language];

            if (!compilexLang) {
                return resolve({
                    status: 'error',
                    error: 'Unsupported language',
                    executionTime: 0,
                    memoryUsed: 0,
                    output: ''
                });
            }

            const compileMethod = `compile${compilexLang}`;

            compilex[compileMethod](code, input, (data) => {
                const executionTime = Date.now() - startTime;

                if (data.error) {
                    resolve({
                        status: 'error',
                        error: data.error,
                        executionTime,
                        memoryUsed: 0,
                        output: data.output || ''
                    });
                } else if (executionTime > timeLimit) {
                    resolve({
                        status: 'timeout',
                        error: 'Time limit exceeded',
                        executionTime,
                        memoryUsed: 0,
                        output: data.output || ''
                    });
                } else {
                    resolve({
                        status: 'success',
                        error: '',
                        executionTime,
                        memoryUsed: 0,
                        output: data.output || ''
                    });
                }
            });
        }
    });
};

// Process submission function
const processSubmission = async (submissionId, question, code, language) => {
    try {
        const submission = await Submission.findById(submissionId);
        if (!submission) return;

        submission.status = 'running';
        await submission.save();

        const testCaseResults = [];
        let totalExecutionTime = 0;
        let totalMemoryUsed = 0;
        // total possible marks for this submission (sum of per-test max marks)
        let maxTotalMarks = 0;
        let obtainedMarks = 0;

        // Prepare fallback marks if stored test case marks sum to 0
        const sumMarksOnQuestion = (question.testCases || []).reduce((s, tc) => s + (typeof tc.marks === 'number' ? tc.marks : 0), 0);
        let defaultMarksArr = [];
        if ((question.testCases || []).length > 0) {
            const DEFAULT_TOTAL = sumMarksOnQuestion === 0 ? 50 : (question.totalMarks || 0);
            const n = question.testCases.length;
            const base = Math.floor(DEFAULT_TOTAL / n);
            let remainder = DEFAULT_TOTAL - base * n;
            defaultMarksArr = question.testCases.map((_, i) => {
                const add = remainder > 0 ? 1 : 0;
                if (remainder > 0) remainder -= 1;
                return base + add;
            });
        }

        // Run code against ALL test cases (including hidden ones for final submission)
        for (const [idx, testCase] of question.testCases.entries()) {
            try {

                const result = await executeCode(code, language, testCase.input, question.timeLimit);


                // Use fallback mark if stored marks sum to 0
                const perTestMax = sumMarksOnQuestion === 0 ? (defaultMarksArr[idx] || 0) : (typeof testCase.marks === 'number' ? testCase.marks : 0);

                const testCaseResult = {
                    testCaseId: testCase._id,
                    status: 'failed',
                    executionTime: result.executionTime || 0,
                    memoryUsed: result.memoryUsed || 0,
                    output: result.output || '',
                    error: result.error || '',
                    marksAwarded: 0,
                    maxMarks: perTestMax,
                    isHidden: testCase.isHidden || false
                };

                maxTotalMarks += perTestMax;

                // Check if output matches expected
                if (result.status === 'success' &&
                    result.output.trim() === testCase.expectedOutput.trim()) {
                    testCaseResult.status = 'passed';
                    testCaseResult.marksAwarded = perTestMax;
                    obtainedMarks += perTestMax;
                } else if (result.status === 'timeout') {
                    testCaseResult.status = 'time_limit_exceeded';
                } else if (result.status === 'error') {
                    testCaseResult.status = 'runtime_error';
                } else {
                }

                testCaseResults.push(testCaseResult);
                totalExecutionTime += result.executionTime || 0;
                totalMemoryUsed = Math.max(totalMemoryUsed, result.memoryUsed || 0);

            } catch (error) {
                const perTestMax = sumMarksOnQuestion === 0 ? (defaultMarksArr[idx] || 0) : (typeof testCase.marks === 'number' ? testCase.marks : 0);
                maxTotalMarks += perTestMax;
                testCaseResults.push({
                    testCaseId: testCase._id,
                    status: 'runtime_error',
                    executionTime: 0,
                    memoryUsed: 0,
                    output: '',
                    error: error.message,
                    marksAwarded: 0,
                    maxMarks: perTestMax,
                    isHidden: testCase.isHidden || false
                });
            }
        }

        // Calculate final score
        const scorePercentage = maxTotalMarks > 0 ? Math.round((obtainedMarks / maxTotalMarks) * 100) : 0;


        // Update submission with results
        submission.testCaseResults = testCaseResults;
        submission.executionTime = totalExecutionTime;
        submission.memoryUsed = totalMemoryUsed;
        submission.status = 'completed';
        // Store obtained and max marks explicitly
        submission.marksAwarded = obtainedMarks;
        submission.maxMarks = maxTotalMarks;
        submission.scorePercentage = scorePercentage;

        await submission.save();


        // Update student's codingScores so activity reflects contest performance
        try {
            const Student = require('../models/Student');
            const student = await Student.findById(submission.userId);
            if (student) {
                const existingIndex = (student.codingScores || []).findIndex(cs => cs.contestId && cs.contestId.toString() === submission.contestId.toString() && cs.questionId && cs.questionId.toString() === submission.questionId.toString());

                if (existingIndex === -1) {
                    student.codingScores = student.codingScores || [];
                    student.codingScores.push({
                        contestId: submission.contestId,
                        questionId: submission.questionId,
                        score: obtainedMarks,
                        totalMarks: maxTotalMarks,
                        completedAt: new Date(),
                        submissionCode: code
                    });
                } else {
                    // Update if this attempt is better
                    const existing = student.codingScores[existingIndex];
                    if ((obtainedMarks || 0) > (existing.score || 0)) {
                        student.codingScores[existingIndex].score = obtainedMarks;
                        student.codingScores[existingIndex].totalMarks = maxTotalMarks;
                        student.codingScores[existingIndex].completedAt = new Date();
                        student.codingScores[existingIndex].submissionCode = code;
                    }
                }

                await student.save();
            }
        } catch (err) {
        }

    } catch (error) {

        // Update submission with error status
        const submission = await Submission.findById(submissionId);
        if (submission) {
            submission.status = 'error';
            submission.compilationError = error.message;
            await submission.save();
        }
    }
};

// Run code for testing (without submitting)
const runCode = async (req, res) => {
    try {
        const { contestId, questionId, code, language, input } = req.body;

        // Validate inputs
        if (!code || !language) {
            return res.status(200).json({ error: 'Code and language are required' });
        }

        let testResults = [];

        // If contestId and questionId are provided, run against sample test cases
        if (contestId && questionId) {
            const contest = await Contest.findById(contestId);
            if (!contest) {
                return res.status(200).json({ error: 'Contest not found' });
            }

            const question = contest.questions.id(questionId);
            if (!question) {
                return res.status(200).json({ error: 'Question not found' });
            }

            // Run only visible/sample test cases for testing
            const visibleTestCases = question.testCases.filter(tc => !tc.isHidden);
            // compute fallback marks if all marks are zero
            const sumVisMarks = visibleTestCases.reduce((s, tc) => s + (typeof tc.marks === 'number' ? tc.marks : 0), 0);
            let defaultVisMarks = [];
            if (visibleTestCases.length > 0) {
                const base = Math.floor(50 / visibleTestCases.length);
                let rem = 50 - base * visibleTestCases.length;
                defaultVisMarks = visibleTestCases.map(() => rem-- > 0 ? base + 1 : base);
            }

            for (const [idx, testCase] of visibleTestCases.entries()) {
                try {
                    const result = await executeCode(code, language, testCase.input, question.timeLimit);

                    const isCorrect = result.status === 'success' &&
                                     result.output.trim() === testCase.expectedOutput.trim();

                    const maxM = sumVisMarks === 0 ? (defaultVisMarks[idx] || 0) : (typeof testCase.marks === 'number' ? testCase.marks : 0);
                    const awarded = isCorrect ? maxM : 0;

                    testResults.push({
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput: result.output || '',
                        status: result.status,
                        error: result.error || '',
                        executionTime: result.executionTime || 0,
                        isCorrect,
                        marksAwarded: awarded,
                        maxMarks: maxM
                    });
                } catch (error) {
                    testResults.push({
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput: '',
                        status: 'error',
                        error: error.message,
                        executionTime: 0,
                        isCorrect: false,
                        marksAwarded: 0,
                        maxMarks: 0
                    });
                }
            }

            res.json({
                success: true,
                testResults,
                totalVisible: visibleTestCases.length,
                passedVisible: testResults.filter(r => r.isCorrect).length
            });
        } else {
            // Run with custom input if no contest/question specified
            const result = await executeCode(code, language, input || '', 10000);

            res.json({
                success: true,
                result: {
                    status: result.status,
                    output: result.output,
                    error: result.error,
                    executionTime: result.executionTime
                }
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Failed to run code' });
    }
};

// Submit code for evaluation
const submitCode = async (req, res) => {
    try {
        const { contestId, questionId, code, language } = req.body;

        // Validate inputs
        if (!contestId || !questionId || !code || !language) {
            return res.status(200).json({ error: 'All fields are required' });
        }

        // Get contest and question
        const contest = await Contest.findById(contestId);
        if (!contest) {
            return res.status(200).json({ error: 'Contest not found' });
        }

        const question = contest.questions.id(questionId);
        if (!question) {
            return res.status(200).json({ error: 'Question not found' });
        }

        // Check if contest is active and accessible
        const now = new Date();
        if (!contest.isActive || contest.endTime < now) {
            return res.status(200).json({ error: 'Contest is not accessible' });
        }

        if (contest.startTime > now) {
            return res.status(200).json({ error: 'Contest has not started yet' });
        }

        // Check if language is allowed
        if (!contest.allowedLanguages.includes(language)) {
            return res.status(200).json({ error: 'Programming language not allowed for this contest' });
        }

        // Prevent submissions if user has finalized the contest
        try {
            const Student = require('../models/Student');
            const student = await Student.findById(req.user._id).select('finalizedContests');
            if (student && Array.isArray(student.finalizedContests) && student.finalizedContests.some(c => c.toString() === contestId.toString())) {
                return res.status(200).json({ error: 'Contest has been finalized; no further submissions allowed' });
            }
        } catch (e) {
        }

        // Check submission limits
        const existingSubmissions = await Submission.countDocuments({
            contestId,
            questionId,
            userId: req.user._id
        });

        if (existingSubmissions >= contest.maxAttempts) {
            return res.status(200).json({ error: 'Maximum submission attempts reached' });
        }

        // Create submission record
        const submission = new Submission({
            contestId,
            questionId,
            userId: req.user._id,
            code,
            language,
            status: 'pending',
            maxMarks: question.totalMarks
        });

        await submission.save();

        // Process submission synchronously to return results immediately
        try {
            await processSubmission(submission._id, question, code, language);

            // Fetch updated submission with results
            const updatedSubmission = await Submission.findById(submission._id);

            res.status(201).json({
                message: 'Code submitted successfully',
                submissionId: submission._id,
                status: updatedSubmission.status,
                submission: {
                    id: updatedSubmission._id,
                    marks: updatedSubmission.marksAwarded,
                    totalMarks: updatedSubmission.totalMarks,
                    scorePercentage: updatedSubmission.scorePercentage,
                    testResults: updatedSubmission.testCaseResults,
                    submittedAt: updatedSubmission.submittedAt,
                    executionTime: updatedSubmission.executionTime,
                    status: updatedSubmission.status
                }
            });
        } catch (processingError) {
            res.status(201).json({
                message: 'Code submitted but processing failed',
                submissionId: submission._id,
                status: 'error',
                error: processingError.message
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Failed to submit code' });
    }
};

// Get submission result
const getSubmissionById = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(200).json({ error: 'Submission not found' });
        }

        // Check if user owns this submission
        if (submission.userId.toString() !== req.user._id.toString()) {
            return res.status(200).json({ error: 'Access denied' });
        }

        res.json({ submission });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
};

// Get user's submissions for a contest
const getUserContestSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({
            contestId: req.params.contestId,
            userId: req.user._id
        }).sort({ submittedAt: -1 });

        res.json({ submissions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

// Get user's submissions for a specific question
const getUserQuestionSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({
            contestId: req.params.contestId,
            questionId: req.params.questionId,
            userId: req.user._id
        }).sort({ submittedAt: -1 });

        res.json({ submissions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

module.exports = {
    runCode,
    submitCode,
    getSubmissionById,
    getUserContestSubmissions,
    getUserQuestionSubmissions
};
