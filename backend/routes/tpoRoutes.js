const express = require('express');
const router = express.Router();
const generalAuth = require('../middleware/generalAuth');

const {
  getProfile,
  getBatches,
  getStudentsByBatch,
  createStudentInBatch,
  updateStudent,
  suspendStudent,
  unsuspendStudent,
  deleteStudent,
  getSuspendedStudents,
  getPlacementTrainingBatches,
  getAvailableTrainers,
  assignTrainers,
  getBatchTrainerAssignments,
  getScheduleTimetable,
  getBatchSchedule,
  exportSchedule,
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  getApprovalHistory,
  assignCoordinator,
  getAttendanceOverallSummary,
  getAttendanceBatch,
  getAttendanceDateRange,
  getAttendanceCompleteReport,
  downloadAttendanceExcel,
  getTechStacks,
  getPlacedStudents,
  downloadPlacedStudentsExcel,
  downloadPlacedStudentsByCompany
} = require('../controllers/tpoController');

// GET TPO Profile
router.get('/profile', generalAuth, getProfile);

// GET TPO Batches
router.get('/batches', generalAuth, getBatches);

// GET Students by Batches (Regular Batches - not placement training) for TPO
router.get('/students-by-batch', generalAuth, getStudentsByBatch);

// TPO: Create a student inside an assigned batch
router.post('/batches/:batchId/students', generalAuth, createStudentInBatch);

// TPO: Edit student (only for students in TPO's batches)
router.put('/students/:id', generalAuth, updateStudent);

// TPO: Suspend a student (soft delete)
router.patch('/students/:id/suspend', generalAuth, suspendStudent);

// TPO: Unsuspend a student
router.patch('/students/:id/unsuspend', generalAuth, unsuspendStudent);

// TPO: Delete a student (permanent)
router.delete('/students/:id', generalAuth, deleteStudent);

// TPO: Fetch suspended students
router.get('/suspended-students', generalAuth, getSuspendedStudents);

// GET Placement Training Batches for TPO
router.get('/placement-training-batches', generalAuth, getPlacementTrainingBatches);

// GET Available Trainers for assignment
router.get('/available-trainers', generalAuth, getAvailableTrainers);

// POST Assign Trainers to Batch
router.post('/assign-trainers/:batchId', generalAuth, assignTrainers);

// GET Batch Trainer Assignments
router.get('/batch-trainer-assignments/:batchId', generalAuth, getBatchTrainerAssignments);

// GET Overall Schedule Timetable
router.get('/schedule-timetable', generalAuth, getScheduleTimetable);

// GET Detailed Schedule for a specific batch
router.get('/batch-schedule/:batchId', generalAuth, getBatchSchedule);

// Export schedule data for Excel download
router.get('/export-schedule', generalAuth, exportSchedule);

// GET Pending approval requests
router.get('/pending-approvals', generalAuth, getPendingApprovals);

// POST Approve a change request
router.post('/approve-request', generalAuth, approveRequest);

// POST Reject a change request
router.post('/reject-request', generalAuth, rejectRequest);

// GET Approval history
router.get('/approval-history', generalAuth, getApprovalHistory);

// POST Assign student as coordinator
router.post('/assign-coordinator', generalAuth, assignCoordinator);

// GET Overall Attendance Summary
router.get('/attendance/overall-summary', generalAuth, getAttendanceOverallSummary);

// GET Batch-specific Attendance
router.get('/attendance/batch/:batchId', generalAuth, getAttendanceBatch);

// GET Attendance by Date Range
router.get('/attendance/date-range', generalAuth, getAttendanceDateRange);

// GET Complete Attendance Report with ALL Student Details
router.get('/attendance/complete-report', generalAuth, getAttendanceCompleteReport);

// DOWNLOAD Excel Report
router.get('/attendance/download-excel', generalAuth, downloadAttendanceExcel);

// GET Available tech stacks
router.get('/tech-stacks', generalAuth, getTechStacks);

// GET Placed Students by Company
router.get('/placed-students', generalAuth, getPlacedStudents);

// DOWNLOAD Placed Students Excel (All Companies)
router.get('/placed-students/download-excel', generalAuth, downloadPlacedStudentsExcel);

// DOWNLOAD Placed Students by Company
router.get('/placed-students/download-company/:companyName', generalAuth, downloadPlacedStudentsByCompany);

module.exports = router;
