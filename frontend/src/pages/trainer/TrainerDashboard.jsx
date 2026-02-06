import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, UserCheck, Calendar, Clock,
  BookOpen, X, Award, Activity, GraduationCap, Phone, Mail,
  Briefcase, School, Monitor, Building2, TrendingUp, MapPin,
  Filter, Search, PlusCircle, CheckSquare, FileText, User, Menu,
  MessageSquare, ChevronDown, Edit, Trash2, Eye, BarChart
} from 'lucide-react';

import axios from 'axios';
import TrainerPlacementCalendar from "../trainer/TrainerPlacementCalendar";
// Import the original trainer components
import Quiz from '../trainer/Quiz';
import Reference from '../trainer/Reference';
import Assignment from '../trainer/Assignment';
import Syllabus from '../trainer/Syllabus';
import TrainerAttendanceView from './TrainerAttendanceView';
import FeedbackWidget from '../../components/FeedbackWidget';
import TrainerStudentActivity from './TrainerStudentActivity';
import Header from '../../components/common/Header';
import BottomNav from '../../components/common/BottomNav';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
const TrainerDashboard = () => {
  const [trainerData, setTrainerData] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [placementBatches, setPlacementBatches] = useState([]);
  const [placementStats, setPlacementStats] = useState({});
  const [regularBatches, setRegularBatches] = useState([]);
  const [availableBatches, setAvailableBatches] = useState({
    regular: [],
    placement: [],
    all: []
  });
  const [contests, setContests] = useState([]);
const trainerId = trainerData?._id || trainerData?.id || null;

  // Fetch trainer's contests
  const fetchTrainerContests = async () => {
    try {
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/contests/admin`, { headers: { Authorization: `Bearer ${token}` } });
      setContests(res.data.contests || []);
    } catch (err) {
      console.error('Error fetching trainer contests:', err);
    }
  };
  const [batchProgress, setBatchProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // Main tab navigation
  const [classFilter, setClassFilter] = useState('ongoing'); // all|ongoing|upcoming|completed
const [showNotifications, setShowNotifications] = useState(false);
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [categoryUnread, setCategoryUnread] = useState({});
const [selectedCategory, setSelectedCategory] = useState(null);

const notificationRef = useRef(null);

  // Tabs + responsive 'More' dropdown (match TPO style)
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'classes', label: 'My Classes', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'student-activity', label: 'Student Activity', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'assignments', label: 'Assignments', icon: PlusCircle },
    { id: 'quizzes', label: 'Quizzes', icon: CheckSquare },
    { id: 'contests', label: 'Contests', icon: Monitor },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'references', label: 'References', icon: FileText },
    { id: 'placementCalendar', label: 'Placement Calendar', icon: Calendar },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare }
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
    const width = 224; // matches w-56
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

  const handleTabClick = (id) => {
    setActiveTab(id);
  };

  // Dynamic overflow: reset on resize, then cascade to find how many tabs fit
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

  // close 'More' on outside click
  useEffect(() => {
    const docClick = (e) => {
      if (moreRef.current && moreRef.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setShowMoreDropdown(false);
    };
    document.addEventListener('click', docClick);
    return () => document.removeEventListener('click', docClick);
  }, []);

  // Batch modal state for mobile view
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // controls animation state
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const batchModalRef = useRef(null);

  const fetchBatchDetails = async (batchId) => {
    try {
      setBatchLoading(true);
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      const res = await axios.get(`/api/trainer/placement-batch-details/${batchId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res?.data?.success) {
        setSelectedBatchDetails(res.data.data);
      } else {
        setSelectedBatchDetails(null);
      }
    } catch (err) {
      console.error('Failed to fetch batch details:', err);
      setSelectedBatchDetails(null);
    } finally {
      setBatchLoading(false);
      setShowBatchModal(true);
    }
  };

  const handleViewClick = (batchId) => {
    // On mobile, open modal overlay; on desktop, navigate to batch page
    if (window.innerWidth < 640) {
      fetchBatchDetails(batchId);
    } else {
      navigate(`/trainer/batches/${batchId}`);
    }
  };

  // Close modal on outside click (animate close)
  useEffect(() => {
    if (!showBatchModal) return;
    const onDocClick = (e) => {
      if (batchModalRef.current && !batchModalRef.current.contains(e.target)) {
        setModalOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showBatchModal]);

  // Animate modal opening when it is mounted
  useEffect(() => {
    if (showBatchModal) {
      setModalOpen(false);
      const id = setTimeout(() => setModalOpen(true), 20);
      return () => clearTimeout(id);
    }
  }, [showBatchModal]);

  // After closing animation finishes, unmount modal and clear details
  useEffect(() => {
    if (!modalOpen && showBatchModal) {
      const id = setTimeout(() => {
        setShowBatchModal(false);
        setSelectedBatchDetails(null);
      }, 300); // match transition duration
      return () => clearTimeout(id);
    }
  }, [modalOpen, showBatchModal]);

  const navigate = useNavigate();

// Initial fetch only - polling handled by Header component
useEffect(() => {
  fetchTrainerNotifications();
}, []);

const fetchTrainerNotifications = async () => {
  try {
    const token = localStorage.getItem("trainerToken");
    const currentTrainerId = trainerData?._id || trainerData?.id;


    const res = await axios.get("/api/trainer/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const notifications = res.data.data || [];

// ✅ Ensure Placement Calendar is tracked even if backend doesn’t send it
const unreadByCategory = {
  "My Classes": 0,
  "Placement Calendar": 0,
  ...(res.data.unreadByCategory || {})
};

// ✅ Auto-count unread manually if backend didn’t categorize it
notifications.forEach(n => {
  const category = n.category || "Placement Calendar";
  const currentTrainerId = trainerData?._id || trainerData?.id;
  const recipient = n.recipients?.find(
    r => r.recipientId?.toString() === currentTrainerId?.toString()
  );
  const isUnread = recipient && !recipient.isRead;
  if (isUnread) {
    console.log(`📝 Trainer found unread: "${n.title}" in ${category}`);
  }
});

const totalUnread = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);

console.log("📊 Trainer unread counts:", {
  totalUnread,
  unreadByCategory,
  notificationsCount: notifications.length
});

setNotifications(notifications);
setCategoryUnread(unreadByCategory);
setUnreadCount(totalUnread);

  } catch (err) {
    console.error("Error fetching trainer notifications:", err);
  }
};

const markAsRead = async (id) => {
  try {
    const token = localStorage.getItem("trainerToken") || localStorage.getItem("userToken");
    
    // Call backend to mark as read
    await axios.put(`/api/notifications/mark-read/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log(`✅ Trainer: Marked notification ${id} as read, refreshing...`);
    
    // Refresh to get updated counts from backend
    await fetchTrainerNotifications();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

// ✅ Mark all notifications as read
const markAllAsRead = async () => {
  try {
    const token = localStorage.getItem("trainerToken") || localStorage.getItem("userToken");
    
    console.log("📬 Trainer: Marking all notifications as read...");
    
    // Call backend to mark all as read
    await axios.put(`/api/notifications/mark-all-read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("✅ Trainer: Marked all as read, refreshing...");
    
    // Refresh to get updated counts from backend
    await fetchTrainerNotifications();
    
    console.log("✅ Trainer: Successfully updated all notifications");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
};

  useEffect(() => {
    fetchTrainerData();
    fetchPlacementBatches();
    fetchRegularBatches();
    fetchTrainerContests();
    fetchAvailableBatches();
  }, []);

  // Refresh contests when returning from creation flow
  const location = useLocation();
  useEffect(() => {
    if (location?.state?.refreshContests) {
      fetchTrainerContests();
      // clear navigation state so refresh only happens once
      try { window.history.replaceState({}, document.title, window.location.pathname); } catch(e) {}
    }
  }, [location?.state]);

  useEffect(() => {
    fetchFeedbackPreview();
  }, []);

  const fetchTrainerData = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      const data = localStorage.getItem('trainerData');

      if (!token) {
        navigate('/trainer-login');
        return;
      }

      let parsedData = data ? JSON.parse(data) : null;

      // If local trainerData is minimal (e.g., only id & userType), fetch full profile from API
      const needsProfile = !parsedData || !(parsedData.name || parsedData.user?.name || parsedData.lastLogin || parsedData.user?.lastLogin);

      if (needsProfile) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trainer/profile`, { headers: { Authorization: `Bearer ${token}` } });
          if (res?.data?.success && res.data.data) {
            parsedData = res.data.data; // full trainer object
            // store latest in localStorage for consistency
            localStorage.setItem('trainerData', JSON.stringify(parsedData));
          }
        } catch (err) {
          // If profile fetch fails, fallback to whatever was available locally
          console.warn('Failed to fetch full trainer profile:', err?.response?.data || err.message || err);
        }
      }

      if (!parsedData) {
        navigate('/trainer-login');
        return;
      }

      setTrainerData(parsedData);
    } catch (err) {
      setError('Failed to fetch trainer data');
      navigate('/trainer-login');
    }
  };

  const fetchPlacementBatches = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trainer/placement-training-batches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setPlacementBatches(data.data.batches || []);
        setPlacementStats(data.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to fetch placement batches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch regular batches for quiz/assignment functionality
  const fetchRegularBatches = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/batches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRegularBatches(response.data || []);
    } catch (err) {
      console.error('Failed to fetch regular batches:', err);
      setRegularBatches([]);
    }
  };

  // NEW: Fetch all available batches for components - This is the key integration from second code
  const fetchAvailableBatches = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      // Fetch batches for quizzes, assignments, and references
      const [quizBatches, assignmentBatches, referenceBatches] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/batches`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { regular: [], placement: [], all: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assignments/batches`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { regular: [], placement: [], all: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/references/batches`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { regular: [], placement: [], all: [] } }))
      ]);

      // Use quiz batches as the primary source
      setAvailableBatches(quizBatches.data || { regular: [], placement: [], all: [] });
    } catch (err) {
      console.error('Failed to fetch available batches:', err);
      setAvailableBatches({ regular: [], placement: [], all: [] });
    }
  };

  const fetchBatchProgress = async (quizId) => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');

      const response = await axios.get(`/api/quizzes/${quizId}/batch-progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBatchProgress(response.data);
    } catch (err) {
      console.error('Failed to fetch batch progress:', err);
      setError(err.response?.data?.message || 'Failed to fetch batch progress');
    }
  };

  const fetchFeedbackPreview = async () => {
    try {
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback/trainer/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res?.data?.success && res.data.data) {
        setFeedbackStats(res.data.data.statistics || null);
        setRecentFeedbacks((res.data.data.feedbacks || []).slice(0, 3));
      } else if (Array.isArray(res.data)) {
        // fallback if endpoint returns raw array
        setRecentFeedbacks(res.data.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching trainer feedback preview:', err);
    }
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

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = [];

    placementBatches.forEach(batch => {
      if (batch.myAssignment && batch.myAssignment.schedule) {
        batch.myAssignment.schedule.forEach(slot => {
          if (slot.day === today) {
            todayClasses.push({
              ...batch,
              scheduleSlot: slot
            });
          }
        });
      }
    });

    return todayClasses.sort((a, b) => a.scheduleSlot.startTime.localeCompare(b.scheduleSlot.startTime));
  };

  const getCurrentTimeStatus = (startTime, endTime) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    if (currentTime >= startTime && currentTime <= endTime) {
      return { status: 'ongoing', color: 'bg-green-100 text-green-800 border-green-200', text: '🔴 Live Now' };
    } else if (currentTime < startTime) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800 border-blue-200', text: '⏰ Upcoming' };
    } else {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800 border-gray-200', text: '✅ Completed' };
    }
  };

  const getWeeklySchedule = () => {
    const weeklySchedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach(day => {
      weeklySchedule[day] = [];
    });

    placementBatches.forEach(batch => {
      if (batch.myAssignment && batch.myAssignment.schedule) {
        batch.myAssignment.schedule.forEach(slot => {
          weeklySchedule[slot.day].push({
            ...batch,
            scheduleSlot: slot
          });
        });
      }
    });

    // Sort each day's schedule by start time
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => a.scheduleSlot.startTime.localeCompare(b.scheduleSlot.startTime));
    });

    return weeklySchedule;
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trainer/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userToken');
      localStorage.removeItem('trainerToken');
      localStorage.removeItem('trainerData');
      navigate('/trainer-login');
    }
  };



  const renderContests = () => (
    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-lg md:text-xl font-semibold text-blue-800 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-blue-600" />
          My Contests ({contests.length})
        </h3>
        <div className="ml-auto">
          <button onClick={() => navigate('/trainer/contests/create')} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:bg-blue-700 transition">Create Contest</button>
        </div>
      </div>

      {contests.length > 0 ? (
        <div className="space-y-4">
          {contests.map(c => (
            <div key={c._id} className="p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-base md:text-lg font-semibold text-blue-800 truncate">{c.name}</h4>
                <p className="text-sm text-gray-600 mt-1 max-h-12 overflow-hidden">{c.description}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(c.startTime).toLocaleString()} - {new Date(c.endTime).toLocaleString()}</p>
              </div>

              <div className="mt-3 sm:mt-0 flex gap-2 items-center flex-nowrap">
                <button onClick={() => navigate(`/trainer/contests/${c._id}`)} className="p-2 sm:px-3 sm:py-1 bg-white border rounded-full sm:rounded-md text-sm inline-flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="hidden sm:inline">View</span>
                </button>

                <button onClick={() => navigate(`/trainer/contests/${c._id}`, { state: { edit: true } })} className="p-2 sm:px-3 sm:py-1 border rounded-full sm:rounded-md text-sm inline-flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-600" />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                { (new Date(c.endTime) < new Date() || !c.isActive) && (
                  <button aria-label="Leaderboard" onClick={() => navigate(`/trainer/contests/${c._id}/leaderboard`)} className="p-2 sm:px-3 sm:py-1 bg-yellow-600 text-white rounded-full sm:rounded-md text-sm inline-flex items-center gap-2">
                    <BarChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Leaderboard</span>
                  </button>
                ) }

                <button aria-label="Delete contest" onClick={async () => {
                  if (!window.confirm('Delete this contest?')) return;
                  const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
                  try {
                    await axios.delete(`/api/contests/admin/${c._id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setContests(prev => prev.filter(x => x._id !== c._id));
                  } catch (err) {
                    console.error('Delete contest error', err);
                    alert(err.response?.data?.error || 'Failed to delete contest');
                  }
                }} className="p-2 sm:px-3 sm:py-1 bg-red-500 text-white rounded-full sm:rounded-md text-sm inline-flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No contests created yet.</p>
        </div>
      )}
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  if (error && !trainerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const todaySchedule = getTodaySchedule();
  const weeklySchedule = getWeeklySchedule();

  // --- added: safe average value to avoid accessing .avg on null ---
  const _avgFeedbackValue = Number(feedbackStats?.avg);
  const avgFeedbackDisplay = Number.isFinite(_avgFeedbackValue) ? _avgFeedbackValue.toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header
        title="Trainer Dashboard"
        subtitle="Training Management Portal"
        icon={UserCheck}
        userData={trainerData?.user || trainerData}
        profileRoute="/trainer-profile"
        changePasswordRoute="/trainer-change-password"
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        fetchNotifications={fetchTrainerNotifications}
        categoryUnread={categoryUnread}
        unreadCount={unreadCount}
        userType="trainer"
        userId={trainerId}
        onIconClick={() => {
          if (window.location.pathname === '/trainer-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/trainer-dashboard');
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-24 sm:pb-8">


        {/* Header Section */}
        <div className="bg-white border-gray-200 shadow-sm">
          <div className="px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="truncate text-2xl md:text-3xl font-bold text-blue-700">
                  Welcome, {trainerData?.user?.name || trainerData?.name || 'Trainer'}!
                </h1>
                <p className="truncate text-gray-600 mt-1 text-sm md:text-base">{trainerData?.user?.subjectDealing || trainerData?.subjectDealing} - {trainerData?.user?.category || trainerData?.category} Trainer</p>
              </div>
            </div>
          </div>

          {/* Info Cards Row */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-600 p-2 rounded-lg items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Last Login</p>
                    <p className="text-sm sm:text-base font-bold text-blue-900">{(trainerData && (trainerData.lastLogin || trainerData.user?.lastLogin || trainerData.lastLoginAt || trainerData.user?.lastLoginAt)) ? new Date(trainerData.lastLogin || trainerData.user?.lastLogin || trainerData.lastLoginAt || trainerData.user?.lastLoginAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-600 p-2 rounded-lg items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Total Students</p>
                    <p className="text-sm sm:text-base font-bold text-blue-900">{placementStats.totalStudents || 0}</p>
                    <p className="text-xs text-blue-700 mt-1">Under Training</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-500 p-2 rounded-lg items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Training Batches</p>
                    <p className="text-sm sm:text-base font-bold text-blue-900">{placementStats.totalBatches || 0}</p>
                    <p className="text-xs text-blue-700 mt-1">Assigned</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex bg-blue-600 p-2 rounded-lg items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Experience</p>
                    <p className="truncate text-sm sm:text-base font-bold text-blue-900">{trainerData?.experience || 0} Years</p>
                    <p className="text-xs text-blue-700 mt-1">Professional</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation (TPO-style with responsive 'More') */}
          <div className="px-0">
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav ref={navRef} className="hidden sm:flex items-center space-x-2 px-2 overflow-hidden">
                  {tabs.slice(0, visibleTabsCount).map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
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

                      {/* Fixed-position dropdown so it isn't clipped by parents */}
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

                {/* Mobile bottom nav */}
                <div className="sm:hidden">
                  <BottomNav tabs={tabs} active={activeTab} onChange={handleTabClick} counts={{ classes: placementBatches.length }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Today's Classes */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 md:p-8">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  <Clock className="h-5 md:h-6 w-5 md:w-6 text-blue-600" />
                  Today's Classes ({todaySchedule.length})
                </h3>

                {todaySchedule.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {todaySchedule.map((classSession, index) => {
                      const timeStatus = getCurrentTimeStatus(classSession.scheduleSlot.startTime, classSession.scheduleSlot.endTime);
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3 md:mb-4 min-w-0">
                            <div className="min-w-0">
                              <h4 className="truncate font-semibold text-gray-900 text-sm md:text-base">{classSession.batchNumber}</h4>
                              <p className="truncate text-xs md:text-sm text-gray-600">{classSession.techStack}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${timeStatus.color}`}>
                              {timeStatus.text}
                            </span>
                          </div>

                          <div className="space-y-2 mb-3 md:mb-4">
                            <div className="flex items-center gap-2 text-xs md:text-sm">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700 text-xs md:text-sm">{classSession.myAssignment.subject}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs md:text-sm">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700 text-xs md:text-sm">{classSession.scheduleSlot.startTime} - {classSession.scheduleSlot.endTime}</span>
                            </div>

                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${getTimeSlotColor(classSession.myAssignment.timeSlot)}`}>
                              {getTimeSlotIcon(classSession.myAssignment.timeSlot)} {classSession.myAssignment.timeSlot}
                            </span>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No classes scheduled for today</p>
                    <p className="text-gray-400 text-sm">Enjoy your free day!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'student-activity' && <TrainerStudentActivity />}



          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 md:p-8">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 md:h-6 w-5 md:w-6 text-blue-600" />
                  My Training Classes ({placementBatches.length})
                </h3>

                {placementBatches.length > 0 ? (
                  <>
                    {/* Mobile compact list */}
                    <div className="space-y-3 sm:hidden">
                      {placementBatches.map((batch) => (
                        <div key={batch._id} className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate">{batch.batchNumber}</h4>
                            <p className="text-xs text-gray-500 truncate">{batch.techStack} • Year {batch.year}</p>
                            <p className="text-xs text-gray-400 truncate">{(batch.colleges || []).slice(0,2).join(', ')}{(batch.colleges || []).length > 2 ? '...' : ''}</p>
                          </div>
                          <div className="ml-3 flex flex-col items-end gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${batch.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' : batch.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                              {batch.status}
                            </span>
                            <button onClick={() => handleViewClick(batch._id)} className="text-blue-600 text-sm font-medium">View</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop grid */}
                    <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                      {placementBatches.map((batch) => (
                        <div key={batch._id} className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-3 md:mb-4">
                            <div>
                              <h4 className="text-base md:text-lg font-semibold text-gray-900">{batch.batchNumber}</h4>
                              <p className="text-xs md:text-sm text-gray-600">{batch.techStack} - Year {batch.year}</p>
                              <p className="text-xs md:text-sm text-gray-500 truncate">{batch.colleges.join(', ')}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${batch.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' : batch.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                              {batch.status}
                            </span>
                          </div>

                          {batch.myAssignment && (
                            <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm">My Assignment</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700 text-xs">Subject:</span>
                                  <span className="ml-2 text-gray-600 text-xs">{batch.myAssignment.subject}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 text-xs">Time Slot:</span>
                                  <span className={`ml-2 px-2 py-1 rounded text-[10px] font-medium ${getTimeSlotColor(batch.myAssignment.timeSlot)}`}>
                                    {getTimeSlotIcon(batch.myAssignment.timeSlot)} {batch.myAssignment.timeSlot}
                                  </span>
                                </div>
                              </div>

                              {batch.myAssignment.schedule && batch.myAssignment.schedule.length > 0 && (
                                <div className="mt-4">
                                  <h6 className="font-medium text-gray-700 mb-2">Schedule ({batch.myAssignment.schedule.length} slots):</h6>
                                  <div className="grid grid-cols-2 gap-2">
                                    {batch.myAssignment.schedule.slice(0, 4).map((slot, index) => (
                                      <div key={index} className="text-xs bg-blue-50 rounded p-2 border border-blue-200">
                                        <div className="font-medium text-blue-800">{slot.day}</div>
                                        <div className="text-blue-600">{slot.startTime} - {slot.endTime}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {batch.myAssignment.schedule.length > 4 && (
                                    <div className="text-xs text-gray-500 mt-1">+{batch.myAssignment.schedule.length - 4} more slots</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs md:text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs md:text-sm">{new Date(batch.startDate).toLocaleDateString()}</span>
                              </span>
                            </div>

                            <div>
                              <button onClick={() => navigate(`/trainer/batches/${batch._id}`)} className="text-blue-600 text-sm font-medium">View</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No training classes assigned yet</p>
                    <p className="text-gray-400 text-sm">Contact your TPO for class assignments</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Details Modal (mobile) */}
          {showBatchModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${modalOpen ? 'opacity-100' : 'opacity-0'}`}></div>

              {/* Slide-up modal styled like BottomNav (rounded top corners) */}
              <div className="relative w-full sm:max-w-lg flex justify-center">
                <div
                  ref={batchModalRef}
                  className={`bg-white w-full rounded-t-3xl sm:rounded-xl p-4 sm:p-6 shadow-2xl border-t border-blue-400 transition-transform duration-300 ease-out transform ${modalOpen ? 'translate-y-0' : 'translate-y-full'}`}
                  style={{ maxHeight: '80vh', overflow: 'auto' }}
                >
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3"></div>

                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold">{selectedBatchDetails?.batchInfo?.batchNumber || 'Batch Details'}</h4>
                    <button onClick={() => setModalOpen(false)} className="text-gray-500">Close</button>
                  </div>

                  {batchLoading ? (
                    <div className="py-8 text-center"><LoadingSkeleton /></div>
                  ) : selectedBatchDetails ? (
                    <div className="space-y-3 text-sm text-gray-700">
                      <div><span className="font-medium">Tech Stack:</span> {selectedBatchDetails.batchInfo.techStack}</div>
                      <div><span className="font-medium">Year:</span> {selectedBatchDetails.batchInfo.year}</div>
                      <div><span className="font-medium">Status:</span> {selectedBatchDetails.batchInfo.status}</div>
                      <div><span className="font-medium">Start Date:</span> {new Date(selectedBatchDetails.batchInfo.startDate).toLocaleDateString()}</div>

                      <div className="mt-2">
                        <h5 className="font-medium mb-1">My Assignment</h5>
                        {selectedBatchDetails.myAssignment ? (
                          <div className="text-sm text-gray-700">
                            <div><span className="font-medium">Subject:</span> {selectedBatchDetails.myAssignment.subject}</div>
                            <div><span className="font-medium">TimeSlot:</span> {selectedBatchDetails.myAssignment.timeSlot}</div>
                            <div className="mt-2">Schedule:
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {selectedBatchDetails.myAssignment.schedule?.map((s,i)=>(
                                  <div key={i} className="text-xs bg-blue-50 rounded p-2 border border-blue-200">
                                    <div className="font-medium text-blue-800">{s.day}</div>
                                    <div className="text-blue-600">{s.startTime} - {s.endTime}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : <div className="text-gray-500">No assignment yet</div>}
                      </div>

 
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500">Failed to load details</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    Weekly Class Schedule
                  </h3>
                  <div className="text-sm text-gray-500">{Object.values(placementBatches || []).length} classes</div>
                </div>

                {/* Desktop table: days as columns, classes stacked inside cells (large screens only) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="bg-gray-50">
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                          <th key={day} className="px-2 py-1 text-left text-[9px] font-semibold text-gray-700 uppercase tracking-wide border-r border-gray-200 min-w-[100px]">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                          <td key={day} className="align-top px-2 py-1 border-r border-gray-100 min-h-[56px]">
                            <div className="space-y-1">
                              {(weeklySchedule[day] || []).length > 0 ? (weeklySchedule[day]).map((classSession, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded-md p-1 shadow-sm hover:shadow transition-shadow cursor-default flex flex-col text-[11px]">
                                  <div>
                                    <div className="text-[11px] font-medium text-gray-900">{classSession.batchNumber}</div>
                                    <div className="text-[9px] text-gray-500">{classSession.myAssignment?.subject}</div>
                                    <div className="text-[9px] text-gray-600 mt-1">{classSession.scheduleSlot.startTime} - {classSession.scheduleSlot.endTime}</div>
                                  </div>
                                  <div className="flex items-center justify-start mt-2">
                                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${getTimeSlotColor(classSession.myAssignment?.timeSlot)}`}>
                                      {getTimeSlotIcon(classSession.myAssignment?.timeSlot)} {classSession.myAssignment?.timeSlot}
                                    </span>
                                  </div>
                                </div>
                              )) : (
                                <div className="text-center py-1 text-gray-400 text-[9px]">No classes</div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tablet grid: medium screens show a compact multi-column day grid */}
                <div className="hidden md:grid lg:hidden grid-cols-2 md:grid-cols-3 gap-3">
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                    <div key={day} className="bg-white rounded-md border border-gray-200 p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-gray-900">{day}</div>
                        <div className="text-xs text-gray-500">{(weeklySchedule[day] || []).length}</div>
                      </div>

                      <div className="space-y-1">
                        {(weeklySchedule[day] || []).length > 0 ? (weeklySchedule[day]).map((classSession, idx) => (
                          <div key={idx} className="mb-1 bg-gray-50 border border-gray-100 rounded p-1">
                            <div className="text-[11px] font-medium text-gray-900">{classSession.batchNumber}</div>
                            <div className="text-[9px] text-gray-500">{classSession.myAssignment?.subject}</div>
                            <div className="text-[9px] text-gray-600 mt-1">{classSession.scheduleSlot.startTime} - {classSession.scheduleSlot.endTime}</div>
                            <div className="mt-1">
                              <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${getTimeSlotColor(classSession.myAssignment?.timeSlot)}`}>
                                {getTimeSlotIcon(classSession.myAssignment?.timeSlot)} {classSession.myAssignment?.timeSlot}
                              </span>
                            </div>
                          </div>
                        )) : (
                          <div className="text-sm text-gray-400">No classes</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile stacked view: day sections with compact cards (like TPO) */}
                <div className="sm:hidden space-y-3">
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => (
                    <div key={day} className="bg-white rounded-md border border-gray-200 p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm text-gray-900">{day}</div>
                        <div className="text-xs text-gray-500">{(weeklySchedule[day] || []).length} slots</div>
                      </div>

                      {(weeklySchedule[day] || []).length > 0 ? (weeklySchedule[day]).map((classSession, idx) => (
                        <div key={idx} className="mb-1 bg-gray-50 border border-gray-100 rounded p-1">
                          <div>
                            <div className="font-medium text-xs">{classSession.batchNumber}</div>
                            <div className="text-xs text-gray-500">{classSession.myAssignment?.subject}</div>
                            <div className="text-xs text-gray-600 mt-1">{classSession.scheduleSlot.startTime} - {classSession.scheduleSlot.endTime}</div>
                          </div>

                          <div className="mt-2">
                            <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${getTimeSlotColor(classSession.myAssignment?.timeSlot)}`}>
                              {getTimeSlotIcon(classSession.myAssignment?.timeSlot)} {classSession.myAssignment?.timeSlot}
                            </span>
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm text-gray-400">No classes</div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}



          {/* Contests Tab */}
          {activeTab === 'contests' && renderContests()}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">All My Students</h3>
                      <p className="text-xs text-gray-600 mt-1">{placementBatches.reduce((acc, batch) => acc + batch.studentCount, 0)} students across {placementBatches.length} batches</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">Refresh</button>
                  </div>
                </div>

                {placementBatches.length > 0 ? (
                  <div className="space-y-6">
                    {placementBatches.map((batch) => (
                      <div key={batch._id} className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{batch.batchNumber}</h4>
                              <p className="text-xs text-gray-600">{batch.techStack} • {batch.colleges.join(', ')}</p>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold text-blue-800">{batch.studentCount}</div>
                              <div className="text-xs text-blue-600">Students</div>
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                                  <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Roll</th>
                                  <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">College</th>
                                  <th className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-600 uppercase">Branch</th>
                                  <th className="px-3 py-2 text-center text-xs md:text-sm font-medium text-gray-600 uppercase">Contact</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {batch.students && batch.students.map((student, idx) => (
                                  <tr key={student._id} className={`${idx%2===0?'bg-white':'bg-gray-50'}`}>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">{student.name.charAt(0)}</div>
                                        <div className="min-w-0">
                                          <div className="font-medium text-sm truncate">{student.name}</div>
                                          <div className="text-xs text-gray-500 truncate">{student.email}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-xs md:text-sm font-mono">{student.rollNo}</td>
                                    <td className="px-3 py-2 text-xs md:text-sm">{student.college}</td>
                                    <td className="px-3 py-2 text-xs md:text-sm">{student.branch}</td>
                                    <td className="px-3 py-2 text-center text-xs md:text-sm">
                                      <a href={`mailto:${student.email}`} className="text-blue-600 hover:text-blue-800">{student.email}</a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile stacked view */}
                          <div className="sm:hidden divide-y divide-gray-200">
                            {batch.students && batch.students.map((student, idx) => (
                              <div key={student._id} className={`p-3 flex items-center justify-between ${idx%2===0?'bg-white':'bg-gray-50'}`}>
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{student.name?.charAt(0)}</div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">{student.name}</div>
                                    <div className="text-xs text-gray-500 truncate">{student.email}</div>
                                    <div className="text-xs text-gray-500 truncate">{student.college}</div>
                                  </div>
                                </div>

                                <div className="w-28 flex flex-col items-end text-right">
                                  <div className="text-sm font-semibold">{student.rollNo}</div>
                                  <div className="text-xs text-gray-600 mt-1">{student.branch}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No students assigned yet</p>
                    <p className="text-gray-400 text-sm">Students will appear here once you're assigned to training batches</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Original Component Tabs - With availableBatches prop from second code */}
          {activeTab === 'assignments' && <Assignment availableBatches={availableBatches} />}
          {activeTab === 'quizzes' && <Quiz availableBatches={availableBatches} />}
          {activeTab === 'syllabus' && <Syllabus availableBatches={availableBatches} />}
          {activeTab === 'attendance' && <TrainerAttendanceView />}

          {activeTab === 'references' && <Reference availableBatches={availableBatches} />}
          {activeTab === "placementCalendar" && <TrainerPlacementCalendar />}

          {/* Feedback Tab - New Section */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Student Feedback</h3>
                {/* Feedback content will be added here */}
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default TrainerDashboard;