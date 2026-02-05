import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Reusable Add/Edit Student form used by TPO (keeps UI inside this file for simplicity)
function AddEditStudentForm({ batches = [], initial = {}, onSubmit, onClose }) {
  // Keep a stable initial id ref so we don't overwrite user input on unrelated re-renders
  const initialIdRef = useRef(initial?._id);

  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    rollNo: initial.rollNo || '',
    branch: initial.branch || '',
    college: initial.college || '', // do NOT auto-select batch/college
    phonenumber: initial.phonenumber || '',
    batchId: initial.batchId || '' // do NOT auto-select
  });
  const [submitting, setSubmitting] = useState(false);

  // Initialize form when the provided initial changes (i.e., edit mode), but do NOT reset while typing
  useEffect(() => {
    const newInitialId = initial?._id;
    if (newInitialId !== initialIdRef.current) {
      setForm({
        name: initial.name || '',
        email: initial.email || '',
        rollNo: initial.rollNo || '',
        branch: initial.branch || '',
        college: initial.college || '',
        phonenumber: initial.phonenumber || '',
        batchId: initial.batchId || ''
      });
      initialIdRef.current = newInitialId;
    }
  }, [initial]);

  // Derive available colleges from batches (union of colleges across batches)
  const collegeOptions = React.useMemo(() => {
    const cols = new Set();
    batches.forEach(b => (b.colleges || []).forEach(c => cols.add(c)));
    return Array.from(cols);
  }, [batches]);

  // Available colleges depends on selected batch; default to the union list
  const [availableColleges, setAvailableColleges] = React.useState(collegeOptions);

  useEffect(() => {
    setAvailableColleges(collegeOptions);
  }, [collegeOptions]);

  const branches = ['AID','CSM','CAI','CSD','CSC'];

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleBatchChange = (batchId) => {
    handleChange('batchId', batchId);
    const batch = batches.find(b => String(b._id) === String(batchId));
    if (batch && batch.colleges && batch.colleges.length > 0) {
      setAvailableColleges(batch.colleges);
      if (form.college && !batch.colleges.includes(form.college)) {
        handleChange('college', '');
      }
    } else {
      setAvailableColleges(collegeOptions);
    }
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    // Basic validation
    if (!form.name || !form.email || !form.rollNo || !form.batchId || !form.college) {
      alert('Please fill name, email, roll number, select college and batch');
      return;
    }

    // Simple email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // If a batch is selected, ensure the chosen college belongs to that batch
    if (form.batchId) {
      const batch = batches.find(b => String(b._id) === String(form.batchId));
      if (batch && batch.colleges && batch.colleges.length > 0) {
        if (!form.college || !batch.colleges.includes(form.college)) {
          alert('Selected college does not belong to the chosen batch. Please select the correct college.');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await onSubmit(form);
      setSubmitting(false);
      if (res && res.success) {
        onClose && onClose();
      } else if (res && res.message) {
        alert(res.message);
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Submit error:', err);
      alert(err.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Name" className="w-full px-3 py-2 border rounded" />
        <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded" />
        <input value={form.rollNo} onChange={(e) => handleChange('rollNo', e.target.value)} placeholder="Roll No" className="w-full px-3 py-2 border rounded" />
        <select value={form.branch} onChange={(e) => handleChange('branch', e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="">Select Branch</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input value={form.phonenumber} onChange={(e) => handleChange('phonenumber', e.target.value)} placeholder="Phone" className="w-full px-3 py-2 border rounded" />
        <select value={form.college} onChange={(e) => handleChange('college', e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="">Select College</option>
          {availableColleges.length === 0 ? (
            <option value="" disabled>No colleges available (select a batch first)</option>
          ) : (
            availableColleges.map(c => <option key={c} value={c}>{c}</option>)
          )}
        </select>

        <select value={form.batchId} onChange={(e) => handleBatchChange(e.target.value)} className="w-full px-3 py-2 border rounded">
          <option value="">Select Batch</option>
          {batches.map(batch => (
            <option key={batch._id} value={batch._id}>{batch.batchNumber} {batch.colleges ? `(${batch.colleges.join(',')})` : ''}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => onClose && onClose()} className="px-3 py-1.5 border rounded">Cancel</button>
        <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-blue-600 text-white rounded">{submitting ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

import api from '../../services/api';
import {
  Users, Building, Calendar, Eye, ChevronRight, ChevronDown,
  Building2, Code2, GraduationCap, X, TrendingUp, Clock, MapPin, Award, Filter,
  Search, UserPlus,Activity, UserCheck, Download, CalendarDays, BookOpen, FileText,
  User, Phone, Mail, MapPin as Location, GraduationCap as Education, Briefcase,
  ExternalLink, Image as ImageIcon, Star,
  CheckCircle, AlertCircle, MoreVertical, Edit, Trash2, UserMinus
} from 'lucide-react';
import TrainerAssignment from './TrainerAssignment';
import ScheduleTimetable from './ScheduleTimetable';
import TPOAttendanceView from './TPOAttendanceView';
import TPOFeedbackView from './TPOFeedbackView';
import { MessageSquare } from 'lucide-react';
import PlacementCalendar from "./PlacementCalendar";
import PlacedStudentsTab from './PlacedStudentsTab';
import axios from 'axios';
import StudentActivity from './StudentActivity';
import Header from '../../components/common/Header';
import BottomNav from '../../components/common/BottomNav';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-500 text-xs sm:text-sm">{label}</span>
    <span className="font-medium text-gray-900 text-xs sm:text-sm flex items-center gap-1.5 text-right max-w-[55%] truncate">
      {Icon && <Icon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
      {value || 'N/A'}
    </span>
  </div>
);

const ProfileSection = ({ title, icon: Icon, children }) => (
  <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-blue-600 flex-shrink-0" />}
      {title}
    </h4>
    {children}
  </div>
);

const ProfileBadge = ({ text, variant = 'default' }) => {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${styles[variant]}`}>
      {text}
    </span>
  );
};

const getStatusVariant = (status) => {
  if (!status) return 'default';
  if (status === 'placed' || status.includes('approved')) return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'CRT') return 'primary';
  return 'default';
};

const PerformanceRing = ({ percentage, color, size = 48 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-800">
        {Math.round(pct)}%
      </span>
    </div>
  );
};

const StudentProfileModal = ({ student, onClose }) => {
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!student?._id) return;
    setActivityLoading(true);
    api.get(`/api/student-activity/${student._id}`)
      .then(res => { if (res.data?.success) setActivity(res.data.data); })
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [student?._id]);

  if (!student) return null;

  const handleResumeDownload = (resumeUrl, fileName) => {
    if (resumeUrl) {
      const link = document.createElement('a');
      link.href = resumeUrl;
      link.download = fileName || 'resume';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const totals = activity?.scores?.totals;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg md:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Sticky header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-3.5 sm:py-4 sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-white/10">
              {student.profileImageUrl ? (
                <img src={student.profileImageUrl} alt={student.name} className="w-full h-full object-cover" onClick={() => student.profileImageUrl && window.open(student.profileImageUrl, '_blank')} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                  {student.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{student.name}</h3>
              <p className="text-blue-200 text-[11px] sm:text-xs truncate">{student.rollNo} &bull; {student.college} &bull; {student.branch}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-white/20 active:bg-white/30 rounded-lg transition-colors text-white/70 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status badges bar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          {student.crtStatus && <ProfileBadge text={student.crtStatus} variant={getStatusVariant(student.crtStatus)} />}
          {student.status && <ProfileBadge text={student.status} variant={getStatusVariant(student.status)} />}
          {student.batchNumber && <ProfileBadge text={student.batchNumber} variant="primary" />}
          {student.yearOfPassing && <ProfileBadge text={`YOP: ${student.yearOfPassing}`} variant="default" />}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-3 sm:space-y-4">

          {/* Contact & Basic Info */}
          <ProfileSection title="Basic Information" icon={User}>
            <div className="space-y-0">
              <InfoRow label="Email" value={student.email} icon={Mail} />
              <InfoRow label="Phone" value={student.phonenumber} icon={Phone} />
              <InfoRow label="College" value={student.college} icon={Building} />
              <InfoRow label="Branch" value={student.branch} icon={GraduationCap} />
              <InfoRow label="Year of Passing" value={student.yearOfPassing} />
            </div>
          </ProfileSection>

          {/* Personal Info */}
          {(student.gender || student.dob || student.currentLocation || student.hometown) && (
            <ProfileSection title="Personal Information" icon={User}>
              <div className="space-y-0">
                {student.gender && <InfoRow label="Gender" value={student.gender} />}
                {student.dob && <InfoRow label="Date of Birth" value={new Date(student.dob).toLocaleDateString()} />}
                {student.currentLocation && <InfoRow label="Location" value={student.currentLocation} icon={Location} />}
                {student.hometown && <InfoRow label="Hometown" value={student.hometown} icon={Location} />}
              </div>
            </ProfileSection>
          )}

          {/* Resume */}
          {student.resumeUrl && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">Resume</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{student.resumeFileName || 'resume.pdf'}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => window.open(student.resumeUrl, '_blank')} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">View</span>
                </button>
                <button onClick={() => handleResumeDownload(student.resumeUrl, student.resumeFileName)} className="px-2.5 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-[10px] sm:text-xs font-medium hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>
          )}

          {/* Bio */}
          {student.bio && (
            <ProfileSection title="Professional Bio">
              <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">{student.bio}</p>
            </ProfileSection>
          )}

          {/* Academics */}
          {student.academics && (
            <ProfileSection title="Academic Records" icon={Education}>
              <div className="space-y-2">
                {student.academics.btechCGPA && (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">B.Tech CGPA</span>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-blue-700">{student.academics.btechCGPA}/10</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {student.academics.inter?.percentage && (
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-xs">12th / Inter</p>
                      <p className="text-base sm:text-lg font-bold text-gray-800 mt-0.5">{student.academics.inter.percentage}%</p>
                      {student.academics.inter.board && <p className="text-[10px] text-gray-500">{student.academics.inter.board}</p>}
                    </div>
                  )}
                  {student.academics.diploma?.percentage && (
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-xs">Diploma</p>
                      <p className="text-base sm:text-lg font-bold text-gray-800 mt-0.5">{student.academics.diploma.percentage}%</p>
                      {student.academics.diploma.board && <p className="text-[10px] text-gray-500">{student.academics.diploma.board}</p>}
                    </div>
                  )}
                </div>
                {student.academics.backlogs !== undefined && (
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">Active Backlogs</span>
                    <span className={`text-lg font-bold ${student.academics.backlogs === 0 ? 'text-green-600' : 'text-red-600'}`}>{student.academics.backlogs}</span>
                  </div>
                )}
              </div>
            </ProfileSection>
          )}

          {/* Tech Stack */}
          {student.techStack && student.techStack.length > 0 && (
            <ProfileSection title="Technical Skills" icon={Code2}>
              <div className="flex flex-wrap gap-1.5">
                {student.techStack.map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] sm:text-xs font-medium border border-blue-200">{tech}</span>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Performance Summary */}
          <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              Performance Summary
            </h4>
            {activityLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <span className="ml-2 text-xs text-gray-500">Loading performance data...</span>
              </div>
            ) : totals ? (
              <div className="space-y-3">
                {/* Overall ring + category rings */}
                <div className="flex items-center justify-around bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3">
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.overallPercentage} color="#4f46e5" size={56} />
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Overall</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.quizPercentage} color="#0891b2" size={44} />
                    <span className="text-[10px] sm:text-xs text-gray-600">Quiz</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.assignmentPercentage} color="#059669" size={44} />
                    <span className="text-[10px] sm:text-xs text-gray-600">Assignment</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <PerformanceRing percentage={totals.codingPercentage} color="#7c3aed" size={44} />
                    <span className="text-[10px] sm:text-xs text-gray-600">Coding</span>
                  </div>
                </div>

                {/* Score breakdown cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2 sm:p-2.5 text-center">
                    <BookOpen className="h-3.5 w-3.5 text-cyan-600 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Quizzes</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{totals.quizScore}/{totals.quizTotalMarks}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400">{activity?.scores?.quizzes?.filter(q => q.submittedAt).length || 0} attempted</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 sm:p-2.5 text-center">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Assignments</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{totals.assignmentScore}/{totals.assignmentTotalMarks}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400">{activity?.scores?.assignments?.filter(a => a.submittedAt).length || 0} submitted</p>
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-2 sm:p-2.5 text-center">
                    <Code2 className="h-3.5 w-3.5 text-violet-600 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Coding</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{totals.codingScore}/{totals.codingTotalMarks}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400">{activity?.scores?.coding?.length || 0} solved</p>
                  </div>
                </div>

                {/* Recent quiz scores */}
                {activity?.scores?.quizzes?.some(q => q.submittedAt) && (
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5">Recent Quizzes</p>
                    <div className="space-y-1">
                      {activity.scores.quizzes
                        .filter(q => q.submittedAt)
                        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                        .slice(0, 3)
                        .map((q, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{q.quizTitle}</p>
                              <p className="text-[9px] text-gray-400">{q.subject}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] sm:text-xs font-bold ${q.percentage >= 80 ? 'text-green-600' : q.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {q.score}/{q.totalMarks}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${q.percentage >= 80 ? 'bg-green-100 text-green-700' : q.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(q.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recent assignment scores */}
                {activity?.scores?.assignments?.some(a => a.submittedAt) && (
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5">Recent Assignments</p>
                    <div className="space-y-1">
                      {activity.scores.assignments
                        .filter(a => a.submittedAt)
                        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                        .slice(0, 3)
                        .map((a, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{a.assignmentTitle}</p>
                              <p className="text-[9px] text-gray-400">{a.subject}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] sm:text-xs font-bold ${a.percentage >= 80 ? 'text-green-600' : a.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {a.score}/{a.totalMarks}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${a.percentage >= 80 ? 'bg-green-100 text-green-700' : a.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(a.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recent coding scores */}
                {activity?.scores?.coding?.length > 0 && (
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5">Coding Problems</p>
                    <div className="space-y-1">
                      {activity.scores.coding
                        .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
                        .slice(0, 3)
                        .map((c, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{c.questionTitle}</p>
                              <p className="text-[9px] text-gray-400">{c.contestName}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] sm:text-xs font-bold ${c.percentage >= 80 ? 'text-green-600' : c.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {c.score}/{c.totalMarks}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${c.percentage >= 80 ? 'bg-green-100 text-green-700' : c.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {Math.round(c.percentage)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">No performance data available</p>
              </div>
            )}
          </div>

          {/* Projects */}
          {student.projects && student.projects.length > 0 && (
            <ProfileSection title={`Projects (${student.projects.length})`} icon={Briefcase}>
              <div className="space-y-2">
                {student.projects.slice(0, 5).map((project, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5 className="font-semibold text-gray-900 text-xs sm:text-sm">{project.title}</h5>
                      <ProfileBadge text={project.verificationStatus?.replace('_', ' ') || 'pending'} variant={getStatusVariant(project.verificationStatus)} />
                    </div>
                    {project.description && <p className="text-gray-600 text-[10px] sm:text-xs line-clamp-2 mb-1.5">{project.description}</p>}
                    {project.techStack && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {project.techStack.map((tech, j) => (
                          <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] sm:text-[10px]">{tech}</span>
                        ))}
                      </div>
                    )}
                    {project.links?.github && (
                      <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[10px] sm:text-xs font-medium">
                        <ExternalLink className="h-3 w-3" /> GitHub
                      </a>
                    )}
                  </div>
                ))}
                {student.projects.length > 5 && <p className="text-center text-gray-500 text-[10px] sm:text-xs">+{student.projects.length - 5} more</p>}
              </div>
            </ProfileSection>
          )}

          {/* Internships */}
          {student.internships && student.internships.length > 0 && (
            <ProfileSection title={`Internships (${student.internships.length})`} icon={Briefcase}>
              <div className="space-y-2">
                {student.internships.map((intern, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="min-w-0">
                        <h5 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{intern.role}</h5>
                        <p className="text-gray-600 text-[10px] sm:text-xs">{intern.company}</p>
                      </div>
                      <ProfileBadge text={intern.verificationStatus?.replace('_', ' ') || 'pending'} variant={getStatusVariant(intern.verificationStatus)} />
                    </div>
                    {intern.location && <p className="text-gray-500 text-[10px] sm:text-xs flex items-center gap-1"><Location className="h-3 w-3" />{intern.location}</p>}
                    {(intern.startDate || intern.endDate) && (
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        {intern.startDate && new Date(intern.startDate).toLocaleDateString()} – {intern.endDate ? new Date(intern.endDate).toLocaleDateString() : 'Present'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Certifications */}
          {student.certifications && student.certifications.length > 0 && (
            <ProfileSection title={`Certifications (${student.certifications.length})`} icon={Award}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {student.certifications.map((cert, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-2.5">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="min-w-0">
                        <h5 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{cert.name}</h5>
                        <p className="text-gray-600 text-[10px] sm:text-xs">{cert.issuer}</p>
                      </div>
                      <ProfileBadge text={cert.verificationStatus?.replace('_', ' ') || 'pending'} variant={getStatusVariant(cert.verificationStatus)} />
                    </div>
                    {cert.credentialId && <p className="text-[10px] text-gray-400">ID: {cert.credentialId}</p>}
                    {cert.dateIssued && <p className="text-[10px] text-gray-400">Issued: {new Date(cert.dateIssued).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

          {/* Placement Details */}
          {student.placementDetails && student.status === 'placed' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                <Star className="h-4 w-4 text-green-600" /> Placement Details
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <InfoRow label="Company" value={student.placementDetails.company} />
                <InfoRow label="Role" value={student.placementDetails.role} />
                {student.placementDetails.package && <InfoRow label="Package" value={`${student.placementDetails.package} LPA`} />}
                {student.placementDetails.location && <InfoRow label="Location" value={student.placementDetails.location} icon={Location} />}
              </div>
            </div>
          )}

          {/* Account Activity */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Account Activity</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center py-2 bg-white rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-500">Joined</p>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="text-center py-2 bg-white rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-500">Last Login</p>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">{student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TPODashboard = () => {
  const [tpoData, setTpoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Assigned Batches state
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [errorBatches, setErrorBatches] = useState('');

  // Placement Training Batches state
  const [placementBatchData, setPlacementBatchData] = useState({});
  const [placementStats, setPlacementStats] = useState({});
  const [loadingPlacementBatches, setLoadingPlacementBatches] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Student Details Batch-wise state
  const [studentBatchData, setStudentBatchData] = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);

  // Mobile view toggle for Student Details: show full table or compact list
  const [mobileStudentTableView, setMobileStudentTableView] = useState(false);

  // Add/Edit/Suspend UI state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [suspendedStudents, setSuspendedStudents] = useState([]);
  const [loadingSuspended, setLoadingSuspended] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null); // student id whose menu is open

  // Trainer Assignment state
  const [showTrainerAssignment, setShowTrainerAssignment] = useState(false);
  const [selectedBatchForAssignment, setSelectedBatchForAssignment] = useState(null);

  // New state for tab navigation and filters
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'batches', label: 'Training Batches', icon: Briefcase },
    { id: 'student-details', label: 'Student Details', icon: Users },
    { id: 'suspended', label: 'Suspended', icon: UserMinus },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'student-activity', label: 'Student Activity', icon: Activity },
    { id: 'statistics', label: 'Statistics', icon: TrendingUp },
    { id: 'placementCalendar', label: 'Placement Calendar', icon: Calendar },
    { id: 'schedule', label: 'Overall Schedule', icon: CalendarDays },
    { id: 'placed-students', label: 'Placed Students', icon: UserCheck },
    { id: 'coordinators', label: 'Coordinators', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: AlertCircle },
    { id: 'feedbacks', label: 'Feedback', icon: MessageSquare },
  ];

  // Desktop 'More' dropdown state (show only first 7 tabs horizontally)
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [visibleTabsCount, setVisibleTabsCount] = useState(7);
  const moreRef = useRef(null);

  useEffect(() => {
    // Use matchMedia for exact breakpoint behavior (768, 1024, 1440)
    const mq1440 = window.matchMedia('(min-width: 1440px)');
    const mq1024 = window.matchMedia('(min-width: 1024px)');
    const mq768 = window.matchMedia('(min-width: 768px)');

    const setCountFromMQ = () => {
      if (mq1440.matches) setVisibleTabsCount(7);
      else if (mq1024.matches) setVisibleTabsCount(5);
      else if (mq768.matches) setVisibleTabsCount(4);
      else setVisibleTabsCount(3);
    };

    setCountFromMQ();
    mq1440.addEventListener?.('change', setCountFromMQ);
    mq1024.addEventListener?.('change', setCountFromMQ);
    mq768.addEventListener?.('change', setCountFromMQ);

    // Fallback for older browsers that only support addListener
    if (typeof mq1440.addEventListener !== 'function' && typeof mq1440.addListener === 'function') {
      mq1440.addListener(setCountFromMQ);
      mq1024.addListener(setCountFromMQ);
      mq768.addListener(setCountFromMQ);
    }

    return () => {
      mq1440.removeEventListener?.('change', setCountFromMQ);
      mq1024.removeEventListener?.('change', setCountFromMQ);
      mq768.removeEventListener?.('change', setCountFromMQ);
      if (typeof mq1440.removeEventListener !== 'function' && typeof mq1440.removeListener === 'function') {
        mq1440.removeListener(setCountFromMQ);
        mq1024.removeListener(setCountFromMQ);
        mq768.removeListener(setCountFromMQ);
      }
    };
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMoreDropdown(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedTechStack, setSelectedTechStack] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Student Details filters
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [selectedCrtFilter, setSelectedCrtFilter] = useState('all');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  // Schedule data state
  const [scheduleData, setScheduleData] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Approval System state
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showApprovalDetail, setShowApprovalDetail] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalToReject, setApprovalToReject] = useState(null);

// 🔔 TPO Notifications
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [categoryUnread, setCategoryUnread] = useState({
  "Placement": 0,
  "Weekly Class Schedule": 0,
  "My Assignments": 0,
  "Available Quizzes": 0,
  "Learning Resources": 0,
});
const [selectedCategory, setSelectedCategory] = useState(null);
const notificationRef = useRef(null);

  const [assigningCoordinatorId, setAssigningCoordinatorId] = useState(null);
  const [assignmentError, setAssignmentError] = useState('');
  const navigate = useNavigate();

  // Add state for tech stack colors
  const [techStackColors, setTechStackColors] = useState({});

  useEffect(() => {
    fetchDashboard();
    fetchAssignedBatches();
    fetchPlacementTrainingBatches();
    fetchStudentDetailsByBatch();
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    if (activeTab === 'suspended') {
      fetchSuspendedStudents();
    }

    if (activeTab === 'coordinators') {
      // Ensure placement batches (with coordinators populated by server) are loaded
      fetchPlacementTrainingBatches();
    }
  }, [activeTab]);

  const fetchSuspendedStudents = async () => {
    setLoadingSuspended(true);
    try {
      const res = await api.get('/api/tpo/suspended-students');
      if (res.data && res.data.success) setSuspendedStudents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch suspended students:', err);
    } finally {
      setLoadingSuspended(false);
    }
  };

  const handleAddStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleCreateStudent = async (payload) => {
    try {
      const res = await api.post(`/api/tpo/batches/${payload.batchId}/students`, payload);
      if (res.data && res.data.success) {
        setShowAddStudentModal(false);
        fetchStudentDetailsByBatch();
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Failed' };
    } catch (err) {
      console.error('Create student failed:', err);
      return { success: false, message: err.message };
    }
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (id, updates) => {
    try {
      const res = await api.put(`/api/tpo/students/${id}`, updates);
      if (res.data && res.data.success) {
        setShowEditStudentModal(false);
        setStudentToEdit(null);
        fetchStudentDetailsByBatch();
        fetchSuspendedStudents();
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Failed' };
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err.message || 'Server error';
      console.error('Update student failed:', err?.response?.data || err.message);
      return { success: false, message: serverMsg };
    }
  };

  const handleSuspendStudent = async (id) => {
    try {
      const res = await api.patch(`/api/tpo/students/${id}/suspend`);
      if (res.data && res.data.success) {
        fetchStudentDetailsByBatch();
        fetchSuspendedStudents();
      }
    } catch (err) {
      console.error('Suspend failed:', err);
    }
  };

  const handleUnsuspendStudent = async (id) => {
    try {
      const res = await api.patch(`/api/tpo/students/${id}/unsuspend`);
      if (res.data && res.data.success) {
        fetchStudentDetailsByBatch();
        fetchSuspendedStudents();
      }
    } catch (err) {
      console.error('Unsuspend failed:', err);
    }
  };

  const handleDeleteStudent = async (id) => {
    try {
      if (!id) return;
      const res = await api.delete(`/api/tpo/students/${id}`);
      if (res.data && res.data.success) {
        fetchStudentDetailsByBatch();
        fetchSuspendedStudents();
        setSelectedStudentForProfile(null);
        alert('Student deleted');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err?.response?.data?.message || 'Failed to delete student');
    }
  };

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const openActionMenu = (id, e) => {
    // compute fixed position so menu is not clipped by scrollable container
    // prefer to show below the button, but flip above if there's not enough space
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 180;
      const approximateMenuHeight = 160; // increase this if menu content grows
      const bottomMargin = 20; // desired gap from the bottom of the viewport

      // place menu below the button by default
      let left = rect.right - menuWidth;
      if (left < 8) left = Math.max(rect.left, 8);
      if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

      let top = rect.bottom + 12; // a slightly bigger gap for comfort

      // If showing below would overflow the viewport bottom (consider margin), flip above
      if (top + approximateMenuHeight > window.innerHeight - bottomMargin) {
        // place above the button
        top = rect.top - approximateMenuHeight - 12;
        // if still off-screen at top, clamp to small margin
        if (top < 8) top = 8;
      }

      setMenuPosition({ top, left });
    }
    setActionMenuOpen(id);
  };

  const closeActionMenu = () => {
    setActionMenuOpen(null);
    setMenuPosition({ top: 0, left: 0 });
  };

  useEffect(() => {
    const handleDocClick = (e) => {
      // Close action menu when clicking outside
      const btn = e.target.closest && e.target.closest('.action-btn');
      const menu = e.target.closest && e.target.closest('.action-menu');
      if (!btn && !menu) closeActionMenu();
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);


  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchScheduleData();
    } else if (activeTab === 'student-details') {
      fetchStudentDetailsByBatch();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  // Add effect to fetch tech stack colors
  useEffect(() => {
    const fetchTechStackColors = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/tech-stacks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          setTechStackColors(response.data.data.colors);
        }
      } catch (error) {
        console.error('Error fetching tech stack colors:', error);
      }
    };
    
    fetchTechStackColors();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/auth/dashboard/tpo');
      if (response.data.success) {
        setTpoData(response.data.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  const handleClickOutside = (event) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get("/api/notifications/tpo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("🔔 TPO notifications fetched:", res.data);

    const notifications = res.data.data || [];
    const currentTpoId = tpoData?.user?._id || tpoData?._id;
    
    // Use backend counts if available
    const unreadByCategory = res.data.unreadByCategory || {
      "Placement": 0,
      "Weekly Class Schedule": 0,
      "My Assignments": 0,
      "Available Quizzes": 0,
      "Learning Resources": 0,
    };
    
    const totalUnread = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);

    console.log("📊 TPO unread counts:", {
      totalUnread,
      unreadByCategory,
      notificationsCount: notifications.length
    });

    setNotifications(notifications);
    setCategoryUnread(unreadByCategory);
    setUnreadCount(totalUnread);
  } catch (err) {
    console.error("Error fetching TPO notifications:", err);
  }
};

// Initial fetch only - polling handled by Header component
useEffect(() => {
  fetchNotifications();
}, []);

const markAsRead = async (id) => {
  try {
    const token = localStorage.getItem("userToken");
    
    // Call backend to mark as read
    await axios.put(`/api/notifications/mark-read/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log(`✅ TPO: Marked notification ${id} as read, refreshing...`);
    
    // Refresh to get updated counts from backend
    await fetchNotifications();
  } catch (err) {
    console.error("Error marking TPO notification as read:", err);
  }
};

// ✅ Mark all notifications as read
const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem("userToken");
    
    console.log("📬 TPO: Marking all notifications as read...");
    
    // Call backend to mark all as read
    await axios.put(`/api/notifications/mark-all-read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("✅ TPO: Marked all as read, refreshing...");
    
    // Refresh to get updated counts from backend
    await fetchNotifications();
    
    console.log("✅ TPO: Successfully updated all notifications");
  } catch (err) {
    console.error("Error marking all TPO notifications as read:", err);
  }
};

  const fetchAssignedBatches = async () => {
    setLoadingBatches(true);
    setErrorBatches('');
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setAssignedBatches(result.data);
      } else {
        setErrorBatches(result.message || 'Failed to fetch assigned batches');
      }
    } catch (err) {
      setErrorBatches('Failed to fetch assigned batches');
    }
    setLoadingBatches(false);
  };

  const fetchStudentDetailsByBatch = async () => {
    setLoadingStudentDetails(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/students-by-batch`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudentBatchData(data.data.batches);
        setStudentStats(data.data.stats);
      } else {
        console.error('Failed to fetch student details:', data.message);
      }
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    } finally {
      setLoadingStudentDetails(false);
    }
  };

  const fetchPlacementTrainingBatches = async () => {
    setLoadingPlacementBatches(true);
    try {
      const response = await api.get('/api/tpo/placement-training-batches');
      const data = response.data;
      if (data.success) {
        // Defensive cleanup: remove any batches that have zero students (should be filtered server-side but keep client-safe)
        const sanitizeOrganized = (organized) => {
          const out = {};
          Object.keys(organized || {}).forEach(year => {
            const colleges = organized[year];
            const collegeOut = {};
            Object.keys(colleges).forEach(college => {
              const techMap = colleges[college];
              const techOut = {};
              Object.keys(techMap).forEach(tech => {
                const group = techMap[tech];
                const filteredBatches = (group.batches || []).filter(b => (b.studentCount || (b.students && b.students.length)) && (b.studentCount || b.students.length) > 0);
                if (filteredBatches.length > 0) {
                  techOut[tech] = { ...group, batches: filteredBatches, totalBatches: filteredBatches.length, totalStudents: filteredBatches.reduce((acc, b) => acc + (b.studentCount || (b.students ? b.students.length : 0)), 0) };
                }
              });
              if (Object.keys(techOut).length > 0) {
                collegeOut[college] = techOut;
              }
            });
            if (Object.keys(collegeOut).length > 0) {
              out[year] = collegeOut;
            }
          });
          return out;
        };

        const cleaned = sanitizeOrganized(data.data.organized);
        // Debug log to help track unexpected empty batches
        console.log('📦 Placement batches fetched (cleaned):', { originalYears: Object.keys(data.data.organized || {}).length, cleanedYears: Object.keys(cleaned).length });

        setPlacementBatchData(cleaned);
        setPlacementStats(data.data.stats);
        const years = Object.keys(cleaned).sort().reverse();
        if (years.length > 0) setSelectedYear(years[0]);
      }
    } catch (err) {
      console.error('Failed to fetch placement training batches:', err);
    } finally {
      setLoadingPlacementBatches(false);
    }
  };

  const fetchScheduleData = async () => {
    setLoadingSchedule(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/schedule-timetable`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setScheduleData(data.data);
      } else {
        console.error('Failed to fetch schedule data:', data.message);
      }
    } catch (err) {
      console.error('Failed to fetch schedule data:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Handle tab clicks so we can trigger immediate loading skeletons for heavy tabs
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    // If user opens Schedule tab, force load so skeleton appears immediately
    if (tabId === 'schedule') {
      setLoadingSchedule(true);
      fetchScheduleData();
    }
  };

  const handleAssignCoordinator = async (studentId) => {
    if (!selectedBatch?._id) {
      setError('No batch selected');
      return;
    }

    setAssigningCoordinatorId(studentId);
    setAssignmentError('');
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/assign-coordinator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          batchId: selectedBatch._id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign coordinator');
      }

      setMessage('Student assigned as coordinator successfully');

      // Refresh placement batches and update selectedBatch in-place so modal stays open
      try {
        const resp = await api.get('/api/tpo/placement-training-batches');
        if (resp.data && resp.data.success) {
          // Find batch by id inside organized structure
          const organized = resp.data.data.organized || {};
          let updated = null;
          Object.keys(organized).forEach(year => {
            Object.keys(organized[year]).forEach(college => {
              Object.keys(organized[year][college]).forEach(tech => {
                organized[year][college][tech].batches.forEach(b => {
                  if (String(b._id) === String(batchId)) updated = b;
                });
              });
            });
          });
          if (updated) {
            // Populate response with coordinator's student object if present (coordinators populated on server)
            setSelectedBatch(updated);
          } else {
            // Fallback: refresh list only
            await fetchPlacementTrainingBatches();
            setSelectedBatch(null);
          }
        } else {
          await fetchPlacementTrainingBatches();
          setSelectedBatch(null);
        }
      } catch (err) {
        console.error('Failed to fetch updated batch after assignment:', err);
        await fetchPlacementTrainingBatches();
        setSelectedBatch(null);
      }

    } catch (err) {
      console.error('Coordinator assignment error:', err);
      setAssignmentError(err.message || 'Failed to assign coordinator');
      setError(err.message || 'Failed to assign coordinator');
    } finally {
      setAssigningCoordinatorId(null);
    }
  };

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    try {
      setLoadingApprovals(true);
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/pending-approvals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('❌ Fetch approvals failed:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Fetched approvals:', data);
      
      if (data.success) {
        setPendingApprovals(data.data.requests || []);
      } else {
        setError(data.message || 'Failed to fetch approvals');
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setError('Failed to fetch pending approvals');
    } finally {
      setLoadingApprovals(false);
    }
  };

  // Handle approval
  const handleApproveRequest = useCallback(async (studentId, approvalId) => {
    console.log('🟢 Approve handler called:', { studentId, approvalId });
    
    if (!studentId || !approvalId) {
      setError('Missing student or approval identifier');
      console.error('❌ Missing IDs:', { studentId, approvalId });
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      console.log('📤 Sending approval request...');

      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/approve-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          approvalId,
          action: 'approve'
        })
      });

      const data = await response.json();
      console.log('📥 Approval response:', { ok: response.ok, status: response.status, data });

      if (response.ok && data.success) {
        setMessage(data.message || 'Request approved successfully');
        console.log('✅ Approval successful, refreshing data...');
        // Refresh both approvals and batch data
        await Promise.all([
          fetchPendingApprovals(),
          fetchPlacementTrainingBatches(),
          fetchStudentDetailsByBatch()
        ]);
        setShowApprovalDetail(false);
        setSelectedApproval(null);
      } else {
        setError(data.message || 'Failed to approve request');
        console.error('❌ Approval failed:', data);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to process approval');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle rejection
  const handleRejectRequest = async (providedReason) => {
    const reasonToUse = typeof providedReason === 'string' ? providedReason : rejectionReason;

    console.log('🔴 handleRejectRequest called, reason:', reasonToUse, 'approvalToReject:', approvalToReject);

    if (!approvalToReject || !reasonToUse || !reasonToUse.trim()) {
      setError('Please provide a reason for rejection');
      console.error('❌ Rejection aborted - missing data', { approvalToReject, reasonToUse });
      return false;
    }

    try {
      setLoading(true);
      console.log('📤 Sending rejection request...');
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tpo/reject-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: approvalToReject.student.id,
          approvalId: approvalToReject.approvalId,
          rejectionReason: reasonToUse
        })
      });

      const data = await response.json();
      console.log('📥 Rejection response:', { ok: response.ok, status: response.status, data });

      if (response.ok && data.success) {
        setMessage('Request rejected successfully');
        console.log('✅ Rejection successful, refreshing data...');
        await fetchPendingApprovals(); // Refresh the approvals list
        closeRejectModal();
        return true;
      } else {
        setError(data.message || 'Failed to reject request');
        console.error('❌ Rejection failed:', data);
        return false;
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to process rejection');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = useCallback((approval) => {
    console.log('🔴 Opening reject modal for:', approval);
    // Close approval detail panel to avoid interaction issues
    setShowApprovalDetail(false);
    setApprovalToReject(approval);
    setShowRejectModal(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    setShowRejectModal(false);
    setRejectionReason('');
    setApprovalToReject(null);
  }, []);


  const getFilteredStudents = () => {
    const allStudents = [];

    studentBatchData.forEach(batch => {
      if (selectedBatchFilter !== 'all' && batch.batchNumber !== selectedBatchFilter) return;

      batch.students.forEach(student => {
        // defer CRT filter until we compute placementBatchName (we need to match PT_/NT_ prefixes)
        if (selectedCollegeFilter !== 'all' && student.college !== selectedCollegeFilter) return;
        if (selectedBranchFilter !== 'all' && student.branch !== selectedBranchFilter) return;

        if (studentSearchTerm && !student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) &&
            !student.rollNo.toLowerCase().includes(studentSearchTerm.toLowerCase()) &&
            !student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())) return;

        // Prefer student-level placement identifiers when available (these are real data coming from API):
        // 1) student.placementTrainingBatchId (populated object -> use name or construct)
        // 2) student.currentBatch?.name
        // 3) student.batchName
        // 4) student.crtBatchName
        // 5) batch.name
        // If none exist, fallback to constructed label from batchNumber, first college and techStack.
        let candidateName = '';

        const ptb = student?.placementTrainingBatchId;
        if (ptb && typeof ptb === 'object') {
          // Prefer explicit name when available, else construct from batch fields
          candidateName = ptb.name || `${ptb.batchNumber || ''}_${ptb.college || ptb.colleges?.[0] || ''}_${ptb.techStack || ''}`;
        }

        candidateName = candidateName || student?.currentBatch?.name || student?.batchName || student?.crtBatchName || batch.name || `${batch.batchNumber}_${(batch.colleges && batch.colleges[0]) || ''}_${batch.techStack || ''}`;

        let placementBatchName = String(candidateName || '').trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '').replace(/^_+|_+$/g, '');

        // Only keep PT_ or NT_ prefixed placement names; otherwise mark as not updated
        if (!(placementBatchName.startsWith('PT_') || placementBatchName.startsWith('NT_'))) {
          placementBatchName = '';
        }

        // Apply CRT filter selection based on placement name prefixes
        if (selectedCrtFilter !== 'all') {
          if (selectedCrtFilter === 'PT' && !placementBatchName.startsWith('PT_')) return;
          if (selectedCrtFilter === 'NT' && !placementBatchName.startsWith('NT_')) return;
          if (selectedCrtFilter === 'not-updated' && placementBatchName) return;
        }

        allStudents.push({ ...student, placementBatchName });
      });
    });

    return allStudents;
  };

  // StudentProfileModal defined outside component (above) to avoid re-creation on every render

  const handleTrainerAssignment = (batchId) => {
    setSelectedBatchForAssignment(batchId);
    setShowTrainerAssignment(true);
  };

  const handleAssignmentUpdate = () => {
    fetchPlacementTrainingBatches();
    fetchScheduleData();
    fetchStudentDetailsByBatch();
    setShowTrainerAssignment(false);
    setSelectedBatchForAssignment(null);
  };

  // Replace hardcoded getTechStackColor function
  const getTechStackColor = (techStack) => {
    return techStackColors[techStack] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Replace hardcoded getTechStackBadgeColor function
  const getTechStackBadgeColor = (techStack) => {
    const colorClass = techStackColors[techStack] || 'bg-gray-500';
    return colorClass.replace('text-', 'bg-').split(' ')[0];
  };

  const getTrainerAssignmentStatus = (batch) => {
    const trainerCount = batch.assignedTrainers ? batch.assignedTrainers.length : 0;
    if (trainerCount === 0) {
      return {
        status: 'No Trainers',
        color: 'bg-red-100 text-red-800',
        icon: '❌'
      };
    } else if (trainerCount < 3) {
      return {
        status: `${trainerCount} Trainer${trainerCount > 1 ? 's' : ''}`,
        color: 'bg-blue-100 text-blue-800',
        icon: '⚠️'
      };
    } else {
      return {
        status: `${trainerCount} Trainers`,
        color: 'bg-blue-100 text-blue-800',
        icon: '✅'
      };
    }
  };

  const years = Object.keys(placementBatchData).sort().reverse();
  const colleges = selectedYear !== 'all' && placementBatchData[selectedYear]
    ? Object.keys(placementBatchData[selectedYear])
    : [];
  const techStacks = selectedYear !== 'all' && selectedCollege !== 'all' && placementBatchData[selectedYear]?.[selectedCollege]
    ? Object.keys(placementBatchData[selectedYear][selectedCollege])
    : [];

  const getFilteredBatches = () => {
    const allBatches = [];

    Object.keys(placementBatchData).forEach(year => {
      if (selectedYear !== 'all' && year !== selectedYear) return;

      Object.keys(placementBatchData[year]).forEach(college => {
        if (selectedCollege !== 'all' && college !== selectedCollege) return;

        Object.keys(placementBatchData[year][college]).forEach(techStack => {
          if (selectedTechStack !== 'all' && techStack !== selectedTechStack) return;

          placementBatchData[year][college][techStack].batches.forEach(batch => {
            allBatches.push({
              ...batch,
              year,
              college,
              techStack
            });
          });
        });
      });
    });

    if (searchTerm) {
      return allBatches.filter(batch =>
        batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.techStack.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allBatches;
  };

  const filteredBatches = getFilteredBatches();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('userToken');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      navigate('/tpo-login');
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }


  // Approval Detail Modal Component - Now a dropdown panel
  const ApprovalDetailModal = ({ approval, onClose, onApprove, onReject }) => {
    if (!approval || !['crt_status_change', 'batch_change', 'profile_change'].includes(approval.requestType)) {
      return null;
    }

    // Lock body scroll when modal is open
    useEffect(() => {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }, []);

    // Create a stable close handler
    const handleClose = useCallback((e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    }, [onClose]);

const getRequestTypeLabel = (type) => {
  const labels = {
    'crt_status_change': 'CRT Status Change',
    'batch_change': 'Batch Change',
    'profile_change': 'Profile Update'
  };
  return labels[type] || type;
};

const getRequestTypeColor = (type) => {
  const colors = {
    'crt_status_change': 'from-sky-500 to-sky-600',
    'batch_change': 'from-blue-500 to-blue-600',
    'profile_change': 'from-blue-500 to-blue-600'
  };
  return colors[type] || 'from-gray-500 to-gray-600';
};

    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose(e);
          }
        }}
        style={{ overflow: 'hidden' }}
      >
        <div 
          className="relative w-full max-w-3xl bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 flex flex-col m-4"
          style={{ maxHeight: 'calc(100vh - 2rem)', height: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed at top */}
          <div className={`bg-gradient-to-r ${getRequestTypeColor(approval.requestType)} px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sm:rounded-t-xl flex justify-between items-center flex-shrink-0 relative`}>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="truncate">Approval Request Details</span>
              </h3>
              <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1">{getRequestTypeLabel(approval.requestType)}</p>
            </div>
            {/* Close Button */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="ml-3 p-2 hover:bg-white/20 rounded-full transition-all flex-shrink-0 cursor-pointer relative z-50"
              role="button"
              tabIndex={0}
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div 
            className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 overflow-y-auto flex-1"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Student Information */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-sky-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-sky-100">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {approval.student.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900">Student Information</h4>
                  <p className="text-xs text-gray-500">Personal & Academic Details</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Full Name</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{approval.student.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Roll Number</p>
                    <p className="font-bold text-gray-900 font-mono text-sm sm:text-base">{approval.student.rollNo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">College</p>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{approval.student.college}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Code2 className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Branch</p>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm">{approval.student.branch}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Year of Passing</p>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm">{approval.student.yearOfPassing}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Current Batch</p>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                        {approval.student.currentBatch ? approval.student.currentBatch.batchNumber : 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-sky-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-sky-100">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900">Requested Changes</h4>
                  <p className="text-xs text-gray-500">Review the modification request</p>
                </div>
              </div>

              {approval.requestType === 'crt_status_change' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">CRT Status Change</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 w-full">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Current Status</p>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-gray-300 shadow-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-bold text-gray-800">
                            {approval.requestedChanges.originalCrtInterested ? 'CRT' : 'Non-CRT'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-center items-center sm:flex-shrink-0 sm:self-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <ChevronRight className="h-5 w-5 text-gray-800 rotate-90 sm:rotate-0" />
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full">
                        <p className="text-xs text-gray-600 mb-2 font-medium">New Status</p>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-gray-300 shadow-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-bold text-gray-800">
                            {approval.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {approval.requestedChanges.crtBatchChoice && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-900 font-medium mb-2">Requested CRT Batch</p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-bold text-gray-800">{approval.requestedChanges.crtBatchChoice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {approval.requestType === 'batch_change' && (
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Code2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Tech Stack Change</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 w-full">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Current Tech Stack</p>
                      <div className="p-3 bg-white rounded-lg border-2 border-gray-300 min-h-[60px] flex items-center shadow-sm">
                        <div className="flex flex-wrap gap-2">
                          {approval.requestedChanges.originalTechStack?.map((tech, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold border border-gray-300">
                              {tech}
                            </span>
                          )) || <span className="text-gray-400 text-xs">None</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center sm:flex-shrink-0 sm:self-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-sky-100 to-blue-100 rounded-full flex items-center justify-center">
                        <ChevronRight className="h-5 w-5 text-sky-600 rotate-90 sm:rotate-0" />
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                      <p className="text-xs text-gray-500 mb-2 font-medium">New Tech Stack</p>
                      <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border-2 border-sky-300 min-h-[60px] flex items-center shadow-sm">
                        <div className="flex flex-wrap gap-2">
                          {approval.requestedChanges.techStack?.map((tech, idx) => (
                            <span key={idx} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-bold border border-sky-400 shadow-sm">
                              {tech}
                            </span>
                          )) || <span className="text-gray-400 text-xs">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {approval.requestType === 'profile_change' && (
              <div className="bg-white rounded-xl p-4 sm:p-5 border border-sky-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-sky-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                    <Edit className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">Profile Changes</h4>
                    <p className="text-xs text-gray-500">Field modifications requested</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(approval.requestedChanges.changedFields || {}).map(([field, newValue]) => {
                    const oldValue = approval.requestedChanges.originalFields?.[field];
                    return (
                      <div key={field} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
                            <svg className="h-3 w-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex-1 w-full">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Current</p>
                            <div className="p-3 bg-white rounded-lg border-2 border-gray-300 shadow-sm">
                              <p className="text-xs text-gray-700 break-words font-mono">
                                {typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue || 'Not set')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-center items-center sm:flex-shrink-0 sm:self-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-sky-100 to-blue-100 rounded-full flex items-center justify-center">
                              <ChevronRight className="h-5 w-5 text-sky-600 rotate-90 sm:rotate-0" />
                            </div>
                          </div>
                          
                          <div className="flex-1 w-full">
                            <p className="text-xs text-gray-500 mb-2 font-medium">New</p>
                            <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border-2 border-sky-300 shadow-sm">
                              <p className="text-xs text-sky-800 break-words font-mono font-semibold">
                                {typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Request Metadata */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                <span className="text-gray-600 font-medium">Requested At</span>
                <span className="font-semibold text-gray-900">
                  {new Date(approval.requestedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-t from-white via-white to-transparent border-t-2 border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 shadow-lg mt-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof onApprove === 'function') {
                    onApprove(approval.student.id, approval.approvalId);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Approve Request</span>
                <span className="sm:hidden">Approve</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof onReject === 'function') {
                    onReject(approval);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Reject Request</span>
                <span className="sm:hidden">Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Reject Modal Component (uses local state to avoid parent re-renders interfering with input)
  const RejectModal = ({ approval, onClose, onConfirm }) => {
    const [localReason, setLocalReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
      setLocalReason('');
      setLocalError('');
      setSubmitting(false);
      // Autofocus textarea after modal opens and move caret to end
      setTimeout(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          const len = el.value?.length || 0;
          try { el.setSelectionRange(len, len); } catch (e) { /* ignore */ }
        }
      }, 50);

      // Debug: log modal state on open
      console.log('RejectModal opened for approval:', approval?.approvalId, 'initial reason prop:', approval?.rejectionReason);
    }, [approval]);

    if (!approval) return null;

    const handleConfirm = async () => {
      console.log('RejectModal: handleConfirm invoked (no event), localReason=', localReason);
      setLocalError('');
      if (!localReason || !localReason.trim()) {
        setLocalError('Please provide a reason for rejection');
        console.warn('RejectModal: no reason provided');
        // focus textarea so user can immediately type
        try { textareaRef.current?.focus(); } catch (e) { /* ignore */ }
        return;
      }
      if (typeof onConfirm !== 'function') {
        setLocalError('No handler configured');
        console.error('RejectModal: onConfirm not a function');
        return;
      }

      try {
        setSubmitting(true);
        console.log('RejectModal: calling onConfirm...');
        const success = await onConfirm(localReason);
        console.log('RejectModal: onConfirm result:', success);
        if (success) {
          // let parent close modal (it already does), but ensure we also call onClose for instant UI response
          try { onClose?.(); } catch (e) { /* ignore */ }
        } else {
          setLocalError('Failed to reject request. See error message on the page.');
        }
      } catch (err) {
        console.error('RejectModal confirm error:', err);
        setLocalError('An error occurred while rejecting.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-lg">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Reject Request
            </h3>
          </div>

          <div className="p-4 sm:p-6">
            <p className="text-gray-700 mb-4">
              You are about to reject the request from <strong>{approval.student.name}</strong>.
              Please provide a reason for rejection:
            </p>

            <textarea
              ref={textareaRef}
              value={localReason}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { console.log('RejectModal textarea change:', e.target.value); setLocalReason(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { console.log('RejectModal: Ctrl+Enter pressed, submitting'); handleConfirm(); } }}
              placeholder="Enter rejection reason... (Ctrl+Enter to submit)"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />

            {localError && <p className="text-sm text-red-600 mt-2">{localError}</p>}

            {/* Debug panel (temporary) */}
            <div className="mt-3 text-xs text-gray-500">
              <div>Debug: localReason length = {localReason.length} | trimmed = {String(Boolean(localReason && localReason.trim()))}</div>
              <div>Debug: submitting = {String(submitting)}</div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                type="button"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onMouseDown={() => console.log('RejectModal: Confirm mouseDown')}
                onClick={() => { console.log('RejectModal: Confirm button clicked'); handleConfirm(); }}
                // Allow clicks even with empty reason so we can show inline validation and focus
                style={{ pointerEvents: submitting ? 'none' : 'auto' }}
                className={`flex-1 ${submitting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-lg transition-colors font-medium`}
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="TPO Dashboard"
        subtitle="Training Placement Officer"
        icon={Users}
        userData={tpoData?.user || tpoData}
        profileRoute="/tpo-profile"
        changePasswordRoute="/tpo-change-password"
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        fetchNotifications={fetchNotifications}
        categoryUnread={categoryUnread}
        unreadCount={unreadCount}
        userType="tpo"
        userId={tpoData?.user?._id || tpoData?._id}
        onIconClick={() => {
          if (window.location.pathname !== '/tpo-dashboard') {
            navigate('/tpo-dashboard');
          }
        }}
      />

      <div className="max-w-7xl mx-auto pt-12 sm:pt-20 pb-24 sm:pb-8">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-blue-700">
                  Training Placement Officer
                </h1>
                <p className="text-gray-600 mt-1">Welcome, {tpoData?.user?.name}</p>
              </div>
            </div>
          </div>
          <div className="px-6 pb-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-600 p-2 rounded-lg items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Last Login</p>
                    <p className="text-sm sm:text-base font-bold text-blue-900">{tpoData?.lastLogin ? new Date(tpoData.lastLogin).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-600 p-2 rounded-lg items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Assigned Trainers</p>
                    <p className="text-sm sm:text-base font-bold text-blue-900">{tpoData?.assignedTrainers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-600 p-2 rounded-lg items-center justify-center">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Companies</p>
                    <p className="text-sm sm:text-base font-bold text-blue-900">{tpoData?.managedCompanies || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-600 p-2 rounded-lg items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Total Batches</p>
                    <p className="text-sm sm:text-base font-bold text-blue-900">{tpoData?.assignedBatches || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6">
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav className="hidden sm:flex items-center space-x-2">
                  {tabs.slice(0, visibleTabsCount).map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'border-b-2 border-blue-700 text-blue-700'
                            : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}

                  {tabs.length > visibleTabsCount && (
                    <div className="relative" ref={moreRef}>
                      <button
                        onClick={() => setShowMoreDropdown((s) => !s)}
                        aria-label="More"
                        className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border-transparent rounded"
                      >
                        <span>More</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${showMoreDropdown ? 'block' : 'hidden'}`}>
                        <ul className="divide-y divide-gray-100">
                          {tabs.slice(visibleTabsCount).map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <li key={tab.id}>
                                <button
                                  onClick={() => { handleTabClick(tab.id); setShowMoreDropdown(false); }}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{tab.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </nav>
              </div>
            </div>

            {/* Mobile bottom nav (exact admin BottomNav) */}
            <div className="sm:hidden">
              <BottomNav tabs={tabs} active={activeTab} onChange={handleTabClick} />
            </div>
          </div>


        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Quick Actions */}
              {/* <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Users className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Manage Students</p>
                  </button>
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Building className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Company Relations</p>
                  </button>
                  <button
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    onClick={() => setActiveTab("placement-calendar")}
                  >
                    <Calendar className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Placement Schedule</p>
                  </button>
                </div>
              </div> */}

              {/* Recent Assigned Batches */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Recently Assigned Batches</h3>
                {loadingBatches ? (
                  <LoadingSkeleton />
                ) : errorBatches ? (
                  <div className="text-red-500 mb-4">{errorBatches}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedBatches.slice(0, 4).map(batch => (
                      <div key={batch.id} className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow p-4 sm:p-5 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-sm sm:text-base mb-2 text-gray-900">Batch {batch.batchNumber}</h4>
                        <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                          <div><span className="font-medium text-gray-700">College:</span> {batch.colleges?.join(', ') || '-'}</div>
                          <div><span className="font-medium text-gray-700">Students:</span> {batch.students?.length || 0}</div>
                          <div><span className="font-medium text-gray-700">Start:</span> {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loadingBatches && assignedBatches.length === 0 && (
                  <div className="text-gray-500 mt-4">No batches assigned yet.</div>
                )}
              </div>
            </div>
          )}

          {/* Training Batches Tab */}
          {activeTab === 'batches' && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-blue-700" />
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSelectedCollege('all');
                        setSelectedTechStack('all');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Years</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">College</label>
                    <select
                      value={selectedCollege}
                      onChange={(e) => {
                        setSelectedCollege(e.target.value);
                        setSelectedTechStack('all');
                      }}
                      disabled={selectedYear === 'all'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                    >
                      <option value="all">All Colleges</option>
                      {colleges.map(college => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
                    <select
                      value={selectedTechStack}
                      onChange={(e) => setSelectedTechStack(e.target.value)}
                      disabled={selectedCollege === 'all'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                    >
                      <option value="all">All Tech Stacks</option>
                      {techStacks.map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search batches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Batches Grid */}
              {loadingPlacementBatches ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                      <div className="h-1.5 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                        <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBatches.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
                      <GraduationCap className="h-14 w-14 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No batches found</p>
                    </div>
                  ) : (
                    filteredBatches.map(batch => {
                      const assignmentStatus = getTrainerAssignmentStatus(batch);
                      return (
                        <div key={batch._id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className={`h-1.5 ${getTechStackBadgeColor(batch.techStack)}`}></div>
                          <div className="p-3 sm:p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-sm sm:text-base font-bold text-gray-900">{batch.batchNumber}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{batch.college}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTechStackColor(batch.techStack)} border`}>
                                {batch.techStack}
                              </span>
                            </div>

                            <div className="space-y-2 mb-3 text-gray-700 text-[11px] sm:text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span><strong>{batch.studentCount}</strong> Students</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span>Year {batch.year}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4" />
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${assignmentStatus.color} border`}>
                                  {assignmentStatus.icon} {assignmentStatus.status}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedBatch(batch)}
                                className="flex-1 text-white bg-blue-600 hover:bg-blue-700 font-medium py-1.5 px-2 sm:py-2 sm:px-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 shadow-sm text-xs sm:text-sm"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">View</span>
                                <span className="sm:hidden">View</span>
                              </button>
                              <button
                                onClick={() => handleTrainerAssignment(batch._id)}
                                className="flex-1 text-blue-700 bg-blue-100 hover:bg-blue-200 font-medium py-1.5 px-2 sm:py-2 sm:px-3 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm"
                              >
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">Assign</span>
                                <span className="sm:hidden">Assign</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Student Details Tab */}
          {activeTab === 'student-details' && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-blue-700" />
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">Student Filters</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Mobile-only toggle to switch between compact list and table */}
                    <button
                      type="button"
                      className="sm:hidden px-2 py-1 text-xs border rounded bg-white text-gray-700"
                      onClick={() => setMobileStudentTableView(v => !v)}
                      aria-pressed={mobileStudentTableView}
                      aria-label="Toggle student view"
                    >
                      {mobileStudentTableView ? 'List' : 'Table'}
                    </button>

                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm hover:bg-blue-700 flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Student</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <select
                    value={selectedBatchFilter}
                    onChange={(e) => setSelectedBatchFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Batches</option>
                    {studentBatchData.map(batch => (
                      <option key={batch._id} value={batch.batchNumber}>{batch.batchNumber}</option>
                    ))}
                  </select>
                  <select
                    value={selectedCrtFilter}
                    onChange={(e) => setSelectedCrtFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="PT">CRT</option>
                    <option value="NT">Non-CRT</option>
                    <option value="not-updated">Not updated</option>
                  </select>
                  <select
                    value={selectedCollegeFilter}
                    onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Colleges</option>
                    {studentStats.collegeDistribution && Object.keys(studentStats.collegeDistribution).map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingStudentDetails ? (
                <LoadingSkeleton />
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  {/* Desktop / Tablet - compact table */}
                  <div className={`${mobileStudentTableView ? 'block' : 'hidden'} sm:block overflow-x-auto`}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-[11px] font-bold text-gray-700 uppercase tracking-wide">Student</th>
                          <th className="px-2 py-2 text-left text-[11px] font-medium text-gray-600 uppercase">Roll</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-600 hidden sm:table-cell">College</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-600">Placement</th>
                          <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-600">Tech</th>
                          <th className="px-2 py-2 text-center text-[11px] font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {getFilteredStudents().map((student, idx) => (
                          <tr key={student._id} className={`group hover:bg-blue-50 hover:shadow transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                                  {student.profileImageUrl ? (
                                    <img src={student.profileImageUrl} alt={student.name} className="w-full h-full object-cover" />
                                  ) : (
                                    student.name.charAt(0)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm truncate">{student.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{student.college} • {student.branch}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{student.rollNo}</span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">{student.college}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">{student.placementBatchName ? student.placementBatchName : 'Not updated'}</span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {(student.techStack || []).slice(0,2).map(ts => (
                                  <span key={ts} className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">{ts}</span>
                                ))}
                                {(student.techStack && student.techStack.length > 2) && (
                                  <span className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded">+{student.techStack.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-2 justify-center">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedStudentForProfile(student); }} className="p-1 text-gray-600 hover:text-gray-800 rounded" title="View"><Eye className="h-4 w-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleEditStudent(student); }} className="p-1 text-gray-600 hover:text-gray-800 rounded" title="Edit"><Edit className="h-4 w-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this student permanently?')) handleDeleteStudent(student._id); }} className="p-1 text-red-500 hover:text-red-600 rounded" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleSuspendStudent(student._id); }} className="p-1 text-yellow-600 hover:text-yellow-700 rounded" title="Suspend"><UserMinus className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile - compact stacked rows to avoid horizontal scroll */}
                  <div className={`sm:hidden divide-y divide-gray-200 ${mobileStudentTableView ? 'hidden' : ''}`}>
                    {getFilteredStudents().map((student, idx) => (
                      <div key={student._id} className={`p-2 flex items-center justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-[11px] truncate">{student.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">{student.college} • {student.branch}</div>
                            <div className="text-[9px] text-gray-500 truncate mt-0.5">{student.placementBatchName ? student.placementBatchName : 'Not updated'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0 relative">
                          <div className="text-[10px] text-gray-700 font-mono text-right">{student.rollNo}</div>

                          <button
                            onClick={(e) => { e.stopPropagation(); openActionMenu(student._id, e); }}
                            className="ml-1 p-1 text-gray-500 hover:text-gray-700 rounded action-btn"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {actionMenuOpen === student._id && (
                            <div
                              className="action-menu z-50 bg-white rounded-md shadow-lg border border-gray-200"
                              style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, width: 180 }}
                            >
                              <ul className="py-1 text-sm">
                                <li>
                                  <button onClick={() => { closeActionMenu(); setSelectedStudentForProfile(student); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">View</button>
                                </li>
                                <li>
                                  <button onClick={() => { closeActionMenu(); handleEditStudent(student); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Edit</button>
                                </li>
                                <li>
                                  <button onClick={() => { closeActionMenu(); handleSuspendStudent(student._id); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-yellow-700">Suspend</button>
                                </li>
                                <li>
                                  <button onClick={() => { closeActionMenu(); if(window.confirm('Delete this student permanently?')) handleDeleteStudent(student._id); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600">Delete</button>
                                </li>
                              </ul>
                            </div>
                          )} 
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suspended Students Tab */}
          {activeTab === 'suspended' && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold">Suspended Students</h2>
                    {/* <p className="text-sm text-gray-500">Students suspended by the TPO (cannot login)</p> */}
                  </div>
                  {/* <div>
                    <button onClick={fetchSuspendedStudents} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">Refresh</button>
                  </div> */}
                </div>

                {loadingSuspended ? (
                  <LoadingSkeleton />
                ) : suspendedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No suspended students</p>
                  </div>
                ) : (
                  <div>
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Student</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Roll</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">College</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Batch</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                          {suspendedStudents.map((s, idx) => (
                            <tr key={s._id} className={`${idx%2===0?'bg-white':'bg-gray-50'}`}>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">{s.name?.charAt(0)}</div>
                                  <div className="truncate text-sm text-gray-900">{s.name}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm font-mono">{s.rollNo}</td>
                              <td className="px-3 py-2 text-sm">{s.college}</td>
                              <td className="px-3 py-2 text-sm text-gray-800 truncate">{s.placementBatchName || s.crtBatchName || 'N/A'}</td>
                              <td className="px-3 py-2">
                                <button onClick={() => handleUnsuspendStudent(s._id)} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Unsuspend</button>
                                <button onClick={() => setSelectedStudentForProfile(s)} className="ml-2 px-2 py-1 text-sm text-blue-600">View</button>
                                <button onClick={() => { if(window.confirm('Delete this student permanently?')) handleDeleteStudent(s._id); }} className="ml-2 px-2 py-1 text-sm text-red-600">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile list - compact like Student Details */}
                    <div className="sm:hidden divide-y divide-gray-200">
                      {suspendedStudents.map((s, idx) => (
                        <div key={s._id} className={`p-2 flex items-center justify-between ${idx%2===0?'bg-white':'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">{s.name?.charAt(0)}</div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 text-[11px] truncate">{s.name}</div>
                              <div className="text-[10px] text-gray-500 truncate">{s.college} • {s.placementBatchName || s.crtBatchName || 'N/A'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-3 flex-shrink-0 relative">
                            <div className="text-[10px] text-gray-700 font-mono text-right">{s.rollNo}</div>

                            <button
                              onClick={(e) => { e.stopPropagation(); openActionMenu(s._id, e); }}
                              className="ml-1 p-1 text-gray-500 hover:text-gray-700 rounded action-btn"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {actionMenuOpen === s._id && (
                              <div
                                className="action-menu z-50 bg-white rounded-md shadow-lg border border-gray-200"
                                style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, width: 180 }}
                              >
                                <ul className="py-1 text-sm">
                                  <li>
                                    <button onClick={() => { closeActionMenu(); handleUnsuspendStudent(s._id); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-green-700">Unsuspend</button>
                                  </li>
                                  <li>
                                    <button onClick={() => { closeActionMenu(); setSelectedStudentForProfile(s); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">View</button>
                                  </li>
                                  <li>
                                    <button onClick={() => { closeActionMenu(); if(window.confirm('Delete this student permanently?')) handleDeleteStudent(s._id); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600">Delete</button>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-5">Detailed Statistics</h2>
                {Object.keys(placementBatchData).sort().reverse().map(year => (
                  <div key={year} className="mb-5">
                    <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Academic Year {year}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.keys(placementBatchData[year]).map(college => {
                        const totalBatches = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0);
                        const totalStudents = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0);

                        return (
                          <div key={college} className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">{college}</h4>
                            <p className="text-sm text-gray-600 mb-3">{totalBatches} batches • {totalStudents} students</p>
                            {Object.keys(placementBatchData[year][college]).map(techStack => (
                              <div key={techStack} className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">{techStack}</span>
                                <span className="text-gray-700 font-medium">{placementBatchData[year][college][techStack].totalBatches} batches</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'attendance' && <TPOAttendanceView />}
{activeTab === 'student-activity' && <StudentActivity />}


          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            loadingSchedule ? <LoadingSkeleton /> : (
              <ScheduleTimetable
                scheduleData={scheduleData}
                loading={loadingSchedule}
                onRefresh={fetchScheduleData}
              />
            )
          )}
          {/* {activeTab === "placement-calendar" && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <PlacementCalendar />
            </div>
          )} */}

                  {activeTab === 'placementCalendar' && (
          <div>
            {/* <h2 className="text-lg font-semibold mb-4">Placement Schedule</h2> */}
            <PlacementCalendar />
          </div>
        )}
        {activeTab === 'placed-students' && (
          <div className="w-full">
            <PlacedStudentsTab />
          </div>
        )}

        {/* Coordinators Tab */}
        {activeTab === 'coordinators' && (
          <div className="space-y-5">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Batch Coordinators</h2>
                  <p className="text-sm text-gray-500">View coordinators assigned to each placement training batch</p>
                </div>
                <div>
                  <button onClick={fetchPlacementTrainingBatches} className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-sm sm:rounded text-xs sm:text-sm">Refresh</button>
                </div>
              </div>

              {loadingPlacementBatches ? (
                <LoadingSkeleton />
              ) : (!placementBatchData || Object.keys(placementBatchData).length === 0) ? (
                <div className="text-center py-12 text-gray-500">No placement batches found</div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(placementBatchData).sort().reverse().map(year => (
                    <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 border-b">
                        <h3 className="text-sm font-semibold">Academic Year {year}</h3>
                      </div>
                      <div className="p-2 sm:p-3 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                        {Object.entries(placementBatchData[year]).flatMap(([college, techMap]) => (
                          Object.values(techMap).flatMap(group => group.batches.map(batch => ({ college, batch })))
                        )).map(({ college, batch }) => (
                          <div key={batch._id} className="bg-white rounded-md border border-gray-200 p-2 sm:p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold truncate">{batch.batchNumber} • {batch.techStack} <span className="text-[10px] sm:text-xs text-gray-500">({college})</span></div>
                                <div className="text-[11px] text-gray-500">Students: {batch.studentCount || (batch.students ? batch.students.length : 0)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">{batch.startDate ? new Date(batch.startDate).toLocaleDateString() : ''}</div>
                              </div>
                            </div>

                            <div className="mt-2 sm:mt-3">
                              {batch.coordinators && batch.coordinators.length > 0 ? (
                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                  {batch.coordinators.map(coord => (
                                    <div key={coord._id} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-xs sm:text-sm">
                                      <div className="font-medium text-xs sm:text-sm">{coord.name || coord.student?.name}</div>
                                      <div className="text-[10px] text-gray-500">{[coord.rollNo || coord.student?.rollNo, coord.phone || coord.student?.phonenumber, coord.email || coord.student?.email].filter(Boolean).join(' • ')}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">No coordinator assigned</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-5">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-sky-600" />
                    Pending Approval Requests
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={fetchPendingApprovals}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Display error messages for approvals */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {message && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-blue-700">{message}</p>
                </div>
              )}

              {loadingApprovals ? (
                <LoadingSkeleton />
              ) : pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No pending CRT approval requests</p>
                  <p className="text-gray-500 text-sm mt-2">All CRT-related requests have been processed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval, idx) => (
                    <div
                      key={idx}
                      className="border border-sky-200 rounded-lg p-3 sm:p-4 bg-gradient-to-r from-sky-50 to-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                            {approval.student.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {approval.student.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {approval.student.rollNo}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {new Date(approval.requestedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end items-end ml-3 sm:ml-4 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setShowApprovalDetail(true);
                            }}
                            className="bg-sky-600 text-white px-3 py-1 rounded-sm sm:rounded-lg hover:bg-sky-700 transition-colors font-medium text-xs sm:text-sm flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Review</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedbacks Tab */}
        {activeTab === 'feedbacks' && (
          <div className="w-full">
            <TPOFeedbackView />
          </div>
        )}

        </div>
      </div>

      {/* Batch Detail Modal */}
{selectedBatch && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
    <div className="w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white rounded-lg shadow-2xl max-h-[90vh] flex flex-col">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2.5 sm:px-4 sm:py-3 rounded-t-lg flex justify-between items-center flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-1.5 sm:gap-2 truncate">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">{selectedBatch.batchNumber}</span>
          </h3>
          <p className="text-blue-100 text-xs sm:text-sm mt-0.5 truncate">
            {selectedBatch.college} • Year {selectedBatch.year}
          </p>
        </div>
        <button
          onClick={() => setSelectedBatch(null)}
          className="ml-2 p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors text-white flex-shrink-0"
          aria-label="Close modal"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Modal Body - Scrollable */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
        {/* Batch Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-blue-50 p-2 sm:p-2.5 rounded-lg border border-blue-200">
            <p className="text-[10px] sm:text-xs font-medium text-blue-700 mb-0.5 sm:mb-1 uppercase tracking-wide">Tech Stack</p>
            <p className="text-xs sm:text-sm font-bold text-blue-900 truncate">{selectedBatch.techStack}</p>
          </div>
          <div className="bg-blue-50 p-2 sm:p-2.5 rounded-lg border border-blue-200">
            <p className="text-[10px] sm:text-xs font-medium text-blue-700 mb-0.5 sm:mb-1 uppercase tracking-wide">Students</p>
            <p className="text-xs sm:text-sm font-bold text-blue-900">{selectedBatch.studentCount}</p>
          </div>
          <div className="bg-blue-50 p-2 sm:p-2.5 rounded-lg border border-blue-200">
            <p className="text-[10px] sm:text-xs font-medium text-blue-700 mb-0.5 sm:mb-1 uppercase tracking-wide">TPO</p>
            <p className="text-xs sm:text-sm font-bold text-blue-900 truncate">{selectedBatch.tpoId?.name || 'Not assigned'}</p>
          </div>
          <div className="bg-blue-50 p-2 sm:p-2.5 rounded-lg border border-blue-200">
            <p className="text-[10px] sm:text-xs font-medium text-blue-700 mb-0.5 sm:mb-1 uppercase tracking-wide">Start Date</p>
            <p className="text-xs sm:text-sm font-bold text-blue-900">{new Date(selectedBatch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
          </div>
        </div>

        {/* Assigned Trainers */}
        {selectedBatch.assignedTrainers && selectedBatch.assignedTrainers.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 border border-gray-200">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              Assigned Trainers ({selectedBatch.assignedTrainers.length})
            </h4>
            <div className="space-y-2">
              {selectedBatch.assignedTrainers.map((assignment, index) => (
                <div key={index} className="bg-white rounded-lg p-2 sm:p-2.5 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                        {assignment.trainer?.name?.charAt(0) || 'T'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{assignment.trainer?.name || 'Unknown'}</h5>
                        <p className="text-gray-600 text-[10px] sm:text-xs truncate">{assignment.subject}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                        assignment.timeSlot === 'morning' ? 'bg-blue-100 text-blue-800' :
                        assignment.timeSlot === 'afternoon' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.timeSlot}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {assignment.schedule?.length || 0} slots
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 border-b border-gray-200">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              Students List ({selectedBatch.students.length})
            </h4>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto max-h-64">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">College</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Tech Stack</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {selectedBatch.students.map((student, idx) => (
                  <tr key={student._id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 text-xs">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700 font-mono">{student.rollNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{student.college}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{student.branch}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                        {student.techStack?.join(', ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {selectedBatch.coordinators && selectedBatch.coordinators.length > 0 && selectedBatch.coordinators[0].student && String(selectedBatch.coordinators[0].student._id) === String(student._id) ? (
                        <span className="px-2 py-1 text-[10px] rounded bg-green-100 text-green-800">Coordinator</span>
                      ) : (
                        <button
                          onClick={() => handleAssignCoordinator(student._id)}
                          disabled={assigningCoordinatorId === student._id}
                          className={`px-2 py-1 text-[10px] rounded transition-colors ${
                            assigningCoordinatorId === student._id
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {assigningCoordinatorId === student._id ? 'Assigning...' : 'Make Coordinator'}
                        </button> 
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden max-h-64 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {selectedBatch.students.map((student, idx) => (
                <div key={student._id} className={`p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 text-xs mb-0.5 truncate">{student.name}</h5>
                      <p className="text-[10px] text-gray-600 font-mono">{student.rollNo}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-[10px] text-gray-700 mb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">College:</span>
                      <span className="truncate ml-2">{student.college}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Branch:</span>
                      <span className="truncate ml-2">{student.branch}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tech:</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                        {student.techStack?.join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {selectedBatch.coordinators && selectedBatch.coordinators.length > 0 && selectedBatch.coordinators[0].student && String(selectedBatch.coordinators[0].student._id) === String(student._id) ? (
                    <div className="w-full px-2 py-1.5 text-xs rounded bg-green-100 text-green-800 text-center">Coordinator</div>
                  ) : (
                    <button
                      onClick={() => handleAssignCoordinator(student._id)}
                      disabled={assigningCoordinatorId === student._id}
                      className={`w-full px-2 py-1.5 text-xs rounded transition-colors ${
                        assigningCoordinatorId === student._id
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {assigningCoordinatorId === student._id ? 'Assigning...' : 'Make Coordinator'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Trainer Assignment Modal */}
{showTrainerAssignment && selectedBatchForAssignment && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
    <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <TrainerAssignment
        batchId={selectedBatchForAssignment}
        compact
        onClose={() => {
          setShowTrainerAssignment(false);
          setSelectedBatchForAssignment(null);
        }}
        onUpdate={handleAssignmentUpdate}
      />
    </div>
  </div>
)}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Add Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
            </div>
            <AddEditStudentForm
              batches={studentBatchData}
              onSubmit={async (values) => {
                const res = await handleCreateStudent(values);
                if (res.success) {
                  setShowAddStudentModal(false);
                } else {
                  alert(res.message || 'Failed to add student');
                }
              }}
              initial={{}}
            />
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && studentToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Edit Student</h3>
              <button onClick={() => { setShowEditStudentModal(false); setStudentToEdit(null); }} className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
            </div>
            <AddEditStudentForm
              batches={studentBatchData}
              initial={studentToEdit}
              onSubmit={async (values) => {
                const res = await handleUpdateStudent(studentToEdit._id, values);
                if (!res.success) alert(res.message || 'Update failed');
              }}
            />
          </div>
        </div>
      )}
      {/* Approval Detail Modal */}
      {showApprovalDetail && selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          onClose={() => {
            console.log('✅ onClose called from parent component');
            console.log('Before - showApprovalDetail:', showApprovalDetail);
            console.log('Before - selectedApproval:', selectedApproval);
            
            // Use setTimeout to ensure state updates are not batched incorrectly
            setShowApprovalDetail(false);
            setSelectedApproval(null);
            
            console.log('✅ State updates dispatched');
          }}
          onApprove={handleApproveRequest}
          onReject={openRejectModal}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          approval={approvalToReject}
          onClose={closeRejectModal}
          onConfirm={handleRejectRequest}
        />
      )}
    </div>
  </div>
  );
};

export default TPODashboard;