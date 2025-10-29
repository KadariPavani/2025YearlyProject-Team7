// components/AttendanceMarking.jsx
// COMPLETE FILE - CREATE NEW FILE
// This is the MAIN component for Coordinators to mark attendance for BOTH students AND trainers

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, 
  User, Save, RefreshCw, Filter, Download, Eye, UserCheck 
} from 'lucide-react';

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
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  // Fetch today's sessions and students on component mount
  useEffect(() => {
    fetchTodaySessions();
  }, []);

const fetchTodaySessions = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token'); // Get actual token
    
    const response = await axios.get('/api/coordinator/attendance/today-sessions', {
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
      sessionDate: new Date().toISOString().split('T')[0],
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
      '/api/coordinator/attendance/mark',
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
    setLoading(true);
    const token = localStorage.getItem('token'); // Get actual token
    
    const params = {};
    if (dateFilter.startDate) params.startDate = dateFilter.startDate;
    if (dateFilter.endDate) params.endDate = dateFilter.endDate;

    const response = await axios.get('/api/coordinator/attendance/history', {
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
    setLoading(false);
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

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-blue-600" />
          Attendance Management
        </h1>
        <p className="text-gray-600">
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
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setView('mark')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            view === 'mark' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="inline h-5 w-5 mr-2" />
          Mark Attendance
        </button>
        <button
          onClick={() => setView('history')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            view === 'history' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Eye className="inline h-5 w-5 mr-2" />
          View History
        </button>
      </div>

      {view === 'mark' && (
        <>
          {/* Today's Sessions */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today's Scheduled Sessions
            </h2>
            
            {todaySessions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No sessions scheduled for today</p>
                <p className="text-gray-400 text-sm mt-2">Check back on a weekday</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaySessions.map((session, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSession(session)}
                    className={`p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                      selectedSession?.trainerId === session.trainerId && 
                       selectedSession?.timeSlot === session.timeSlot
                        ? 'border-blue-600 bg-blue-50 shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900 text-lg">
                        {session.subject}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.timeSlot === 'morning' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : session.timeSlot === 'afternoon'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {session.timeSlot}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {session.trainerName}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Marking Section */}
          {selectedSession && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Mark Attendance - {selectedSession.subject}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={markAllPresent}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    All Present
                  </button>
                  <button
                    onClick={markAllAbsent}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    All Absent
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentStats.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {currentStats.present}
                  </div>
                  <div className="text-sm text-gray-600">Present</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {currentStats.absent}
                  </div>
                  <div className="text-sm text-gray-600">Absent</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {currentStats.late}
                  </div>
                  <div className="text-sm text-gray-600">Late</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentStats.notMarked}
                  </div>
                  <div className="text-sm text-gray-600">Not Marked</div>
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
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {student.rollNo}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={attendanceData[student._id]?.status || 'not_marked'}
                            onChange={(e) => 
                              handleStudentStatusChange(student._id, e.target.value)
                            }
                            className={`px-4 py-2 rounded-lg border font-medium text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 ${
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
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Optional remarks"
                            value={attendanceData[student._id]?.remarks || ''}
                            onChange={(e) => 
                              handleStudentRemarksChange(student._id, e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmitAttendance}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Submit Attendance
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Attendance History</h2>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={fetchAttendanceHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {attendanceHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceHistory.map((record) => (
                <div
                  key={record._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {record.subject}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(record.sessionDate).toLocaleDateString()} - {record.timeSlot}
                      </p>
                      <p className="text-sm text-gray-500">
                        Trainer: {record.trainerId?.name || 'N/A'} - {record.trainerStatus}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {record.attendancePercentage}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.presentCount}/{record.totalStudents} present
                      </div>
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
