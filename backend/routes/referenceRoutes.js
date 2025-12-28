// FIXED referenceRoutes.js - Complete Routes with Query Issues Resolved

const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');
const Batch = require('../models/Batch');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const Student = require('../models/Student');
const generalAuth = require('../middleware/generalAuth');
const mongoose = require('mongoose');
const { createNotification } = require("../controllers/notificationController");
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');

// Cloudinary storage for resource files (pdf/doc/ppt)
const resourceStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExt = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, fileExt)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    const extensionMap = {
      '.pdf': 'pdf',
      '.doc': 'doc',
      '.docx': 'docx',
      '.ppt': 'ppt',
      '.pptx': 'pptx',
    };
    const format = extensionMap[fileExt] || fileExt.replace('.', '');
    const publicIdWithExtension = `resource_${timestamp}_${randomString}_${cleanName}.${format}`;
    return {
      folder: 'resources',
      resource_type: 'raw',
      public_id: publicIdWithExtension,
      use_filename: false,
      unique_filename: false,
    };
  },
});

const upload = multer({
  storage: resourceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX allowed'), false);
  },
});

// Helpers
const getTrainerPlacementBatches = async (trainerId) => {
  try {
    const batches = await PlacementTrainingBatch.find({
      'assignedTrainers.trainer': trainerId,
      isActive: true,
    }).select('_id batchNumber techStack year colleges students');

    return batches.map((batch) => ({
      _id: batch._id,
      name: `${batch.batchNumber} - ${batch.techStack} (${batch.year})`,
      batchNumber: batch.batchNumber,
      techStack: batch.techStack,
      year: batch.year,
      colleges: batch.colleges,
      studentCount: batch.students.length,
      type: 'placement',
    }));
  } catch (error) {
    console.error('Error fetching placement batches:', error);
    return [];
  }
};

const getTrainerRegularBatches = async (trainerId) => {
  try {
    const batches = await Batch.find({ trainerId }).select('_id batchNumber isCrt students');
    return batches.map((batch) => ({
      _id: batch._id,
      name: batch.batchNumber || `Batch ${batch._id}`,
      batchNumber: batch.batchNumber,
      isCrt: batch.isCrt,
      studentCount: batch.students?.length || 0,
      type: 'regular',
    }));
  } catch (error) {
    console.error('Error fetching regular batches:', error);
    return [];
  }
};

const parseIdsArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return val.split(',').map((s) => s.trim());
    } catch {
      return val.split(',').map((s) => s.trim());
    }
  }
  return [];
};

const parseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

