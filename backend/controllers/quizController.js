const Quiz = require('../models/Quiz');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const mongoose = require('mongoose');
const { sendNotificationToBatches, notifyQuizDeleted, notifyQuizCreated } = require("./notificationController");

// Helper function to get trainer's assigned placement batches
const getTrainerPlacementBatches = async (trainerId) => {
  try {
    const batches = await PlacementTrainingBatch.find({
      'assignedTrainers.trainer': trainerId,
      isActive: true
    }).select('_id batchNumber techStack year colleges students');

    return batches.map(batch => ({
      _id: batch._id,
      name: `${batch.batchNumber} - ${batch.techStack} (${batch.year})`,
      batchNumber: batch.batchNumber,
      techStack: batch.techStack,
      year: batch.year,
      colleges: batch.colleges,
      studentCount: batch.students.length,
      type: 'placement'
    }));
  } catch (error) {
    console.error('Error fetching placement batches:', error);
    return [];
  }
};

// Helper function to get trainer's regular batches
const getTrainerRegularBatches = async (trainerId) => {
  try {
    const batches = await Batch.find({ trainerId }).select('_id batchNumber isCrt students');
    return batches.map(batch => ({
      _id: batch._id,
      name: batch.batchNumber || `Batch ${batch._id}`,
      batchNumber: batch.batchNumber,
      isCrt: batch.isCrt,
      studentCount: batch.students?.length || 0,
      type: 'regular'
    }));
  } catch (error) {
    console.error('Error fetching regular batches:', error);
    return [];
  }
};

// Modified: Helper function to get trainer's subject (singular)
const getTrainerSubject = async (trainerId) => {
  try {
    const trainer = await Trainer.findById(trainerId).select('subjectDealing');
    return trainer?.subjectDealing ? [trainer.subjectDealing] : []; // Return as array for consistency
  } catch (error) {
    console.error('Error fetching trainer subject:', error);
    return [];
  }
};

// Get all batches for trainer (both regular and placement)
const getBatches = async (req, res) => {
  try {
    const trainerId = req.user.id;

    const [regularBatches, placementBatches] = await Promise.all([
      getTrainerRegularBatches(trainerId),
      getTrainerPlacementBatches(trainerId)
    ]);

    const allBatches = {
      regular: regularBatches,
      placement: placementBatches,
      all: [...regularBatches, ...placementBatches]
    };

    res.json(allBatches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
};

// Modified: Get trainer's subject
const getSubjects = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const subject = await getTrainerSubject(trainerId);
    res.json(subject); // Returns array with single subject
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ message: 'Failed to fetch subject' });
  }
};

