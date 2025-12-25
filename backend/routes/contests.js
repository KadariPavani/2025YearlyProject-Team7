const express = require('express');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const notificationController = require('../controllers/notificationController');
const { runSubmission } = require('../utils/judge');
const authenticateToken = require('../middleware/generalAuth');
const mongoose = require('mongoose');
const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Debugging: log incoming contest router requests
router.use((req, res, next) => {
    console.log('Contests router hit ->', req.method, req.path);
    next();
});

// Get all active contests for users
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const contests = await Contest.find({
            isActive: true,
            endTime: { $gte: now }
        })
        .select('name description startTime endTime duration allowedLanguages maxAttempts questions createdAt')
        .sort({ startTime: 1 });
        
        res.json({ contests });
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

// Admin-specific routes (for contest management)
// Get contest details for admin (with full data including test cases)
router.get('/admin/:id', async (req, res) => {
    try {
        // Check if user is admin/instructor/trainer
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        // Fetch contest, then attempt to resolve the creator across known user models
        let contest = await Contest.findById(req.params.id);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Try to populate createdBy from common creator models (Trainer, Admin, TPO) to avoid relying on a missing generic 'User' model
        try {
            const Trainer = require('../models/Trainer');
            const Admin = require('../models/Admin');
            const TPO = require('../models/TPO');

            // Attempt to find creator in each model; keep the first match
            const creator = (await Trainer.findById(contest.createdBy).select('fullName email username'))
                || (await Admin.findById(contest.createdBy).select('fullName email username'))
                || (await TPO.findById(contest.createdBy).select('fullName email username'));

            // Convert to plain object and attach resolved creator if found
            const contestObj = contest.toObject ? contest.toObject() : contest;
            contestObj.createdBy = creator || contestObj.createdBy;

            return res.json({ contest: contestObj });
        } catch (popErr) {
            console.warn('Could not resolve contest creator, returning contest without creator details', popErr && popErr.message);
            return res.json({ contest });
        }
    } catch (error) {
        console.error('Error fetching admin contest:', error);
        res.status(500).json({ error: 'Failed to fetch contest' });
    }
});

// Create a new contest (admin / instructor)
router.post('/admin', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const {
            name,
            description,
            startTime,
            endTime,
            duration,
            questions = [],
            allowedLanguages = ['python', 'javascript'],
            maxAttempts = 1,
            targetBatchIds = []
        } = req.body;

        const contest = new Contest({
            name,
            description,
            startTime,
            endTime,
            duration,
            questions,
            allowedLanguages,
            maxAttempts,
            accessLevel: req.body.accessLevel || 'public',
            targetBatchIds: Array.isArray(req.body.targetBatchIds) ? req.body.targetBatchIds : [],
            createdBy: req.user._id
        });

        await contest.save();

        // populate targetBatchIds minimally so frontend can display assigned batches (if needed)
        await contest.populate('targetBatchIds');

        // Notify students (if targetBatchIds provided use them; otherwise send to all students)
        try {
            if (notificationController.notifyContestCreated) {
                notificationController.notifyContestCreated(contest._id, req.user._id, contest.name, targetBatchIds, req.user.fullName || req.user.name || req.user.username);
            } else {
                // Fallback: create generic notification
                await notificationController.createNotification({
                    body: {
                        title: `New Contest: ${contest.name}`,
                        message: `A new contest "${contest.name}" has been created and will be available from ${new Date(contest.startTime).toLocaleString()}.`,
                        targetBatchIds
                    },
                    user: req.user
                });
            }
        } catch (notifyErr) {
            console.error('Error sending contest notifications:', notifyErr);
        }

        res.status(201).json({ contest });
    } catch (error) {
        console.error('Error creating contest:', error);
        res.status(500).json({ error: 'Failed to create contest' });
    }
});

// Add a question to an existing contest (admin/instructor/trainer)
router.post('/admin/:id/questions', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const contestId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(contestId)) {
            return res.status(400).json({ error: 'Invalid contest id' });
        }

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        // Only creator or admins/instructors can add questions
        if (contest.createdBy && contest.createdBy.toString() !== req.user._id.toString() && !['admin', 'instructor'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to add question to this contest' });
        }

        const {
            title,
            description,
            difficulty = 'Easy',
            constraints = '',
            inputFormat = '',
            outputFormat = '',
            sampleInput = '',
            sampleOutput = '',
            testCases = [],
            timeLimit = 2000,
            memoryLimit = 256
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const question = {
            title,
            description,
            difficulty,
            constraints,
            inputFormat,
            outputFormat,
            sampleInput,
            sampleOutput,
            testCases: Array.isArray(testCases) ? testCases : [],
            timeLimit,
            memoryLimit
        };

        contest.questions.push(question);
        // Recalculate question totals on the new subdocument
        const addedQuestion = contest.questions[contest.questions.length - 1];
        addedQuestion.totalMarks = (addedQuestion.testCases || []).reduce((s, t) => s + (t.marks || 0), 0);
        await contest.save();

        // Return the newly added question (the last one)
        res.status(201).json({ question: addedQuestion });
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({ error: 'Failed to add question' });
    }
});

