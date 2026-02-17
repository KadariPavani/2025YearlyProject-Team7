import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Clock,
  BookOpen, Award, Activity, GraduationCap, Phone, Mail,
  CheckCircle, AlertCircle, UserCheck, Briefcase, School, Monitor, Building2, X,
  PlusCircle, CheckSquare, FileText, User, Menu, Home, Target, TrendingUp, MessageSquare, ChevronLeft, Bell, Settings, LogOut, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import StudentPlacementCalendar from './StudentCalender';
// Import enhanced student components from the second code
import StudentQuiz from './StudentQuiz';
import StudentAssignment from './StudentAssignment';
import StudentResources from './StudentResources';
import StudentAttendanceView from './StudentAttendanceView';
import StudentFeedback from '../student/StudentFeedback';
import StudentActivityView from './StudentActivityView';

import FeedbackPreview from '../../components/feedbackPreview'; // Import feedback preview component
import Header from '../../components/common/Header';
import BottomNav from '../../components/common/BottomNav';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';
import ProfileCompletionModal from '../../components/ui/ProfileCompletionModal';
// Keep placeholder components for the rest as in the first code


const StudentSyllabus = () => (
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
      <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
      <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Course Syllabus</h3>
    </div>
    <div className="p-3 sm:p-4">
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-xs sm:text-sm font-medium text-gray-500">No syllabus available</p>
        <p className="text-gray-400 text-xs">Course syllabus will appear here once uploaded by trainers</p>
      </div>
    </div>
  </div>
);


