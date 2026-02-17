import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar, CheckCircle, Save, RefreshCw, Filter, Download, Eye, X, AlertCircle
} from 'lucide-react';
import { LoadingSkeleton, TableSkeleton, SimpleLoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const AttendanceMarking = ({ onToast }) => {
  const [loading, setLoading] = useState(true);
  const [todaySessions, setTodaySessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [trainerStatus, setTrainerStatus] = useState('not_marked');
  const [sessionNotes, setSessionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailedAttendance, setDetailedAttendance] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [activeView, setActiveView] = useState('mark');

  const toast = (type, msg) => onToast?.(type, msg);

  useEffect(() => { fetchSessions(); fetchHistory(); }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/coordinator/attendance/today-sessions`, { headers: getHeaders() });
      if (data.success) {
        const d = data.data;
        setTodaySessions(d.todaySessions);
        setStudents(d.students);
        setBatchInfo({ batchId: d.batchId, batchNumber: d.batchNumber });
        const init = {};
        d.students.forEach(s => { init[s._id] = { studentId: s._id, status: 'not_marked', remarks: '' }; });
        setAttendanceData(init);
      }
    } catch (e) {
      toast('error', e.response?.data?.message || 'Failed to load sessions');
    } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const params = {};
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;
      const { data } = await axios.get(`${API}/api/coordinator/attendance/history`, { params, headers: getHeaders() });
      if (data.success) setHistory(data.data.records);
    } catch (e) {
      toast('error', 'Failed to load attendance history');
    } finally { setLoadingHistory(false); }
  };

  const markAll = (status) => {
    const updated = {};
    Object.keys(attendanceData).forEach(id => { updated[id] = { ...attendanceData[id], status }; });
    setAttendanceData(updated);
  };

  const submitAttendance = async () => {
    const session = todaySessions[parseInt(selectedSessionIdx)];
    if (!session) return toast('error', 'Select a session first');
    if (Object.values(attendanceData).every(a => a.status === 'not_marked')) return toast('error', 'Mark at least one student');

    const now = new Date(), start = new Date(), end = new Date();
    const [sh, sm] = session.startTime.split(':').map(Number);
    const [eh, em] = session.endTime.split(':').map(Number);
    start.setHours(sh, sm, 0, 0); end.setHours(eh, em, 0, 0);
    if (now < start || now > end) return toast('error', `Allowed only between ${session.startTime} – ${session.endTime}`);

    try {
      setSubmitting(true);
      const { data } = await axios.post(`${API}/api/coordinator/attendance/mark`, {
        batchId: batchInfo.batchId,
        sessionDate: session?.date ? new Date(session.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        timeSlot: session.timeSlot, startTime: session.startTime, endTime: session.endTime,
        trainerId: session.trainerId, subject: session.subject,
        trainerStatus, trainerRemarks: '', studentAttendance: Object.values(attendanceData), sessionNotes
      }, { headers: getHeaders() });

      if (data.success) {
        toast('success', 'Attendance submitted successfully!');
        setSelectedSessionIdx(''); setTrainerStatus('not_marked'); setSessionNotes('');
        fetchSessions(); fetchHistory();
      }
    } catch (e) {
      toast('error', e.response?.data?.message || 'Failed to submit attendance');
    } finally { setSubmitting(false); }
  };

  const viewDetails = async (record) => {
    try {
      setLoadingDetails(true);
      const { data } = await axios.get(`${API}/api/coordinator/attendance/student-details/${record._id}`, { headers: getHeaders() });
      if (data.success) { setDetailedAttendance(data.data); setSelectedRecord(record); }
    } catch (e) {
      toast('error', 'Failed to load details');
    } finally { setLoadingDetails(false); }
  };

  const downloadReport = (type = 'all') => {
    try {
      const rows = type === 'all'
        ? history.map(r => ({ Date: new Date(r.sessionDate).toLocaleDateString(), Slot: r.timeSlot, Subject: r.subject, Trainer: r.trainerId?.name || 'N/A', Total: r.totalStudents, Present: r.presentCount, Absent: r.absentCount, '%': r.attendancePercentage }))
        : detailedAttendance.map(s => ({ Name: s.name, Roll: s.rollNo, Status: s.status, Remarks: s.remarks || '-' }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf]), `attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast('success', 'Report downloaded!');
    } catch (e) { toast('error', 'Download failed'); }
  };

  const currentSession = selectedSessionIdx !== '' ? todaySessions[parseInt(selectedSessionIdx)] : null;
  const present = Object.values(attendanceData).filter(a => a.status === 'present').length;
  const absent = Object.values(attendanceData).filter(a => a.status === 'absent').length;
  const late = Object.values(attendanceData).filter(a => a.status === 'late').length;
  const slotColor = (s) => s === 'morning' ? 'bg-yellow-100 text-yellow-800' : s === 'afternoon' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800';

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Attendance</h2>
          {batchInfo?.batchNumber && <p className="text-xs text-gray-500 mt-0.5">Batch {batchInfo.batchNumber}</p>}
        </div>
        <button onClick={() => { fetchSessions(); fetchHistory(); }} className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Tabbed card */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="grid grid-cols-2 sm:flex sm:gap-2 w-full">
            {[{ id: 'mark', label: 'Mark Attendance' }, { id: 'history', label: 'Session History' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`w-full text-center px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeView === tab.id ? 'border-b-2 border-blue-700 text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {/* ── MARK ATTENDANCE TAB ── */}
          {activeView === 'mark' && (
            <div className="space-y-4">
              {todaySessions.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No sessions scheduled for today</p>
                  <p className="text-xs text-gray-400 mt-1">Sessions will appear here when scheduled</p>
                </div>
              ) : (
                <>
                  {/* Session picker dropdown */}
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Select Session</label>
                    <select
                      value={selectedSessionIdx}
                      onChange={(e) => setSelectedSessionIdx(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Choose a session --</option>
                      {todaySessions.map((s, i) => (
                        <option key={i} value={i}>
                          {s.subject} — {s.timeSlot} ({s.startTime} – {s.endTime}) — {s.trainerName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentSession && (
                    <>
                      {/* Quick actions row */}
                      <div className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs sm:text-sm">
                        <span className="text-gray-500 font-medium">Trainer:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name="ts" value="present" checked={trainerStatus === 'present'} onChange={() => setTrainerStatus('present')} className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-green-700">Present</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name="ts" value="absent" checked={trainerStatus === 'absent'} onChange={() => setTrainerStatus('absent')} className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-red-600">Absent</span>
                        </label>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <button onClick={() => markAll('present')} className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium hover:bg-green-100">All Present</button>
                        <button onClick={() => markAll('absent')} className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium hover:bg-red-100">All Absent</button>
                        <span className="ml-auto text-gray-400 text-xs">
                          <span className="text-green-700 font-semibold">{present}</span>P
                          <span className="mx-0.5">&middot;</span>
                          <span className="text-red-600 font-semibold">{absent}</span>A
                          {late > 0 && <><span className="mx-0.5">&middot;</span><span className="text-yellow-600 font-semibold">{late}</span>L</>}
                          <span className="mx-0.5">&middot;</span>
                          <span className="text-gray-600">{students.length}</span> total
                        </span>
                      </div>

                      {/* Student marking table */}
                      <div className="overflow-auto max-h-[45vh] sm:max-h-[55vh] border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-blue-50">
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-8">#</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Roll No</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Status</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {students.map((s, i) => (
                              <tr key={s._id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                <td className="px-3 py-1.5 text-xs text-gray-400">{i + 1}</td>
                                <td className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{s.name}</td>
                                <td className="px-3 py-1.5 text-xs sm:text-sm text-gray-500 font-mono whitespace-nowrap">{s.rollNo}</td>
                                <td className="px-3 py-1.5 text-center">
                                  <select
                                    value={attendanceData[s._id]?.status || 'not_marked'}
                                    onChange={(e) => setAttendanceData(prev => ({ ...prev, [s._id]: { ...prev[s._id], status: e.target.value } }))}
                                    className={`px-2 py-1 rounded border text-xs sm:text-sm font-medium cursor-pointer ${
                                      attendanceData[s._id]?.status === 'present' ? 'bg-green-50 border-green-300 text-green-800'
                                      : attendanceData[s._id]?.status === 'absent' ? 'bg-red-50 border-red-300 text-red-800'
                                      : attendanceData[s._id]?.status === 'late' ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                                      : 'bg-gray-50 border-gray-300 text-gray-500'
                                    }`}
                                  >
                                    <option value="not_marked">&mdash;</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                  </select>
                                </td>
                                <td className="px-3 py-1.5">
                                  <input
                                    type="text" placeholder="—"
                                    value={attendanceData[s._id]?.remarks || ''}
                                    onChange={(e) => setAttendanceData(prev => ({ ...prev, [s._id]: { ...prev[s._id], remarks: e.target.value } }))}
                                    className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Submit row */}
                      <div className="flex items-center gap-3">
                        <input
                          type="text" placeholder="Session notes (optional)" value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded text-xs sm:text-sm focus:ring-1 focus:ring-blue-500"
                        />
                        <button onClick={submitAttendance} disabled={submitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                          {submitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Submit</>}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── SESSION HISTORY TAB ── */}
          {activeView === 'history' && (
            <div className="space-y-4">
              {/* Date filters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Start Date</label>
                  <input type="date" value={dateFilter.startDate} onChange={(e) => setDateFilter(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">End Date</label>
                  <input type="date" value={dateFilter.endDate} onChange={(e) => setDateFilter(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="flex gap-2 items-end">
                  <button onClick={fetchHistory} className="flex-1 px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" /> Apply
                  </button>
                  <button onClick={() => { setDateFilter({ startDate: '', endDate: '' }); setTimeout(fetchHistory, 100); }}
                    className="flex-1 px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm font-medium hover:bg-gray-200">Reset</button>
                </div>
                {history.length > 0 && (
                  <div className="flex items-end">
                    <button onClick={() => downloadReport('all')} className="w-full px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Export
                    </button>
                  </div>
                )}
              </div>

              {/* History table */}
              {loadingHistory ? <TableSkeleton /> : history.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No attendance records found</p>
                  <p className="text-xs text-gray-400 mt-1">Records will appear here after marking attendance</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500">{history.length} records</p>
                  <div className="overflow-auto max-h-[50vh] sm:max-h-[60vh] border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-blue-50">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Slot</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Trainer</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Attendance</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">%</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {history.map((r, i) => (
                          <tr key={r._id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{new Date(r.sessionDate).toLocaleDateString()}</div>
                              <div className="text-[10px] text-gray-400">{new Date(r.sessionDate).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${slotColor(r.timeSlot)}`}>{r.timeSlot}</span>
                            </td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 whitespace-nowrap font-medium">{r.subject}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{r.trainerId?.name || '—'}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap text-xs sm:text-sm">
                              <span className="text-green-700 font-semibold">{r.presentCount}</span>
                              <span className="text-gray-400"> / </span>
                              <span>{r.totalStudents}</span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {r.attendancePercentage != null ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${r.attendancePercentage >= 75 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>{r.attendancePercentage}%</span>
                              ) : <span className="text-xs text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {r.recorded !== false && (
                                <button onClick={() => viewDetails(r)} className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="View details">
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details — bottom sheet on mobile, centered modal on desktop */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full max-h-[90vh] rounded-t-2xl sm:rounded-lg shadow-xl sm:max-w-2xl sm:max-h-[85vh] sm:mx-4 flex flex-col">
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {loadingDetails ? (
              <div className="p-6"><SimpleLoadingSkeleton /></div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 pt-2 sm:pt-4 pb-3 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{selectedRecord.subject}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedRecord.sessionDate).toLocaleDateString()} &middot; {selectedRecord.timeSlot} &middot;
                      <span className="text-green-700 font-medium"> {selectedRecord.presentCount}P</span> /
                      <span className="text-red-600 font-medium"> {selectedRecord.absentCount}A</span> /
                      <span> {selectedRecord.totalStudents} total</span>
                    </p>
                  </div>
                  <button onClick={() => setSelectedRecord(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-3 sm:p-4">
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-blue-50">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-8">#</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Roll No</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailedAttendance.map((s, i) => (
                          <tr key={s._id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-3 py-1.5 text-xs text-gray-400">{i + 1}</td>
                            <td className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-900">{s.name}</td>
                            <td className="px-3 py-1.5 text-xs sm:text-sm text-gray-500 font-mono">{s.rollNo}</td>
                            <td className="px-3 py-1.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                s.status === 'present' ? 'bg-green-100 text-green-800 border-green-200'
                                : s.status === 'absent' ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>{s.status}</span>
                            </td>
                            <td className="px-3 py-1.5 text-xs text-gray-500">{s.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end">
                  <button onClick={() => downloadReport('detail')} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
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
