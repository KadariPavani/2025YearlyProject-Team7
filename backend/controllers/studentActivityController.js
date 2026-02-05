const Student = require('../models/Student');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');
const Contest = require('../models/Contest');

// Helper function to calculate student activity data
const calculateStudentActivity = async (student, batchId = null, subject = null) => {
  try {
    // Find all quizzes for the student
    const allQuizzes = await Quiz.find({
      $or: [
        { assignedBatches: student.batchId },
        { assignedPlacementBatches: student.placementTrainingBatchId }
      ]
    });

    // Find all assignments for the student
    const allAssignments = await Assignment.find({
      $or: [
        { assignedBatches: student.batchId },
        { assignedPlacementBatches: student.placementTrainingBatchId }
      ]
    });

    // Filter by subject if provided (for trainer view)
    let filteredQuizzes = allQuizzes;
    let filteredAssignments = allAssignments;

    if (subject) {
      filteredQuizzes = allQuizzes.filter(q => q.subject === subject);
      filteredAssignments = allAssignments.filter(a => a.subject === subject);
    }

    // Calculate quiz scores
    const quizScores = filteredQuizzes.map(quiz => {
      const submission = quiz.submissions.find(
        sub => sub.studentId.toString() === student._id.toString()
      );
      return {
        quizId: quiz._id,
        quizTitle: quiz.title,
        subject: quiz.subject,
        score: submission ? submission.score : 0,
        totalMarks: quiz.totalMarks,
        percentage: submission ? submission.percentage : 0,
        submittedAt: submission ? submission.submittedAt : null
      };
    });

    // Calculate assignment scores
    const assignmentScores = filteredAssignments.map(assignment => {
      const submission = assignment.submissions.find(
        sub => sub.studentId.toString() === student._id.toString()
      );
      return {
        assignmentId: assignment._id,
        assignmentTitle: assignment.title,
        subject: assignment.subject,
        score: submission ? submission.score || 0 : 0,
        totalMarks: assignment.totalMarks,
        percentage: submission ? ((submission.score || 0) / assignment.totalMarks * 100) : 0,
        submittedAt: submission ? submission.submittedAt : null
      };
    });

    // Calculate overall statistics
    const totalQuizScore = quizScores.reduce((sum, q) => sum + (q.score || 0), 0);
    const totalQuizMarks = quizScores.reduce((sum, q) => sum + q.totalMarks, 0);
    const totalAssignmentScore = assignmentScores.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalAssignmentMarks = assignmentScores.reduce((sum, a) => sum + a.totalMarks, 0);

    const totalScore = totalQuizScore + totalAssignmentScore;
    const totalMarks = totalQuizMarks + totalAssignmentMarks;
    const overallPercentage = totalMarks > 0 ? (totalScore / totalMarks * 100).toFixed(2) : 0;

    // Calculate coding scores and enrich with contest/question titles
    const codingScores = student.codingScores || [];
    const totalCodingScore = codingScores.reduce((sum, c) => sum + (c.score || 0), 0);
    const totalCodingMarks = codingScores.reduce((sum, c) => sum + (c.totalMarks || 0), 0);

    // Enrich coding breakdown with contest and question metadata for display
    const contestIds = [...new Set(codingScores.filter(c => c.contestId).map(c => c.contestId.toString()))];
    let contestMap = new Map();
    if (contestIds.length > 0) {
      const contests = await Contest.find({ _id: { $in: contestIds } }).lean();
      contests.forEach(cont => contestMap.set(cont._id.toString(), cont));
    }

    const codingDetails = codingScores.map(c => {
      const contest = c.contestId ? contestMap.get(c.contestId.toString()) : null;
      let questionTitle = '';
      let contestName = contest ? contest.name : 'Contest';
      if (contest && c.questionId) {
        const q = (contest.questions || []).find(q => q._id.toString() === c.questionId.toString());
        if (q) questionTitle = q.title;
      }
      const percentage = (c.totalMarks && c.totalMarks > 0) ? Math.round((c.score || 0) / c.totalMarks * 100) : 0;
      return {
        contestId: c.contestId,
        contestName,
        questionId: c.questionId,
        questionTitle: questionTitle || 'Question',
        score: c.score || 0,
        totalMarks: c.totalMarks || 0,
        percentage,
        completedAt: c.completedAt
      };
    });

    // Get batch name from populated data or fallback
    let batchName = 'N/A';
    if (student.placementTrainingBatchId) {
      // If populated as object with batchNumber
      if (student.placementTrainingBatchId.batchNumber) {
        batchName = student.placementTrainingBatchId.batchNumber;
      }
      // If populated as object with just _id
      else if (student.placementTrainingBatchId._id) {
        // This shouldn't happen with proper population, but fallback just in case
        batchName = 'Batch ' + student.placementTrainingBatchId._id.toString().slice(-6);
      }
    }

    return {
      student: {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        branch: student.branch,
        college: student.college,
        yearOfPassing: student.yearOfPassing,
        batchId: student.batchId,
        placementTrainingBatchId: student.placementTrainingBatchId?._id || student.placementTrainingBatchId,
        batchName: batchName
      },
      scores: {
        quizzes: quizScores,
        assignments: assignmentScores,
        // enriched coding breakdown (contestName, questionTitle, percentage)
        coding: codingDetails,
        totals: {
          quizScore: totalQuizScore,
          quizTotalMarks: totalQuizMarks,
          quizPercentage: totalQuizMarks > 0 ? (totalQuizScore / totalQuizMarks * 100).toFixed(2) : 0,
          assignmentScore: totalAssignmentScore,
          assignmentTotalMarks: totalAssignmentMarks,
          assignmentPercentage: totalAssignmentMarks > 0 ? (totalAssignmentScore / totalAssignmentMarks * 100).toFixed(2) : 0,
          codingScore: totalCodingScore,
          codingTotalMarks: totalCodingMarks,
          codingPercentage: totalCodingMarks > 0 ? (totalCodingScore / totalCodingMarks * 100).toFixed(2) : 0,
          overallScore: totalScore + totalCodingScore,
          overallTotalMarks: totalMarks + totalCodingMarks,
          // weighted overall (by marks)
          overallPercentage: (totalMarks + totalCodingMarks) > 0
            ? ((totalScore + totalCodingScore) / (totalMarks + totalCodingMarks) * 100).toFixed(2)
            : 0,
          // mean percentage across quiz, assignment and coding (simple average)
          meanPercentage: (() => {
            const q = totalQuizMarks > 0 ? (totalQuizScore / totalQuizMarks * 100) : 0;
            const a = totalAssignmentMarks > 0 ? (totalAssignmentScore / totalAssignmentMarks * 100) : 0;
            const c = totalCodingMarks > 0 ? (totalCodingScore / totalCodingMarks * 100) : 0;
            const mean = (q + a + c) / 3;
            return isNaN(mean) ? '0.00' : mean.toFixed(2);
          })()
        }
      }
    };
  } catch (error) {
    console.error('Error calculating student activity:', error);
    throw error;
  }
};