const StudentContests = ({ contests, loading=false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live');

  if (loading) return <LoadingSkeleton />;

  const now = new Date();
  const liveContests = contests?.filter(c =>
    new Date(c.startTime) <= now && new Date(c.endTime) >= now && !c.myFinalized
  ) || [];
  const upcomingContests = contests?.filter(c =>
    new Date(c.startTime) > now
  ) || [];
  const completedContests = contests?.filter(c =>
    c.myFinalized || new Date(c.endTime) < now
  ) || [];
  const totalContests = contests?.length || 0;

  const getFilteredContests = () => {
    switch(activeTab) {
      case 'live': return liveContests;
      case 'upcoming': return upcomingContests;
      case 'completed': return completedContests;
      default: return contests || [];
    }
  };
  const filteredContests = getFilteredContests();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Coding Contests</h2>
          <p className="text-xs text-gray-500 mt-0.5">{totalContests} contests</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center"><Target className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Live</p>
              <p className="text-sm sm:text-xl font-bold text-green-700">{liveContests.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center"><Calendar className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Upcoming</p>
              <p className="text-sm sm:text-xl font-bold text-blue-600">{upcomingContests.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-md bg-gray-100 items-center justify-center"><CheckCircle className="h-5 w-5 text-gray-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-sm sm:text-xl font-bold text-gray-900">{completedContests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contest Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Blue header with filter tabs */}
        <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <div className="p-2 bg-blue-100 rounded-lg"><Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mr-auto">Contests</h3>
          <div className="flex gap-1">
            {[
              { key: 'live', label: 'Live', count: liveContests.length, active: 'bg-green-600 text-white', dot: 'bg-green-300' },
              { key: 'upcoming', label: 'Upcoming', count: upcomingContests.length, active: 'bg-blue-600 text-white', dot: null },
              { key: 'completed', label: 'Done', count: completedContests.length, active: 'bg-gray-600 text-white', dot: null },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  activeTab === tab.key ? tab.active : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.dot && activeTab === tab.key && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`}></span>}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label}</span>
                <span className={`text-[10px] ${activeTab === tab.key ? 'opacity-80' : 'text-gray-400'}`}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filteredContests.length === 0 ? (
          <div className="text-center py-8 p-3 sm:p-4">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No contests in this category</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Contest</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Schedule</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Qs</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Duration</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContests.map((c, idx) => {
                    const startTime = new Date(c.startTime);
                    const endTime = new Date(c.endTime);
                    const duration = Math.floor((endTime - startTime) / (1000 * 60));
                    const isActive = startTime <= now && endTime >= now && !c.myFinalized;

                    return (
                      <tr key={c._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{c.name}</div>
                          {c.description && <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">{c.description}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isActive ? 'bg-green-100 text-green-800' :
                            c.myFinalized || endTime < now ? 'bg-gray-100 text-gray-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-green-500' : c.myFinalized || endTime < now ? 'bg-gray-400' : 'bg-blue-500'
                            }`}></span>
                            {isActive ? 'Active' : c.myFinalized || endTime < now ? 'Done' : 'Soon'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-700">{startTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                          <div className="text-[10px] sm:text-xs text-gray-400">to {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                        </td>
                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 text-center whitespace-nowrap">{c.questions?.length || 0}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Clock className="h-3 w-3" />
                            {duration}m
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {c.myFinalized || endTime < now ? (
                            <button
                              onClick={() => navigate(`/student/contests/${c._id}/leaderboard`)}
                              className="px-2 sm:px-3 py-1 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600"
                            >
                              Results
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/student/contests/${c._id}`)}
                              className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                            >
                              Enter
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const StudentDashboard = ({ initialTab }) => {
  const [studentData, setStudentData] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [placementBatchInfo, setPlacementBatchInfo] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    quizzes: { total: 0, completed: 0, upcoming: 0, average: 0 },
    assignments: { total: 0, completed: 0, pending: 0, overdue: 0 },
    resources: { total: 0, viewed: 0 },
    performance: { totalQuizzes: 0, averageScore: 0, passRate: 0 }
  });
const [categoryUnread, setCategoryUnread] = useState({
  Placement: 0,
  "Weekly Class Schedule": 0,
  "My Assignments": 0,
  "Available Quizzes": 0,
  "Learning Resources": 0,
});

  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'trainers', label: 'Trainers & Schedule', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: PlusCircle },
    { id: 'student-activity', label: 'Student Activity', icon: Activity },
    { id: 'contests', label: 'Contests', icon: Target },
    { id: 'quizzes', label: 'Quizzes', icon: CheckSquare },
    { id: 'resources', label: 'Resources', icon: FileText },
    { id: 'calendar', label: 'Placement Calendar', icon: Calendar },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'approvals', label: 'Approvals', icon: AlertCircle },
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

  const handleTabClick = (tabId) => {
    if (tabId === 'feedback') { setActiveTab('feedback'); return; }
    setActiveTab(tabId);
    if (tabId === 'trainers') fetchTodaySchedule();
    if (tabId === 'approvals') fetchPendingApprovals();
  };
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [formData, setFormData] = useState({
    crtInterested: false,
    crtBatchChoice: '',
    // other profile fields...
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
// 🔔 Notifications
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [selectedCategory, setSelectedCategory] = useState(null);
const [contests, setContests] = useState([]);
const [loadingContests, setLoadingContests] = useState(false);
// 🔔 Close notification when clicking outside
const notificationRef = useRef(null);

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

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
    fetchBatchInfo();
    fetchPlacementBatchInfo();
    fetchTodaySchedule();
    fetchAssignments();
    fetchQuizzes();
    fetchResources();
    fetchSyllabi();
    fetchPendingApprovals();
    fetchContests();
  }, []);

  // Re-fetch approvals when the approvals tab is opened
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  // When Schedule tab is activated on desktop, fetch today's schedule so skeletons show immediately
  useEffect(() => {
    if (activeTab === 'trainers') {
      fetchTodaySchedule();
    }
  }, [activeTab]);

  // Fetch active contests for student
  const fetchContests = async () => {
    setLoadingContests(true);
    try {
      const token = localStorage.getItem('userToken');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/contests`, { headers: { Authorization: `Bearer ${token}` } });
      setContests(res.data.contests || []);
    } catch (err) {
      console.error('Error fetching contests:', err);
    } finally {
      setLoadingContests(false);
    }
  };

  useEffect(() => {
    if (assignments.length > 0 || quizzes.length > 0 || resources.length > 0) {
      calculateDashboardStats();
    }
  }, [assignments, quizzes, resources]);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/dashboard/student`, {
        headers:
         {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setStudentData(result.data);
        setFormData(prev => ({
          ...prev,
          crtInterested: result.data.crtInterested || false,
          crtBatchChoice: result.data.crtBatchChoice || ''
        }));
      } else {
        setError('Failed to fetch student data');
      }
    } catch (err) {
      setError('Failed to fetch student data');
    }
  };
const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("userToken");
    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/student`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("🔔 Notifications fetched:", res.data);

    const notifications = res.data.data || [];
    const currentStudentId = studentData?.user?.id || studentData?.user?._id || studentData?.id || studentData?._id;
    
    // Try to use backend counts first, fallback to frontend calculation
    let unreadByCategory = res.data.unreadByCategory || {
      Placement: 0,
      "Weekly Class Schedule": 0,
      "My Assignments": 0,
      "Available Quizzes": 0,
      "Learning Resources": 0,
    };
    
    // Double-check by calculating on frontend as well
    let totalUnread = 0;
    notifications.forEach(notification => {
      const recipient = notification.recipients?.find(
        r => {
          const rId = r.recipientId?._id || r.recipientId;
          return rId?.toString() === currentStudentId?.toString();
        }
      );
      const isUnread = recipient && !recipient.isRead;
      
      if (isUnread) {
        console.log(`📝 Frontend counting unread: "${notification.title}" in ${notification.category}`);
        totalUnread++;
      }
    });

    // Use the sum from backend categories
    const backendTotal = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);
    
    console.log("📊 Unread counts:", { 
      backendTotal, 
      frontendTotal: totalUnread, 
      unreadByCategory,
      notificationsCount: notifications.length
    });

    setNotifications(notifications);
    setCategoryUnread(unreadByCategory);
    setUnreadCount(backendTotal); // Use backend total
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
};

// ✅ Fetch notifications only when studentData is available
useEffect(() => {
  if (studentData) {
    fetchNotifications();
  }
}, [studentData]);

const markAsRead = async (id) => {
  try {
    const token = localStorage.getItem("userToken");
    
    // Call backend to mark as read
    await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/mark-read/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log(`✅ Marked notification ${id} as read, refreshing...`);
    
    // Refresh to get updated counts from backend
    await fetchNotifications();
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
};

// ✅ Mark all notifications as read
const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem("userToken");
    
    console.log("� Mark All Read button clicked!");
    console.log("📊 Current unread count:", unreadCount);
    console.log("📊 Current notifications:", notifications.length);
    
    // Call backend to mark all as read
    const response = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/mark-all-read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("✅ Backend response:", response.data);
    
    // Small delay to ensure backend has processed
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Refresh to get updated counts from backend
    await fetchNotifications();
    
    console.log("✅ Successfully refreshed notifications after mark all read");
  } catch (err) {
    console.error("❌ Error marking all notifications as read:", err);
    console.error("Error details:", err.response?.data);
  }
};



  const fetchBatchInfo = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/my-batch`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setBatchInfo(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch batch info:', err);
    }
  };

  const fetchPlacementBatchInfo = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/placement-training-batch-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setPlacementBatchInfo(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch placement batch info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/my-trainers-schedule`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setTodaySchedule(result.data.todaySchedule);
      }
    } catch (err) {
      console.error('Failed to fetch today schedule:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/student/list`, {  // Using path from second code for functionality
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAssignments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      setAssignments([]);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/student/list`, {  // Using path from second code for functionality
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(response.data || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setQuizzes([]);
    }
  };

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/references/student/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setResources(response.data.references || []);
    } catch (err) {
      // Handle 404 gracefully
      if (err.response?.status === 404) {
        setResources([]);
      } else {
        console.error('Failed to fetch resources:', err);
        setResources([]);
      }
    }
  };

  const fetchSyllabi = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/syllabi/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyllabi(response.data || []);
    } catch (err) {
      setSyllabi([]);
    }
  };

  // Add this new function
  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/pending-approvals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.data);
      }
    } catch (err) {
      console.error('Error fetching approvals:', err);
    }
  };

  const calculateDashboardStats = () => {
    // Calculations from the second code
    const completedQuizzes = quizzes.filter(q => q.hasSubmitted);
    const upcomingQuizzes = quizzes.filter(q => {
      const now = new Date();
      const startTime = new Date(`${q.scheduledDate} ${q.startTime}`);
      const endTime = new Date(`${q.scheduledDate} ${q.endTime}`);
      return now < endTime && !q.hasSubmitted;
    });
    const averageQuizScore = completedQuizzes.length > 0
      ? completedQuizzes.reduce((acc, q) => acc + (q.percentage || 0), 0) / completedQuizzes.length
      : 0;

    const completedAssignments = assignments.filter(a => a.hasSubmitted);
    const pendingAssignments = assignments.filter(a => !a.hasSubmitted && !a.isOverdue);
    const overdueAssignments = assignments.filter(a => a.isOverdue && !a.hasSubmitted);

    const totalQuizzesTaken = completedQuizzes.length;
    const passedQuizzes = completedQuizzes.filter(q => q.percentage >= 60).length;
    const passRate = totalQuizzesTaken > 0 ? (passedQuizzes / totalQuizzesTaken) * 100 : 0;

    setDashboardStats({
      quizzes: {
        total: quizzes.length,
        completed: completedQuizzes.length,
        upcoming: upcomingQuizzes.length,
        average: averageQuizScore
      },
      assignments: {
        total: assignments.length,
        completed: completedAssignments.length,
        pending: pendingAssignments.length,
        overdue: overdueAssignments.length
      },
      resources: {
        total: resources.length,
        viewed: resources.filter(r => r.hasViewed).length || 0
      },
      performance: {
        totalQuizzes: totalQuizzesTaken,
        averageScore: averageQuizScore,
        passRate: passRate
      }
    });

    // Upcoming deadlines from second code
    const deadlines = [
      ...assignments.filter(a => !a.hasSubmitted && !a.isOverdue).map(a => ({
        type: 'assignment',
        title: a.title,
        dueDate: a.dueDate,
        subject: a.subject,
        trainer: a.trainer
      })),
      ...upcomingQuizzes.map(q => ({
        type: 'quiz',
        title: q.title,
        dueDate: `${q.scheduledDate} ${q.endTime}`,
        subject: q.subject,
        trainer: q.trainer
      }))
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);

    setUpcomingDeadlines(deadlines);

    // Recent activity from second code
    const activities = [
      ...completedQuizzes.slice(-3).map(q => ({
        type: 'quiz',
        title: `Completed quiz: ${q.title}`,
        date: q.submittedAt,
        score: q.percentage,
        subject: q.subject
      })),
      ...completedAssignments.slice(-3).map(a => ({
        type: 'assignment',
        title: `Submitted assignment: ${a.title}`,
        date: a.lastSubmission?.submittedAt,
        score: a.lastSubmission?.percentage,
        subject: a.subject
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    setRecentActivity(activities);
  };

  const getTimeSlotColor = (timeSlot) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      afternoon: 'bg-blue-100 text-blue-800 border-blue-200',
      evening: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[timeSlot] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTimeSlotIcon = (timeSlot) => {
    const icons = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌙'
    };
    return icons[timeSlot] || '⏰';
  };

  const getCurrentTimeStatus = (startTime, endTime) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    if (currentTime >= startTime && currentTime <= endTime) {
      return { status: 'ongoing', color: 'bg-green-100 text-green-800 border-green-200', text: 'Live' };
    } else if (currentTime < startTime) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Upcoming' };
    } else {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800 border-gray-200', text: ' Completed' };
    }
  };

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
      navigate('/student-login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for CRT-related changes
    if (name === 'crtInterested' || name === 'crtBatchChoice') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        requiresApproval: true
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Update the save function to handle approvals
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('userToken');
      const response = await axios.put('/api/student/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.requiresApproval) {
        setMessage('Profile updated. CRT-related changes have been sent for TPO approval.');
      } else {
        setMessage('Profile updated successfully');
      }

      setProfile(response.data.data);
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;


  // Compute student ID - uses .id not ._id for student data structure
  const computedStudentId = studentData?.user?.id || studentData?.user?._id || studentData?.id || studentData?._id;

  return (
    <div className="min-h-screen bg-white">
      <ProfileCompletionModal
        studentData={studentData}
        show={!loading && !!studentData}
        pendingApprovals={pendingApprovals}
        placementBatchInfo={placementBatchInfo}
      />
      <Header
        title="Student Dashboard"
        subtitle="Placement Training Portal"
        icon={GraduationCap}
        userData={studentData?.user || studentData}
        profileRoute="/student-profile"
        changePasswordRoute="/student-change-password"
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        fetchNotifications={fetchNotifications}
        categoryUnread={categoryUnread}
        unreadCount={unreadCount}
        userType="student"
        userId={computedStudentId}
        onIconClick={() => {
          if (window.location.pathname === '/student-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/student-dashboard');
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

        {/* Welcome */}
        <div className="mb-4 sm:px-0">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Welcome, {studentData?.user?.name || 'Student'}..!</h1>
        </div>

          {/* Approval Status Banner */}
          {pendingApprovals && pendingApprovals.totalPending > 0 && (
            <div className="mb-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">
                      You have {pendingApprovals.totalPending} pending approval request{pendingApprovals.totalPending !== 1 ? 's' : ''} awaiting TPO review
                    </p>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="mt-2 text-xs sm:text-sm text-yellow-700 hover:text-yellow-900 font-semibold underline"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Tab Navigation */}
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

            <div className="sm:hidden">
              <BottomNav tabs={tabs} active={activeTab} onChange={handleTabClick} />
            </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5 sm:space-y-4">
              {/* Stat Cards (moved from header) */}
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg shadow border border-blue-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-100 items-center justify-center"><Calendar className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-xs text-blue-700 leading-relaxed">Last Login</p>
                      <p className="text-sm sm:text-xl font-bold text-blue-900 mt-0.5">{studentData?.lastLogin ? new Date(studentData.lastLogin).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg shadow border border-blue-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-100 items-center justify-center"><PlusCircle className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-xs text-blue-700 leading-relaxed">Assignments</p>
                      <p className="text-sm sm:text-xl font-bold text-blue-900 mt-0.5">{dashboardStats.assignments.completed}/{dashboardStats.assignments.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg shadow border border-blue-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-100 items-center justify-center"><CheckSquare className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-xs text-blue-700 leading-relaxed">Quizzes</p>
                      <p className="text-sm sm:text-xl font-bold text-blue-900 mt-0.5">{dashboardStats.quizzes.completed}/{dashboardStats.quizzes.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg shadow border border-blue-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-100 items-center justify-center"><Award className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-xs text-blue-700 leading-relaxed">Average Score</p>
                      <p className="text-sm sm:text-xl font-bold text-blue-900 mt-0.5">{dashboardStats.quizzes.average.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overdue Alert */}
              {dashboardStats.assignments.overdue > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3" />
                    <div>
                      <p className="font-medium text-red-800 text-xs sm:text-sm">
                        You have {dashboardStats.assignments.overdue} overdue assignment{dashboardStats.assignments.overdue !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-red-600">
                        Please contact your trainer if you need assistance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Batch & TPO Information */}
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow">
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg"><GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Batch & TPO Information</h3>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {batchInfo && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <h4 className="font-semibold text-blue-900 mb-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                          <School className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Your Batch
                        </h4>
                        <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Batch Number:</span>
                            <span className="ml-1.5 sm:ml-2 text-gray-600">{batchInfo.batch.batchNumber}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Colleges:</span>
                            <span className="ml-1.5 sm:ml-2 text-gray-600">{batchInfo.batch.colleges.join(', ')}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Duration:</span>
                            <span className="ml-1.5 sm:ml-2 text-gray-600">
                              {new Date(batchInfo.batch.startDate).toLocaleDateString()} - {new Date(batchInfo.batch.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {batchInfo?.tpo && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <h4 className="font-semibold text-green-900 mb-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                          <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Your TPO
                        </h4>
                        <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="ml-1.5 sm:ml-2 text-gray-600">{batchInfo.tpo.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                            <span className="text-gray-600">{batchInfo.tpo.phone}</span>
                          </div>
                          <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 sm:p-2.5 rounded">
                            Contact your TPO for any queries related to placements and training
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {placementBatchInfo && (
                    <div className="mt-3 sm:mt-4 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <h4 className="font-semibold text-purple-900 mb-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                        <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Placement Training Batch
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                        <div className="flex sm:block gap-2">
                          <span className="text-xs font-medium text-gray-500 sm:block">Batch:</span>
                          <span className="text-xs sm:text-sm text-gray-900 break-all">{placementBatchInfo.placementBatch.batchNumber}</span>
                        </div>
                        <div className="flex sm:block gap-2">
                          <span className="text-xs font-medium text-gray-500 sm:block">Tech Stack:</span>
                          <span className="text-xs sm:text-sm text-gray-900">{placementBatchInfo.placementBatch.techStack}</span>
                        </div>
                        <div className="flex sm:block gap-2">
                          <span className="text-xs font-medium text-gray-500 sm:block">Year:</span>
                          <span className="text-xs sm:text-sm text-gray-900">{placementBatchInfo.placementBatch.year}</span>
                        </div>
                        <div className="flex sm:block gap-2">
                          <span className="text-xs font-medium text-gray-500 sm:block">Trainers:</span>
                          <span className="text-xs sm:text-sm text-gray-900">{placementBatchInfo.totalTrainers} Assigned</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Classes as table */}
              {todaySchedule.length > 0 && (
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow">
                  <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg"><Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Today's Classes ({todaySchedule.length})</h3>
                  </div>
                  <div className="p-3 sm:p-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Trainer</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Subject</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Time</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Slot</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {todaySchedule.map((session, index) => {
                          const timeStatus = getCurrentTimeStatus(session.startTime, session.endTime);
                          return (
                            <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium">{session.trainer.name}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-600">{session.subject}</td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-600">{session.startTime} - {session.endTime}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTimeSlotColor(session.timeSlot)}`}>
                                  {session.timeSlot}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${timeStatus.color}`}>
                                  {timeStatus.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow">
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg"><Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Recent Activity</h3>
                </div>
                <div className="p-3 sm:p-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm font-medium text-gray-500">No recent activity</p>
                    <p className="text-gray-400 text-xs">Your learning progress will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2.5 sm:space-x-3">
                          {activity.type === 'quiz' ? (
                            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full">
                              <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full">
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-xs sm:text-sm leading-relaxed">{activity.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{activity.subject}</p>
                          </div>
                        </div>
                        {activity.score !== undefined && (
                          <div className={`text-xs sm:text-sm font-medium ${
                            activity.score >= 80 ? 'text-green-600' :
                            activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {activity.score.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow">
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Upcoming Deadlines</h3>
                </div>
                <div className="p-3 sm:p-4">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm font-medium text-gray-500">No upcoming deadlines</p>
                    <p className="text-gray-400 text-xs">Assignments and quizzes will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline, index) => {
                      const isUrgent = new Date(deadline.dueDate) - new Date() < 24 * 60 * 60 * 1000;
                      return (
                        <div key={index} className={`p-2.5 sm:p-3 rounded-lg ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 sm:space-x-3">
                              {deadline.type === 'quiz' ? (
                                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-blue-100'}`}>
                                  <CheckSquare className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
                                </div>
                              ) : (
                                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-green-100'}`}>
                                  <FileText className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isUrgent ? 'text-red-600' : 'text-green-600'}`} />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900 text-xs sm:text-sm leading-relaxed">{deadline.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{deadline.subject}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs sm:text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
                                {new Date(deadline.dueDate).toLocaleDateString()}
                              </p>
                              <p className={`text-xs ${isUrgent ? 'text-red-500' : 'text-gray-500'} mt-0.5`}>
                                {new Date(deadline.dueDate).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* Trainers & Schedule Tab (merged) */}
          {activeTab === 'trainers' && (
            <div className="space-y-4">
              {placementBatchInfo ? (
                <>
                  {/* Trainers */}
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow">
                    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Your Training Team ({placementBatchInfo.totalTrainers} Trainers)</h3>
                    </div>

                    {/* Mobile: compact cards */}
                    <div className="sm:hidden p-2 space-y-1.5">
                      {Object.entries(placementBatchInfo.trainerSchedule).flatMap(([timeSlot, trainers]) =>
                        trainers.map((assignment) => (
                          <div key={`m-${timeSlot}-${assignment.trainer.name}`} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ fontSize: '9px' }}>
                                  {assignment.trainer.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-900 truncate">{assignment.trainer.name}</div>
                                  <div className="text-[10px] text-gray-500 truncate">{assignment.subject}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded-full font-medium ${getTimeSlotColor(timeSlot)}`} style={{ fontSize: '9px' }}>{timeSlot}</span>
                                <button onClick={() => setSelectedTrainer(assignment)} className="text-blue-600 text-[10px] font-medium">
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden sm:block p-3 sm:p-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Trainer</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Subject</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Slot</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Classes/Week</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            let rowIdx = 0;
                            return Object.entries(placementBatchInfo.trainerSchedule).flatMap(([timeSlot, trainers]) =>
                              trainers.map((assignment) => {
                                const i = rowIdx++;
                                return (
                                  <tr key={`${timeSlot}-${assignment.trainer.name}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                                          {assignment.trainer.name.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-gray-900">{assignment.trainer.name}</div>
                                          <div className="text-[10px] text-gray-500">{assignment.trainer.category} &middot; {assignment.trainer.experience}y exp</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-600">{assignment.subject}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTimeSlotColor(timeSlot)}`}>{timeSlot}</span>
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-600">{assignment.trainer.email}</td>
                                    <td className="px-3 py-2 text-xs text-gray-900 font-medium">{assignment.schedule?.length || 0}</td>
                                    <td className="px-3 py-2">
                                      <button onClick={() => setSelectedTrainer(assignment)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Weekly Schedule */}
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow">
                    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Weekly Class Schedule</h3>
                    </div>
                    {/* Mobile: compact table */}
                    <div className="sm:hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Day</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Time</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Trainer</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Subject</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            const rows = [];
                            let rowIdx = 0;
                            Object.entries(placementBatchInfo.weeklySchedule).forEach(([day, sessions]) => {
                              if (sessions.length === 0) return;
                              sessions.forEach((session, sIdx) => {
                                const i = rowIdx++;
                                rows.push(
                                  <tr key={`${day}-${sIdx}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                    {sIdx === 0 ? (
                                      <td rowSpan={sessions.length} className="px-3 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap align-top border-r border-gray-100">
                                        {day.slice(0, 3)}
                                      </td>
                                    ) : null}
                                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{session.startTime} - {session.endTime}</td>
                                    <td className="px-3 py-2 text-xs font-medium text-gray-900">{session.trainer.name}</td>
                                    <td className="px-3 py-2">
                                      <div className="text-xs text-gray-600">{session.subject}</div>
                                      <span className={`mt-0.5 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getTimeSlotColor(session.timeSlot)}`}>
                                        {session.timeSlot}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            });
                            return rows.length > 0 ? rows : (
                              <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">No classes scheduled</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Desktop: 7-column grid */}
                    <div className="hidden sm:block p-3 sm:p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
                        {Object.entries(placementBatchInfo.weeklySchedule).map(([day, sessions]) => (
                          <div key={day} className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 text-center border-b border-gray-200 pb-2">
                              {day}
                            </h4>
                            <div className="space-y-1.5">
                              {sessions.length > 0 ? sessions.map((session, index) => (
                                <div key={index} className="bg-white rounded-md p-2.5 border border-gray-200 hover:shadow-md transition-shadow">
                                  <div className="text-xs font-medium text-gray-700 mb-0.5">
                                    {session.startTime} - {session.endTime}
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900 mb-0.5">
                                    {session.trainer.name}
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    {session.subject}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTimeSlotColor(session.timeSlot)}`}>
                                    {session.timeSlot}
                                  </span>
                                </div>
                              )) : (
                                <div className="text-center py-3 text-gray-400 text-xs">
                                  No classes
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow p-6 text-center">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-xs sm:text-sm font-medium text-gray-500">No trainers assigned yet</p>
                  <p className="text-gray-400 text-xs">Complete your profile to get assigned to a training batch</p>
                </div>
              )}
            </div>
          )}


          {/* Use enhanced components from second code for these tabs */}
          {activeTab === 'assignments' && <StudentAssignment />}
          {activeTab === 'quizzes' && <StudentQuiz />}
          {activeTab === 'resources' && <StudentResources />}
{activeTab === 'syllabus' && (
  <div className="space-y-4">
    {syllabi.length === 0 ? (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Course Syllabus</h3>
        </div>
        <div className="p-3 sm:p-4">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">No syllabus available yet</p>
            <p className="text-xs text-gray-400 mt-1">Your trainers will upload the syllabus soon.</p>
          </div>
        </div>
      </div>
    ) : (
      syllabi.map((syllabus) => (
        <div key={syllabus._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden print:shadow-none print:border print:break-inside-avoid">
          {/* Header with title + print */}
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{syllabus.title}</h3>
              {syllabus.description && (
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{syllabus.description}</p>
              )}
            </div>
            <button
              onClick={() => {
                const area = document.getElementById(`print-${syllabus._id}`);
                const original = document.body.innerHTML;
                document.body.innerHTML = area?.innerHTML ?? '';
                window.print();
                document.body.innerHTML = original;
                window.location.reload();
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors print:hidden"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>

          {/* Topics table */}
          <div id={`print-${syllabus._id}`} className="p-3 sm:p-4">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap w-10">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Topic</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.isArray(syllabus.topics) && syllabus.topics.length > 0 ? (
                    syllabus.topics.map((topic, idx) => (
                      <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{idx + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{topic.topicName}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-600">{topic.description || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Clock className="h-3 w-3" />
                            {topic.duration}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-500 text-xs italic">No topics listed for this syllabus.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
)}


          {activeTab === 'contests' && <StudentContests contests={contests} loading={loadingContests} />}
          {activeTab === 'attendance' && <StudentAttendanceView />}
          {activeTab === "calendar" && <StudentPlacementCalendar />}
          {activeTab === 'student-activity' && <StudentActivityView />}
          {activeTab === 'feedback' && <StudentFeedback />}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow">
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg"><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" /></div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">Approval Requests</h3>
                </div>
                <div className="p-3 sm:p-4">
                {!pendingApprovals ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500">Loading approvals...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold mb-2">Pending Requests ({pendingApprovals.pending.length})</h4>
                      {pendingApprovals.pending.length === 0 ? (
                        <div className="text-xs text-gray-500">No pending approval requests.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {pendingApprovals.pending.map((appr) => (
                            <div key={appr._id || appr.approvalId} className="p-2 sm:p-3 rounded-lg border border-orange-200 bg-orange-50">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gray-900 text-xs sm:text-sm">{appr.requestType === 'crt_status_change' ? 'CRT Status Change' : appr.requestType.replace(/_/g, ' ')}</div>
                                  <div className="text-xs text-gray-600">Requested at: {new Date(appr.requestedAt).toLocaleString()}</div>
                                </div>
                                <div className="text-xs text-orange-700 font-semibold">Pending</div>
                              </div>
                              <div className="mt-1.5 text-xs text-gray-700">
                                {appr.requestedChanges?.crtInterested !== undefined && (
                                  <div>Requested CRT Status: {appr.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}</div>
                                )}
                                {appr.requestedChanges?.crtBatchChoice && (
                                  <div>Requested Batch: {appr.requestedChanges.crtBatchChoice}</div>
                                )}
                                {appr.requestedChanges?.techStack && (
                                  <div>Requested Tech Stack: {appr.requestedChanges.techStack.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Approved */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold mb-2">Approved Requests ({pendingApprovals.approved.length})</h4>
                      {pendingApprovals.approved.length === 0 ? (
                        <div className="text-xs text-gray-500">No approved requests.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {pendingApprovals.approved.map((appr) => (
                            <div key={appr._id || appr.approvalId} className="p-2 sm:p-3 rounded-lg border border-green-200 bg-green-50">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gray-900 text-xs sm:text-sm">{appr.requestType === 'crt_status_change' ? 'CRT Status Change' : appr.requestType.replace(/_/g, ' ')}</div>
                                  <div className="text-xs text-gray-600">Requested at: {new Date(appr.requestedAt).toLocaleString()}</div>
                                </div>
                                <div className="text-xs text-green-700 font-semibold">Approved</div>
                              </div>
                              <div className="mt-1.5 text-xs text-gray-700">
                                {appr.requestedChanges?.crtInterested !== undefined && (
                                  <div>Requested CRT Status: {appr.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}</div>
                                )}
                                {appr.requestedChanges?.crtBatchChoice && (
                                  <div>Assigned Batch: {appr.requestedChanges.crtBatchChoice}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rejected */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold mb-2">Rejected Requests ({pendingApprovals.rejected.length})</h4>
                      {pendingApprovals.rejected.length === 0 ? (
                        <div className="text-xs text-gray-500">No rejected requests.</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {pendingApprovals.rejected.map((appr) => (
                            <div key={appr._id || appr.approvalId} className="p-2 sm:p-3 rounded-lg border border-red-200 bg-red-50">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gray-900 text-xs sm:text-sm">{appr.requestType === 'crt_status_change' ? 'CRT Status Change' : appr.requestType.replace(/_/g, ' ')}</div>
                                  <div className="text-xs text-gray-600">Requested at: {new Date(appr.requestedAt).toLocaleString()}</div>
                                </div>
                                <div className="text-xs text-red-700 font-semibold">Rejected</div>
                              </div>
                              <div className="mt-1.5 text-xs text-gray-700">
                                <div><strong>Reason:</strong> {appr.rejectionReason || 'No reason provided'}</div>
                                {appr.requestedChanges?.crtInterested !== undefined && (
                                  <div>Requested CRT Status: {appr.requestedChanges.crtInterested ? 'CRT' : 'Non-CRT'}</div>
                                )}
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
            </div>
          )}
        </div>
      </main>

      {/* Trainer Detail Modal — bottom sheet on mobile, centered on desktop */}
      {selectedTrainer && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedTrainer(null)}
        >
          <div
            className="relative w-full sm:max-w-lg md:max-w-2xl bg-white rounded-t-xl sm:rounded-lg shadow-xl flex flex-col max-h-[92vh] sm:max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 px-4 sm:px-5 py-3.5 sm:py-4 sm:rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                  {selectedTrainer.trainer.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-base font-bold text-gray-900 truncate">{selectedTrainer.trainer.name}</h3>
                  <p className="text-blue-600 text-[10px] sm:text-xs truncate">{selectedTrainer.subject} &bull; {selectedTrainer.trainer.category} Trainer</p>
                </div>
                <button
                  onClick={() => setSelectedTrainer(null)}
                  className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto p-3 sm:p-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
                  <p className="text-[10px] sm:text-xs font-medium text-blue-600 mb-0.5">Experience</p>
                  <p className="text-xs sm:text-sm font-bold text-blue-900">{selectedTrainer.trainer.experience} Years</p>
                </div>
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                  <p className="text-[10px] sm:text-xs font-medium text-green-600 mb-0.5">Classes/Week</p>
                  <p className="text-xs sm:text-sm font-bold text-green-900">{selectedTrainer.schedule?.length || 0}</p>
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <h4 className="font-semibold text-gray-900 mb-1.5 text-xs sm:text-sm">Contact Information</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-700 truncate">{selectedTrainer.trainer.email}</span>
                  </div>
                  {selectedTrainer.trainer.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                      <span className="text-xs sm:text-sm text-gray-700">{selectedTrainer.trainer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTrainer.schedule && selectedTrainer.schedule.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1.5 text-xs sm:text-sm">Weekly Schedule</h4>
                  <div className="grid grid-cols-1 gap-1 sm:gap-1.5">
                    {selectedTrainer.schedule.map((slot, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-2 sm:p-2.5 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 text-xs sm:text-sm">{slot.day}</div>
                            <div className="text-[10px] sm:text-xs text-gray-600">{slot.startTime} - {slot.endTime}</div>
                          </div>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getTimeSlotColor(selectedTrainer.timeSlot)}`}>
                            {selectedTrainer.subject}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;