// Update contest details (admin/instructor/trainer)
router.put('/admin/:id', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const contestId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(contestId)) {
            return res.status(400).json({ error: 'Invalid contest id' });
        }

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        // Only creator or admins/instructors can edit
        if (contest.createdBy && contest.createdBy.toString() !== req.user._id.toString() && !['admin', 'instructor'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to edit this contest' });
        }

        const {
            name,
            description,
            startTime,
            endTime,
            duration,
            allowedLanguages,
            maxAttempts,
            accessLevel,
            targetBatchIds,
            isActive
        } = req.body;

        if (name) contest.name = name;
        if (description) contest.description = description;
        if (startTime) contest.startTime = startTime;
        if (endTime) contest.endTime = endTime;
        if (typeof duration !== 'undefined') contest.duration = duration;
        if (allowedLanguages) contest.allowedLanguages = Array.isArray(allowedLanguages) ? allowedLanguages : contest.allowedLanguages;
        if (typeof maxAttempts !== 'undefined') contest.maxAttempts = maxAttempts;
        if (accessLevel) contest.accessLevel = accessLevel;
        if (Array.isArray(targetBatchIds)) contest.targetBatchIds = targetBatchIds;
        if (typeof isActive !== 'undefined') contest.isActive = !!isActive;

        await contest.save();

        res.json({ contest });
    } catch (error) {
        console.error('Error updating contest:', error);
        res.status(500).json({ error: 'Failed to update contest' });
    }
});

// Delete a contest (admin/instructor/trainer)
router.delete('/admin/:id', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const contestId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(contestId)) {
            return res.status(400).json({ error: 'Invalid contest id' });
        }

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        // Only creator or admins/instructors can delete
        if (contest.createdBy && contest.createdBy.toString() !== req.user._id.toString() && !['admin', 'instructor'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to delete this contest' });
        }

        await Contest.findByIdAndDelete(contestId);
        res.json({ message: 'Contest deleted' });
    } catch (error) {
        console.error('Error deleting contest:', error);
        res.status(500).json({ error: 'Failed to delete contest' });
    }
});

// Update a question inside a contest (admin/instructor/trainer)
router.put('/admin/:id/questions/:questionId', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const { id: contestId, questionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(contestId) || !mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({ error: 'Invalid id(s)' });
        }

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        // Only creator or admins/instructors can edit
        if (contest.createdBy && contest.createdBy.toString() !== req.user._id.toString() && !['admin', 'instructor'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to edit questions for this contest' });
        }

        const question = contest.questions.id(questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        const {
            title,
            description,
            difficulty,
            constraints,
            inputFormat,
            outputFormat,
            sampleInput,
            sampleOutput,
            testCases,
            timeLimit,
            memoryLimit
        } = req.body;

        if (title) question.title = title;
        if (description) question.description = description;
        if (difficulty) question.difficulty = difficulty;
        if (typeof constraints !== 'undefined') question.constraints = constraints;
        if (typeof inputFormat !== 'undefined') question.inputFormat = inputFormat;
        if (typeof outputFormat !== 'undefined') question.outputFormat = outputFormat;
        if (typeof sampleInput !== 'undefined') question.sampleInput = sampleInput;
        if (typeof sampleOutput !== 'undefined') question.sampleOutput = sampleOutput;
        if (typeof timeLimit !== 'undefined') question.timeLimit = timeLimit;
        if (typeof memoryLimit !== 'undefined') question.memoryLimit = memoryLimit;

        if (Array.isArray(testCases)) {
            question.testCases = testCases;
            // recalc total
            question.totalMarks = (question.testCases || []).reduce((s, t) => s + (t.marks || 0), 0);
        }

        await contest.save();
        res.json({ question });
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ error: 'Failed to update question' });
    }
});

