import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, RefreshCw, Search, Calendar, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const TPOAttendanceView = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '', batchId: '', searchQuery: '' });
  const [activeView, setActiveView] = useState('summary');

  useEffect(() => { fetchCompleteReport(); }, []);

  const fetchCompleteReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.batchId) params.batchId = filters.batchId;

      const response = await axios.get('/api/tpo/attendance/complete-report', { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

      if (response.data.success) setReportData(response.data.data);
      else setError('Failed to fetch attendance data');
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.response?.data?.message || 'Error loading attendance data');
    } finally { setLoading(false); }
  };

  const downloadExcel = async () => {
    try {
      setDownloading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.batchId) params.batchId = filters.batchId;

      const response = await axios.get('/api/tpo/attendance/download-excel', { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading Excel:', err);
      alert('Error downloading report. Please try again.');
    } finally { setDownloading(false); }
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const applyFilters = () => fetchCompleteReport();
  const resetFilters = () => { setFilters({ startDate: '', endDate: '', batchId: '', searchQuery: '' }); setTimeout(() => fetchCompleteReport(), 100); };

  const getFilteredStudents = () => {
    if (!reportData || !reportData.studentWiseReport) return [];
    let filtered = reportData.studentWiseReport;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.student.name.toLowerCase().includes(q) || s.student.rollNo.toLowerCase().includes(q) || s.student.email.toLowerCase().includes(q));
    }
    return filtered;
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">{error}</div>
        <div className="mt-3 flex gap-2">
          <button onClick={fetchCompleteReport} className="px-3 py-1.5 bg-blue-600 text-white rounded">Retry</button>
        </div>
      </div>
    );
  }

  if (!reportData) return <div className="p-4 text-gray-500">No data available</div>;

  const { summary, batchStats, studentWiseReport = [], sessionWiseReport = [], lowAttendanceStudents = [] } = reportData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Attendance Management</h2>
          <p className="text-sm text-gray-500">Overview and detailed attendance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadExcel} disabled={downloading} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${downloading ? 'bg-gray-300 text-gray-600' : 'bg-green-600 text-white'}`}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Export Excel'}</span>
          </button>
          <button onClick={fetchCompleteReport} className="px-3 py-1.5 rounded text-sm font-medium bg-blue-600 text-white flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Mobile compact stats - 4 small boxes in single row */}
      <div className="sm:hidden grid grid-cols-4 gap-2">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 text-center text-[10px]">
          <div className="text-gray-500">Total Students</div>
          <div className="text-sm font-semibold">{summary.totalStudents}</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 text-center text-[10px]">
          <div className="text-gray-500">Total Sessions</div>
          <div className="text-sm font-semibold">{summary.totalSessions}</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 text-center text-[10px]">
          <div className="text-gray-500">Avg</div>
          <div className="text-sm font-semibold">{summary.averageAttendance}%</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 text-center text-[10px]">
          <div className="text-gray-500">Low Attendance</div>
          <div className="text-sm font-semibold">{summary.lowAttendanceCount}</div>
        </div>
      </div>

      {/* Desktop stat cards */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{summary.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 flex items-center justify-center"><Calendar className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Sessions</p>
              <p className="text-xl font-bold text-gray-900">{summary.totalSessions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex w-10 h-10 rounded-md ${summary.averageAttendance >= 75 ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center`}>
              <TrendingUp className={`h-5 w-5 ${summary.averageAttendance >= 75 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Attendance</p>
              <p className={`text-xl font-bold ${summary.averageAttendance >= 75 ? 'text-green-700' : 'text-red-600'}`}>{summary.averageAttendance}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-red-50 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Low Attendance</p>
              <p className="text-xl font-bold text-red-600">{summary.lowAttendanceCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-600">Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Search Student</label>
            <div className="relative mt-1">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Name, Roll No, Email..." value={filters.searchQuery} onChange={(e) => handleFilterChange('searchQuery', e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded text-sm" />
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <button onClick={applyFilters} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm">Apply</button>
            <button onClick={resetFilters} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm">Reset</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="border-b">
          <div className="grid grid-cols-4 sm:flex sm:gap-2 w-full">
            {[{ id: 'summary', label: 'Batch Summary' }, { id: 'students', label: 'Student Details' }, { id: 'sessions', label: 'Session History' }, { id: 'alerts', label: 'Low Attendance' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`w-full text-center px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium ${activeView === tab.id ? 'border-b-2 border-blue-700 text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* Summary Table */}
          {activeView === 'summary' && (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Batch</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Tech Stack</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Students</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Sessions</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Avg</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Alerts</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-sm">
                      {batchStats.map(batch => (
                        <tr key={batch._id} className={`hover:bg-blue-50 ${batch.averageAttendance < 75 ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2">{batch.batchNumber}</td>
                          <td className="px-3 py-2 text-gray-700">{batch.techStack}</td>
                          <td className="px-3 py-2 text-center">{batch.totalStudents}</td>
                          <td className="px-3 py-2 text-center">{batch.totalSessions}</td>
                          <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${batch.averageAttendance >= 75 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{batch.averageAttendance}%</span></td>
                          <td className="px-3 py-2 text-center text-red-600 font-semibold">{batch.lowAttendanceCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile stacked list - compact */}
              <div className="sm:hidden divide-y divide-gray-200">
                {batchStats.map(batch => (
                  <div key={batch._id} className="p-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-xs truncate">{batch.batchNumber}</div>
                      <div className="text-[10px] text-gray-500">{batch.techStack}</div>
                    </div>
                    <div className="text-right text-[10px]">
                      <div className="font-semibold">{batch.totalStudents} students</div>
                      <div className="text-gray-500">{batch.totalSessions} sessions</div>
                      <div className={`font-semibold ${batch.averageAttendance >= 75 ? 'text-green-700' : 'text-red-600'}`}>{batch.averageAttendance}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Student Details */}
          {activeView === 'students' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Showing {getFilteredStudents().length} of {studentWiseReport.length} students</p>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Roll</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">College</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Branch</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Sessions</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Present</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Absent</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {getFilteredStudents().map((s, idx) => (
                      <tr key={s.student._id} className={`${idx%2===0?'bg-white':'bg-gray-50'}`}>
                        <td className="px-3 py-2">{s.student.name}</td>
                        <td className="px-3 py-2 font-mono text-sm">{s.student.rollNo}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">{s.student.email}</td>
                        <td className="px-3 py-2 text-sm">{s.student.college}</td>
                        <td className="px-3 py-2 text-sm">{s.student.branch}</td>
                        <td className="px-3 py-2 text-center">{s.totalSessions}</td>
                        <td className="px-3 py-2 text-center text-green-700 font-semibold">{s.present + s.late}</td>
                        <td className="px-3 py-2 text-center text-red-600 font-semibold">{s.absent}</td>
                        <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.percentage >= 75 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{s.percentage}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile compact list */}
              <div className="sm:hidden divide-y divide-gray-200">
                {getFilteredStudents().map((s, idx) => (
                  <div key={s.student._id} className={`p-2 flex items-center justify-between ${idx%2===0?'bg-white':'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px]">{s.student.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-[10px] truncate">{s.student.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{s.student.college} • {s.student.branch}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3 flex-shrink-0 relative">
                      <div className="text-[10px] text-gray-700 font-mono text-right">{s.student.rollNo}</div>
                      <div className={`ml-3 text-xs font-semibold ${s.percentage >= 75 ? 'text-green-700' : 'text-red-600'}`}>{s.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session History */}
          {activeView === 'sessions' && (
            <div className="space-y-3 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
              {/* Desktop: table similar to Student Details */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Day</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Time</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Subject</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Trainer</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Batch</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Attendance</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Present</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sessionWiseReport.map((session, idx) => (
                      <tr key={session._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                        <td className="px-3 py-2 text-sm">{new Date(session.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-sm">{session.day}</td>
                        <td className="px-3 py-2 text-sm">{session.timeSlot} • {session.startTime} - {session.endTime}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">{session.subject}</td>
                        <td className="px-3 py-2 text-sm">{session.trainer ? session.trainer.name : 'N/A'}</td>
                        <td className="px-3 py-2 text-sm">{session.batch?.batchNumber || 'N/A'}</td>
                        <td className="px-3 py-2 text-center">
                          {session.attendancePercentage !== null && session.attendancePercentage !== undefined ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${session.attendancePercentage >= 75 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{session.attendancePercentage}%</span>
                          ) : (
                            <span className="text-xs text-gray-500">Not recorded</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-semibold">{session.presentCount}/{session.totalStudents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: stacked compact list with consistent sizing and Batch on its own line */}
              <div className="sm:hidden divide-y divide-gray-200">
                {sessionWiseReport.map((session, idx) => (
                  <div key={session._id} className={`p-2 flex items-start justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{new Date(session.date).toLocaleDateString()} <span className="text-xs text-gray-500">({session.day})</span></div>
                      <div className="text-xs text-gray-500 mt-0.5">{session.timeSlot} • {session.startTime} - {session.endTime}</div>
                      <div className="text-xs text-gray-700 mt-1 truncate">{session.subject}</div>
                      <div className="text-xs text-gray-700 truncate">{session.trainer ? session.trainer.name : 'N/A'}</div>
                      <div className="text-xs text-gray-700 truncate">{session.batch?.batchNumber || 'N/A'}</div>
                    </div>

                    <div className="text-right ml-3 flex-shrink-0">
                      {session.attendancePercentage !== null && session.attendancePercentage !== undefined ? (
                        <div className={`font-medium text-xs ${session.attendancePercentage >= 75 ? 'text-green-700' : 'text-red-600'}`}>{session.attendancePercentage}%</div>
                      ) : (
                        <div className="text-xs text-gray-500 font-medium">Not recorded</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{session.presentCount}/{session.totalStudents}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Attendance Alerts */}
          {activeView === 'alerts' && (
            <>
              <p className="text-sm text-gray-500 mb-3">{lowAttendanceStudents.length} students below 75% attendance</p>

              {/* Desktop table */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">Student</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">Roll No</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-red-700">Contact</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-red-700">Attendance</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-red-700">Absent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {lowAttendanceStudents.map(student => (
                        <tr key={student.student._id} className={`hover:bg-red-50`}>
                          <td className="px-3 py-2">
                            <div className="font-semibold">{student.student.name}</div>
                            <div className="text-xs text-gray-500">{student.student.college} - {student.student.branch}</div>
                          </td>
                          <td className="px-3 py-2">{student.student.rollNo}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{student.student.email}</td>
                          <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">{student.percentage}%</span></td>
                          <td className="px-3 py-2 text-center text-red-600 font-semibold">{student.absent}/{student.totalSessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile stacked list */}
              <div className="sm:hidden divide-y divide-gray-200">
                {lowAttendanceStudents.map(student => (
                  <div key={student.student._id} className="p-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs">{student.student.name}</div>
                      <div className="text-[10px] text-gray-500">{student.student.college} - {student.student.branch}</div>
                    </div>
                    <div className="text-right text-[10px]">
                      <div className="font-semibold text-red-700">{student.percentage}%</div>
                      <div className="text-gray-500">Absent: {student.absent}/{student.totalSessions}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TPOAttendanceView;
