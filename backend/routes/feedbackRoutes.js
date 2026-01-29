const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const authenticateUser = require('../middleware/generalAuth');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const TPO = require('../models/TPO');
const Coordinator = require('../models/Coordinator');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');

// helper: robust student lookup for different schemas
async function findStudentByRequestUser(req) {
  const userId = req.user?.id || req.user?._id || (typeof req.user === 'string' ? req.user : null);
  const userEmail = req.user?.email;
  const queries = [];

  if (userId) {
    queries.push({ user: userId });
    queries.push({ userId: userId });
    queries.push({ studentId: userId });
    queries.push({ _id: userId });
  }
  if (userEmail) {
    queries.push({ email: userEmail });
  }

  // try queries in order
  for (const q of queries) {
    const s = await Student.findOne(q);
    if (s) return s;
  }

  // last-resort: try findById with raw req.user (if it's an id string)
  if (typeof req.user === 'string') {
    const s = await Student.findById(req.user);
    if (s) return s;
  }

  return null;
}

// @route   POST /api/feedback/submit
// @desc    Submit feedback by student
// @access  Private (Student)
router.post('/submit', authenticateUser, async (req, res) => {
  try {
    const { title, content, rating, category, toTrainer, otherTrainerName, toTPO, toCoordinator, isAnonymous, suggestions } = req.body;

    // Verify the student exists (use robust helper)
    const student = await findStudentByRequestUser(req);
    if (!student) {
      console.warn('[feedbackRoutes] submit - Student not found for user:', req.user?.id || req.user?._id || req.user);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      title,
      content,
      rating,
      category,
      fromStudent: student._id,
      toTrainer: toTrainer && toTrainer !== 'other' ? toTrainer : undefined,
      otherTrainerName: otherTrainerName || undefined,
      toTPO: toTPO || undefined,
      toCoordinator: toCoordinator || undefined,
      isAnonymous: isAnonymous || false,
      suggestions: suggestions || ''
    });

    await feedback.populate([
      { path: 'fromStudent', select: 'name rollNo college' },
      { path: 'toTrainer', select: 'name email subjectDealing' },
      { path: 'toTPO', select: 'name email college' },
      { path: 'toCoordinator', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/student/my-feedback
// @desc    Get all feedback submitted by logged-in student
// @access  Private (Student)
router.get('/student/my-feedback', authenticateUser, async (req, res) => {
  try {
    const student = await findStudentByRequestUser(req);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    const feedbacks = await Feedback.find({ fromStudent: student._id })
      .populate('toTrainer', 'name email subjectDealing')
      .populate('toTPO', 'name email college')
      .populate('toCoordinator', 'name email')
      .populate('response.respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error fetching student feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/student/trainers
// @desc    Get trainers assigned to student for feedback
// @access  Private (Student)
router.get('/student/trainers', authenticateUser, async (req, res) => {
  try {
    // robust student lookup: try common field names and id fallback
    const student = await Student.findOne({
      $or: [
        { user: req.user.id },
        { userId: req.user.id },
        { _id: req.user.id },
        { studentId: req.user.id }
      ]
    });

    // If not found, try direct findById (sometimes middleware provides student id)
    const studentFallback = !student ? await Student.findById(req.user.id) : student;
    const finalStudent = student || studentFallback;

    if (!finalStudent) {
      console.warn('[feedbackRoutes] Student not found for user id:', req.user.id);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Try multiple ways to find the placement batch:
    const batchQueryCandidates = [
      { students: finalStudent._id, isActive: true },
      { _id: finalStudent.placementTrainingBatchId, isActive: true },
      { _id: finalStudent.placementBatchId, isActive: true },
      { _id: finalStudent.placementBatch, isActive: true }
    ].filter(Boolean);

    let batch = null;
    for (const q of batchQueryCandidates) {
      batch = await PlacementTrainingBatch.findOne(q)
        .populate('assignedTrainers.trainer', 'name email subjectDealing category experience');
      if (batch) break;
    }

    if (!batch || !batch.assignedTrainers || batch.assignedTrainers.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No trainers assigned yet'
      });
    }

    // Extract, dedupe and return trainers (unchanged)
    const trainers = batch.assignedTrainers
      .filter(assignment => assignment.trainer)
      .map(assignment => ({
        _id: assignment.trainer._id,
        name: assignment.trainer.name,
        email: assignment.trainer.email,
        subjectDealing: assignment.subject || assignment.trainer.subjectDealing,
        category: assignment.trainer.category,
        experience: assignment.trainer.experience,
        timeSlot: assignment.timeSlot
      }));

    const uniqueTrainers = trainers.reduce((acc, trainer) => {
      const exists = acc.find(t => t._id.toString() === trainer._id.toString());
      if (!exists) acc.push(trainer);
      return acc;
    }, []);

    res.json({
      success: true,
      data: uniqueTrainers
    });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainers',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/trainer/received
// @desc    Get all feedback received by logged-in trainer
// @access  Private (Trainer)
router.get('/trainer/received', authenticateUser, async (req, res) => {
  try {
    // Try multiple ways to get trainerId
    let trainerId = req.user?.id || req.user?._id;
    
    // If not found directly, try to find trainer by user reference
    if (!trainerId) {
      const trainer = await Trainer.findOne({ user: req.user.id });
      if (trainer) {
        trainerId = trainer._id;
      }
    }

    if (!trainerId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Trainer not found' 
      });
    }

    const feedbacks = await Feedback.find({ toTrainer: trainerId })
      .populate('fromStudent', 'name email')
      .sort({ createdAt: -1 });

    const total = feedbacks.length;
    const averageRating = total ? 
      +(feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / total).toFixed(2) : 0;
    const pendingCount = feedbacks.filter(f => f.status === 'pending').length;
    const respondedCount = feedbacks.filter(f => 
      f.status === 'responded' || f.status === 'reviewed'
    ).length;

    return res.json({
      success: true,
      data: {
        statistics: {
          totalFeedbacks: total,
          averageRating,
          pendingCount,
          respondedCount
        },
        feedbacks
      }
    });
  } catch (err) {
    console.error('GET /trainer/received error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/feedback/tpo/all
// @desc    Get all feedback relevant to this TPO
// @access  Private (TPO)
router.get('/tpo/all', authenticateUser, async (req, res) => {
  try {
    // Determine TPO id robustly
    let tpo = await TPO.findOne({ user: req.user.id });
    let tpoId = tpo ? tpo._id : null;

    if (!tpoId) {
      if (req.userType && String(req.userType).toLowerCase() === 'tpo') {
        tpoId = req.user._id || req.user.id;
        console.log('[feedbackRoutes] Using req.user as TPO id:', tpoId);
      } else {
        try {
          const byId = await TPO.findById(req.user.id);
          if (byId) tpoId = byId._id;
        } catch (e) {
          // ignore lookup errors
        }
      }
    }

    if (!tpoId) {
      console.warn('[feedbackRoutes] TPO not found for request user', { userId: req.user.id, userType: req.userType });
      return res.status(404).json({ success: false, message: 'TPO not found' });
    }

    // Load TPO and determine batches this TPO should see
    const tpoDoc = await TPO.findById(tpoId).select('assignedBatches');
    const tpoAssigned = (tpoDoc?.assignedBatches || []).map(id => id.toString());

    // Regular batches owned by this TPO
    const ownedBatchIds = (await Batch.find({ tpoId }).select('_id')).map(b => b._id.toString());
    // Placement training batches owned by this TPO
    const ownedPlacementIds = (await PlacementTrainingBatch.find({ tpoId }).select('_id')).map(b => b._id.toString());

    const batchIds = Array.from(new Set([...tpoAssigned, ...ownedBatchIds]));
    const placementIds = Array.from(new Set([...tpoAssigned, ...ownedPlacementIds]));

    // Collect students belonging to these batches
    let studentIds = [];
    if (batchIds.length > 0 || placementIds.length > 0) {
      const students = await Student.find({
        $or: [
          { batchId: { $in: batchIds } },
          { placementTrainingBatchId: { $in: placementIds } }
        ]
      }).select('_id');
      studentIds = students.map(s => s._id);
    }

    // Build query: feedbacks explicitly to this TPO OR feedbacks from students under this TPO
    const feedbackQuery = { $or: [ { toTPO: tpoId } ] };
    if (studentIds.length > 0) feedbackQuery.$or.push({ fromStudent: { $in: studentIds } });

    const feedbacks = await Feedback.find(feedbackQuery)
      .populate('fromStudent', 'name rollNo college branch')
      .populate('toTrainer', 'name subjectDealing')
      .populate('toCoordinator', 'name')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
      : 0;

    const categoryDistribution = {
      training: feedbacks.filter(f => f.category === 'training').length,
      placement: feedbacks.filter(f => f.category === 'placement').length,
      facilities: feedbacks.filter(f => f.category === 'facilities').length,
      coordinator: feedbacks.filter(f => f.category === 'coordinator').length,
      general: feedbacks.filter(f => f.category === 'general').length
    };

    const priorityDistribution = {
      high: feedbacks.filter(f => f.priority === 'high').length,
      medium: feedbacks.filter(f => f.priority === 'medium').length,
      low: feedbacks.filter(f => f.priority === 'low').length
    };

    res.json({
      success: true,
      data: {
        feedbacks,
        statistics: {
          totalFeedbacks,
          averageRating: averageRating.toFixed(1),
          categoryDistribution,
          priorityDistribution,
          pendingCount: feedbacks.filter(f => f.status === 'pending').length,
          respondedCount: feedbacks.filter(f => f.status === 'responded').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching TPO feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/coordinator/all
// @desc    Get all feedback for coordinator
// @access  Private (Coordinator)
router.get('/coordinator/all', authenticateUser, async (req, res) => {
  try {
    // Try to find coordinator by user id or accept req.user if it's a Coordinator doc
    let coordinator = await Coordinator.findOne({ user: req.user.id });
    if (!coordinator) {
      try {
        const byId = await Coordinator.findById(req.user.id);
        if (byId) coordinator = byId;
      } catch (e) {
        // ignore
      }
    }

    if (!coordinator) {
      return res.status(404).json({ success: false, message: 'Coordinator not found' });
    }

    const feedbacks = await Feedback.find({
      $or: [
        { toCoordinator: coordinator._id },
        { category: 'coordinator' }
      ]
    })
      .populate('fromStudent', 'name rollNo college branch')
      .populate('toTrainer', 'name subjectDealing')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
      : 0;

    res.json({
      success: true,
      data: {
        feedbacks,
        statistics: {
          totalFeedbacks,
          averageRating: averageRating.toFixed(1),
          pendingCount: feedbacks.filter(f => f.status === 'pending').length,
          respondedCount: feedbacks.filter(f => f.status === 'responded').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching coordinator feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// @route   POST /api/feedback/:id/respond
// @desc    Respond to feedback
// @access  Private (Trainer/TPO/Coordinator)
router.post('/:id/respond', authenticateUser, async (req, res) => {
  try {
    const { content } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    // Determine responder type
    let responderModel;
    let responderId;

    const trainer = await Trainer.findOne({ user: req.user.id });
    const tpo = await TPO.findOne({ user: req.user.id });
    const coordinator = await Coordinator.findOne({ user: req.user.id });

    if (trainer) {
      responderModel = 'Trainer';
      responderId = trainer._id;
    } else if (tpo) {
      responderModel = 'TPO';
      responderId = tpo._id;
    } else if (coordinator) {
      responderModel = 'Coordinator';
      responderId = coordinator._id;
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized to respond' });
    }

    feedback.response = {
      content,
      respondedAt: new Date(),
      respondedBy: responderId,
      responseByModel: responderModel
    };
    feedback.status = 'responded';

    await feedback.save();
    await feedback.populate('response.respondedBy', 'name email');

    res.json({
      success: true,
      message: 'Response submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error responding to feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: error.message
    });
  }
});

// @route   PUT /api/feedback/:id/status
// @desc    Update feedback status
// @access  Private (Trainer/TPO/Coordinator)
router.put('/:id/status', authenticateUser, async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    feedback.status = status;
    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback status updated',
      data: feedback
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private (Student - can only delete their own feedback)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    // Validate ID format
    if (!feedbackId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID format'
      });
    }

    const feedback = await Feedback.findById(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Only allow deletion if feedback is pending
    if (feedback.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete feedback that has been reviewed or responded to'
      });
    }

    await feedback.deleteOne();

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
});

module.exports = router;