// Create a new quiz
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      scheduledDate,
      startTime,
      endTime,
      duration,
      questions,
      totalMarks,
      passingMarks,
      assignedBatches,
      assignedPlacementBatches,
      batchType,
      shuffleQuestions,
      showResultsImmediately,
      allowRetake,
      status
    } = req.body;

    const trainerId = req.user.id;

    // Validate subject
    const trainerSubject = await getTrainerSubject(trainerId);
    if (!trainerSubject.includes(subject)) {
      return res.status(400).json({ message: 'Invalid subject for this trainer' });
    }

    // Validate batch assignments based on type
    let validatedRegularBatches = [];
    let validatedPlacementBatches = [];

    // Accept both 'noncrt' and legacy 'regular' - resolve string identifiers to _id when needed
    if (batchType === 'noncrt' || batchType === 'regular' || batchType === 'both') {
      if (assignedBatches && assignedBatches.length > 0) {
        // Resolve each entry: if it's already a valid ObjectId keep it; otherwise try multiple lookups (batchNumber/name, case-insensitive, substring)
        const resolved = await Promise.all(assignedBatches.map(async (candidateRaw) => {
          const candidate = (candidateRaw || '').toString().trim();
          try {
            if (!candidate) return null;
            if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

            // Exact match by batchNumber or name
            let found = await Batch.findOne({ $or: [{ batchNumber: candidate }, { name: candidate }] }).select('_id batchNumber name');
            if (found && found._id) {
              console.log(`Resolved regular candidate '${candidate}' -> ${found._id} (${found.batchNumber||found.name})`);
              return found._id.toString();
            }

            // Case-insensitive or substring search by batchNumber or name
            const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
            found = await Batch.findOne({ $or: [{ batchNumber: regex }, { name: regex }] }).select('_id batchNumber name');
            if (found && found._id) {
              console.log(`Resolved regular candidate by regex '${candidate}' -> ${found._id} (${found.batchNumber||found.name})`);
              return found._id.toString();
            }

            // No match
            console.warn(`Could not resolve regular batch candidate: '${candidateRaw}'`);
            return null;
          } catch (err) {
            console.error('Error resolving regular batch candidate:', candidateRaw, err.message || err);
            return null;
          }
        }));
        validatedRegularBatches = resolved.filter(Boolean);

        // SAFEGUARD: If any of the resolved "regular" ids actually exist in PlacementTrainingBatch,
        // move them to validatedPlacementBatches so quizzes reach placement students correctly.
        if (validatedRegularBatches.length > 0) {
          try {
            const placementMatches = await PlacementTrainingBatch.find({ _id: { $in: validatedRegularBatches } }).select('_id');
            const placementIds = placementMatches.map(p => p._id.toString());
            if (placementIds.length > 0) {
              // Remove these ids from validatedRegularBatches
              validatedRegularBatches = validatedRegularBatches.filter(id => !placementIds.includes(id));
              // Add to placement list (avoid duplicates)
              validatedPlacementBatches = Array.from(new Set([...(validatedPlacementBatches || []), ...placementIds]));
              console.log(`Moved ${placementIds.length} id(s) from validatedRegularBatches to validatedPlacementBatches because they belong to placement batches:` , placementIds);
            }
          } catch (err) {
            console.error('Error reconciling regular vs placement batch ids:', err);
          }
        }
      }
    }

    // Always process assignedPlacementBatches if provided, regardless of the requested batchType.
    if (assignedPlacementBatches && assignedPlacementBatches.length > 0) {
      // Placement batches are expected to be ObjectIds, but resolve similarly in case a batchNumber was passed
      const resolvedPlacement = await Promise.all(assignedPlacementBatches.map(async (candidateRaw) => {
        const candidate = (candidateRaw || '').toString().trim();
        try {
          if (!candidate) return null;
          if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

          // Try to find by batchNumber (exact or regex)
          let found = await PlacementTrainingBatch.findOne({ batchNumber: candidate }).select('_id batchNumber');
          if (found && found._id) {
            console.log(`Resolved placement candidate '${candidate}' -> ${found._id} (${found.batchNumber})`);
            return found._id.toString();
          }

          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await PlacementTrainingBatch.findOne({ batchNumber: regex }).select('_id batchNumber');
          if (found && found._id) {
            console.log(`Resolved placement candidate by regex '${candidate}' -> ${found._id} (${found.batchNumber})`);
            return found._id.toString();
          }

          console.warn(`Could not resolve placement batch candidate: '${candidateRaw}'`);
          return null;
        } catch (err) {
          console.error('Error resolving placement batch candidate:', candidateRaw, err.message || err);
          return null;
        }
      }));
      validatedPlacementBatches = resolvedPlacement.filter(Boolean);
      console.log('Resolved placement batch ids:', validatedPlacementBatches);
    }

    // Determine final batchType based on what actually got resolved
    let finalBatchType = batchType || 'placement';
    if ((validatedPlacementBatches && validatedPlacementBatches.length > 0) && (validatedRegularBatches && validatedRegularBatches.length > 0)) {
      finalBatchType = 'both';
    } else if (validatedPlacementBatches && validatedPlacementBatches.length > 0) {
      finalBatchType = 'placement';
    } else if (validatedRegularBatches && validatedRegularBatches.length > 0) {
      finalBatchType = 'noncrt';
    }

    // DEBUG: Show final resolved batch lists and batchType being saved
    console.log('Saving quiz with resolved batches:', {
      validatedRegularBatches,
      validatedPlacementBatches,
      finalBatchType
    });

    // Normalize scheduledDate if it's a YYYY-MM-DD string (avoid timezone surprises on deploy)
    let normalizedScheduledDate = scheduledDate;
    if (typeof scheduledDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      const [y, m, d] = scheduledDate.split('-').map(Number);
      // Save as UTC midnight for the date to keep it consistent between client & server
      normalizedScheduledDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      console.debug(`[Quiz Create] normalized scheduledDate ${scheduledDate} -> ${normalizedScheduledDate.toISOString()}`);
    }

    // Respect explicit scheduledStart / scheduledEnd if provided (ISO strings from frontend)
    const scheduledStartISO = req.body.scheduledStart;
    const scheduledEndISO = req.body.scheduledEnd;
    let scheduledStartFinal = scheduledStartISO ? new Date(scheduledStartISO) : null;
    let scheduledEndFinal = scheduledEndISO ? new Date(scheduledEndISO) : null;

    // Fall back to computing datetimes (UTC) from normalizedScheduledDate and provided times
    if (!scheduledStartFinal || isNaN(scheduledStartFinal)) {
      const sd = normalizedScheduledDate instanceof Date ? normalizedScheduledDate : new Date(normalizedScheduledDate);
      const [sh, sm] = (startTime || '00:00').split(':').map(Number);
      const [eh, em] = (endTime || '00:00').split(':').map(Number);
      scheduledStartFinal = new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate(), sh, sm, 0));
      scheduledEndFinal = new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate(), eh, em, 0));
      if (scheduledEndFinal <= scheduledStartFinal) scheduledEndFinal = new Date(scheduledEndFinal.getTime() + 24 * 60 * 60 * 1000);
    }

    console.debug(`[Quiz Create] final windows scheduledStart:${scheduledStartFinal?.toISOString()} scheduledEnd:${scheduledEndFinal?.toISOString()}`);

    const quiz = new Quiz({
      title,
      description,
      subject,
      scheduledDate: normalizedScheduledDate,
      scheduledStart: scheduledStartFinal,
      scheduledEnd: scheduledEndFinal,
      startTime,
      endTime,
      duration,
      questions,
      totalMarks,
      passingMarks,
      trainerId,
      assignedBatches: validatedRegularBatches,
      assignedPlacementBatches: validatedPlacementBatches,
      batchType: finalBatchType || 'placement',
      shuffleQuestions,
      showResultsImmediately,
      allowRetake,
      status: status || 'active'
    });

    const savedQuiz = await quiz.save();

    // Populate batch information for response
    await savedQuiz.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);

    // Fetch trainer details for notification
    const trainer = await Trainer.findById(trainerId).select("name");

    // Notify placement batch students
    if (validatedPlacementBatches.length > 0) {
      for (const batchId of validatedPlacementBatches) {
        await notifyQuizCreated(batchId, trainer?.name || "Trainer", title, trainerId);
      }
    }

    // Notify non-CRT batch students (legacy 'regular' also supported)
    if (validatedRegularBatches.length > 0) {
      for (const batchId of validatedRegularBatches) {
        await notifyQuizCreated(batchId, trainer?.name || "Trainer", title, trainerId);
      }
    }

    console.log("Quiz notifications sent to all assigned batches.");

    // Notify regular batches
    const allTargetBatches = [...validatedRegularBatches, ...validatedPlacementBatches];

    if (allTargetBatches.length > 0) {
      await sendNotificationToBatches({
        title: `New Quiz: ${title}`,
        message: `A new quiz "${title}" has been created by ${req.user.name}. Check your Available Quizzes section.`,
        category: "Available Quizzes",
        targetBatchIds: allTargetBatches,
        type: "quiz",
        user: req.user
      });
    }

    res.status(201).json(savedQuiz);

  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(400).json({ message: error.message || 'Failed to create quiz' });
  }
};