// Get batches for trainer (both regular and placement)
router.get('/batches', generalAuth, async (req, res) => {
  try {
    const trainerId = req.user.id;
    const [regularBatches, placementBatches] = await Promise.all([
      getTrainerRegularBatches(trainerId),
      getTrainerPlacementBatches(trainerId),
    ]);
    const allBatches = {
      regular: regularBatches,
      placement: placementBatches,
      all: [...regularBatches, ...placementBatches],
    };
    res.json(allBatches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
});

// Trainer uploads a resource
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
      availableUntil,
    } = req.body;

    const trainerId = req.user.id;

    // Resolve batch assignments (support passing names/numbers or ids)
    let validatedRegularBatches = [];
    let validatedPlacementBatches = [];

    const parsedAB = parseIdsArray(assignedBatches);
    if (parsedAB.length > 0) {
      const resolved = await Promise.all(parsedAB.map(async (candidateRaw) => {
        const candidate = (candidateRaw || '').toString().trim();
        try {
          if (!candidate) return null;
          if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

          let found = await Batch.findOne({ $or: [{ batchNumber: candidate }, { name: candidate }] }).select('_id batchNumber name');
          if (found && found._id) return found._id.toString();

          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await Batch.findOne({ $or: [{ batchNumber: regex }, { name: regex }] }).select('_id batchNumber name');
          if (found && found._id) return found._id.toString();

          console.warn(`Could not resolve regular batch candidate: '${candidateRaw}'`);
          return null;
        } catch (err) {
          console.error('Error resolving regular batch candidate:', candidateRaw, err.message || err);
          return null;
        }
      }));
      validatedRegularBatches = resolved.filter(Boolean);
    }

    const parsedPB = parseIdsArray(assignedPlacementBatches);
    if (parsedPB.length > 0) {
      const resolvedPlacement = await Promise.all(parsedPB.map(async (candidateRaw) => {
        const candidate = (candidateRaw || '').toString().trim();
        try {
          if (!candidate) return null;
          if (mongoose.Types.ObjectId.isValid(candidate)) return candidate;

          let found = await PlacementTrainingBatch.findOne({ batchNumber: candidate }).select('_id batchNumber');
          if (found && found._id) return found._id.toString();

          const regex = new RegExp(candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          found = await PlacementTrainingBatch.findOne({ batchNumber: regex }).select('_id batchNumber');
          if (found && found._id) return found._id.toString();

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

    // Reconcile placement ids accidentally passed as regular ids
    if (validatedRegularBatches.length > 0) {
      try {
        const placementMatches = await PlacementTrainingBatch.find({ _id: { $in: validatedRegularBatches } }).select('_id');
        const placementIds = placementMatches.map(p => p._id.toString());
        if (placementIds.length > 0) {
          validatedRegularBatches = validatedRegularBatches.filter(id => !placementIds.includes(id));
          validatedPlacementBatches = Array.from(new Set([...(validatedPlacementBatches || []), ...placementIds]));
          console.log(`Moved ${placementIds.length} id(s) from validatedRegularBatches to validatedPlacementBatches because they belong to placement batches:` , placementIds);
        }
      } catch (err) {
        console.error('Error reconciling regular vs placement batch ids in reference:', err);
      }
    }

    // Determine final batchType
    let finalBatchType = accessLevel === 'public' ? 'public' : batchType || 'public';
    if (finalBatchType !== 'public') {
      if ((validatedPlacementBatches && validatedPlacementBatches.length > 0) && (validatedRegularBatches && validatedRegularBatches.length > 0)) finalBatchType = 'both';
      else if (validatedPlacementBatches && validatedPlacementBatches.length > 0) finalBatchType = 'placement';
      else if (validatedRegularBatches && validatedRegularBatches.length > 0) finalBatchType = 'noncrt';
    }

    // Process uploaded files properly for Cloudinary
    let processedFiles = [];
    if (req.files && req.files.length > 0) {
      processedFiles = req.files.map((file) => ({
        filename: file.originalname,
        url: file.path.replace('http://', 'https://'),
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }));
    }

    // If access is batch-specific, ensure we have at least one resolved batch
    if (accessLevel === 'batch-specific' && validatedRegularBatches.length === 0 && validatedPlacementBatches.length === 0) {
      return res.status(400).json({ message: 'At least one batch must be selected for batch-specific resources' });
    }

    const reference = new Reference({
      trainerId,
      topicName,
      subject,
      files: processedFiles, // Store files array properly
      referenceVideoLink,
      referenceNotesLink,
      assignedBatches: accessLevel === 'batch-specific' ? validatedRegularBatches : [],
      assignedPlacementBatches: accessLevel === 'batch-specific' ? validatedPlacementBatches : [],
      batchType: finalBatchType,
      // Explicitly set isPublic: batch-specific resources must not be public
      isPublic: accessLevel === 'public' ? true : false,
      accessLevel: accessLevel || 'public',
      learningObjectives: parseArray(learningObjectives),
      prerequisites: parseArray(prerequisites),
      tags: parseArray(tags),
      availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
      availableUntil: availableUntil ? new Date(availableUntil) : null,
    });

    const savedReference = await reference.save();

    await savedReference.populate([
      { path: 'assignedBatches', select: 'name' },
      {
        path: 'assignedPlacementBatches',
        select: 'batchNumber techStack year colleges',
      },
    ]);

    // Notifications
    if (validatedPlacementBatches.length > 0) {
      await createNotification(
        {
          body:
            {
              title: `New Learning Resource: ${topicName}`,
              message: `A new learning resource "${topicName}" has been shared by ${req.user.name}.`,
              category: 'Learning Resources',
              targetBatchIds: validatedPlacementBatches,
              type: 'resource',
            },
          user: req.user,
        },
        { status: () => ({ json: () => {} }) }
      );
    }
    if (validatedRegularBatches.length > 0) {
      await createNotification(
        {
          body:
            {
              title: `New Learning Resource: ${topicName}`,
              message: `A new learning resource "${topicName}" has been shared by ${req.user.name}.`,
              category: 'Learning Resources',
              targetBatchIds: validatedRegularBatches,
              type: 'resource',
            },
          user: req.user,
        },
        { status: () => ({ json: () => {} }) }
      );
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
    const { search, subject, difficulty, batchType, page = 1, limit = 10 } = req.query;

    const query = { trainerId: req.user.id, status: 'active' };

    if (search) query.$text = { $search: search };
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (batchType && batchType !== 'all') query.batchType = batchType;

    const references = await Reference.find(query)
      .populate([
        { path: 'assignedBatches', select: 'name' },
        {
          path: 'assignedPlacementBatches',
          select: 'batchNumber techStack year colleges',
        },
      ])
      .select('-ratings -lastViewedBy')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10));

    const total = await Reference.countDocuments(query);

    res.json({
      references,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Error fetching references:', error);
    res.status(500).json({ message: 'Failed to fetch references' });
  }
});

// Get a single reference by ID for trainer
router.get('/:id', generalAuth, async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id).populate([
      { path: 'assignedBatches', select: 'name' },
      {
        path: 'assignedPlacementBatches',
        select: 'batchNumber techStack year colleges',
      },
      { path: 'ratings.studentId', select: 'name rollNo' },
      { path: 'lastViewedBy.studentId', select: 'name rollNo' },
    ]);

    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ message: 'Reference not found or not authorized' });
    }

    res.json(reference);
  } catch (error) {
    console.error('Error fetching reference:', error);
    res.status(500).json({ message: 'Failed to fetch reference' });
  }
});

