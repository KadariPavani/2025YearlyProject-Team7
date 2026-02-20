import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../services/api';
import {
  Users, Building, Calendar, Eye, ChevronRight, ChevronDown,
  Building2, Code2, GraduationCap, X, TrendingUp, Clock, MapPin, Award, Filter,
  Search, UserPlus,Activity, UserCheck, Download, CalendarDays, BookOpen, FileText,
  User, Phone, Mail, MapPin as Location, GraduationCap as Education, Briefcase,
  ExternalLink, Image as ImageIcon, Star,
  CheckCircle, AlertCircle, MoreVertical, Edit, Trash2, UserMinus
} from 'lucide-react';
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
import ToastNotification from '../../components/ui/ToastNotification';

// Extracted tab components
import DashboardTab from './tabs/DashboardTab';
import BatchesTab from './tabs/BatchesTab';
import StudentDetailsTab from './tabs/StudentDetailsTab';
import SuspendedTab from './tabs/SuspendedTab';
import StatisticsTab from './tabs/StatisticsTab';
import CoordinatorsTab from './tabs/CoordinatorsTab';
import ApprovalsTab from './tabs/ApprovalsTab';

// Extracted shared components
import AddEditStudentForm from './components/AddEditStudentForm';

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

  // Student Details Batch-wise state
  const [studentBatchData, setStudentBatchData] = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);
  // Add/Edit/Suspend UI state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [suspendedStudents, setSuspendedStudents] = useState([]);
  const [loadingSuspended, setLoadingSuspended] = useState(false);

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

  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [visibleTabsCount, setVisibleTabsCount] = useState(tabs.length);
  const moreRef = useRef(null);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const [dropdownCoords, setDropdownCoords] = useState(null);

  const handleMoreToggle = (e) => {
    e.stopPropagation();
    if (!moreRef.current) {
      setShowMoreDropdown(s => !s);
      return;
    }
    const rect = moreRef.current.getBoundingClientRect();
    const width = 224;
    const top = rect.bottom + 8;
    const left = Math.max(8, rect.right - width);
    setDropdownCoords({ top, left, width });
    setShowMoreDropdown(s => !s);
  };

  // Recompute dropdown position on resize/scroll while open
  useEffect(() => {
    if (!showMoreDropdown) return;
    const handleReposition = () => {
      if (!moreRef.current) return;
      const rect = moreRef.current.getBoundingClientRect();
      const width = 224;
      const top = rect.bottom + 8;
      const left = Math.max(8, rect.right - width);
      setDropdownCoords({ top, left, width });
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showMoreDropdown]);

  useEffect(() => {
    const reset = () => { setVisibleTabsCount(tabs.length); setShowMoreDropdown(false); };
    window.addEventListener('resize', reset);
    // Also re-trigger when crossing the sm breakpoint (nav hidden ↔ visible)
    const mql = window.matchMedia('(min-width: 640px)');
    mql.addEventListener('change', reset);
    return () => { window.removeEventListener('resize', reset); mql.removeEventListener('change', reset); };
  }, [tabs.length]);

  // No dependency array so it re-runs when nav first appears after loading
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.offsetWidth === 0) return; // skip if nav is hidden
    // Fast-forward: jump to actual child count instead of decrementing one-by-one
    const childCount = nav.children.length;
    if (childCount > 0 && visibleTabsCount > childCount) {
      setVisibleTabsCount(childCount);
      return;
    }
    if (nav.scrollWidth > nav.clientWidth + 2 && visibleTabsCount > 1) {
      setVisibleTabsCount(v => v - 1);
    }
  });

  useEffect(() => {
    const onDocClick = (e) => {
      if (moreRef.current && moreRef.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setShowMoreDropdown(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
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

// Notifications
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [categoryUnread, setCategoryUnread] = useState({
  "Placement": 0,
  "CRT Batches": 0,
  "Account": 0,
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
      return { success: false, message: err.response?.data?.message || err.message };
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
        alert('Student deleted');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err?.response?.data?.message || 'Failed to delete student');
    }
  };

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

    const notifications = res.data.data || [];
    const currentTpoId = tpoData?.user?._id || tpoData?._id;

    const unreadByCategory = res.data.unreadByCategory || {
      "Placement": 0,
      "CRT Batches": 0,
      "Account": 0,
    };

    const totalUnread = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);

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

    await axios.put(`/api/notifications/mark-read/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchNotifications();
  } catch (err) {
    console.error("Error marking TPO notification as read:", err);
  }
};

const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem("userToken");

    await axios.put(`/api/notifications/mark-all-read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchNotifications();
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
    if (tabId === 'schedule') {
      setLoadingSchedule(true);
      fetchScheduleData();
    }
  };

  const handleAssignCoordinator = async (studentId, batchId) => {
    if (!batchId) {
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
          batchId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign coordinator');
      }

      setMessage('Student assigned as coordinator successfully');
      await fetchPlacementTrainingBatches();

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
        console.error('Fetch approvals failed:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
    if (!studentId || !approvalId) {
      setError('Missing student or approval identifier');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

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

      if (response.ok && data.success) {
        setMessage(data.message || 'Request approved successfully');
        await Promise.all([
          fetchPendingApprovals(),
          fetchPlacementTrainingBatches(),
          fetchStudentDetailsByBatch()
        ]);
        setShowApprovalDetail(false);
        setSelectedApproval(null);
      } else {
        setError(data.message || 'Failed to approve request');
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

    if (!approvalToReject || !reasonToUse || !reasonToUse.trim()) {
      setError('Please provide a reason for rejection');
      return false;
    }

    try {
      setLoading(true);
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

      if (response.ok && data.success) {
        setMessage('Request rejected successfully');
        await fetchPendingApprovals();
        closeRejectModal();
        return true;
      } else {
        setError(data.message || 'Failed to reject request');
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
        if (selectedCollegeFilter !== 'all' && student.college !== selectedCollegeFilter) return;
        if (selectedBranchFilter !== 'all' && student.branch !== selectedBranchFilter) return;

        if (studentSearchTerm && !student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) &&
            !student.rollNo.toLowerCase().includes(studentSearchTerm.toLowerCase()) &&
            !student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())) return;

        let candidateName = '';

        const ptb = student?.placementTrainingBatchId;
        if (ptb && typeof ptb === 'object') {
          candidateName = ptb.name || `${ptb.batchNumber || ''}_${ptb.college || ptb.colleges?.[0] || ''}_${ptb.techStack || ''}`;
        }

        candidateName = candidateName || student?.currentBatch?.name || student?.batchName || student?.crtBatchName || batch.name || `${batch.batchNumber}_${(batch.colleges && batch.colleges[0]) || ''}_${batch.techStack || ''}`;

        let placementBatchName = String(candidateName || '').trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '').replace(/^_+|_+$/g, '');

        if (!(placementBatchName.startsWith('PT_') || placementBatchName.startsWith('NT_'))) {
          placementBatchName = '';
        }

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

  // Approval Detail Modal Component
  const ApprovalDetailModal = ({ approval, onClose, onApprove, onReject }) => {
    if (!approval || !['crt_status_change', 'batch_change', 'profile_change'].includes(approval.requestType)) {
      return null;
    }

    useEffect(() => {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalStyle; };
    }, []);

    const getRequestTypeLabel = (type) => {
      const labels = { 'crt_status_change': 'CRT Status Change', 'batch_change': 'Batch Change', 'profile_change': 'Profile Update' };
      return labels[type] || type;
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-blue-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg flex justify-between items-center flex-shrink-0 border-b border-gray-200">
            <div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Approval Request</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{getRequestTypeLabel(approval.requestType)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Student Info Table */}
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Student Information</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ['Name', approval.student.name],
                      ['Roll No', approval.student.rollNo],
                      ['College', approval.student.college],
                      ['Branch', approval.student.branch],
                      ['Year of Passing', approval.student.yearOfPassing],
                      ['Current Batch', approval.student.currentBatch?.batchNumber || 'Not Assigned']
                    ].map(([label, value], i) => (
                      <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap w-1/3">{label}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-900">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CRT Status Change */}
            {approval.requestType === 'crt_status_change' && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Requested Changes</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-100">
                      <tr className="bg-white">
                        <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 w-1/3">Current Status</td>
                        <td className="px-3 py-2 text-xs sm:text-sm">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {approval.requestedChanges.originalCrtInterested ? 'CRT' : 'Non-CRT'}
                          </span>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 w-1/3">New Status</td>
                        <td className="px-3 py-2 text-xs sm:text-sm">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {approval.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}
                          </span>
                        </td>
                      </tr>
                      {approval.requestedChanges.crtBatchChoice && (
                        <tr className="bg-white">
                          <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 w-1/3">Requested Batch</td>
                          <td className="px-3 py-2 text-xs sm:text-sm font-medium text-blue-600">{approval.requestedChanges.crtBatchChoice}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Batch/Tech Stack Change */}
            {approval.requestType === 'batch_change' && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Tech Stack Change</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-100">
                      <tr className="bg-white">
                        <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 w-1/3">Current</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {approval.requestedChanges.originalTechStack?.map((tech, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{tech}</span>
                            )) || <span className="text-xs text-gray-400">None</span>}
                          </div>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 w-1/3">New</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {approval.requestedChanges.techStack?.map((tech, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{tech}</span>
                            )) || <span className="text-xs text-gray-400">None</span>}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Profile Change */}
            {approval.requestType === 'profile_change' && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Profile Changes</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Field</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Current</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">New</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(approval.requestedChanges.changedFields || {}).map(([field, newValue], i) => {
                        const oldValue = approval.requestedChanges.originalFields?.[field];
                        return (
                          <tr key={field} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 capitalize whitespace-nowrap">{field.replace(/([A-Z])/g, ' $1').trim()}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-500 break-words">{typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue || 'Not set')}</td>
                            <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium break-words">{typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <span>Requested</span>
              <span className="font-medium text-gray-700">
                {new Date(approval.requestedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 px-4 sm:px-6 py-3 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onApprove?.(approval.student.id, approval.approvalId); }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReject?.(approval); }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Reject Modal Component
  const RejectModal = ({ approval, onClose, onConfirm }) => {
    const [localReason, setLocalReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
      setLocalReason('');
      setLocalError('');
      setSubmitting(false);
      setTimeout(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          const len = el.value?.length || 0;
          try { el.setSelectionRange(len, len); } catch (e) { /* ignore */ }
        }
      }, 50);
    }, [approval]);

    if (!approval) return null;

    const handleConfirm = async () => {
      setLocalError('');
      if (!localReason || !localReason.trim()) {
        setLocalError('Please provide a reason for rejection');
        try { textareaRef.current?.focus(); } catch (e) { /* ignore */ }
        return;
      }
      if (typeof onConfirm !== 'function') {
        setLocalError('No handler configured');
        return;
      }

      try {
        setSubmitting(true);
        const success = await onConfirm(localReason);
        if (success) {
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
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose?.(); }}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="bg-red-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg flex items-center gap-2 border-b border-gray-200">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Reject Request</h3>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-xs sm:text-sm text-gray-700">
              Reject the request from <strong>{approval.student.name}</strong>. Please provide a reason:
            </p>

            <textarea
              ref={textareaRef}
              value={localReason}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setLocalReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { handleConfirm(); } }}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              rows={3}
            />

            {localError && <p className="text-xs sm:text-sm text-red-600">{localError}</p>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-xs sm:text-sm"
                type="button"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirm()}
                disabled={submitting}
                className={`flex-1 ${submitting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-lg font-medium text-xs sm:text-sm`}
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
    <div className="min-h-screen bg-white">
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

      {/* Toast Notification for errors/messages */}
      {(error || message) && (
        <ToastNotification
          type={error ? "error" : "success"}
          message={error || message}
          onClose={() => {
            setError("");
            setMessage("");
          }}
        />
      )}

      <main className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 pt-24 pb-[220px] sm:pb-8">
        {/* Page header */}
        <div className="mb-4 sm:px-0">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">{`Welcome, ${tpoData?.user?.name || 'TPO'}..!`}</h1>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav ref={navRef} className="hidden sm:flex items-center space-x-2 overflow-hidden">
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
                    <div className="relative ml-auto" ref={moreRef}>
                      <button
                        onClick={handleMoreToggle}
                        aria-label="More"
                        className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border-transparent rounded"
                      >
                        <span>More</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showMoreDropdown && dropdownCoords && (
                        <div
                          ref={dropdownRef}
                          style={{ position: 'fixed', top: dropdownCoords.top, left: dropdownCoords.left, width: dropdownCoords.width }}
                          className="bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                        >
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
                      )}
                    </div>
                  )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {activeTab === 'dashboard' && (
            <DashboardTab
              loadingBatches={loadingBatches}
              errorBatches={errorBatches}
              assignedBatches={assignedBatches}
            />
          )}

          {activeTab === 'batches' && (
            <BatchesTab
              loadingPlacementBatches={loadingPlacementBatches}
              filteredBatches={filteredBatches}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedCollege={selectedCollege}
              setSelectedCollege={setSelectedCollege}
              selectedTechStack={selectedTechStack}
              setSelectedTechStack={setSelectedTechStack}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              years={years}
              colleges={colleges}
              techStacks={techStacks}
              handleAssignCoordinator={handleAssignCoordinator}
              assigningCoordinatorId={assigningCoordinatorId}
              fetchPlacementTrainingBatches={fetchPlacementTrainingBatches}
              fetchScheduleData={fetchScheduleData}
              fetchStudentDetailsByBatch={fetchStudentDetailsByBatch}
              getTechStackColor={getTechStackColor}
              getTechStackBadgeColor={getTechStackBadgeColor}
              getTrainerAssignmentStatus={getTrainerAssignmentStatus}
            />
          )}

          {activeTab === 'student-details' && (
            <StudentDetailsTab
              loadingStudentDetails={loadingStudentDetails}
              studentSearchTerm={studentSearchTerm}
              setStudentSearchTerm={setStudentSearchTerm}
              selectedBatchFilter={selectedBatchFilter}
              setSelectedBatchFilter={setSelectedBatchFilter}
              selectedCrtFilter={selectedCrtFilter}
              setSelectedCrtFilter={setSelectedCrtFilter}
              selectedCollegeFilter={selectedCollegeFilter}
              setSelectedCollegeFilter={setSelectedCollegeFilter}
              studentBatchData={studentBatchData}
              studentStats={studentStats}
              getFilteredStudents={getFilteredStudents}
              handleAddStudent={handleAddStudent}
              handleEditStudent={handleEditStudent}
              handleDeleteStudent={handleDeleteStudent}
              handleSuspendStudent={handleSuspendStudent}
            />
          )}

          {activeTab === 'suspended' && (
            <SuspendedTab
              loadingSuspended={loadingSuspended}
              suspendedStudents={suspendedStudents}
              handleUnsuspendStudent={handleUnsuspendStudent}
              handleDeleteStudent={handleDeleteStudent}
            />
          )}

          {activeTab === 'statistics' && (
            <StatisticsTab placementBatchData={placementBatchData} />
          )}

          {activeTab === 'attendance' && <TPOAttendanceView />}
          {activeTab === 'student-activity' && <StudentActivity />}

          {activeTab === 'schedule' && (
            loadingSchedule ? <LoadingSkeleton /> : (
              <ScheduleTimetable
                scheduleData={scheduleData}
                loading={loadingSchedule}
                onRefresh={fetchScheduleData}
              />
            )
          )}

          {activeTab === 'placementCalendar' && (
            <div>
              <PlacementCalendar />
            </div>
          )}

          {activeTab === 'placed-students' && (
            <div className="w-full">
              <PlacedStudentsTab />
            </div>
          )}

          {activeTab === 'coordinators' && (
            <CoordinatorsTab
              loadingPlacementBatches={loadingPlacementBatches}
              placementBatchData={placementBatchData}
              fetchPlacementTrainingBatches={fetchPlacementTrainingBatches}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsTab
              loadingApprovals={loadingApprovals}
              pendingApprovals={pendingApprovals}
              fetchPendingApprovals={fetchPendingApprovals}
              setSelectedApproval={setSelectedApproval}
              setShowApprovalDetail={setShowApprovalDetail}
            />
          )}

          {activeTab === 'feedbacks' && (
            <div className="w-full">
              <TPOFeedbackView />
            </div>
          )}

          {/* Mobile bottom nav */}
          <div className="sm:hidden">
            <BottomNav tabs={tabs} active={activeTab} onChange={handleTabClick} />
          </div>
        </div>
      </main>

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
        />
      )}
  </div>
  );
};

export default TPODashboard;
