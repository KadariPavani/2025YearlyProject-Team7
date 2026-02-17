import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, UserCheck, Calendar,
  BookOpen, GraduationCap,
  Monitor, PlusCircle, CheckSquare, FileText,
  ChevronDown
} from 'lucide-react';

import axios from 'axios';
import TrainerPlacementCalendar from "../trainer/TrainerPlacementCalendar";
import Quiz from '../trainer/Quiz';
import Reference from '../trainer/Reference';
import Assignment from '../trainer/Assignment';
import Syllabus from '../trainer/Syllabus';
import Header from '../../components/common/Header';
import BottomNav from '../../components/common/BottomNav';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';

// Tab components
import DashboardTab from './tabs/DashboardTab';
import MyBatchesTab from './tabs/MyBatchesTab';
import StudentsTab from './tabs/StudentsTab';
import ContestsTab from './tabs/ContestsTab';

const TrainerDashboard = () => {
  const [trainerData, setTrainerData] = useState(null);
  const [placementBatches, setPlacementBatches] = useState([]);
  const [placementStats, setPlacementStats] = useState({});
  const [contests, setContests] = useState([]);
  const trainerId = trainerData?._id || trainerData?.id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryUnread, setCategoryUnread] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'batches', label: 'My Batches', icon: GraduationCap },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'assignments', label: 'Assignments', icon: PlusCircle },
    { id: 'quizzes', label: 'Quizzes', icon: CheckSquare },
    { id: 'contests', label: 'Contests', icon: Monitor },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'references', label: 'References', icon: FileText },
    { id: 'placementCalendar', label: 'Calendar', icon: Calendar }
  ];

  // ─── Tab overflow (More dropdown) ───
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

  useEffect(() => {
    const reset = () => { setVisibleTabsCount(tabs.length); setShowMoreDropdown(false); };
    window.addEventListener('resize', reset);
    const mql = window.matchMedia('(min-width: 640px)');
    mql.addEventListener('change', reset);
    return () => { window.removeEventListener('resize', reset); mql.removeEventListener('change', reset); };
  }, [tabs.length]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.offsetWidth === 0) return;
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
    const docClick = (e) => {
      if (moreRef.current && moreRef.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setShowMoreDropdown(false);
    };
    document.addEventListener('click', docClick);
    return () => document.removeEventListener('click', docClick);
  }, []);

  // ─── Data fetching ───
  const fetchTrainerContests = async () => {
    try {
      const token = localStorage.getItem('trainerToken') || localStorage.getItem('userToken');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/contests/admin`, { headers: { Authorization: `Bearer ${token}` } });
      setContests(res.data.contests || []);
    } catch (err) {
      console.error('Error fetching trainer contests:', err);
    }
  };

  useEffect(() => {
    fetchTrainerNotifications();
  }, []);

  const fetchTrainerNotifications = async () => {
    try {
      const token = localStorage.getItem("trainerToken");
      const res = await axios.get("/api/trainer/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notifications = res.data.data || [];
      const unreadByCategory = {
        "My Classes": 0,
        "Placement Calendar": 0,
        ...(res.data.unreadByCategory || {})
      };

      const totalUnread = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);

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
      await axios.put(`/api/notifications/mark-read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTrainerNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("trainerToken") || localStorage.getItem("userToken");
      await axios.put(`/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTrainerNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  useEffect(() => {
    fetchTrainerData();
    fetchPlacementBatches();
    fetchTrainerContests();
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (location?.state?.refreshContests) {
      fetchTrainerContests();
      try { window.history.replaceState({}, document.title, window.location.pathname); } catch(e) {}
    }
  }, [location?.state]);

  const fetchTrainerData = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      const data = localStorage.getItem('trainerData');

      if (!token) {
        navigate('/trainer-login');
        return;
      }

      let parsedData = data ? JSON.parse(data) : null;

      const needsProfile = !parsedData || !(parsedData.name || parsedData.user?.name || parsedData.lastLogin || parsedData.user?.lastLogin);

      if (needsProfile) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trainer/profile`, { headers: { Authorization: `Bearer ${token}` } });
          if (res?.data?.success && res.data.data) {
            parsedData = res.data.data;
            localStorage.setItem('trainerData', JSON.stringify(parsedData));
          }
        } catch (err) {
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

  // ─── Helpers (passed to tab components) ───
  const getTimeSlotColor = (timeSlot) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      afternoon: 'bg-blue-100 text-blue-800 border-blue-200',
      evening: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[timeSlot] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTimeSlotLabel = (timeSlot) => {
    const labels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
    return labels[timeSlot] || timeSlot || '—';
  };

  const getCurrentTimeStatus = (startTime, endTime) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    if (currentTime >= startTime && currentTime <= endTime) {
      return { status: 'ongoing', color: 'bg-green-50 text-green-700 border-green-200', text: 'Live Now' };
    } else if (currentTime < startTime) {
      return { status: 'upcoming', color: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Upcoming' };
    } else {
      return { status: 'completed', color: 'bg-gray-50 text-gray-700 border-gray-200', text: 'Completed' };
    }
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

    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => a.scheduleSlot.startTime.localeCompare(b.scheduleSlot.startTime));
    });

    return weeklySchedule;
  };

  if (loading) return <LoadingSkeleton />;

  const todaySchedule = getTodaySchedule();
  const weeklySchedule = getWeeklySchedule();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
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

      {error && (
        <ToastNotification type="error" message={error} onClose={() => setError("")} />
      )}

      <main className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 pt-24 pb-[220px] sm:pb-8">

        {/* Page header */}
        <div className="mb-4 sm:px-0">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">{`Welcome, ${trainerData?.user?.name || trainerData?.name || 'Trainer'}..!`}</h1>
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

        {/* Mobile Bottom Navigation */}
        <div className="sm:hidden">
          <BottomNav tabs={tabs} active={activeTab} onChange={handleTabClick} counts={{ batches: placementBatches.length }} />
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {activeTab === 'dashboard' && (
            <DashboardTab
              todaySchedule={todaySchedule}
              getTimeSlotColor={getTimeSlotColor}
              getTimeSlotLabel={getTimeSlotLabel}
              getCurrentTimeStatus={getCurrentTimeStatus}
            />
          )}
          {activeTab === 'batches' && (
            <MyBatchesTab
              placementBatches={placementBatches}
              weeklySchedule={weeklySchedule}
              getTimeSlotColor={getTimeSlotColor}
              getTimeSlotLabel={getTimeSlotLabel}
              navigate={navigate}
            />
          )}
          {activeTab === 'students' && (
            <StudentsTab placementBatches={placementBatches} />
          )}
          {activeTab === 'assignments' && <Assignment />}
          {activeTab === 'quizzes' && <Quiz />}
          {activeTab === 'contests' && (
            <ContestsTab contests={contests} setContests={setContests} navigate={navigate} />
          )}
          {activeTab === 'syllabus' && <Syllabus />}
          {activeTab === 'references' && <Reference />}
          {activeTab === 'placementCalendar' && <TrainerPlacementCalendar />}
        </div>
      </main>
    </div>
  );
};

export default TrainerDashboard;
