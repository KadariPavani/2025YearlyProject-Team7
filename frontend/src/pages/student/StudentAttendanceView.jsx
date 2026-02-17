import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, TrendingUp, CheckCircle, XCircle, BookOpen, Filter, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const StudentAttendanceView = () => {
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/attendance/my-attendance`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setAttendance(response.data.data.attendance);
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchAttendance();
  };

  const resetFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setTimeout(() => fetchAttendance(), 0);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">My Attendance</h2>
        </div>
        <button
          onClick={fetchAttendance}
          className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Attendance Rate</p>
                <p className="text-sm sm:text-xl font-bold text-gray-900">{statistics.attendancePercentage}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><BookOpen className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Total Sessions</p>
                <p className="text-sm sm:text-xl font-bold text-gray-900">{statistics.totalSessions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Present</p>
                <p className="text-sm sm:text-xl font-bold text-green-700">{statistics.presentCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex w-10 h-10 rounded-md bg-red-50 items-center justify-center"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-gray-500">Absent</p>
                <p className="text-sm sm:text-xl font-bold text-red-600">{statistics.absentCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full mt-1 px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full mt-1 px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 items-end">
            <button
              onClick={handleDateFilter}
              className="flex-1 px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="flex-1 px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Attendance Records</h3>
          {attendance.length > 0 && (
            <span className="ml-auto text-xs text-gray-500">{attendance.length} records</span>
          )}
        </div>

        {attendance.length === 0 ? (
          <div className="text-center py-8 p-3 sm:p-4">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No attendance records found</p>
            <p className="text-gray-400 text-xs mt-1">Your attendance will appear here once sessions are recorded</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="overflow-x-auto max-h-[50vh] sm:max-h-[60vh] border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Slot</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Trainer</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map((record, idx) => (
                    <tr key={record.attendanceId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {new Date(record.sessionDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500">
                          {new Date(record.sessionDate).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${
                          record.timeSlot === 'morning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : record.timeSlot === 'afternoon'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.timeSlot}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{record.subject}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">
                          {record.startTime} - {record.endTime}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{record.trainer?.name || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : record.status === 'late'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status === 'present' ? 'Present' :
                           record.status === 'absent' ? 'Absent' :
                           record.status === 'late' ? 'Late' : 'Not Marked'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-500">{record.remarks || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendanceView;