// Get all quizzes for the trainer
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ trainerId: req.user.id })
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .select('-submissions -questions')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};

// Get a single quiz by ID for trainer
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .select('-submissions');

    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
};

// Get quizzes assigned to the logged-in student (list)
const getStudentQuizList = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student information to check their batch assignments
    const student = await Student.findById(studentId)
      .select('batchId placementTrainingBatchId');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Build query to find quizzes accessible to this student
    const query = {
      status: 'active',
      $or: []
    };

    // Add regular batch condition if student has a batchId
    if (student.batchId) {
      query.$or.push({
        batchType: { $in: ['noncrt', 'regular', 'both'] },
        assignedBatches: student.batchId
      });
    }

    // Add placement batch condition if student has placementTrainingBatchId
    if (student.placementTrainingBatchId) {
      query.$or.push({
        batchType: { $in: ['placement', 'both'] },
        assignedPlacementBatches: student.placementTrainingBatchId
      });
    }

    // If student has no batch assignments, return empty array
    if (query.$or.length === 0) {
      return res.json([]);
    }

    const quizzes = await Quiz.find(query)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year' }
      ])
      .select('title subject totalMarks passingMarks scheduledDate scheduledStart scheduledEnd startTime endTime duration submissions batchType')
      .sort({ scheduledDate: 1 });

    // For each quiz, check if the student has submitted
    const quizList = quizzes.map(quiz => {
      const submission = quiz.submissions.find(sub =>
        sub.studentId.toString() === studentId
      );

      return {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
        scheduledDate: quiz.scheduledDate,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        duration: quiz.duration,
        scheduledStart: quiz.scheduledStart,
        scheduledEnd: quiz.scheduledEnd,
        batchType: quiz.batchType,
        assignedBatches: quiz.assignedBatches,
        assignedPlacementBatches: quiz.assignedPlacementBatches,
        hasSubmitted: !!submission,
        score: submission ? submission.score : null,
        percentage: submission ? submission.percentage : null,
        submittedAt: submission ? submission.submittedAt : null,
        attemptNumber: submission ? submission.attemptNumber : 0
      };
    });

    res.json(quizList);
  } catch (error) {
    console.error('Error fetching quizzes for student:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes for student' });
  }
};

