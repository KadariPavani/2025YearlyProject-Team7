// FIXED referenceRoutes.js - Complete Routes with Query Issues Resolved

const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const generalAuth = require('../middleware/generalAuth');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const { createNotification } = require("../controllers/notificationController");

// Cloudinary storage config
const resourceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExt = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, fileExt)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    
    const extensionMap = { '.pdf': 'pdf', '.doc': 'doc', '.docx': 'docx' };
    const format = extensionMap[fileExt] || fileExt.replace('.', '');
    const publicIdWithExtension = `resource_${timestamp}_${randomString}_${cleanName}.${format}`;
    
    return {
      folder: 'resources',
      resource_type: 'raw',
      public_id: publicIdWithExtension,
      use_filename: false,
      unique_filename: false
    };
  }
});

const upload = multer({
  storage: resourceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX files are allowed'), false);
  }
});

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
    const batches = await Batch.find({ trainerId }).select('_id name students');
    return batches.map(batch => ({
      _id: batch._id,
      name: batch.name,
      studentCount: batch.students?.length || 0,
      type: 'regular'
    }));
  } catch (error) {
    console.error('Error fetching regular batches:', error);
    return [];
  }
};

// Get batches for trainer (both regular and placement)
router.get('/batches', generalAuth, async (req, res) => {
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
});

// Trainer uploads a resource (file or link)
router.post('/', generalAuth, upload.array('files', 5), async (req, res) => {
  try {
    const {
      topicName,
      subject,
      referenceVideoLink,
      referenceNotesLink,
      assignedBatches,
      assignedPlacementBatches,
      batchType,
      isPublic,
      accessLevel,
      learningObjectives,
      prerequisites,
      tags,
      availableFrom,
      availableUntil
    } = req.body;
    
    const trainerId = req.user.id;
    
    let validatedRegularBatches = [];
    let validatedPlacementBatches = [];
    
    if (accessLevel === 'batch-specific') {
      if (batchType === 'regular' || batchType === 'both') {
        const batchArray = typeof assignedBatches === 'string' 
          ? JSON.parse(assignedBatches) 
          : assignedBatches;
        validatedRegularBatches = Array.isArray(batchArray)
          ? batchArray.filter(id => mongoose.Types.ObjectId.isValid(id))
          : [];
      }
      
      if (batchType === 'placement' || batchType === 'both') {
        const batchArray = typeof assignedPlacementBatches === 'string'
          ? JSON.parse(assignedPlacementBatches)
          : assignedPlacementBatches;
        validatedPlacementBatches = Array.isArray(batchArray)
          ? batchArray.filter(id => mongoose.Types.ObjectId.isValid(id))
          : [];
      }
    }

    let files = [];
    if (req.files?.length > 0) {
      files = req.files.map(file => ({
        filename: file.originalname,
        url: file.path.replace('http://', 'https://'),
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }));
    }

    const reference = new Reference({
      trainerId,
      topicName,
      subject,
      files,
      referenceVideoLink,
      referenceNotesLink,
      assignedBatches: validatedRegularBatches,
      assignedPlacementBatches: validatedPlacementBatches,
      batchType: accessLevel === 'public' ? 'public' : (batchType || 'public'),
      isPublic: accessLevel === 'public' ? true : (isPublic === 'true' || isPublic === true),
      accessLevel: accessLevel || 'public',
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives :
        (learningObjectives ? [learningObjectives] : []),
      prerequisites: Array.isArray(prerequisites) ? prerequisites :
        (prerequisites ? [prerequisites] : []),
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
      availableUntil: availableUntil ? new Date(availableUntil) : null
    });

    const savedReference = await reference.save();
    await savedReference.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);

    // Send notifications
    if (validatedPlacementBatches.length > 0) {
      await createNotification({
        body: {
          title: `New Learning Resource: ${topicName}`,
          message: `A new learning resource "${topicName}" has been shared by ${req.user.name}`,
          category: "Learning Resources",
          targetBatchIds: validatedPlacementBatches,
          type: "resource",
        },
        user: req.user,
      }, { status: () => ({ json: () => {} }) });
    }

    if (validatedRegularBatches.length > 0) {
      await createNotification({
        body: {
          title: `New Learning Resource: ${topicName}`,
          message: `A new learning resource "${topicName}" has been shared by ${req.user.name}`,
          category: "Learning Resources",
          targetBatchIds: validatedRegularBatches,
          type: "resource",
        },
        user: req.user,
      }, { status: () => ({ json: () => {} }) });
    }

    res.status(201).json(savedReference);
  } catch (error) {
    console.error('Error creating reference:', error);
    res.status(400).json({ message: error.message || 'Failed to create reference' });
  }
});