// Delete a question from a contest (admin/instructor/trainer)
router.delete('/admin/:id/questions/:questionId', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const { id: contestId, questionId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(contestId) || !mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({ error: 'Invalid id(s)' });
        }

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        // Only creator or admins/instructors can delete
        if (contest.createdBy && contest.createdBy.toString() !== req.user._id.toString() && !['admin', 'instructor'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to delete questions for this contest' });
        }

        const question = contest.questions.id(questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        question.remove();
        await contest.save();

        res.json({ message: 'Question deleted' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// List contests created by the current admin/instructor (admin view)
router.get('/admin', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const contests = await Contest.find({ createdBy: req.user._id })
            .select('name description startTime endTime duration allowedLanguages maxAttempts accessLevel targetBatchIds createdAt questions')
            .sort({ createdAt: -1 });
        res.json({ contests });
    } catch (error) {
        console.error('Error fetching admin contests list:', error);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

// Get contest details for participants
router.get('/:id', async (req, res) => {
    try {
        // Guard against reserved keywords like 'admin' being routed here
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.warn('Invalid contest id received:', req.params.id);
            return res.status(404).json({ error: 'Contest not found' });
        }

        const contest = await Contest.findById(req.params.id);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Check if contest is accessible (allow viewing after contest end so results can be read)
        const now = new Date();
        if (!contest.isActive) {
            return res.status(403).json({ error: 'Contest is not accessible' });
        }

        // Get user's submissions for this contest
        const userSubmissions = await Submission.find({ 
            contestId: req.params.id, 
            userId: req.user._id 
        }).sort({ submittedAt: -1 });

        // Create a map of best scores per question
        const questionScores = new Map();
        userSubmissions.forEach(submission => {
            const questionId = submission.questionId.toString();
            const currentBest = questionScores.get(questionId) || { marksAwarded: 0, maxMarks: 0, status: 'not_attempted' };
            
            if ((submission.marksAwarded || 0) >= (currentBest.marksAwarded || 0)) {
                const marks = submission.marksAwarded || 0;
                const max = submission.maxMarks || 0;
                const percent = max > 0 ? Math.round((marks / max) * 100) : 0;
                questionScores.set(questionId, {
                    marksAwarded: marks,
                    maxMarks: max,
                    status: submission.status,
                    scorePercentage: submission.scorePercentage || percent,
                    percentage: percent,
                    submissionId: submission._id,
                    submittedAt: submission.submittedAt
                });
            }
        });

        // Don't send test cases to participants (only sample input/output)
        const contestData = {
            _id: contest._id,
            name: contest.name,
            description: contest.description,
            startTime: contest.startTime,
            endTime: contest.endTime,
            duration: contest.duration,
            allowedLanguages: contest.allowedLanguages,
            maxAttempts: contest.maxAttempts,
            questions: contest.questions.map(question => ({
                _id: question._id,
                title: question.title,
                description: question.description,
                difficulty: question.difficulty,
                constraints: question.constraints,
                inputFormat: question.inputFormat,
                outputFormat: question.outputFormat,
                sampleInput: question.sampleInput,
                sampleOutput: question.sampleOutput,
                timeLimit: question.timeLimit,
                memoryLimit: question.memoryLimit,
                // If totalMarks is not set, derive a default (50 distributed across testcases)
                totalMarks: question.totalMarks && question.totalMarks > 0 ? question.totalMarks : ((question.testCases || []).length > 0 ? 50 : 0),
                // Add user's submission data for this question
                userSubmission: (() => {
                    const us = questionScores.get(question._id.toString()) || null;
                    if (!us) return null;
                    // If user's maxMarks is 0 (older submissions), fall back to question total or default 50
                    const displayMax = (us.maxMarks && us.maxMarks > 0) ? us.maxMarks : (question.totalMarks && question.totalMarks > 0 ? question.totalMarks : ((question.testCases || []).length > 0 ? 50 : 0));
                    const percent = typeof us.percentage === 'number' ? us.percentage : (displayMax > 0 ? Math.round((us.marksAwarded / displayMax) * 100) : 0);
                    return { ...us, percentage: percent, maxMarks: displayMax };
                })()
            }))
        };

        // include whether current user has finalized this contest
        try {
            const Student = require('../models/Student');
            const student = await Student.findById(req.user._id).select('finalizedContests');
            contestData.myFinalized = !!(student && Array.isArray(student.finalizedContests) && student.finalizedContests.some(id => id.toString() === contest._id.toString()));
        } catch (e) {
            contestData.myFinalized = false;
        }

        console.log(contestData);
        res.json({ contest: contestData });
    } catch (error) {
        console.error('Error fetching contest:', error);
        res.status(500).json({ error: 'Failed to fetch contest' });
    }
});

// Get specific question details
router.get('/:contestId/questions/:questionId', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.contestId);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        const question = contest.questions.id(req.params.questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Check if contest is accessible
        const now = new Date();
        if (!contest.isActive || contest.endTime < now) {
            return res.status(403).json({ error: 'Contest is not accessible' });
        }

        // Don't send test cases to participants
        const questionData = {
            _id: question._id,
            title: question.title,
            description: question.description,
            difficulty: question.difficulty,
            constraints: question.constraints,
            inputFormat: question.inputFormat,
            outputFormat: question.outputFormat,
            sampleInput: question.sampleInput,
            sampleOutput: question.sampleOutput,
            timeLimit: question.timeLimit,
            memoryLimit: question.memoryLimit,
            totalMarks: question.totalMarks
        };

        res.json({ question: questionData });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

// Run code for a question (non-saved quick run)
router.post('/:contestId/questions/:questionId/run', async (req, res) => {
    try {
        const { contestId, questionId } = req.params;
        const { code, language } = req.body;

        console.log('Run endpoint hit', { contestId, questionId });

        const contest = await Contest.findById(contestId);
        if (!contest) {
            console.warn('Run: contest not found', contestId);
            return res.status(404).json({ error: 'Contest not found' });
        }

        const now = new Date();
        if (!contest.isActive || contest.endTime < now) {
            console.warn('Run: contest not accessible', { contestId, isActive: contest.isActive, endTime: contest.endTime });
            return res.status(403).json({ error: 'Contest is not accessible' });
        }

        const question = contest.questions.id(questionId);
        if (!question) {
            console.warn('Run: question not found', { contestId, questionId });
            return res.status(404).json({ error: 'Question not found' });
        }

        // Build testcases for run: prefer non-hidden test cases; fallback to sample IO
        const qTestCases = (question.testCases || []).filter(tc => !tc.isHidden);
        // Compute per-test marks fallback (if question.totalMarks is 0, we already set defaults on save; but guard anyway)
        const qTotal = question.totalMarks && question.totalMarks > 0 ? question.totalMarks : (qTestCases.length > 0 ? 50 : 0);
        // If existing per-test marks sum to 0, use default distribution; otherwise prefer stored marks
        const sumExistingMarks = qTestCases.reduce((s, tc) => s + (typeof tc.marks === 'number' ? tc.marks : 0), 0);
        let defaultMarks = [];
        if (qTestCases.length > 0) {
            const base = Math.floor(qTotal / qTestCases.length);
            let rem = qTotal - base * qTestCases.length;
            defaultMarks = qTestCases.map(() => rem-- > 0 ? base + 1 : base);
        }

        let tcs = qTestCases.map((tc, idx) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            marks: sumExistingMarks === 0 ? (defaultMarks[idx] || 0) : (typeof tc.marks === 'number' && tc.marks >= 0 ? tc.marks : (defaultMarks[idx] || 0)),
            isHidden: tc.isHidden
        }));

        if (tcs.length === 0) {
            // if no non-hidden testcases exist, use sample input/output (if present)
            if (question.sampleInput || question.sampleOutput) {
                tcs = [{ input: question.sampleInput || '', expectedOutput: question.sampleOutput || '', marks: 0, isHidden: false }];
            }
        }

        if (tcs.length === 0) {
            console.warn('Run: no visible test cases for run', { contestId, questionId });
            return res.status(400).json({ error: 'No visible test cases available for run' });
        }

        // Run judge
        const judgeResult = await runSubmission({ language, code, testCases: tcs, timeLimit: question.timeLimit, memoryLimit: question.memoryLimit });

        if (judgeResult.compilationError) {
            return res.status(200).json({ compilationError: judgeResult.compilationError });
        }

        const testCaseResults = judgeResult.testCaseResults.map((r, idx) => ({
            status: r.status,
            executionTime: r.executionTime,
            memoryUsed: r.memoryUsed,
            output: r.output,
            error: r.error,
            marksAwarded: r.marksAwarded || 0,
            maxMarks: r.maxMarks || (tcs[idx]?.marks || 0),
            isHidden: r.isHidden,
            testCaseId: question.testCases[idx]?._id || null
        }));

        // Optionally save this run as a lightweight submission (auto-save the first run for this question)
        let savedSubmission = null;
        try {
            const existingSubCount = await Submission.countDocuments({ contestId, questionId, userId: req.user._id });
            const shouldSaveRun = !!req.body.saveRun || existingSubCount === 0;
            if (shouldSaveRun) {
                const totalMarks = testCaseResults.reduce((s, r) => s + (r.marksAwarded || 0), 0);
                const maxMarks = testCaseResults.reduce((s, r) => s + (r.maxMarks || 0), 0);

                const submission = new Submission({
                    contestId: contest._id,
                    questionId: question._id,
                    userId: req.user._id,
                    code: code || '',
                    language: language || (contest.allowedLanguages && contest.allowedLanguages[0]) || 'python',
                    status: 'completed',
                    testCaseResults: testCaseResults,
                    marksAwarded: totalMarks,
                    maxMarks: maxMarks,
                    scorePercentage: maxMarks === 0 ? 0 : Math.round((totalMarks / maxMarks) * 100),
                    passedTestCases: testCaseResults.filter(r => r.status === 'passed').length,
                    totalTestCases: testCaseResults.length,
                    executionTime: judgeResult.totalTime || 0,
                    isRun: true,
                    submittedAt: new Date()
                });

                await submission.save();
                savedSubmission = submission;

                // Update student's codingScores (best-effort)
                try {
                    const Student = require('../models/Student');
                    const student = await Student.findById(req.user._id);
                    if (student) {
                        const obtainedMarks = submission.marksAwarded || 0;
                        const maxTotalMarks = submission.maxMarks || 0;
                        const existingIndex = (student.codingScores || []).findIndex(cs => cs.contestId && cs.contestId.toString() === contest._id.toString() && cs.questionId && cs.questionId.toString() === question._id.toString());
                        if (existingIndex === -1) {
                            student.codingScores = student.codingScores || [];
                            student.codingScores.push({ contestId: contest._id, questionId: question._id, score: obtainedMarks, totalMarks: maxTotalMarks, completedAt: new Date(), submissionCode: submission.code });
                        } else {
                            if ((obtainedMarks || 0) > (student.codingScores[existingIndex].score || 0)) {
                                student.codingScores[existingIndex].score = obtainedMarks;
                                student.codingScores[existingIndex].totalMarks = maxTotalMarks;
                                student.codingScores[existingIndex].completedAt = new Date();
                                student.codingScores[existingIndex].submissionCode = submission.code;
                            }
                        }
                        await student.save();
                    }
                } catch (err) {
                    console.warn('Failed to update student codingScores on run save:', err.message);
                }
            }
        } catch (err) {
            console.warn('Failed to auto-save run submission:', err.message);
        }

        res.json({ testCaseResults, totalTime: judgeResult.totalTime || 0, savedRun: !!savedSubmission, savedSubmission });
    } catch (error) {
        console.error('Error running code:', error);
        res.status(500).json({ error: 'Failed to run code' });
    }
});

// Submit code for a question
router.post('/:contestId/questions/:questionId/submit', async (req, res) => {
    try {
        const { contestId, questionId } = req.params;
        const { code, language } = req.body;

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        const now = new Date();
        if (!contest.isActive || contest.endTime < now) {
            return res.status(403).json({ error: 'Contest is not accessible' });
        }

        const question = contest.questions.id(questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        if (!contest.allowedLanguages.includes(language)) {
            return res.status(400).json({ error: 'Language not allowed for this contest' });
        }

        // Prevent submission if user has finalized the contest
        try {
            const Student = require('../models/Student');
            const student = await Student.findById(req.user._id).select('finalizedContests');
            if (student && Array.isArray(student.finalizedContests) && student.finalizedContests.some(c => c.toString() === contest._id.toString())) {
                return res.status(403).json({ error: 'Contest has been finalized; no further submissions allowed' });
            }
        } catch (e) {
            console.warn('Could not check student finalization status:', e.message);
        }

        // Create a pending submission
        let submission = new Submission({
            contestId: contest._id,
            questionId: question._id,
            userId: req.user._id,
            code,
            language,
            status: 'running'
        });

        await submission.save();

        // Build minimal testcases for judge and ensure per-test marks exist (fallback to equal distribution of question.totalMarks or 50)
        const qAllTestCases = question.testCases || [];
        const qTotalForMarks = question.totalMarks && question.totalMarks > 0 ? question.totalMarks : (qAllTestCases.length > 0 ? 50 : 0);
        // If existing per-test marks sum to 0, use default distribution; otherwise prefer stored marks
        const sumExistingAll = qAllTestCases.reduce((s, tc) => s + (typeof tc.marks === 'number' ? tc.marks : 0), 0);
        let defaultMarksForAll = [];
        if (qAllTestCases.length > 0) {
            const base = Math.floor(qTotalForMarks / qAllTestCases.length);
            let rem = qTotalForMarks - base * qAllTestCases.length;
            defaultMarksForAll = qAllTestCases.map(() => rem-- > 0 ? base + 1 : base);
        }

        const tcs = qAllTestCases.map((tc, idx) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            marks: sumExistingAll === 0 ? (defaultMarksForAll[idx] || 0) : (typeof tc.marks === 'number' && tc.marks >= 0 ? tc.marks : (defaultMarksForAll[idx] || 0)),
            isHidden: tc.isHidden
        }));

        // Run judge
        const judgeResult = await runSubmission({ language, code, testCases: tcs, timeLimit: question.timeLimit, memoryLimit: question.memoryLimit });

        // If compilation error
        if (judgeResult.compilationError) {
            submission.status = 'error';
            submission.compilationError = judgeResult.compilationError;
            await submission.save();
            return res.status(200).json({ submission, compilationError: judgeResult.compilationError });
        }

        // Map results back to testCase results including original testCaseId if exists
        const testCaseResults = judgeResult.testCaseResults.map((r, idx) => ({
            testCaseId: question.testCases[idx]._id,
            status: r.status,
            executionTime: r.executionTime,
            memoryUsed: r.memoryUsed,
            output: r.output,
            error: r.error,
            marksAwarded: r.marksAwarded || 0,
            maxMarks: r.maxMarks || (question.testCases[idx]?.marks || 0),
            isHidden: r.isHidden
        }));

        const totalMarks = testCaseResults.reduce((s, r) => s + (r.marksAwarded || 0), 0);
        const maxMarks = testCaseResults.reduce((s, r) => s + (r.maxMarks || 0), 0);
        const passed = testCaseResults.filter(r => r.status === 'passed').length;

        submission.status = 'completed';
        submission.testCaseResults = testCaseResults;
        submission.totalMarks = totalMarks;
        submission.marksAwarded = totalMarks;
        submission.maxMarks = maxMarks;
        submission.passedTestCases = passed;
        submission.totalTestCases = testCaseResults.length;
        submission.executionTime = judgeResult.totalTime || 0;
        submission.scorePercentage = maxMarks === 0 ? 0 : Math.round((totalMarks / maxMarks) * 100);

        await submission.save();

        res.json({ submission });

    } catch (error) {
        console.error('Error submitting code:', error);
        res.status(500).json({ error: 'Failed to submit code' });
    }
});

// Finalize contest for current user (student) — submit final entries and prevent further attempts
router.post('/:id/finalize', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        const now = new Date();
        if (!contest.isActive || contest.startTime > now || contest.endTime < now) {
            return res.status(403).json({ error: 'Contest is not accessible for finalization at this time' });
        }

        const Student = require('../models/Student');
        const student = await Student.findById(req.user._id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Already finalized?
        if (Array.isArray(student.finalizedContests) && student.finalizedContests.some(c => c.toString() === contest._id.toString())) {
            return res.status(403).json({ error: 'Contest already finalized for this user' });
        }

        // Gather existing submissions for this user
        const userSubmissions = await Submission.find({ contestId: contest._id, userId: student._id }).sort({ submittedAt: -1 });
        const bestByQuestion = new Map();
        userSubmissions.forEach(s => {
            const qid = s.questionId.toString();
            const cur = bestByQuestion.get(qid) || null;
            if (!cur || (s.marksAwarded || 0) > (cur.marksAwarded || 0)) bestByQuestion.set(qid, s);
        });

        // For each question, create a final submission if needed and update student.codingScores
        for (const question of contest.questions) {
            const qid = question._id.toString();
            const best = bestByQuestion.get(qid);

            if (best) {
                // Copy best submission as final
                const finalSub = new Submission({
                    contestId: contest._id,
                    questionId: question._id,
                    userId: student._id,
                    code: best.code || '',
                    language: best.language || (contest.allowedLanguages && contest.allowedLanguages[0]) || 'python',
                    status: 'completed',
                    testCaseResults: best.testCaseResults || [],
                    marksAwarded: best.marksAwarded || 0,
                    maxMarks: best.maxMarks || question.totalMarks || ((question.testCases && question.testCases.length) ? 50 : 0),
                    scorePercentage: best.scorePercentage || 0,
                    executionTime: best.executionTime || 0,
                    isFinal: true,
                    submittedAt: new Date()
                });
                await finalSub.save();

                // Update student codingScores similar to submissions processing
                const obtainedMarks = finalSub.marksAwarded || 0;
                const maxTotalMarks = finalSub.maxMarks || 0;
                const existingIndex = (student.codingScores || []).findIndex(cs => cs.contestId && cs.contestId.toString() === contest._id.toString() && cs.questionId && cs.questionId.toString() === qid);
                if (existingIndex === -1) {
                    student.codingScores = student.codingScores || [];
                    student.codingScores.push({ contestId: contest._id, questionId: question._id, score: obtainedMarks, totalMarks: maxTotalMarks, completedAt: new Date(), submissionCode: finalSub.code });
                } else {
                    if ((obtainedMarks || 0) > (student.codingScores[existingIndex].score || 0)) {
                        student.codingScores[existingIndex].score = obtainedMarks;
                        student.codingScores[existingIndex].totalMarks = maxTotalMarks;
                        student.codingScores[existingIndex].completedAt = new Date();
                        student.codingScores[existingIndex].submissionCode = finalSub.code;
                    }
                }

            } else {
                // No submission for this question — create a zero submission as final
                const maxMarks = question.totalMarks && question.totalMarks > 0 ? question.totalMarks : ((question.testCases && question.testCases.length) ? 50 : 0);
                const finalSub = new Submission({
                    contestId: contest._id,
                    questionId: question._id,
                    userId: student._id,
                    code: '',
                    language: (contest.allowedLanguages && contest.allowedLanguages[0]) || 'python',
                    status: 'completed',
                    testCaseResults: [],
                    marksAwarded: 0,
                    maxMarks: maxMarks,
                    scorePercentage: 0,
                    executionTime: 0,
                    isFinal: true,
                    submittedAt: new Date()
                });
                await finalSub.save();

                // Add zero entry to student.codingScores if missing
                const existingIndex = (student.codingScores || []).findIndex(cs => cs.contestId && cs.contestId.toString() === contest._id.toString() && cs.questionId && cs.questionId.toString() === qid);
                if (existingIndex === -1) {
                    student.codingScores = student.codingScores || [];
                    student.codingScores.push({ contestId: contest._id, questionId: question._id, score: 0, totalMarks: maxMarks, completedAt: new Date(), submissionCode: '' });
                }
            }
        }

        student.finalizedContests = student.finalizedContests || [];
        student.finalizedContests.push(contest._id);
        await student.save();

        res.json({ message: 'Contest finalized successfully' });
    } catch (error) {
        console.error('Error finalizing contest:', error);
        res.status(500).json({ error: 'Failed to finalize contest' });
    }
});


// Finalize contest for ALL participants (admin/trainer) — build final submissions per-user and update student coding scores
router.post('/admin/:id/finalize-all', async (req, res) => {
    try {
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        // Find all participants who submitted or were targeted by contest (from submissions)
        const submissions = await Submission.find({ contestId: contest._id });
        const participantIds = Array.from(new Set(submissions.map(s => s.userId.toString())));

        // If contest accessLevel === 'batch' we may want to include students from target batches
        if (contest.accessLevel === 'batch' && Array.isArray(contest.targetBatchIds) && contest.targetBatchIds.length > 0) {
            const Student = require('../models/Student');
            const more = await Student.find({ $or: [ { batchId: { $in: contest.targetBatchIds } }, { placementTrainingBatchId: { $in: contest.targetBatchIds } } ] }).select('_id');
            more.forEach(s => participantIds.push(s._id.toString()));
        }

        // Deduplicate
        const uniqueParticipants = Array.from(new Set(participantIds));

        const Student = require('../models/Student');

        for (const pid of uniqueParticipants) {
            const student = await Student.findById(pid);
            if (!student) continue;

            // Gather user's submissions and pick best per question
            const userSubs = await Submission.find({ contestId: contest._id, userId: student._id }).sort({ submittedAt: -1 });
            const bestByQuestion = new Map();
            userSubs.forEach(s => {
                const qid = s.questionId.toString();
                const cur = bestByQuestion.get(qid) || null;
                if (!cur || (s.marksAwarded || 0) > (cur.marksAwarded || 0)) bestByQuestion.set(qid, s);
            });

            // For each question, create a final submission (best or zero) and update student's codingScores
            for (const question of contest.questions) {
                const qid = question._id.toString();
                const best = bestByQuestion.get(qid);

                if (best) {
                    const finalSub = new Submission({
                        contestId: contest._id,
                        questionId: question._id,
                        userId: student._id,
                        code: best.code || '',
                        language: best.language || (contest.allowedLanguages && contest.allowedLanguages[0]) || 'python',
                        status: 'completed',
                        testCaseResults: best.testCaseResults || [],
                        marksAwarded: best.marksAwarded || 0,
                        maxMarks: best.maxMarks || question.totalMarks || ((question.testCases && question.testCases.length) ? 50 : 0),
                        scorePercentage: best.scorePercentage || 0,
                        executionTime: best.executionTime || 0,
                        isFinal: true,
                        submittedAt: new Date()
                    });
                    await finalSub.save();

                    // Update student codingScores
                    const obtainedMarks = finalSub.marksAwarded || 0;
                    const maxTotalMarks = finalSub.maxMarks || 0;
                    const existingIndex = (student.codingScores || []).findIndex(cs => cs.contestId && cs.contestId.toString() === contest._id.toString() && cs.questionId && cs.questionId.toString() === qid);
                    if (existingIndex === -1) {
                        student.codingScores = student.codingScores || [];
                        student.codingScores.push({ contestId: contest._id, questionId: question._id, score: obtainedMarks, totalMarks: maxTotalMarks, completedAt: new Date(), submissionCode: finalSub.code });
                    } else {
                        if ((obtainedMarks || 0) > (student.codingScores[existingIndex].score || 0)) {
                            student.codingScores[existingIndex].score = obtainedMarks;
                            student.codingScores[existingIndex].totalMarks = maxTotalMarks;
                            student.codingScores[existingIndex].completedAt = new Date();
                            student.codingScores[existingIndex].submissionCode = finalSub.code;
                        }
                    }
                } else {
                    // No submission for this question — create a zero submission as final
                    const maxMarks = question.totalMarks && question.totalMarks > 0 ? question.totalMarks : ((question.testCases && question.testCases.length) ? 50 : 0);
                    const finalSub = new Submission({
                        contestId: contest._id,
                        questionId: question._id,
                        userId: student._id,
                        code: '',
                        language: (contest.allowedLanguages && contest.allowedLanguages[0]) || 'python',
                        status: 'completed',
                        testCaseResults: [],
                        marksAwarded: 0,
                        maxMarks: maxMarks,
                        scorePercentage: 0,
                        executionTime: 0,
                        isFinal: true,
                        submittedAt: new Date()
                    });
                    await finalSub.save();

                    const existingIndex = (student.codingScores || []).findIndex(cs => cs.contestId && cs.contestId.toString() === contest._id.toString() && cs.questionId && cs.questionId.toString() === qid);
                    if (existingIndex === -1) {
                        student.codingScores = student.codingScores || [];
                        student.codingScores.push({ contestId: contest._id, questionId: question._id, score: 0, totalMarks: maxMarks, completedAt: new Date(), submissionCode: '' });
                    }
                }
            }

            // Mark contest finalized for this student
            student.finalizedContests = student.finalizedContests || [];
            if (!student.finalizedContests.some(id => id.toString() === contest._id.toString())) {
                student.finalizedContests.push(contest._id);
            }
            await student.save();
        }

        // Optionally mark contest inactive to prevent further submissions
        contest.isActive = false;
        await contest.save();

        res.json({ message: 'Contest finalized for all participants', totalParticipants: uniqueParticipants.length });
    } catch (error) {
        console.error('Error finalizing contest for all participants:', error);
        res.status(500).json({ error: 'Failed to finalize contest for all participants' });
    }
});

// Get contest participants (admin only)
router.get('/admin/:id/participants', async (req, res) => {
    try {
        // Check if user is admin/instructor/trainer
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        // For now, we'll get participants from submissions
        // In a real system, you might have a separate participants collection
        const submissions = await Submission.find({ contestId: req.params.id })
            .populate('userId', 'fullName email username teamNumber batchYear')
            .select('userId submittedAt')
            .sort({ submittedAt: 1 });

        // Get unique participants
        const participantsMap = new Map();
        submissions.forEach(submission => {
            if (submission.userId && !participantsMap.has(submission.userId._id.toString())) {
                participantsMap.set(submission.userId._id.toString(), {
                    _id: submission.userId._id,
                    user: submission.userId,
                    registeredAt: submission.submittedAt // Using first submission as registration time
                });
            }
        });

        const participants = Array.from(participantsMap.values());
        res.json({ participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ error: 'Failed to fetch participants' });
    }
});

// Get all contest submissions (admin only)
router.get('/admin/:id/submissions', async (req, res) => {
    try {
        // Check if user is admin/instructor/trainer
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const submissions = await Submission.find({ contestId: req.params.id })
            .populate('userId', 'fullName email username teamNumber batchYear')
            .sort({ submittedAt: -1 });

        res.json({ submissions });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Get contest leaderboard (admin only)
router.get('/admin/:id/leaderboard', async (req, res) => {
    try {
        // Check if user is admin/instructor/trainer
        if (!['admin', 'instructor', 'trainer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Admin/instructor/trainer access required' });
        }

        const contest = await Contest.findById(req.params.id);
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Get all submissions for this contest
        const submissions = await Submission.find({ contestId: req.params.id })
            .populate('userId', 'fullName email username teamNumber batchYear')
            .sort({ submittedAt: -1 });

        // Calculate leaderboard
        const userScores = new Map();
        
        submissions.forEach(submission => {
            if (!submission.userId) return;
            
            const userId = submission.userId._id.toString();
            const questionId = submission.questionId.toString();
            
            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    userId: userId,
                    user: submission.userId,
                    totalScore: 0,
                    problemsSolved: 0,
                    totalTime: 0,
                    lastSubmission: submission.submittedAt,
                    maxPossibleScore: 0,
                    questionScores: new Map()
                });
            }
            
            const userScore = userScores.get(userId);
            const currentQuestionScore = userScore.questionScores.get(questionId) || 0;
            
            // Update if this submission has a better score for this question
            if (submission.marksAwarded > currentQuestionScore) {
                const scoreDiff = submission.marksAwarded - currentQuestionScore;
                userScore.totalScore += scoreDiff;
                userScore.questionScores.set(questionId, submission.marksAwarded);
                
                // If this is the first time solving this question
                if (currentQuestionScore === 0 && submission.marksAwarded > 0) {
                    userScore.problemsSolved += 1;
                }
            }
            
            userScore.totalTime += submission.executionTime || 0;
            userScore.lastSubmission = submission.submittedAt;
        });

        // Calculate max possible score (fallback to 50 per question when totalMarks not set)
        const maxPossibleScore = contest.questions.reduce((total, question) => total + (question.totalMarks && question.totalMarks > 0 ? question.totalMarks : ((question.testCases || []).length > 0 ? 50 : 0)), 0);
        userScores.forEach(userScore => {
            userScore.maxPossibleScore = maxPossibleScore;
        });

        // Convert to array and sort by total score (descending)
        const leaderboard = Array.from(userScores.values())
            .sort((a, b) => {
                if (b.totalScore !== a.totalScore) {
                    return b.totalScore - a.totalScore;
                }
                // If scores are equal, sort by problems solved
                if (b.problemsSolved !== a.problemsSolved) {
                    return b.problemsSolved - a.problemsSolved;
                }
                // If still equal, sort by total time (ascending - faster is better)
                return a.totalTime - b.totalTime;
            });

        // also return max possible score to keep frontend consistent
        res.json({ leaderboard, maxPossibleScore });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Public leaderboard (available after contest completion) or available to finalized participants during contest
router.get('/:id/leaderboard', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        const now = new Date();
        let submissions;

        if (contest.endTime > now) {
            // Contest ongoing — allow only finalized participants to view leaderboard (constructed from final submissions)
            const Student = require('../models/Student');
            const student = await Student.findById(req.user._id).select('finalizedContests');
            if (!student || !Array.isArray(student.finalizedContests) || !student.finalizedContests.some(id => id.toString() === contest._id.toString())) {
                return res.status(403).json({ error: 'Leaderboard will be available after contest completion' });
            }

            submissions = await Submission.find({ contestId: req.params.id, isFinal: true })
                .populate('userId', 'fullName username')
                .sort({ submittedAt: -1 });
        } else {
            // Contest completed — show normal leaderboard built from all submissions
            submissions = await Submission.find({ contestId: req.params.id })
                .populate('userId', 'fullName username')
                .sort({ submittedAt: -1 });
        }

        const userScores = new Map();
        submissions.forEach(submission => {
            if (!submission.userId) return;
            const userId = submission.userId._id.toString();
            const questionId = submission.questionId.toString();
            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    userId,
                    user: submission.userId,
                    totalScore: 0,
                    problemsSolved: 0,
                    totalTime: 0,
                    questionScores: new Map()
                });
            }
            const userScore = userScores.get(userId);
            const currentQuestionScore = userScore.questionScores.get(questionId) || 0;
            if (submission.marksAwarded > currentQuestionScore) {
                const diff = submission.marksAwarded - currentQuestionScore;
                userScore.totalScore += diff;
                userScore.questionScores.set(questionId, submission.marksAwarded);
                if (currentQuestionScore === 0 && submission.marksAwarded > 0) userScore.problemsSolved += 1;
            }
            userScore.totalTime += submission.executionTime || 0;
        });

        const maxPossibleScore = contest.questions.reduce((t, q) => t + (q.totalMarks && q.totalMarks > 0 ? q.totalMarks : ((q.testCases || []).length > 0 ? 50 : 0)), 0);
        const leaderboard = Array.from(userScores.values())
            .map(u => ({
                user: u.user,
                totalScore: u.totalScore,
                problemsSolved: u.problemsSolved,
                totalTime: u.totalTime,
                percentage: maxPossibleScore ? Math.round((u.totalScore / maxPossibleScore) * 100) : 0
            }))
            .sort((a, b) => b.totalScore - a.totalScore || b.problemsSolved - a.problemsSolved || a.totalTime - b.totalTime);

        res.json({ leaderboard, maxPossibleScore });
    } catch (error) {
        console.error('Error fetching public leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get current authenticated user's contest result and rank
router.get('/:id/user-result', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });

        const now = new Date();
        if (contest.endTime > now) {
            return res.status(403).json({ error: 'Results will be available after contest completion' });
        }

        // Build leaderboard to compute ranks
        const submissions = await Submission.find({ contestId: req.params.id })
            .populate('userId', 'fullName username')
            .sort({ submittedAt: -1 });

        const userScores = new Map();
        submissions.forEach(submission => {
            if (!submission.userId) return;
            const userId = submission.userId._id.toString();
            const questionId = submission.questionId.toString();
            if (!userScores.has(userId)) {
                userScores.set(userId, { userId, user: submission.userId, totalScore: 0, problemsSolved: 0, totalTime: 0, questionScores: new Map() });
            }
            const userScore = userScores.get(userId);
            const currentQuestionScore = userScore.questionScores.get(questionId) || 0;
            if (submission.marksAwarded > currentQuestionScore) {
                const diff = submission.marksAwarded - currentQuestionScore;
                userScore.totalScore += diff;
                userScore.questionScores.set(questionId, submission.marksAwarded);
                if (currentQuestionScore === 0 && submission.marksAwarded > 0) userScore.problemsSolved += 1;
            }
            userScore.totalTime += submission.executionTime || 0;
        });

        const maxPossibleScore = contest.questions.reduce((t, q) => t + q.totalMarks, 0);
        const sorted = Array.from(userScores.values()).sort((a, b) => b.totalScore - a.totalScore || b.problemsSolved - a.problemsSolved || a.totalTime - b.totalTime);

        const myId = req.user._id.toString();
        const myEntry = sorted.findIndex(u => u.userId === myId);
        if (myEntry === -1) return res.status(404).json({ error: 'No submissions found for this user in this contest' });

        const rank = myEntry + 1;
        const myScore = sorted[myEntry];

        res.json({ rank, myScore: { totalScore: myScore.totalScore, problemsSolved: myScore.problemsSolved, percentage: maxPossibleScore ? Math.round((myScore.totalScore / maxPossibleScore)*100) : 0 }, maxPossibleScore });
    } catch (error) {
        console.error('Error fetching user result:', error);
        res.status(500).json({ error: 'Failed to fetch user result' });
    }
});

module.exports = router;