// Get a single quiz by ID for student
const getStudentQuizById = async (req, res) => {
  try {
    const studentId = req.user.id;
    const quizId = req.params.id;

    const [quiz, student] = await Promise.all([
      Quiz.findById(quizId),
      Student.findById(studentId).select('batchId placementTrainingBatchId')
    ]);

    if (!quiz || !student) {
      return res.status(404).json({ message: 'Quiz or student not found' });
    }

    // Check if student can access this quiz (verbose)
    const access = quiz.checkStudentAccess(student);
    if (!access.allowed) {
      console.warn(`[Quiz Access Denied] quiz:${quiz._id} student:${student._id} - access denied reason:${access.reason}`);
      return res.status(403).json({ message: 'You are not authorized to access this quiz', reason: access.reason });
    }

    // Remove sensitive information for student view
    const studentQuiz = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      scheduledDate: quiz.scheduledDate,
      scheduledStart: quiz.scheduledStart,
      scheduledEnd: quiz.scheduledEnd,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      duration: quiz.duration,
      questions: quiz.questions.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options.map(opt => ({ text: opt.text })), // Remove isCorrect
        marks: q.marks,
        difficulty: q.difficulty
      })),
      totalMarks: quiz.totalMarks,
      passingMarks: quiz.passingMarks,
      shuffleQuestions: quiz.shuffleQuestions,
      showResultsImmediately: quiz.showResultsImmediately,
      allowRetake: quiz.allowRetake
    };

    res.json(studentQuiz);
  } catch (error) {
    console.error('Error fetching quiz for student:', error);
    res.status(500).json({ message: 'Failed to fetch quiz for student' });
  }
};