// Get all references for the trainer
router.get('/', generalAuth, async (req, res) => {
  try {
    const { search, subject, batchType, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { trainerId: req.user.id, status: 'active' };

    if (search) {
      query.$text = { $search: search };
    }

    if (subject) {
      query.subject = subject;
    }
    
    if (batchType && batchType !== 'all') {
      query.batchType = batchType;
    }
    
    const references = await Reference.find(query)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
      ])
      .select('-ratings -lastViewedBy')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Reference.countDocuments(query);
    
    res.json({
      references,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching references:', error);
    res.status(500).json({ message: 'Failed to fetch references' });
  }
});

// Get a single reference by ID for trainer
router.get('/:id', generalAuth, async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' },
        { path: 'ratings.studentId', select: 'name rollNo' },
        { path: 'lastViewedBy.studentId', select: 'name rollNo' }
      ]);
    
    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Reference not found or not authorized' });
    }
    
    res.json(reference);
  } catch (error) {
    console.error('Error fetching reference:', error);
    res.status(500).json({ message: 'Failed to fetch reference' });
  }
});

// Update a reference
router.put('/:id', generalAuth, async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id);
    
    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Reference not found or not authorized' });
    }
    
    // Update basic fields
    const updateFields = [
      'topicName', 'subject', 'referenceVideoLink', 'referenceNotesLink', 'isPublic', 'accessLevel',
      'learningObjectives', 'prerequisites', 'tags', 'availableFrom', 'availableUntil', 'batchType'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'availableFrom' || field === 'availableUntil') {
          reference[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (field === 'learningObjectives' || field === 'prerequisites' || field === 'tags') {
          reference[field] = Array.isArray(req.body[field]) ? req.body[field] :
            (req.body[field] ? [req.body[field]] : []);
        } else {
          reference[field] = req.body[field];
        }
      }
    });
    
    // Update batch assignments
    if (req.body.accessLevel === 'batch-specific') {
      if (req.body.assignedBatches !== undefined) {
        const batches = Array.isArray(req.body.assignedBatches) ? req.body.assignedBatches : [req.body.assignedBatches];
        reference.assignedBatches = batches.filter(id => mongoose.Types.ObjectId.isValid(id));
      }
      
      if (req.body.assignedPlacementBatches !== undefined) {
        const batches = Array.isArray(req.body.assignedPlacementBatches) ? req.body.assignedPlacementBatches : [req.body.assignedPlacementBatches];
        reference.assignedPlacementBatches = batches.filter(id => mongoose.Types.ObjectId.isValid(id));
      }
    } else {
      // Clear batch assignments if not batch-specific
      reference.assignedBatches = [];
      reference.assignedPlacementBatches = [];
      reference.batchType = 'public';
    }
    
    const updatedReference = await reference.save();
    await updatedReference.populate([
      { path: 'assignedBatches', select: 'name' },
      { path: 'assignedPlacementBatches', select: 'batchNumber techStack year colleges' }
    ]);
    
    res.json(updatedReference);
  } catch (error) {
    console.error('Error updating reference:', error);
    res.status(400).json({ message: error.message || 'Failed to update reference' });
  }
});

// Delete a reference
router.delete('/:id', generalAuth, async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id);
    
    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Reference not found or not authorized' });
    }
    
    // Soft delete by changing status
    reference.status = 'archived';
    await reference.save();
    
    res.json({ message: 'Reference archived successfully' });
  } catch (error) {
    console.error('Error deleting reference:', error);
    res.status(500).json({ message: 'Failed to delete reference' });
  }
});

// ==================== FIXED STUDENT ENDPOINTS ====================

// Student fetches resources assigned to their batch/placement batch or public
router.get('/student/list', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { search, subject, batchType, page = 1, limit = 10 } = req.query;

    // Get student information
    const student = await Student.findById(studentId)
      .select('batchId placementTrainingBatchId');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('Student data:', {
      studentId,
      batchId: student.batchId,
      placementTrainingBatchId: student.placementTrainingBatchId
    });
    
    const now = new Date();
    
    // Build the query with proper OR conditions
    const orConditions = [];
    
    // 1. Public resources
    orConditions.push({
      accessLevel: 'public',
      isPublic: true
    });
    
    // 2. Batch-specific resources for regular batch
    if (student.batchId) {
      orConditions.push({
        accessLevel: 'batch-specific',
        batchType: { $in: ['regular', 'both'] },
        assignedBatches: student.batchId
      });
    }
    
    // 3. Batch-specific resources for placement batch
    if (student.placementTrainingBatchId) {
      orConditions.push({
        accessLevel: 'batch-specific',
        batchType: { $in: ['placement', 'both'] },
        assignedPlacementBatches: student.placementTrainingBatchId
      });
    }
    
    // Final query
    const query = {
      status: 'active',
      availableFrom: { $lte: now },
      $or: [
        { availableUntil: { $exists: false } },
        { availableUntil: null },
        { availableUntil: { $gte: now } }
      ],
      $or: orConditions
    };
    
    console.log('Query for student resources:', JSON.stringify(query, null, 2));
    
    const references = await Reference.find(query)
      .populate([
        { path: 'trainerId', select: 'name' },
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year' }
      ])
      .select('-ratings -lastViewedBy')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Reference.countDocuments(query);

    // Add view status for each reference
    const referencesWithViewStatus = references.map(ref => {
      const hasViewed = ref.lastViewedBy.some(view =>
        view.studentId.toString() === studentId
      );

      return {
        ...ref.toJSON(),
        hasViewed,
        resourceCount: ref.resourceCount,
        averageRating: ref.averageRating
      };
    });

    res.json({
      references: referencesWithViewStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching references for student:', error);
    res.status(500).json({ 
      message: 'Failed to fetch references for student',
      error: error.message 
    });
  }
});

