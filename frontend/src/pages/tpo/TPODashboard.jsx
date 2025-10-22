import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Settings, LogOut, Bell, ChevronDown, Building, Calendar, Eye, ChevronRight,
  Building2, Code2, GraduationCap, X, TrendingUp, Clock, MapPin, Award, Filter,
  Search, UserPlus, UserCheck, Download, CalendarDays, BookOpen, FileText,
  User, Phone, Mail, MapPin as Location, GraduationCap as Education, Briefcase,
  ExternalLink, Image as ImageIcon, Star,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import TrainerAssignment from './TrainerAssignment';
import ScheduleTimetable from './ScheduleTimetable';

const TPODashboard = () => {
  const [tpoData, setTpoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
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

  // Trainer Assignment state
  const [showTrainerAssignment, setShowTrainerAssignment] = useState(false);
  const [selectedBatchForAssignment, setSelectedBatchForAssignment] = useState(null);

  // New state for tab navigation and filters
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchAssignedBatches();
    fetchPlacementTrainingBatches();
    fetchStudentDetailsByBatch();
    fetchPendingApprovals();
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

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/auth/dashboard/tpo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setTpoData(result.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch {
      setError('Failed to fetch dashboard data');
    }
  };

  const fetchAssignedBatches = async () => {
    setLoadingBatches(true);
    setErrorBatches('');
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/batches', {
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
      const response = await fetch('/api/tpo/students-by-batch', {
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
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/placement-training-batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPlacementBatchData(data.data.organized);
        setPlacementStats(data.data.stats);
        const years = Object.keys(data.data.organized).sort().reverse();
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
      const response = await fetch('/api/tpo/schedule-timetable', {
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

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    try {
      setLoadingApprovals(true);
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setError('Failed to fetch pending approvals');
    } finally {
      setLoadingApprovals(false);
    }
  };

  // Handle approval
  const handleApproveRequest = async (studentId, approvalId) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          approvalId,
          action: 'approve'
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Request approved successfully');
        await fetchPendingApprovals();
        setShowApprovalDetail(false);
        setSelectedApproval(null);
      } else {
        setError(data.message || 'Failed to approve request');
        console.error('Server response:', data);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to process approval. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle rejection
  const handleRejectRequest = async () => {
    if (!approvalToReject || !rejectionReason) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: approvalToReject.student.id,
          approvalId: approvalToReject.approvalId,
          action: 'reject',
          rejectionReason
        }),
        credentials: 'include' // Add this to include cookies
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Request rejected successfully');
        fetchPendingApprovals(); // Refresh the approvals list
        closeRejectModal();
      } else {
        setError(data.message || 'Failed to reject request');
        console.error('Server response:', data);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to process rejection');
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (approval) => {
    setApprovalToReject(approval);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setApprovalToReject(null);
  };


  const getFilteredStudents = () => {
    const allStudents = [];
    
    studentBatchData.forEach(batch => {
      if (selectedBatchFilter !== 'all' && batch.batchNumber !== selectedBatchFilter) return;
      
      batch.students.forEach(student => {
        if (selectedCrtFilter !== 'all' && student.crtStatus !== selectedCrtFilter) return;
        if (selectedCollegeFilter !== 'all' && student.college !== selectedCollegeFilter) return;
        if (selectedBranchFilter !== 'all' && student.branch !== selectedBranchFilter) return;
        
        if (studentSearchTerm && !student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) &&
            !student.rollNo.toLowerCase().includes(studentSearchTerm.toLowerCase()) &&
            !student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())) return;
        
        allStudents.push(student);
      });
    });
    
    return allStudents;
  };

  const handleProfileImageView = (imageUrl) => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

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

  const StudentProfileModal = ({ student, onClose }) => {
    if (!student) return null;

    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <GraduationCap className="h-6 w-6" />
                Student Profile - {student.name}
              </h3>
              <p className="text-blue-100 text-sm mt-1">{student.rollNo} • {student.college}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 bg-white rounded-full overflow-hidden border-4 border-blue-200 shadow">
                  {student.profileImageUrl ? (
                    <img 
                      src={student.profileImageUrl} 
                      alt={student.name}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleProfileImageView(student.profileImageUrl)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                      {student.name.charAt(0)}
                    </div>
                  )}
                </div>
                {student.profileImageUrl && (
                  <button 
                    onClick={() => handleProfileImageView(student.profileImageUrl)}
                    className="mt-3 text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <ImageIcon className="h-4 w-4" />
                    View Full Image
                  </button>
                )}
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Full Name</label>
                    <p className="text-base font-semibold text-gray-900 mt-1">{student.name}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Roll Number</label>
                    <p className="text-base font-semibold text-gray-900 mt-1 font-mono">{student.rollNo}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Email Address</label>
                    <p className="text-base font-semibold text-gray-900 mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      {student.email}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Phone Number</label>
                    <p className="text-base font-semibold text-gray-900 mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      {student.phonenumber}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">College</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {student.college}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Branch</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{student.branch}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Year of Passing</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{student.yearOfPassing}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Batch</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{student.batchNumber}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">CRT Status</label>
                    <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      student.crtStatus === 'CRT' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {student.crtStatus}
                    </span>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Placement Status</label>
                    <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      student.status === 'placed' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : student.status === 'eligible' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {student.resumeUrl && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Resume</h4>
                      <p className="text-sm text-gray-600">{student.resumeFileName || 'resume.pdf'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(student.resumeUrl, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleResumeDownload(student.resumeUrl, student.resumeFileName)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(student.gender || student.dob || student.currentLocation || student.hometown) && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {student.gender && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Gender</span>
                      <span className="font-medium text-gray-900 text-sm">{student.gender}</span>
                    </div>
                  )}
                  {student.dob && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Date of Birth</span>
                      <span className="font-medium text-gray-900 text-sm">{new Date(student.dob).toLocaleDateString()}</span>
                    </div>
                  )}
                  {student.currentLocation && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Current Location</span>
                      <span className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                        <Location className="h-4 w-4 text-green-600" />
                        {student.currentLocation}
                      </span>
                    </div>
                  )}
                  {student.hometown && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">Hometown</span>
                      <span className="font-medium text-gray-900 text-sm">{student.hometown}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {student.bio && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Professional Bio</h4>
                <p className="text-gray-700 leading-relaxed text-sm">{student.bio}</p>
              </div>
            )}

            {student.academics && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Education className="h-5 w-5 text-blue-600" />
                  Academic Records
                </h4>
                <div className="space-y-3">
                  {student.academics.btechCGPA && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">B.Tech CGPA</p>
                          <p className="text-xs text-gray-600">Overall Performance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-700">{student.academics.btechCGPA}/10</p>
                        <p className="text-xs text-gray-600">Scale</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {student.academics.inter?.percentage && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="font-semibold text-gray-900 text-sm">Intermediate / 12th</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{student.academics.inter.percentage}%</p>
                        {student.academics.inter.board && (
                          <p className="text-xs text-gray-600 mt-1">{student.academics.inter.board} Board</p>
                        )}
                      </div>
                    )}
                    {student.academics.diploma?.percentage && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="font-semibold text-gray-900 text-sm">Diploma</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{student.academics.diploma.percentage}%</p>
                        {student.academics.diploma.board && (
                          <p className="text-xs text-gray-600 mt-1">{student.academics.diploma.board}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {student.academics.backlogs !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Active Backlogs</p>
                        <p className="text-xs text-gray-600">Academic Standing</p>
                      </div>
                      <p className={`text-2xl font-bold ${student.academics.backlogs === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {student.academics.backlogs}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {student.techStack && student.techStack.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-green-600" />
                  Technical Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {student.techStack.map((tech, index) => (
                    <span key={index} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-green-100 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {student.projects && student.projects.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Projects ({student.projects.length})
                </h4>
                <div className="space-y-3">
                  {student.projects.slice(0, 5).map((project, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-base font-semibold text-gray-900">{project.title}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          project.verificationStatus === 'tpo_approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                          project.verificationStatus === 'coordinator_approved' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          project.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {project.verificationStatus.replace('_', ' ')}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-700 mb-2 text-sm">{project.description}</p>
                      )}
                      {project.techStack && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {project.techStack.map((tech, techIndex) => (
                            <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.links?.github && (
                        <a 
                          href={project.links.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on GitHub
                        </a>
                      )}
                    </div>
                  ))}
                  {student.projects.length > 5 && (
                    <p className="text-center text-gray-600 text-xs mt-3">
                      +{student.projects.length - 5} more projects
                    </p>
                  )}
                </div>
              </div>
            )}

            {student.internships && student.internships.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  Internships ({student.internships.length})
                </h4>
                <div className="space-y-3">
                  {student.internships.map((internship, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="text-base font-semibold text-gray-900">{internship.role}</h5>
                          <p className="text-gray-700 font-medium text-sm">{internship.company}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          internship.verificationStatus === 'tpo_approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                          internship.verificationStatus === 'coordinator_approved' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          internship.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {internship.verificationStatus.replace('_', ' ')}
                        </span>
                      </div>
                      {internship.location && (
                        <p className="text-gray-600 flex items-center gap-2 mb-1 text-sm">
                          <Location className="h-3 w-3" />
                          {internship.location}
                        </p>
                      )}
                      {(internship.startDate || internship.endDate) && (
                        <p className="text-xs text-gray-600">
                          {internship.startDate && new Date(internship.startDate).toLocaleDateString()} - {internship.endDate && new Date(internship.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {student.certifications && student.certifications.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Certifications ({student.certifications.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {student.certifications.map((cert, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm">{cert.name}</h5>
                          <p className="text-gray-700 text-xs">{cert.issuer}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          cert.verificationStatus === 'tpo_approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                          cert.verificationStatus === 'coordinator_approved' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          cert.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {cert.verificationStatus.replace('_', ' ')}
                        </span>
                      </div>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-600 mb-1">Credential ID: {cert.credentialId}</p>
                      )}
                      {cert.dateIssued && (
                        <p className="text-xs text-gray-600">
                          Issued: {new Date(cert.dateIssued).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {student.placementDetails && student.status === 'placed' && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-600" />
                  Placement Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Company</span>
                      <span className="font-semibold text-gray-900 text-sm">{student.placementDetails.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Role</span>
                      <span className="font-semibold text-gray-900 text-sm">{student.placementDetails.role}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {student.placementDetails.package && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Package</span>
                        <span className="font-bold text-green-600 text-lg">{student.placementDetails.package} LPA</span>
                      </div>
                    )}
                    {student.placementDetails.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Location</span>
                        <span className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                          <Location className="h-3 w-3" />
                          {student.placementDetails.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Account Activity</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm">Account Created</span>
                  <span className="font-medium text-gray-900 text-sm">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 text-sm">Last Login</span>
                  <span className="font-medium text-gray-900 text-sm">{student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  const getTechStackColor = (techStack) => {
    const colors = {
      Java: 'bg-blue-50 text-blue-700 border-blue-200',
      Python: 'bg-green-50 text-green-700 border-green-200',
      'AI/ML': 'bg-blue-50 text-blue-700 border-blue-200',
      NonCRT: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[techStack] || 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getTechStackBadgeColor = (techStack) => {
    const colors = {
      Java: 'bg-blue-500',
      Python: 'bg-green-500',
      'AI/ML': 'bg-blue-600',
      NonCRT: 'bg-gray-500',
    };
    return colors[techStack] || 'bg-blue-500';
  };

  const getTrainerAssignmentStatus = (batch) => {
    const trainerCount = batch.assignedTrainers ? batch.assignedTrainers.length : 0;
    if (trainerCount === 0) {
      return {
        status: 'No Trainers',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '❌'
      };
    } else if (trainerCount < 3) {
      return {
        status: `${trainerCount} Trainer${trainerCount > 1 ? 's' : ''}`,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '⚠️'
      };
    } else {
      return {
        status: `${trainerCount} Trainers`,
        color: 'bg-green-100 text-green-800 border-green-200',
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
      await fetch('/api/auth/logout', {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }


  // Approval Detail Modal Component
  const ApprovalDetailModal = ({ approval, onClose, onApprove, onReject }) => {
    if (!approval) return null;

    const getRequestTypeLabel = (type) => {
      return type === 'crt_status_change' ? 'CRT Status Change' : 'Batch Change';
    };

    const getRequestTypeColor = (type) => {
      return type === 'crt_status_change' 
        ? 'from-purple-500 to-purple-600' 
        : 'from-blue-500 to-blue-600';
    };

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl">
          <div className={`bg-gradient-to-r ${getRequestTypeColor(approval.requestType)} px-6 py-4 rounded-t-lg flex justify-between items-center`}>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Approval Request Details
              </h3>
              <p className="text-white/90 text-sm mt-1">{getRequestTypeLabel(approval.requestType)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Student Information
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{approval.student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Roll Number</p>
                  <p className="font-semibold text-gray-900 font-mono">{approval.student.rollNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">College</p>
                  <p className="font-semibold text-gray-900">{approval.student.college}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Branch</p>
                  <p className="font-semibold text-gray-900">{approval.student.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Year of Passing</p>
                  <p className="font-semibold text-gray-900">{approval.student.yearOfPassing}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Current Batch</p>
                  <p className="font-semibold text-gray-900">
                    {approval.student.currentBatch ? approval.student.currentBatch.batchNumber : 'Not Assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Requested Changes</h4>

              {approval.requestType === 'crt_status_change' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Current CRT Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                        approval.requestedChanges.originalCrtInterested
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {approval.requestedChanges.originalCrtInterested ? 'CRT' : 'Non-CRT'}
                      </span>
                    </div>
                    <div className="px-4">
                      <ChevronRight className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-600 mb-1">Requested CRT Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                        approval.requestedChanges.crtInterested
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {approval.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}
                      </span>
                    </div>
                  </div>

                  {approval.requestedChanges.crtBatchChoice && (
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Requested CRT Batch</p>
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                        {approval.requestedChanges.crtBatchChoice}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {approval.requestType === 'batch_change' && (
                <div className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Current Tech Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {approval.requestedChanges.originalTechStack?.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold border border-gray-200"
                        >
                          {tech}
                        </span>
                      )) || <span className="text-gray-500 text-sm">None</span>}
                    </div>
                  </div>
                  <div className="px-4">
                    <ChevronRight className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm text-gray-600 mb-2">Requested Tech Stack</p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {approval.requestedChanges.techStack?.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-200"
                        >
                          {tech}
                        </span>
                      )) || <span className="text-gray-500 text-sm">None</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Request Metadata */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Requested At</span>
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
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => onApprove(approval.student.id, approval.approvalId)}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle className="h-5 w-5" />
                Approve Request
              </button>
              <button
                onClick={() => onReject(approval)}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <X className="h-5 w-5" />
                Reject Request
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Reject Modal Component
  const RejectModal = ({ approval, onClose, onConfirm, reason, setReason }) => {
    if (!approval) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-lg">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Reject Request
            </h3>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-4">
              You are about to reject the request from <strong>{approval.student.name}</strong>.
              Please provide a reason for rejection:
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!reason.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TPO Dashboard</h1>
                <p className="text-sm opacity-90">Training Placement Officer</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-green-400 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center space-x-1 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                    <button 
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/tpo-profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/tpo-change-password');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-blue-700">
                  Training Placement Officer
                </h1>
                <p className="text-gray-600 mt-1">Welcome, {tpoData?.user?.name}! - {tpoData?.message}</p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Data</span>
              </div>
            </div>
          </div>

          {/* Info Cards Row */}
          <div className="px-6 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Last Login</p>
                    <p className="text-base font-bold text-green-900">{tpoData?.lastLogin ? new Date(tpoData.lastLogin).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Assigned Trainers</p>
                    <p className="text-base font-bold text-blue-900">{tpoData?.assignedTrainers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Companies</p>
                    <p className="text-base font-bold text-green-900">{tpoData?.managedCompanies || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Total Batches</p>
                    <p className="text-base font-bold text-blue-900">{tpoData?.assignedBatches || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6">
            <div className="flex gap-1 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'dashboard'
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className={`px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'batches'
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Training Batches
              </button>
              <button
                onClick={() => setActiveTab('student-details')}
                className={`px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'student-details'
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Student Details
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'statistics'
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'schedule'
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="h-4 w-4 inline mr-2" />
                Overall Schedule
              </button>

            {/* Approval Requests Tab */}
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 relative ${
                activeTab === 'approvals'
                  ? 'border-orange-600 text-orange-700 bg-orange-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Approval Requests
                {pendingApprovals.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {pendingApprovals.length}
                  </span>
                )}
              </div>
            </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Users className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Manage Students</p>
                  </button>
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                    <Building className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Company Relations</p>
                  </button>
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Calendar className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Placement Schedule</p>
                  </button>
                </div>
              </div>

              {/* Recent Assigned Batches */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Assigned Batches</h3>
                {loadingBatches ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading batches...</p>
                  </div>
                ) : errorBatches ? (
                  <div className="text-red-500 mb-4">{errorBatches}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedBatches.slice(0, 4).map(batch => (
                      <div key={batch.id} className="bg-gradient-to-r from-blue-50 to-green-50 border rounded-lg shadow p-5 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-base mb-2 text-gray-900">Batch {batch.batchNumber}</h4>
                        <div className="space-y-2 text-sm text-gray-700">
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
                  <h3 className="text-base font-bold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
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
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading batches...</p>
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
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{batch.batchNumber}</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{batch.college}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTechStackColor(batch.techStack)} border`}>
                                {batch.techStack}
                              </span>
                            </div>

                            <div className="space-y-2 mb-4 text-gray-700 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span><strong>{batch.studentCount}</strong> Students</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span>Year {batch.year}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4" />
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${assignmentStatus.color} border`}>
                                  {assignmentStatus.icon} {assignmentStatus.status}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedBatch(batch)}
                                className="flex-1 text-white bg-blue-600 hover:bg-blue-700 font-medium py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm text-sm"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleTrainerAssignment(batch._id)}
                                className="flex-1 text-green-700 bg-green-100 hover:bg-green-200 font-medium py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                              >
                                <UserPlus className="h-4 w-4" />
                                Assign
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
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-blue-700" />
                  <h3 className="text-base font-bold text-gray-900">Student Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                    <option value="all">All CRT Status</option>
                    <option value="CRT">CRT</option>
                    <option value="Non-CRT">Non-CRT</option>
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

              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-green-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">College</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tech Stack</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredStudents().map((student, idx) => (
                        <tr key={student._id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{student.rollNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.college}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.branch}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                              {student.techStack?.join(', ') || 'Not specified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => setSelectedStudentForProfile(student)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-5">Detailed Statistics</h2>
                {Object.keys(placementBatchData).sort().reverse().map(year => (
                  <div key={year} className="mb-5">
                    <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Academic Year {year}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.keys(placementBatchData[year]).map(college => {
                        const totalBatches = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0);
                        const totalStudents = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0);

                        return (
                          <div key={college} className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
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

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <ScheduleTimetable 
              scheduleData={scheduleData} 
              loading={loadingSchedule} 
              onRefresh={fetchScheduleData}
            />
          )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-5">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                    Pending Approval Requests
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Review and approve student requests for CRT status and batch changes
                  </p>
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
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                  <p className="text-green-700">{message}</p>
                </div>
              )}

              {loadingApprovals ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading approval requests...</p>
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No pending approval requests</p>
                  <p className="text-gray-500 text-sm mt-2">All requests have been processed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval, idx) => (
                    <div
                      key={idx}
                      className="border border-orange-200 rounded-lg p-4 bg-gradient-to-r from-orange-50 to-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {approval.student.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-base">
                                {approval.student.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {approval.student.rollNo} • {approval.student.college} • {approval.student.branch}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              approval.requestType === 'crt_status_change'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {approval.requestType === 'crt_status_change' 
                                ? 'CRT Status Change' 
                                : 'Batch Change'}
                            </span>

                            <span className="text-xs text-gray-500">
                              {new Date(approval.requestedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Quick preview of changes */}
                          <div className="mt-3 p-2 bg-white rounded border border-gray-200 text-sm">
                            {approval.requestType === 'crt_status_change' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-semibold text-gray-800">
                                  {approval.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-orange-700">
                                  {approval.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Tech Stack:</span>
                                <span className="font-semibold text-gray-800">
                                  {approval.requestedChanges.techStack?.join(', ') || 'None'}
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-orange-700">
                                  {approval.requestedChanges.techStack?.join(', ') || 'None'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowApprovalDetail(true);
                          }}
                          className="ml-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4 rounded-t-lg flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="h-6 w-6" />
                  {selectedBatch.batchNumber}
                </h3>
                <p className="text-blue-100 text-sm mt-1">{selectedBatch.college} • Year {selectedBatch.year}</p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Tech Stack</p>
                  <p className="text-base font-bold text-blue-900">{selectedBatch.techStack}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-700 mb-1">Total Students</p>
                  <p className="text-base font-bold text-green-900">{selectedBatch.studentCount}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">TPO</p>
                  <p className="text-base font-bold text-blue-900">{selectedBatch.tpoId?.name || 'Not assigned'}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-700 mb-1">Start Date</p>
                  <p className="text-base font-bold text-green-900">{new Date(selectedBatch.startDate).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedBatch.assignedTrainers && selectedBatch.assignedTrainers.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-5">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Assigned Trainers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedBatch.assignedTrainers.map((assignment, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {assignment.trainer?.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 text-sm">{assignment.trainer?.name || 'Unknown'}</h5>
                            <p className="text-gray-700 text-xs">{assignment.subject}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={`px-2 py-1 rounded-lg ${
                            assignment.timeSlot === 'morning' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            assignment.timeSlot === 'afternoon' ? 'bg-green-100 text-green-800 border border-green-200' :
                            'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {assignment.timeSlot}
                          </span>
                          <span className="text-gray-500">
                            {assignment.schedule?.length || 0} time slots
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-green-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">College</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tech Stack</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {selectedBatch.students.map((student, idx) => (
                        <tr key={student._id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">{student.rollNo}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{student.college}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{student.branch}</td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                              {student.techStack?.join(', ') || 'Not specified'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Assignment Modal */}
      {showTrainerAssignment && selectedBatchForAssignment && (
        <TrainerAssignment
          batchId={selectedBatchForAssignment}
          onClose={() => {
            setShowTrainerAssignment(false);
            setSelectedBatchForAssignment(null);
          }}
          onUpdate={handleAssignmentUpdate}
        />
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}
      {/* Approval Detail Modal */}
      {showApprovalDetail && selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          onClose={() => {
            setShowApprovalDetail(false);
            setSelectedApproval(null);
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
          reason={rejectionReason}
          setReason={setRejectionReason}
        />
      )}
    </div>
  );
};

export default TPODashboard;