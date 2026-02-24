const Calendar = require('../models/Calendar');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

// Helper: Wait for DB connection (for serverless environments like Vercel)
const ensureDbConnected = async (maxWaitMs = 5000) => {
  const startTime = Date.now();

  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }


  // Wait for connection with timeout
  return new Promise((resolve) => {
    const checkConnection = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(checkConnection);
        resolve(true);
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkConnection);
        resolve(false);
      }
    }, 100);
  });
};

// Public endpoint: get placed students from Student model (FINAL placements)
// Query params: limit, year
const getPlacedStudents = async (req, res) => {
  try {
    // Wait for DB connection (important for serverless)
    const isConnected = await ensureDbConnected();
    if (!isConnected) {
      return res.json({ success: true, message: 'Database connection unavailable', data: { students: [], total: 0 } });
    }

    const limit = parseInt(req.query.limit, 10) || 100;
    const year = req.query.year;

    // Build query - use Student.placementDetails as source of truth for FINAL placements
    // Show ALL placed students (both imported via Excel and existing students)
    const query = {
      status: 'placed',
      'placementDetails.company': { $exists: true, $ne: null }
    };

    if (year) query.yearOfPassing = parseInt(year);

    // Optimized aggregation query
    const placedStudents = await Student.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'batches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: '$_id',
          name: 1,
          rollNo: 1,
          profileImageUrl: 1,
          hometown: 1,
          college: 1,
          branch: 1,
          yearOfPassing: 1,
          companyName: '$placementDetails.company',
          role: '$placementDetails.role',
          package: '$placementDetails.package',
          type: { $ifNull: ['$placementDetails.type', 'PLACEMENT'] },
          duration: { $ifNull: ['$placementDetails.duration', 'FULL TIME'] },
          stipend: { $ifNull: ['$placementDetails.stipend', 0] },
          placedDate: '$placementDetails.placedDate',
          batchName: '$batch.batchNumber',
          allOffers: 1
        }
      },
      { $sort: { placedDate: -1 } },
      { $limit: limit }
    ]);

    res.json({
      success: true,
      message: 'Placed students fetched',
      data: {
        students: placedStudents,
        total: placedStudents.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// Public: upcoming events (companies scheduled)
const getUpcomingEvents = async (req, res) => {
  try {
    // Wait for DB connection (important for serverless)
    const isConnected = await ensureDbConnected();
    if (!isConnected) {
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
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// Public endpoint: get placement statistics for charts
const getPlacementStatistics = async (req, res) => {
  try {
    const isConnected = await ensureDbConnected();
    if (!isConnected) {
      return res.json({ success: true, message: 'Database connection unavailable', data: { companyWise: [], packageWise: [] } });
    }

    const year = req.query.year;
    const query = {
      status: 'placed',
      'placementDetails.company': { $exists: true, $ne: null }
    };

    if (year) query.yearOfPassing = parseInt(year);

    // Company-wise placement count
    const companyWise = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$placementDetails.company',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }, // Top 15 companies
      {
        $project: {
          company: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Package-wise distribution (PLACEMENT type only)
    const placementQuery = { ...query, $or: [{ 'placementDetails.type': 'PLACEMENT' }, { 'placementDetails.type': { $exists: false } }] };
    const packageWise = await Student.aggregate([
      { $match: placementQuery },
      {
        $bucket: {
          groupBy: '$placementDetails.package',
          boundaries: [0, 3, 5, 10, 20, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Format package ranges
    const packageRanges = packageWise.map(bucket => {
      let range;
      if (bucket._id === 'Other') {
        range = 'Other';
      } else if (bucket._id === 0) {
        range = '0-3 LPA';
      } else if (bucket._id === 3) {
        range = '3-5 LPA';
      } else if (bucket._id === 5) {
        range = '5-10 LPA';
      } else if (bucket._id === 10) {
        range = '10-20 LPA';
      } else {
        range = '20+ LPA';
      }

      return {
        range,
        count: bucket.count
      };
    });

    // Type-wise distribution
    const typeWise = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $ifNull: ['$placementDetails.type', 'PLACEMENT'] },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      message: 'Statistics fetched',
      data: {
        companyWise,
        packageWise: packageRanges,
        typeWise
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Public endpoint: download all placements as Excel
const downloadPlacementsExcel = async (req, res) => {
  try {
    const isConnected = await ensureDbConnected();
    if (!isConnected) {
      return res.status(503).json({ success: false, message: 'Database connection unavailable' });
    }

    // Fetch all placed students
    const placedStudents = await Student.find({
      status: 'placed',
      'placementDetails.company': { $exists: true, $ne: null }
    })
      .select('rollNo name email phonenumber college branch yearOfPassing placementDetails otherClubs')
      .sort({ yearOfPassing: -1, 'placementDetails.company': 1 })
      .lean();

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: All Placements
    const sheet = workbook.addWorksheet('All Placements');

    // Define columns
    sheet.columns = [
      { header: 'Roll No', key: 'rollNo', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'College', key: 'college', width: 15 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Duration', key: 'duration', width: 14 },
      { header: 'Compensation', key: 'compensation', width: 16 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'FMML', key: 'fmml', width: 10 },
      { header: 'KHUB', key: 'khub', width: 10 }
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    placedStudents.forEach(student => {
      const isKHub = student.otherClubs?.includes('k-hub');
      const pd = student.placementDetails || {};
      const type = pd.type || 'PLACEMENT';
      const compensation = type === 'PLACEMENT'
        ? `${pd.package || 0} LPA`
        : `${pd.stipend || 0} K/month`;

      sheet.addRow({
        rollNo: student.rollNo,
        name: student.name,
        email: student.email,
        phone: student.phonenumber,
        college: student.college,
        branch: student.branch,
        year: student.yearOfPassing,
        company: pd.company || 'N/A',
        type,
        duration: pd.duration || 'FULL TIME',
        compensation,
        role: pd.role || 'N/A',
        fmml: isKHub ? 'Yes' : 'No',
        khub: isKHub ? 'Yes' : 'No'
      });
    });

    // Sheet 2: Summary Statistics
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 20;

    summarySheet.addRow(['Placement Summary Report']).font = { bold: true, size: 14 };
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Placements', placedStudents.length]);
    summarySheet.addRow([]);

    // Group by college
    const byCollege = {};
    placedStudents.forEach(s => {
      byCollege[s.college] = (byCollege[s.college] || 0) + 1;
    });

    summarySheet.addRow(['College-wise Breakdown']).font = { bold: true };
    Object.entries(byCollege).forEach(([college, count]) => {
      summarySheet.addRow([college, count]);
    });

    summarySheet.addRow([]);

    // Group by year
    const byYear = {};
    placedStudents.forEach(s => {
      byYear[s.yearOfPassing] = (byYear[s.yearOfPassing] || 0) + 1;
    });

    summarySheet.addRow(['Year-wise Breakdown']).font = { bold: true };
    Object.entries(byYear).sort((a, b) => b[0] - a[0]).forEach(([year, count]) => {
      summarySheet.addRow([year, count]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="All_Placements.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPlacedStudents,
  getUpcomingEvents,
  getPlacementStatistics,
  downloadPlacementsExcel
};
