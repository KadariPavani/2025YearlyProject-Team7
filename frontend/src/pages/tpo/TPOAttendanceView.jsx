// components/TPOAttendanceView.jsx - CLEAN & MODERN UI VERSION
// Replace your entire TPOAttendanceView.jsx with this code

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Calendar, RefreshCw, Search, X, TrendingUp, Users, AlertTriangle } from 'lucide-react';

const TPOAttendanceView = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    batchId: '',
    searchQuery: '',
  });
  const [activeView, setActiveView] = useState('summary');

  useEffect(() => {
    fetchCompleteReport();
  }, []);

  const fetchCompleteReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.batchId) params.batchId = filters.batchId;

      const response = await axios.get('/api/tpo/attendance/complete-report', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError('Failed to fetch attendance data');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.response?.data?.message || 'Error loading attendance data');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setDownloading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.batchId) params.batchId = filters.batchId;

      const response = await axios.get('/api/tpo/attendance/download-excel', {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });

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
    } finally {
      setDownloading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchCompleteReport();
  };

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', batchId: '', searchQuery: '' });
    setTimeout(() => fetchCompleteReport(), 100);
  };

  const getFilteredStudents = () => {
    if (!reportData || !reportData.studentWiseReport) return [];
    let filtered = reportData.studentWiseReport;
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.student.name.toLowerCase().includes(query) ||
        s.student.rollNo.toLowerCase().includes(query) ||
        s.student.email.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '10px', color: '#666' }}>Loading attendance data...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', padding: '15px', borderRadius: '8px', color: '#c33' }}>
          {error}
        </div>
        <button onClick={fetchCompleteReport} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  if (!reportData) return <div>No data available</div>;

  const { summary, batchStats, studentWiseReport, sessionWiseReport, lowAttendanceStudents } = reportData;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Attendance Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={downloadExcel} disabled={downloading} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            <Download size={18} />
            {downloading ? 'Downloading...' : 'Export Excel'}
          </button>
          <button onClick={fetchCompleteReport} style={{ padding: '10px 20px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total Students</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '4px 0 0 0' }}>{summary.totalStudents}</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} color="#10b981" />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total Sessions</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '4px 0 0 0' }}>{summary.totalSessions}</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: summary.averageAttendance >= 75 ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color={summary.averageAttendance >= 75 ? '#10b981' : '#ef4444'} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Avg Attendance</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: summary.averageAttendance >= 75 ? '#10b981' : '#ef4444', margin: '4px 0 0 0' }}>{summary.averageAttendance}%</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Low Attendance</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444', margin: '4px 0 0 0' }}>{summary.lowAttendanceCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Search Student</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input type="text" placeholder="Name, Roll No, Email..." value={filters.searchQuery} onChange={(e) => handleFilterChange('searchQuery', e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <button onClick={applyFilters} style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Apply</button>
            <button onClick={resetFilters} style={{ flex: 1, padding: '10px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
          {[
            { id: 'summary', label: 'Batch Summary' },
            { id: 'students', label: 'Student Details' },
            { id: 'sessions', label: 'Session History' },
            { id: 'alerts', label: 'Low Attendance' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{ padding: '16px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: activeView === tab.id ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', fontSize: '14px', fontWeight: activeView === tab.id ? '600' : '400', color: activeView === tab.id ? '#3b82f6' : '#6b7280', whiteSpace: 'nowrap' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {/* Batch Summary */}
          {activeView === 'summary' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Batch</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tech Stack</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Students</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Sessions</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Avg Attendance</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {batchStats.map(batch => (
                    <tr key={batch._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{batch.batchNumber}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{batch.techStack}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{batch.totalStudents}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{batch.totalSessions}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: batch.averageAttendance >= 75 ? '#d1fae5' : '#fee2e2', color: batch.averageAttendance >= 75 ? '#065f46' : '#991b1b', fontWeight: '600', fontSize: '13px' }}>
                          {batch.averageAttendance}%
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>{batch.lowAttendanceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Student Details */}
          {activeView === 'students' && (
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Showing {getFilteredStudents().length} of {studentWiseReport.length} students</p>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Roll No</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>College</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Branch</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Sessions</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Present</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Absent</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStudents().map(student => (
                      <tr key={student.student._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px', fontWeight: '500' }}>{student.student.name}</td>
                        <td style={{ padding: '10px', color: '#6b7280' }}>{student.student.rollNo}</td>
                        <td style={{ padding: '10px', color: '#6b7280', fontSize: '12px' }}>{student.student.email}</td>
                        <td style={{ padding: '10px', color: '#6b7280' }}>{student.student.college}</td>
                        <td style={{ padding: '10px', color: '#6b7280' }}>{student.student.branch}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{student.totalSessions}</td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>{student.present + student.late}</td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>{student.absent}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '10px', backgroundColor: student.percentage >= 75 ? '#d1fae5' : '#fee2e2', color: student.percentage >= 75 ? '#065f46' : '#991b1b', fontWeight: '600' }}>
                            {student.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Session History */}
          {activeView === 'sessions' && (
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Total {sessionWiseReport.length} sessions recorded</p>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {sessionWiseReport.map(session => (
                  <div key={session._id} style={{ marginBottom: '12px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '15px', margin: 0 }}>{new Date(session.date).toLocaleDateString()} ({session.day})</p>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>{session.timeSlot} • {session.startTime} - {session.endTime}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: session.attendancePercentage >= 75 ? '#10b981' : '#ef4444', margin: 0 }}>{session.attendancePercentage}%</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>{session.presentCount}/{session.totalStudents}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
                      <strong>Subject:</strong> {session.subject} • <strong>Trainer:</strong> {session.trainer ? session.trainer.name : 'N/A'} • <strong>Batch:</strong> {session.batch.batchNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Attendance Alerts */}
          {activeView === 'alerts' && (
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{lowAttendanceStudents.length} students below 75% attendance</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Student</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Roll No</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Contact</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#991b1b' }}>Attendance</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#991b1b' }}>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowAttendanceStudents.map(student => (
                      <tr key={student.student._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '600' }}>{student.student.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{student.student.college} - {student.student.branch}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{student.student.rollNo}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>{student.student.email}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ padding: '6px 12px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: '700', fontSize: '13px' }}>
                            {student.percentage}%
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>{student.absent}/{student.totalSessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TPOAttendanceView;