// Submit a quiz (for students)
const submitQuiz = async (req, res) => {
  try {
    const studentId = req.user.id;
    const quizId = req.params.id;
    const { answers, timeSpent } = req.body;

    const [quiz, student] = await Promise.all([
      Quiz.findById(quizId),
      Student.findById(studentId).select('batchId placementTrainingBatchId name')
    ]);

    if (!quiz || !student) {
      return res.status(404).json({ message: 'Quiz or student not found' });
    }

    // Check if student can access this quiz (verbose)
    const access = quiz.checkStudentAccess(student);
    if (!access.allowed) {
      console.warn(`[Quiz Submit Denied] quiz:${quiz._id} student:${student._id} - submit denied reason:${access.reason}`);
      return res.status(403).json({ message: 'You are not authorized to submit this quiz', reason: access.reason });
    }

    // Check if student has already submitted (if retakes are not allowed)
    const existingSubmission = quiz.submissions.find(sub =>
      sub.studentId.toString() === studentId
    );

    if (existingSubmission && !quiz.allowRetake) {
      return res.status(400).json({ message: 'You have already submitted this quiz' });
    }

    // Calculate score
    let score = 0;
    const evaluatedAnswers = answers.map((ans, index) => {
      const question = quiz.questions[index];
      let isCorrect = false;

      if (question.questionType === 'mcq') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = ans.selectedOption === correctOption?.text;
      } else if (question.questionType === 'true-false') {
        isCorrect = ans.selectedOption?.toLowerCase() === question.correctAnswer?.toLowerCase();
      } else if (question.questionType === 'fill-blank') {
        isCorrect = ans.answer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
      }

      if (isCorrect) score += question.marks;

      return {
        questionIndex: index,
        selectedOption: ans.selectedOption,
        answer: ans.answer,
        isCorrect
      };
    });

    const percentage = (score / quiz.totalMarks) * 100;

    let performanceCategory;
    if (percentage >= 80) performanceCategory = 'green';
    else if (percentage >= 60) performanceCategory = 'yellow';
    else performanceCategory = 'red';

    const attemptNumber = existingSubmission ? existingSubmission.attemptNumber + 1 : 1;

    const submission = {
      studentId,
      answers: evaluatedAnswers,
      score,
      percentage,
      timeSpent,
      performanceCategory,
      attemptNumber,
      submittedAt: new Date()
    };

    if (existingSubmission && quiz.allowRetake) {
      // Update existing submission
      Object.assign(existingSubmission, submission);
    } else {
      // Add new submission
      quiz.submissions.push(submission);
    }

    await quiz.save();

    res.json({
      score,
      percentage,
      performanceCategory,
      totalMarks: quiz.totalMarks,
      passingMarks: quiz.passingMarks,
      passed: score >= quiz.passingMarks,
      attemptNumber
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
};

// Update a quiz
const updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const updateData = req.body;

    // Prevent editing submissions directly
    if ('submissions' in updateData) {
      delete updateData.submissions;
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }

    // Validate subject if updated
    if (updateData.subject) {
      const trainerSubject = await getTrainerSubject(req.user.id);
      if (!trainerSubject.includes(updateData.subject)) {
        return res.status(400).json({ message: 'Invalid subject for this trainer' });
      }
    }

    // Update the quiz
    Object.assign(quiz, updateData);
    await quiz.save();

    // Populate for response
    await quiz.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);

    res.json(quiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ message: 'Failed to update quiz' });
  }
};

// Delete a quiz
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }

    // Notify students before deleting
    // Notify placement batch students
    if (quiz.assignedPlacementBatches?.length > 0) {
      for (const batchId of quiz.assignedPlacementBatches) {
        await notifyQuizDeleted(batchId, req.user.name, quiz.title, req.user.id || req.user.userId);
      }
    }

    // Notify regular batch students
    if (quiz.assignedBatches?.length > 0) {
      for (const batchId of quiz.assignedBatches) {
        await notifyQuizDeleted(batchId, req.user.name, quiz.title, req.user.id || req.user.userId);
      }
    }

    // Delete the quiz itself
    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: 'Quiz deleted successfully and students notified' });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ message: 'Failed to delete quiz', error: error.message });
  }
};

