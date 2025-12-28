// components/AttendanceMarking.jsx
// COMPLETE FILE - CREATE NEW FILE
// This is the MAIN component for Coordinators to mark attendance for BOTH students AND trainers

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, 
  User, Save, RefreshCw, Filter, Download, Eye, X,UserCheck 
} from 'lucide-react';
import { LoadingSkeleton, AttendanceSkeleton, CardGridSkeleton, TableSkeleton, SimpleLoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const AttendanceMarking = () => {
  const [loading, setLoading] = useState(false);
  const [todaySessions, setTodaySessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [trainerStatus, setTrainerStatus] = useState('not_marked');
  const [trainerRemarks, setTrainerRemarks] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [view, setView] = useState('mark'); // 'mark', 'history'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailedAttendance, setDetailedAttendance] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [techStackColors, setTechStackColors] = useState({});
  const [availableTechStacks, setAvailableTechStacks] = useState([]);

  // Fetch today's sessions and students on component mount
  useEffect(() => {
    fetchTodaySessions();
  }, []);

  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/tech-stacks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          setAvailableTechStacks(response.data.data.techStacks);
          setTechStackColors(response.data.data.colors);
        }
      } catch (error) {
        console.error('Error fetching tech stacks:', error);
      }
    };
    
    fetchTechStacks();
  }, []);

  const fetchTodaySessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Get actual token
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/coordinator/attendance/today-sessions`, {
        headers: {
          Authorization: `Bearer ${token}` // Send actual token, not 'Present'
        }
      });

      if (response.data.success) {
        setTodaySessions(response.data.data.todaySessions);
        setStudents(response.data.data.students);
        setBatchInfo({
          batchId: response.data.data.batchId,
          batchNumber: response.data.data.batchNumber
        });

        // Initialize attendance data
        const initialAttendance = {};
        response.data.data.students.forEach(student => {
          initialAttendance[student._id] = {
            studentId: student._id,
            status: 'not_marked',
            remarks: ''
          };
        });
        setAttendanceData(initialAttendance);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load sessions'
      });
    } finally {
      setLoading(false);
    }
  };


  const handleStudentStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status
      }
    }));
  };

  const handleStudentRemarksChange = (studentId, remarks) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: remarks
      }
    }));
  };

  const markAllPresent = () => {
    const updatedAttendance = {};
    Object.keys(attendanceData).forEach(studentId => {
      updatedAttendance[studentId] = {
        ...attendanceData[studentId],
        status: 'present'
      };
    });
    setAttendanceData(updatedAttendance);
    setMessage({ type: 'success', text: 'All students marked as present' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const markAllAbsent = () => {
    const updatedAttendance = {};
    Object.keys(attendanceData).forEach(studentId => {
      updatedAttendance[studentId] = {
        ...attendanceData[studentId],
        status: 'absent'
      };
    });
    setAttendanceData(updatedAttendance);
    setMessage({ type: 'success', text: 'All students marked as absent' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSession) {
      setMessage({ type: 'error', text: 'Please select a session first' });
      return;
    }

    const markedCount = Object.values(attendanceData).filter(
      a => a.status !== 'not_marked'
    ).length;

    if (markedCount === 0) {
      setMessage({ type: 'error', text: 'Please mark attendance for at least one student' });
      return;
    }

    // ✅ Time validation
    const now = new Date();
    const start = new Date();
    const end = new Date();
    const [startHour, startMinute] = selectedSession.startTime.split(':').map(Number);
    const [endHour, endMinute] = selectedSession.endTime.split(':').map(Number);
    start.setHours(startHour, startMinute, 0, 0);
    end.setHours(endHour, endMinute, 0, 0);

    if (now < start || now > end) {
      setMessage({
        type: 'error',
        text: `⏰ Attendance can only be marked between ${selectedSession.startTime} and ${selectedSession.endTime}`
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Get actual token

      const payload = {
        batchId: batchInfo.batchId,
        sessionDate: selectedSession?.date ? new Date(selectedSession.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        timeSlot: selectedSession.timeSlot,
        startTime: selectedSession.startTime,
        endTime: selectedSession.endTime,
        trainerId: selectedSession.trainerId,
        subject: selectedSession.subject,
        trainerStatus: trainerStatus,
        trainerRemarks: trainerRemarks,
        studentAttendance: Object.values(attendanceData),
        sessionNotes: sessionNotes
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/coordinator/attendance/mark`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}` // Send actual token, not 'Present'
          }
        }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '✅ Attendance marked successfully!'
        });

        // Reset form
        setSelectedSession(null);
        setTrainerStatus('not_marked');
        setTrainerRemarks('');
        setSessionNotes('');
        
        const initialAttendance = {};
        students.forEach(student => {
          initialAttendance[student._id] = {
            studentId: student._id,
            status: 'not_marked',
            remarks: ''
          };
        });
        setAttendanceData(initialAttendance);

        fetchTodaySessions();
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to mark attendance'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('token'); // Get actual token
      
      const params = {};
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/coordinator/attendance/history`, {
        params,
        headers: {
          Authorization: `Bearer ${token}` // Send actual token, not 'Present'
        }
      });

      if (response.data.success) {
        setAttendanceHistory(response.data.data.records);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load attendance history'
      });
    } finally {
      setLoadingHistory(false);
    }
  };


  useEffect(() => {
    if (view === 'history') {
      fetchAttendanceHistory();
    }
  }, [view]);

  // Calculate statistics for current form
  const currentStats = {
    total: Object.keys(attendanceData).length,
    present: Object.values(attendanceData).filter(a => a.status === 'present').length,
    absent: Object.values(attendanceData).filter(a => a.status === 'absent').length,
    late: Object.values(attendanceData).filter(a => a.status === 'late').length,
    notMarked: Object.values(attendanceData).filter(a => a.status === 'not_marked').length
  };

  const handleViewDetails = async (record) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/coordinator/attendance/student-details/${record._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDetailedAttendance(response.data.data);
        setSelectedRecord(record);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load attendance details'
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const downloadAttendanceReport = (data, type = 'all') => {
    try {
      let reportData = [];
      
      if (type === 'all') {
        // Format all attendance records
        reportData = attendanceHistory.map(record => ({
          Date: new Date(record.sessionDate).toLocaleDateString(),
          TimeSlot: record.timeSlot,
          Subject: record.subject,
          Trainer: record.trainerId?.name || 'N/A',
          'Total Students': record.totalStudents,
          Present: record.presentCount,
          Absent: record.absentCount,
          'Attendance %': record.attendancePercentage
        }));
      } else {
        // Format detailed student attendance
        reportData = detailedAttendance.map(student => ({
          'Student Name': student.name,
          'Roll No': student.rollNo,
          'Total Sessions': student.totalSessions,
          'Sessions Present': student.sessionsPresent,
          'Sessions Absent': student.sessionsAbsent,
          'Attendance %': student.attendancePercentage,
          'Last Updated': new Date(student.lastUpdated).toLocaleDateString()
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      saveAs(data, `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setMessage({
        type: 'success',
        text: 'Report downloaded successfully!'
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      setMessage({
        type: 'error',
        text: 'Failed to download report'
      });
    }
  };

  if (loading && students.length === 0 && todaySessions.length === 0) return <AttendanceSkeleton />;

  const getTechStackColor = (techStack) => {
    return techStackColors[techStack] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="p-1 bg-gray-50 min-h-screen pb-20 md:pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-sm md:text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
          <UserCheck className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          Attendance Management
        </h1>
        <p className="text-xs md:text-sm text-gray-600">
          Batch: <span className="font-semibold text-gray-900">{batchInfo?.batchNumber || 'Loading...'}</span>
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* View Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setView('mark')}
          className={`px-2 py-1 rounded text-[10px] font-medium transition ${
            view === 'mark' 
              ? 'bg-blue-600 text-white shadow' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="inline h-3 w-3" />
          <span className="hidden md:inline ml-2">Mark Attendance</span>
        </button>
        <button
          onClick={() => setView('history')}
          className={`px-2 py-1 rounded text-[10px] font-medium transition ${
            view === 'history' 
              ? 'bg-blue-600 text-white shadow' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Eye className="inline h-3 w-3" />
          <span className="hidden md:inline ml-2">View History</span>
        </button>
      </div>

      {view === 'mark' && (
        <>
          {/* Today's Sessions */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-sm md:text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              Today's Scheduled Sessions
            </h2>
            
            {loading && todaySessions.length === 0 ? (
              <CardGridSkeleton />
            ) : todaySessions.length === 0 ? (
              <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg">
                <Calendar className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm md:text-lg font-medium text-gray-500">No sessions scheduled for today</p>
                <p className="text-xs md:text-sm text-gray-400 mt-2">Check back on a weekday</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaySessions.map((session, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 md:p-5 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      selectedSession?.trainerId === session.trainerId && 
                       selectedSession?.timeSlot === session.timeSlot
                        ? 'border-blue-600 bg-blue-50 shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 text-sm md:text-lg">
                        {session.subject}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
                        session.timeSlot === 'morning' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : session.timeSlot === 'afternoon'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {session.timeSlot}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1 flex items-center gap-2">
                      <User className="h-3 w-3 md:h-4 md:w-4" />
                      {session.trainerName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
                      <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Marking Section */}
          {selectedSession && (
            <div className="bg-white rounded-xl shadow-md p-3 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Mark Attendance - {selectedSession.subject}
                </h2>
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                  <button
                    onClick={markAllPresent}
                    className="w-full sm:w-auto px-1.5 py-0.5 bg-green-600 text-white rounded text-[10px] font-medium hover:bg-green-700 transition flex items-center gap-1 justify-center"
                  >
                    <CheckCircle className="h-2.5 w-2.5" />
                    All Present
                  </button>
                  <button
                    onClick={markAllAbsent}
                    className="w-full sm:w-auto px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-medium hover:bg-red-700 transition flex items-center gap-1 justify-center"
                  >
                    <XCircle className="h-2.5 w-2.5" />
                    All Absent
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 md:mb-6">
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                  <div className="text-lg md:text-2xl font-bold text-gray-900">
                    {currentStats.total}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Total Students</div>
                </div>
                <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                  <div className="text-lg md:text-2xl font-bold text-green-600">
                    {currentStats.present}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Present</div>
                </div>
                <div className="bg-red-50 p-3 md:p-4 rounded-lg border border-red-200">
                  <div className="text-lg md:text-2xl font-bold text-red-600">
                    {currentStats.absent}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Absent</div>
                </div>
                <div className="bg-yellow-50 p-3 md:p-4 rounded-lg border border-yellow-200">
                  <div className="text-lg md:text-2xl font-bold text-yellow-600">
                    {currentStats.late}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Late</div>
                </div>
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                  <div className="text-lg md:text-2xl font-bold text-blue-600">
                    {currentStats.notMarked}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Not Marked</div>
                </div>
              </div>

              {/* Trainer Status */}
              <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Trainer Attendance: {selectedSession.trainerName}
                </h3>
                <div className="flex gap-6 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trainerStatus"
                      value="present"
                      checked={trainerStatus === 'present'}
                      onChange={(e) => setTrainerStatus(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium">Present</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trainerStatus"
                      value="absent"
                      checked={trainerStatus === 'absent'}
                      onChange={(e) => setTrainerStatus(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium">Absent</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Trainer remarks (optional)"
                  value={trainerRemarks}
                  onChange={(e) => setTrainerRemarks(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Students List */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
                {loading && students.length === 0 ? (
                  <TableSkeleton />
                ) : (
                  <table className="w-full table-fixed text-xs md:text-sm">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>

                        <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900 text-xs md:text-sm">
                                  {student.name}
                                </div>
                                <div className="text-[10px] md:text-xs text-gray-500">
                                  {student.rollNo} • {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={attendanceData[student._id]?.status || 'not_marked'}
                              onChange={(e) => 
                                handleStudentStatusChange(student._id, e.target.value)
                              }
                              className={`px-1.5 py-0.5 rounded border font-medium text-[10px] cursor-pointer focus:ring-2 focus:ring-blue-500 ${
                                attendanceData[student._id]?.status === 'present'
                                  ? 'bg-green-50 border-green-300 text-green-800'
                                  : attendanceData[student._id]?.status === 'absent'
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : attendanceData[student._id]?.status === 'late'
                                  ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                                  : 'bg-gray-50 border-gray-300 text-gray-600'
                              }`}
                            >
                              <option value="not_marked">Not Marked</option>
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="Optional remarks"
                              value={attendanceData[student._id]?.remarks || ''}
                              onChange={(e) => 
                                handleStudentRemarksChange(student._id, e.target.value)
                              }
                              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Session Notes */}
              <div className="mt-6">
                <label className="block font-medium mb-2 text-gray-900">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Add any notes about this session (topics covered, observations, etc.)"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
                <button
                  onClick={handleSubmitAttendance}
                  disabled={loading}
                  className="w-full sm:w-auto px-1.5 py-0.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 justify-center shadow"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      <span className="text-[10px]">Submit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'history' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Attendance History</h2>
              <button
                onClick={fetchAttendanceHistory}
                aria-label="Apply date filter"
                title="Apply date filter"
                className="ml-2 w-auto px-2 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <Filter className="h-3 w-3" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-0">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          {loadingHistory ? (
            <TableSkeleton />
          ) : attendanceHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-4">              {attendanceHistory.map((record) => (
                <div
                  key={record._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {record.subject}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        {new Date(record.sessionDate).toLocaleDateString()} - {record.timeSlot}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        Trainer: {record.trainerId?.name || 'N/A'} - {record.trainerStatus}
                      </p>
                    </div>
                    <div className="text-right">
                      {record.attendancePercentage !== null && record.attendancePercentage !== undefined ? (
                        <>
                          <div className="text-3xl font-bold text-gray-900">
                            {record.attendancePercentage}%
                          </div>
                          <div className="text-xs md:text-sm text-gray-600">
                            {record.presentCount}/{record.totalStudents} present
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-500">Not recorded</div>
                          <div className="text-xs text-gray-400">Attendance not marked</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Present:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {record.presentCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Absent:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {record.absentCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {record.totalStudents}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2">
                    {record.recorded === false ? (
                      <>
                        <button disabled className="w-full sm:w-auto px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded flex items-center gap-1 cursor-not-allowed justify-center text-[10px]">
                          <Eye className="h-2.5 w-2.5" />
                          View
                        </button>
                        <button disabled className="w-full sm:w-auto px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded flex items-center gap-1 cursor-not-allowed justify-center text-[10px]">
                          <Download className="h-2.5 w-2.5" />
                          Download
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleViewDetails(record)}
                          className="w-full sm:w-auto px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex items-center gap-1 justify-center text-[10px]"
                        >
                          <Eye className="h-2.5 w-2.5" />
                          <span className="hidden md:inline ml-1">View</span>
                        </button>
                        <button
                          onClick={() => downloadAttendanceReport(record, 'detail')}
                          className="w-full sm:w-auto px-1.5 py-0.5 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center gap-1 text-[10px] justify-center"
                        >
                          <Download className="h-2.5 w-2.5" />
                          <span className="hidden md:inline ml-1">Download</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            {loadingDetails ? (
              <SimpleLoadingSkeleton />
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm md:text-xl font-bold">
                    Detailed Attendance - {new Date(selectedRecord.sessionDate).toLocaleDateString()}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-600">Subject</div>
                      <div className="font-semibold">{selectedRecord.subject}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600">Present</div>
                      <div className="font-semibold">{selectedRecord.presentCount} students</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600">Absent</div>
                      <div className="font-semibold">{selectedRecord.absentCount} students</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailedAttendance.map((student) => (
                          <tr key={student._id}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div>
                                  <div className="font-medium text-gray-900 text-xs md:text-sm">{student.name}</div>
                                  <div className="text-xs md:text-sm text-gray-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs md:text-sm text-gray-500">{student.rollNo}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === 'present' 
                                  ? 'bg-green-100 text-green-800'
                                  : student.status === 'absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{student.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => downloadAttendanceReport(detailedAttendance, 'detail')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Details
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