// Get a single reference for student
router.get('/student/:id', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const referenceId = req.params.id;

    const [reference, student] = await Promise.all([
      Reference.findById(referenceId)
        .populate([
          { path: 'trainerId', select: 'name email' },
          { path: 'assignedBatches', select: 'name' },
          { path: 'assignedPlacementBatches', select: 'batchNumber techStack year' }
        ]),
      Student.findById(studentId).select('batchId placementTrainingBatchId name')
    ]);
    
    if (!reference || !student) {
      return res.status(404).json({ message: 'Reference or student not found' });
    }
    
    // Check if student can access this reference
    if (!reference.canStudentAccess(student)) {
      return res.status(403).json({ message: 'You are not authorized to access this reference' });
    }
    
    // Record the view
    reference.recordView(studentId);
    await reference.save();
    
    // Get student's rating for this reference
    const studentRating = reference.ratings.find(rating =>
      rating.studentId.toString() === studentId
    );
    
    const referenceData = {
      ...reference.toJSON(),
      studentRating: studentRating ? {
        rating: studentRating.rating,
        feedback: studentRating.feedback,
        ratedAt: studentRating.ratedAt
      } : null,
      hasRated: !!studentRating
    };
    
    res.json(referenceData);
  } catch (error) {
    console.error('Error fetching reference for student:', error);
    res.status(500).json({ message: 'Failed to fetch reference for student' });
  }
});

// Rate a reference (for students)
router.post('/:id/rate', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const referenceId = req.params.id;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const [reference, student] = await Promise.all([
      Reference.findById(referenceId),
      Student.findById(studentId).select('batchId placementTrainingBatchId')
    ]);
    
    if (!reference || !student) {
      return res.status(404).json({ message: 'Reference or student not found' });
    }
    
    // Check if student can access this reference
    if (!reference.canStudentAccess(student)) {
      return res.status(403).json({ message: 'You are not authorized to rate this reference' });
    }
    
    reference.addRating(studentId, rating, feedback);
    await reference.save();
    
    res.json({
      message: 'Rating submitted successfully',
      averageRating: reference.averageRating,
      totalRatings: reference.ratings.length
    });
  } catch (error) {
    console.error('Error rating reference:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// Get reference analytics for trainer
router.get('/:id/analytics', generalAuth, async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id)
      .populate([
        { path: 'lastViewedBy.studentId', select: 'name rollNo college branch' },
        { path: 'ratings.studentId', select: 'name rollNo college branch' }
      ]);
    
    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Reference not found or not authorized' });
    }
    
    // Calculate analytics
    const analytics = {
      viewStats: {
        totalViews: reference.viewCount,
        uniqueViewers: reference.lastViewedBy.length,
        recentViews: reference.lastViewedBy
          .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
          .slice(0, 10)
      },
      ratingStats: {
        totalRatings: reference.ratings.length,
        averageRating: reference.averageRating,
        ratingDistribution: {
          5: reference.ratings.filter(r => r.rating === 5).length,
          4: reference.ratings.filter(r => r.rating === 4).length,
          3: reference.ratings.filter(r => r.rating === 3).length,
          2: reference.ratings.filter(r => r.rating === 2).length,
          1: reference.ratings.filter(r => r.rating === 1).length
        },
        recentRatings: reference.ratings
          .sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt))
          .slice(0, 10)
          .map(rating => ({
            student: rating.studentId,
            rating: rating.rating,
            feedback: rating.feedback,
            ratedAt: rating.ratedAt
          }))
      },
      engagement: {
        averageViewsPerStudent: reference.lastViewedBy.length > 0 ?
          reference.viewCount / reference.lastViewedBy.length : 0,
        feedbackRate: reference.ratings.length > 0 && reference.lastViewedBy.length > 0 ?
          (reference.ratings.length / reference.lastViewedBy.length) * 100 : 0
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching reference analytics:', error);
    res.status(500).json({ message: 'Failed to fetch reference analytics' });
  }
});

// Legacy endpoint - Get all public references (no auth required)
router.get('/all', async (req, res) => {
  try {
    const references = await Reference.find({
      status: 'active',
      isPublic: true,
      accessLevel: 'public'
    })
      .populate('trainerId', 'name')
      .select('topicName subject files referenceVideoLink referenceNotesLink createdAt viewCount')
      .sort({ createdAt: -1 });
    
    res.json(references);
  } catch (error) {
    console.error('Error fetching public references:', error);
    res.status(500).json({ message: 'Failed to fetch references' });
  }
});

module.exports = router;