// ============================================
// CONTROLLER 1: TPO - Get all student activity
// ============================================
// @desc    Get all student activity (TPO view - all batches)
// @access  Private (TPO only)
const getTpoStudentActivity = async (req, res) => {
  try {
    // Check if user is TPO
    if (req.userType !== 'tpo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only TPO can view all student activities.'
      });
    }

    const { batchId } = req.query;

    // Restrict to batches assigned to this TPO
    const tpoId = req.user._id;
    const batchQuery = { tpoId, isActive: true };
    if (batchId) batchQuery._id = batchId;

    const batches = await PlacementTrainingBatch.find(batchQuery).lean();

    // If TPO has no batches (or requested batch doesn't belong to them), return empty set
    if (!batches || batches.length === 0) {
      return res.json({ success: true, count: 0, data: [], message: 'No batches available for this TPO' });
    }

    const batchIds = batches.map(b => b._id);

    // Only fetch students belonging to the TPO's batches
    const students = await Student.find({ isActive: true, placementTrainingBatchId: { $in: batchIds } })
      .populate('batchId', 'batchNumber')
      .populate('placementTrainingBatchId', 'batchNumber techStack year')
      .lean();

    const activityData = [];

    for (const student of students) {
      const activity = await calculateStudentActivity(student);
      activityData.push(activity);
    }

    // Calculate ranks based on overall percentage
    activityData.sort((a, b) => b.scores.totals.overallPercentage - a.scores.totals.overallPercentage);
    activityData.forEach((data, index) => {
      data.rank = index + 1;
    });

    res.json({
      success: true,
      count: activityData.length,
      data: activityData
    });
  } catch (error) {
    console.error('Error fetching TPO student activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// CONTROLLER 2: TRAINER - Get student activity for assigned batches
// ============================================
// @desc    Get student activity for trainer's assigned batches and subjects
// @access  Private (Trainer only)
const getTrainerStudentActivity = async (req, res) => {
  try {
    // Check if user is Trainer
    if (req.userType !== 'trainer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only trainers can view this data.'
      });
    }

    const trainerId = req.user._id;
    const { batchId, subject } = req.query;

    // Find batches assigned to this trainer
    const batches = await PlacementTrainingBatch.find({
      'assignedTrainers.trainer': trainerId
    }).lean();

    if (batches.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        subjects: [],
        message: 'No batches assigned to this trainer'
      });
    }

    // Get subjects taught by this trainer
    const trainerSubjects = [];
    batches.forEach(batch => {
      batch.assignedTrainers.forEach(assignment => {
        if (assignment.trainer.toString() === trainerId.toString()) {
          trainerSubjects.push(assignment.subject);
        }
      });
    });

    const uniqueSubjects = [...new Set(trainerSubjects)];

    // Build filter for students
    let studentFilter = { isActive: true };

    if (batchId) {
      studentFilter.placementTrainingBatchId = batchId;
    } else {
      studentFilter.placementTrainingBatchId = { $in: batches.map(b => b._id) };
    }

    // Properly populate placementTrainingBatchId
    const students = await Student.find(studentFilter)
      .populate('batchId', 'batchNumber')
      .populate('placementTrainingBatchId', 'batchNumber techStack year')
      .lean();

    const activityData = [];

    // Filter by subject if provided
    const filterSubject = subject || null;

    for (const student of students) {
      const activity = await calculateStudentActivity(student, batchId, filterSubject);
      activityData.push(activity);
    }

    // Calculate ranks based on mean percentage (average of quiz, assignment, coding)
    activityData.sort((a, b) => b.scores.totals.meanPercentage - a.scores.totals.meanPercentage);
    activityData.forEach((data, index) => {
      data.rank = index + 1;
    });

    res.json({
      success: true,
      count: activityData.length,
      subjects: uniqueSubjects,
      data: activityData
    });
  } catch (error) {
    console.error('Error fetching trainer student activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// CONTROLLER 3: COORDINATOR - Get student activity for assigned batch
// ============================================
// @desc    Get student activity for coordinator's assigned batch
// @access  Private (Coordinator only)
const getCoordinatorStudentActivity = async (req, res) => {
  try {
    // Check if user is Coordinator
    if (req.userType !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only coordinators can view this data.'
      });
    }

    const coordinatorId = req.user._id;

    // Find batches assigned to this coordinator
    const batches = await PlacementTrainingBatch.find({
      coordinators: coordinatorId
    }).lean();

    if (batches.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        batches: [],
        message: 'No batches assigned to this coordinator'
      });
    }

    const batchIds = batches.map(b => b._id);

    // Properly populate placementTrainingBatchId
    const students = await Student.find({
      placementTrainingBatchId: { $in: batchIds },
      isActive: true
    })
      .populate('batchId', 'batchNumber')
      .populate('placementTrainingBatchId', 'batchNumber techStack year')
      .lean();

    const activityData = [];

    for (const student of students) {
      const activity = await calculateStudentActivity(student);
      activityData.push(activity);
    }

    // Calculate ranks based on mean percentage (average of quiz, assignment, coding)
    activityData.sort((a, b) => b.scores.totals.meanPercentage - a.scores.totals.meanPercentage);
    activityData.forEach((data, index) => {
      data.rank = index + 1;
    });

    res.json({
      success: true,
      count: activityData.length,
      batches: batches.map(b => ({ _id: b._id, batchNumber: b.batchNumber, techStack: b.techStack })),
      data: activityData
    });
  } catch (error) {
    console.error('Error fetching coordinator student activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// CONTROLLER 4: STUDENT - Get individual student's activity
// ============================================
// @desc    Get individual student's activity with personal ranking
// @access  Private (Student only)
const getStudentOwnActivity = async (req, res) => {
  try {
    // Check if user is Student
    if (req.userType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only students can view their own activity.'
      });
    }

    const studentId = req.user._id;

    // Properly populate placementTrainingBatchId
    const student = await Student.findById(studentId)
      .populate('batchId', 'batchNumber')
      .populate('placementTrainingBatchId', 'batchNumber techStack year')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const activity = await calculateStudentActivity(student);

    // Calculate rank among all students in the same batch
    const batchStudents = await Student.find({
      placementTrainingBatchId: student.placementTrainingBatchId?._id || student.placementTrainingBatchId,
      isActive: true
    })
      .populate('placementTrainingBatchId', 'batchNumber techStack year')
      .lean();

    const batchActivities = [];
    for (const batchStudent of batchStudents) {
      const batchActivity = await calculateStudentActivity(batchStudent);
      batchActivities.push(batchActivity);
    }

    batchActivities.sort((a, b) => b.scores.totals.meanPercentage - a.scores.totals.meanPercentage);
    const rank = batchActivities.findIndex(a => a.student._id.toString() === studentId.toString()) + 1;

    activity.rank = rank;
    activity.totalStudentsInBatch = batchActivities.length;

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching student activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// CONTROLLER 5: TPO/Coordinator - Get single student's activity by ID
// ============================================
// @desc    Get activity summary for a specific student (lightweight, no ranking)
// @access  Private (TPO or Coordinator)
const getStudentActivityById = async (req, res) => {
  try {
    if (req.userType !== 'tpo' && req.userType !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only TPO or Coordinator can view student activity.'
      });
    }

    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate('batchId', 'batchNumber')
      .populate('placementTrainingBatchId', 'batchNumber techStack year')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const activity = await calculateStudentActivity(student);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching student activity by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getTpoStudentActivity,
  getTrainerStudentActivity,
  getCoordinatorStudentActivity,
  getStudentOwnActivity,
  getStudentActivityById
};
