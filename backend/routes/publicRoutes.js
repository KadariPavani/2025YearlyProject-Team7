const express = require('express');
const router = express.Router();

const Calendar = require('../models/Calendar');
const mongoose = require('mongoose');

// Helper: Wait for DB connection (for serverless environments like Vercel)
const ensureDbConnected = async (maxWaitMs = 5000) => {
  const startTime = Date.now();
  
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  console.log('[publicRoutes] DB not ready, waiting for connection... readyState:', mongoose.connection.readyState);
  
  // Wait for connection with timeout
  return new Promise((resolve) => {
    const checkConnection = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(checkConnection);
        console.log('[publicRoutes] DB connected successfully');
        resolve(true);
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkConnection);
        console.error('[publicRoutes] DB connection timeout after', maxWaitMs, 'ms');
        resolve(false);
      }
    }, 100);
  });
};

// Public endpoint: get recent placed students across all events
// Query params: limit (number of students to return)
router.get('/placed-students', async (req, res) => {
  try {
    // Wait for DB connection (important for serverless)
    const isConnected = await ensureDbConnected();
    if (!isConnected) {
      console.error('[publicRoutes] DB connection failed for placed-students');
      return res.json({ success: true, message: 'Database connection unavailable', data: { students: [], total: 0 } });
    }
    
    const limit = parseInt(req.query.limit, 10) || 8;

    // Fetch recent events with selected students, newest first
    const events = await Calendar.find({ 'selectedStudents.0': { $exists: true } })
      .sort({ startDate: -1 })
      .populate({
        path: 'selectedStudents.studentId',
        select: 'name rollNo profileImageUrl hometown batchId yearOfPassing',
        populate: { path: 'batchId', select: 'batchNumber' }
      })
      .lean();

    if (!events || events.length === 0) {
      return res.json({ success: true, message: 'No placed students found', data: { students: [], total: 0 } });
    }

    // Flatten selected students and attach company info
    const allPlaced = [];
    events.forEach(event => {
      const companyName = event.companyDetails?.companyName || event.title || 'Unknown Company';

      event.selectedStudents.forEach(sel => {
        const student = sel.studentId || {};

        // Prefer the student's regular Batch (student.batchId.batchNumber) as batchName
        const batchName = student.batchId?.batchNumber || student.yearOfPassing || sel.personalInfo?.yearOfPassing || 'Unknown Batch';

        allPlaced.push({
          studentId: student._id || null,
          name: student.name || sel.name || 'Unknown',
          rollNumber: student.rollNo || sel.rollNo || 'NA',
          profileImageUrl: student.profileImageUrl || null,
          hometown: student.hometown || sel.hometown || null,
          companyName,
          batchName,
          selectionDate: sel.selectedAt || event.startDate || null,
          role: event.eventType || ''
        });
      });
    });

    // Deduplicate by studentId (keep most recent selection if multiple), preserve order by selectionDate desc
    const byId = new Map();
    allPlaced
      .sort((a, b) => (b.selectionDate || 0) - (a.selectionDate || 0))
      .forEach(p => {
        const id = p.studentId ? String(p.studentId) : `${p.name}-${p.rollNumber}-${p.companyName}`;
        if (!byId.has(id)) byId.set(id, p);
      });

    const unique = Array.from(byId.values());

    res.json({ success: true, message: 'Public placed students fetched', data: { students: unique.slice(0, limit), total: unique.length } });
  } catch (error) {
    console.error('Public placed-students error:', error?.message, error?.stack);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

// Public: upcoming events (companies scheduled)
router.get('/upcoming-events', async (req, res) => {
  try {
    // Wait for DB connection (important for serverless)
    const isConnected = await ensureDbConnected();
    if (!isConnected) {
      console.error('[publicRoutes] DB connection failed for upcoming-events');
      return res.json({ success: true, message: 'Database connection unavailable', data: { events: [] } });
    }
    
    const limit = parseInt(req.query.limit, 10) || 5;
    const now = new Date();

    const events = await Calendar.find({
      startDate: { $gte: now },
      // optionally only campus drives
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .lean();

    const results = events.map(ev => ({
      companyName: ev.companyDetails?.companyName || ev.title || 'Unknown Company',
      startDate: ev.startDate,
      role: ev.eventType || ev.eventType || 'Position'
    }));

    res.json({ success: true, message: 'Upcoming events fetched', data: { events: results } });
  } catch (error) {
    console.error('Error fetching upcoming events:', error?.message, error?.stack);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

module.exports = router;