// Update a reference - handle file updates
router.put('/:id', generalAuth, upload.array('files', 5), async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id);
    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ message: 'Reference not found or not authorized' });
    }

    // Handle existing files to keep
    let existingFilesToKeep = [];
    if (req.body.existingFiles) {
      try {
        const existingFileIds = JSON.parse(req.body.existingFiles);
        existingFilesToKeep = reference.files.filter(f =>
          existingFileIds.includes(f._id.toString())
        );
      } catch (err) {
        console.error('Error parsing existing files:', err);
      }
    }

    // Handle new uploaded files
    let newFiles = [];
    if (req.files && req.files.length > 0) {
      newFiles = req.files.map((file) => ({
        filename: file.originalname,
        url: file.path.replace('http://', 'https://'),
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }));
    }

    // Combine existing and new files
    reference.files = [...existingFilesToKeep, ...newFiles];

    // Update other fields
    const fields = [
      'topicName',
      'subject',
      'referenceVideoLink',
      'referenceNotesLink',
      'isPublic',
      'accessLevel',
      'learningObjectives',
      'prerequisites',
      'tags',
      'availableFrom',
      'availableUntil',
      'batchType',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (field === 'availableFrom' || field === 'availableUntil') {
          reference[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (
          field === 'learningObjectives' ||
          field === 'prerequisites' ||
          field === 'tags'
        ) {
          reference[field] = parseArray(req.body[field]);
        } else {
          reference[field] = req.body[field];
        }
      }
    }

    if (req.body.accessLevel === 'batch-specific') {
      if (req.body.assignedBatches !== undefined) {
        reference.assignedBatches = parseIdsArray(req.body.assignedBatches).filter(
          (id) => mongoose.Types.ObjectId.isValid(id)
        );
      }
      if (req.body.assignedPlacementBatches !== undefined) {
        reference.assignedPlacementBatches = parseIdsArray(
          req.body.assignedPlacementBatches
        ).filter((id) => mongoose.Types.ObjectId.isValid(id));
      }
      // Ensure batch-specific resources are explicitly not public
      reference.isPublic = false;
    } else {
      reference.assignedBatches = [];
      reference.assignedPlacementBatches = [];
      reference.batchType = 'public';
      reference.isPublic = true;
    }

    const updatedReference = await reference.save();
    await updatedReference.populate([
      { path: 'assignedBatches', select: 'name' },
      {
        path: 'assignedPlacementBatches',
        select: 'batchNumber techStack year colleges',
      },
    ]);

    res.json(updatedReference);
  } catch (error) {
    console.error('Error updating reference:', error);
    res
      .status(400)
      .json({ message: error.message || 'Failed to update reference' });
  }
});