// Get batch progress for a quiz (trainer)
const getBatchProgress = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate([
        { path: 'submissions.studentId', select: 'name rollNo email college branch' },
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .select('submissions assignedBatches assignedPlacementBatches trainerId totalMarks passingMarks');

    if (!quiz || quiz.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Quiz not found or not authorized' });
    }

    const progress = quiz.submissions.map(sub => ({
      studentId: sub.studentId._id,
      studentName: sub.studentId.name,
      rollNo: sub.studentId.rollNo,
      email: sub.studentId.email,
      college: sub.studentId.college,
      branch: sub.studentId.branch,
      score: sub.score,
      percentage: sub.percentage,
      performanceCategory: sub.performanceCategory,
      timeSpent: sub.timeSpent,
      submittedAt: sub.submittedAt,
      attemptNumber: sub.attemptNumber,
      passed: sub.score >= quiz.passingMarks
    }));

    const stats = {
      totalSubmissions: progress.length,
      averageScore: progress.length > 0 ?
        progress.reduce((acc, p) => acc + p.score, 0) / progress.length : 0,
      averagePercentage: progress.length > 0 ?
        progress.reduce((acc, p) => acc + p.percentage, 0) / progress.length : 0,
      passedCount: progress.filter(p => p.passed).length,
      failedCount: progress.filter(p => !p.passed).length,
      performanceDistribution: {
        green: progress.filter(p => p.performanceCategory === 'green').length,
        yellow: progress.filter(p => p.performanceCategory === 'yellow').length,
        red: progress.filter(p => p.performanceCategory === 'red').length
      }
    };

    res.json({
      progress,
      stats,
      batches: {
        regular: quiz.assignedBatches,
        placement: quiz.assignedPlacementBatches
      }
    });
  } catch (error) {
    console.error('Error fetching batch progress:', error);
    res.status(500).json({ message: 'Failed to fetch batch progress' });
  }
};

// ADMIN/TRAINER: Backfill scheduledStart/scheduledEnd for existing quizzes
const backfillScheduledTimes = async (req, res) => {
  try {
    const trainerId = req.user.id;

    // Find quizzes without explicit scheduledStart/scheduledEnd
    const quizzes = await Quiz.find({
      trainerId,
      $or: [
        { scheduledStart: { $exists: false } },
        { scheduledStart: null },
        { scheduledEnd: { $exists: false } },
        { scheduledEnd: null }
      ]
    });

    let updated = 0;
    for (const quiz of quizzes) {
      if (!quiz.scheduledStart || !quiz.scheduledEnd) {
        const sd = new Date(quiz.scheduledDate);
        const [sh, sm] = (quiz.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (quiz.endTime || '00:00').split(':').map(Number);

        const scheduledStart = new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate(), sh, sm, 0));
        let scheduledEnd = new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate(), eh, em, 0));

        if (scheduledEnd <= scheduledStart) {
          scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
        }

        quiz.scheduledStart = scheduledStart;
        quiz.scheduledEnd = scheduledEnd;
        await quiz.save();
        updated++;
      }
    }

    res.json({ message: `Backfilled ${updated} quizzes with explicit scheduled times`, updated });
  } catch (error) {
    console.error('Error backfilling scheduled times:', error);
    res.status(500).json({ message: 'Failed to backfill scheduled times' });
  }
};

module.exports = {
  getBatches,
  getSubjects,
  createQuiz,
  getAllQuizzes,
  getQuizById,
  getStudentQuizList,
  getStudentQuizById,
  submitQuiz,
  updateQuiz,
  deleteQuiz,
  getBatchProgress,
  backfillScheduledTimes
};
