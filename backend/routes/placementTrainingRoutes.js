const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PlacementTrainingBatch = require('../models/PlacementTrainingBatch');
const TPO = require('../models/TPO');
const Admin = require('../models/Admin');

// GET /api/placement-training-batches - Get all placement training batches grouped
router.get('/', auth, async (req, res) => {
  try {
    const batches = await PlacementTrainingBatch.find()
      .populate('students', 'name rollNo email college branch techStack crtInterested yearOfPassing')
      .populate('tpoId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ year: -1, college: 1, techStack: 1 });

    // Group batches by year → college → techStack
    const organized = {};
    let totalBatches = 0;
    let totalStudents = 0;
    let crtBatches = 0;
    let nonCrtBatches = 0;

    batches.forEach(batch => {
      const year = batch.year;
      batch.colleges.forEach(college => {
        const techStack = batch.techStack;
        
        // Initialize nested structure
        if (!organized[year]) organized[year] = {};
        if (!organized[year][college]) organized[year][college] = {};
        if (!organized[year][college][techStack]) {
          organized[year][college][techStack] = {
            batches: [],
            totalStudents: 0,
            totalBatches: 0
          };
        }

        // Add batch to organized structure
        organized[year][college][techStack].batches.push({
          _id: batch._id,
          batchNumber: batch.batchNumber,
          studentCount: batch.students.length,
          students: batch.students,
          tpoId: batch.tpoId,
          createdBy: batch.createdBy,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          techStack: batch.techStack,
          colleges: batch.colleges,
          createdAt: batch.createdAt
        });

        organized[year][college][techStack].totalStudents += batch.students.length;
        organized[year][college][techStack].totalBatches += 1;

        totalBatches += 1;
        totalStudents += batch.students.length;
        if (techStack !== 'NonCRT') crtBatches += 1;
        else nonCrtBatches += 1;
      });
    });

    // Get unique tech stacks from batches
    const uniqueTechStacks = [...new Set(batches.map(b => b.techStack))];

    // Dynamic tech stack stats
    const batchesByTech = uniqueTechStacks.reduce((acc, tech) => ({
      ...acc,
      [tech]: batches.filter(b => b.techStack === tech).length
    }), {});

    const stats = {
      totalBatches,
      totalStudents,
      crtBatches,
      nonCrtBatches,
      batchesByTech,
      batchesByCollege: {
        KIET: batches.filter(b => b.colleges.includes('KIET')).length,
        KIEK: batches.filter(b => b.colleges.includes('KIEK')).length,
        KIEW: batches.filter(b => b.colleges.includes('KIEW')).length
      }
    };

    res.json({
      success: true,
      data: {
        organized,
        stats,
        flatBatches: batches
      }
    });
  } catch (error) {
    console.error('Error fetching placement training batches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching placement training batches'
    });
  }
});

// GET /api/placement-training-batches/:id - Get specific batch details
router.get('/:id', auth, async (req, res) => {
  try {
    const batch = await PlacementTrainingBatch.findById(req.params.id)
      .populate('students', 'name rollNo email college branch techStack crtInterested')
      .populate('tpoId', 'name email')
      .populate('createdBy', 'name email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching batch'
    });
  }
});

module.exports = router;