// Delete (archive) a reference
router.delete('/:id', generalAuth, async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id);

    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Reference not found or not authorized' });
    }

    reference.status = 'archived';
    await reference.save();

    // ✅ Notify students about deleted resource
    const allBatchIds = [
      ...(reference.assignedBatches || []),
      ...(reference.assignedPlacementBatches || [])
    ];

    if (allBatchIds.length > 0) {
      await createNotification(
        {
          body: {
            title: `Resource Removed`,
            message: `The resource "${reference.topicName}" has been removed by ${req.user.name}.`,
            category: "Learning Resources",
            targetBatchIds: allBatchIds,
            type: "resource",
          },
          user: req.user,
        },
        { status: () => ({ json: () => {} }) }
      );
    }

    res.json({ message: 'Reference archived successfully and notification sent.' });
  } catch (error) {
    console.error('Error deleting reference:', error);
    res.status(500).json({ message: 'Failed to delete reference' });
  }
});


// ==================== STUDENT ENDPOINTS ====================

// Student fetches resources - Fix the query structure
router.get('/student/list', generalAuth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { search, subject, difficulty } = req.query;

    const student = await Student.findById(studentId).select(
      'batchId placementTrainingBatchId'
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Student batch info:', {
      batchId: student.batchId,
      placementTrainingBatchId: student.placementTrainingBatchId
    });

    const now = new Date();

    // Build access conditions
    const accessConditions = [
      { accessLevel: 'public', isPublic: true }
    ];

    if (student.batchId) {
      accessConditions.push({
        accessLevel: 'batch-specific',
        batchType: { $in: ['noncrt', 'regular', 'both'] },
        assignedBatches: student.batchId
      });
    }

    if (student.placementTrainingBatchId) {
      accessConditions.push({
        accessLevel: 'batch-specific',
        batchType: { $in: ['placement', 'both'] },
        assignedPlacementBatches: student.placementTrainingBatchId
      });
    }

    // Build main query
    const query = {
      status: 'active',
      availableFrom: { $lte: now },
      $and: [
        {
          $or: [
            { availableUntil: { $exists: false } },
            { availableUntil: null },
            { availableUntil: { $gte: now } }
          ]
        },
        { $or: accessConditions }
      ]
    };

    // Add filters
    if (search) {
      query.$and.push({
        $or: [
          { topicName: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (subject) {
      query.$and.push({ subject });
    }

    if (difficulty) {
      query.$and.push({ difficulty });
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    const references = await Reference.find(query)
      .populate([
        { path: 'trainerId', select: 'name' },
        { path: 'assignedBatches', select: 'name' },
        { path: 'assignedPlacementBatches', select: 'batchNumber techStack year' }
      ])
      .sort({ createdAt: -1 });

    console.log(`Found ${references.length} resources for student`);

    // Return consistent structure
    res.json({
      success: true,
      references
    });

  } catch (error) {
    console.error('Error fetching references for student:', error);
    res.status(500).json({
      success: false,
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
      Reference.findById(referenceId).populate([
        { path: 'trainerId', select: 'name email' },
        { path: 'assignedBatches', select: 'name' },
        {
          path: 'assignedPlacementBatches',
          select: 'batchNumber techStack year',
        },
      ]),
      Student.findById(studentId).select(
        'batchId placementTrainingBatchId name'
      ),
    ]);

    if (!reference || !student) {
      return res
        .status(404)
        .json({ message: 'Reference or student not found' });
    }

    if (!reference.canStudentAccess(student)) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to access this reference' });
    }

    reference.recordView(studentId);
    await reference.save();

    const studentRating = reference.ratings.find(
      (r) => r.studentId.toString() === studentId
    );

    const referenceData = {
      ...reference.toJSON(),
      studentRating: studentRating
        ? {
            rating: studentRating.rating,
            feedback: studentRating.feedback,
            ratedAt: studentRating.ratedAt,
          }
        : null,
      hasRated: !!studentRating,
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
      Student.findById(studentId).select('batchId placementTrainingBatchId'),
    ]);

    if (!reference || !student) {
      return res
        .status(404)
        .json({ message: 'Reference or student not found' });
    }

    if (!reference.canStudentAccess(student)) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to rate this reference' });
    }

    reference.addRating(studentId, rating, feedback);
    await reference.save();

    res.json({
      message: 'Rating submitted successfully',
      averageRating: reference.averageRating,
      totalRatings: reference.ratings.length,
    });
  } catch (error) {
    console.error('Error rating reference:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// Get reference analytics for trainer
router.get('/:id/analytics', generalAuth, async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id).populate([
      {
        path: 'lastViewedBy.studentId',
        select: 'name rollNo college branch',
      },
      { path: 'ratings.studentId', select: 'name rollNo college branch' },
    ]);

    if (!reference || reference.trainerId.toString() !== req.user.id) {
      return res
        .status(404)
        .json({ message: 'Reference not found or not authorized' });
    }

    const analytics = {
      viewStats: {
        totalViews: reference.viewCount,
        uniqueViewers: reference.lastViewedBy.length,
        recentViews: reference.lastViewedBy
          .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
          .slice(0, 10),
      },
      ratingStats: {
        totalRatings: reference.ratings.length,
        averageRating: reference.averageRating,
        ratingDistribution: {
          5: reference.ratings.filter((r) => r.rating === 5).length,
          4: reference.ratings.filter((r) => r.rating === 4).length,
          3: reference.ratings.filter((r) => r.rating === 3).length,
          2: reference.ratings.filter((r) => r.rating === 2).length,
          1: reference.ratings.filter((r) => r.rating === 1).length,
        },
        recentRatings: reference.ratings
          .sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt))
          .slice(0, 10)
          .map((r) => ({
            student: r.studentId,
            rating: r.rating,
            feedback: r.feedback,
            ratedAt: r.ratedAt,
          })),
      },
      engagement: {
        averageViewsPerStudent:
          reference.lastViewedBy.length > 0
            ? reference.viewCount / reference.lastViewedBy.length
            : 0,
        feedbackRate:
          reference.ratings.length > 0 && reference.lastViewedBy.length > 0
            ? (reference.ratings.length / reference.lastViewedBy.length) * 100
            : 0,
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching reference analytics:', error);
    res.status(500).json({ message: 'Failed to fetch reference analytics' });
  }
});

// Legacy public references
router.get('/all', async (req, res) => {
  try {
    const references = await Reference.find({
      status: 'active',
      isPublic: true,
      accessLevel: 'public',
    })
      .populate('trainerId', 'name')
      .select(
        'topicName subject resources referenceVideoLink referenceNotesLink createdAt viewCount'
      )
      .sort({ createdAt: -1 });

    res.json(references);
  } catch (error) {
    console.error('Error fetching public references:', error);
    res.status(500).json({ message: 'Failed to fetch references' });
  }
});

module.exports = router;
