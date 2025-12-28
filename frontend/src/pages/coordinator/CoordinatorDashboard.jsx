// CoordinatorDashboard.jsx - COMPLETE WITH TEXT LOGIC + ORIGINAL UI MAINTAINED + FIXED STUDENT ACTIVITY TAB
// Replace your CoordinatorDashboard.jsx with this

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, User, Mail, Phone, Clock, Activity,
  Calendar, BookOpen, MapPin, Award, Users, 
  FileText, CheckCircle, Star, Shield, Bell, Settings, LogOut, ChevronDown
} from 'lucide-react';
import BottomNav from '../../components/common/BottomNav';
import PasswordChangeNotification from '../../components/common/PasswordChangeNotification';
import AttendanceMarking from '../coordinator/AttandanceMarking';
import CoordinatorStudentActivity from './CoordinatorStudentActivity';
import Header from '../../components/common/Header';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';

// TEXT LOGIC - All UI strings in one place for consistency
const TEXT = {
  header: {
    title: 'Coordinator Dashboard',
    subtitle: 'Student Coordinator Portal',
    profile: 'Profile',
    logout: 'Logout',
    settings: {
      viewProfile: 'View Profile',
      changePassword: 'Change Password',
    },
  },
  tabs: {
    dashboard: 'Dashboard',
    attendance: 'Attendance',
    studentActivity: 'Student Activity', // Fixed: Added missing label
  },
  welcome: {
    title: (name) => `Welcome, ${name || 'Coordinator'}!`,
    message: (msg) => msg || 'Welcome to your coordinator portal',
    lastLogin: 'Last Login',
  },
  batch: {
    title: 'Assigned Placement Training Batch',
    detailsHeader: 'Batch Details',
    fields: {
      batchNumber: 'Batch Number:',
      techStack: 'Tech Stack:',
      year: 'Year:',
      colleges: 'Colleges:',
      startDate: 'Start Date:',
      endDate: 'End Date:',
      status: 'Status:',
    },
    tpo: {
      header: 'TPO',
      name: 'Name:',
      email: 'Email:',
      notAvailable: 'N/A',
    },
    students: {
      header: (count) => `Students in Batch (${count || 0})`,
      tableHeaders: {
        name: 'Name',
        rollNo: 'Roll No',
        email: 'Email',
        college: 'College',
        branch: 'Branch',
      },
      noStudents: 'No students assigned',
    },
  },
  stats: {
    certificates: 'Certificates',
    projects: 'Projects',
    internships: 'Internships',
    feedbacks: 'Feedbacks',
  },
  quickActions: {
    title: 'Quick Actions',
    verifyCertificates: 'Verify Certificates',
    reviewProjects: 'Review Projects',
    manageFeedbacks: 'Manage Feedbacks',
  },
  errors: {
    fetchFailed: 'Failed to fetch dashboard data',
  },
};

const CoordinatorDashboard = () => {
  const [coordinatorData, setCoordinatorData] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  // Tabs configuration (uses same icons and order as TPO for consistency)
  const tabs = [
    { id: 'dashboard', label: TEXT.tabs.dashboard, icon: UserCheck },
    { id: 'attendance', label: TEXT.tabs.attendance, icon: Clock },
    { id: 'student-activity', label: TEXT.tabs.studentActivity, icon: Activity },
  ];

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSkeleton />; 

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/dashboard/coordinator`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setCoordinatorData(result.data);
      } else {
        setError(TEXT.errors.fetchFailed);
      }
    } catch (err) {
      setError(TEXT.errors.fetchFailed);
    } finally {
      setLoading(false);
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
      navigate('/coordinator-login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-20 pb-20 md:pb-24">
      {/* Password Change Notification */}
      <PasswordChangeNotification 
        userType="coordinator" 
        onPasswordChange={() => navigate('/coordinator-profile')} 
      />
      
      <Header
        title={TEXT.header.title}
        subtitle={TEXT.header.subtitle}
        icon={UserCheck}
        userData={coordinatorData}
        profileRoute="/coordinator-profile"
        changePasswordRoute="/coordinator-change-password"
        onLogout={handleLogout}
        onIconClick={() => {
          if (window.location.pathname === '/coordinator-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/coordinator-dashboard');
          }
        }}
      />

      {/* Welcome / Hero (moved above tabs to match TPO layout) */}
      <div className="bg-white rounded-lg shadow-sm mx-4 md:mx-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between md:p-5">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">{TEXT.welcome.title(coordinatorData?.user?.name)}</h2>
              <p className="text-sm text-gray-600 mt-1">{TEXT.welcome.message(coordinatorData?.message)}</p>
            </div>
            <div className="flex items-center gap-4">
              {coordinatorData?.user?.lastLogin && (
                <div className="text-right text-sm text-gray-500">
                  <div className="text-xs text-gray-400">{TEXT.welcome.lastLogin}</div>
                  <div className="font-medium mt-1">{coordinatorData?.user?.lastLogin ? new Date(coordinatorData.user.lastLogin).toLocaleString() : ''}</div>
                </div>
              )}
              {/* <button onClick={() => navigate('/coordinator-profile')} className="btn-primary">View Profile</button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation (desktop icon+label tabs) */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 border-b-2 font-medium text-xs md:text-sm transition ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Mobile: BottomNav will appear (see component at bottom) */}
        </div>
      </div> 


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-5 text-sm md:text-base">
        {activeTab === 'dashboard' && (
          <>
            {/* Dashboard Main (TPO-style) */}
            <div className="space-y-5">
              {/* Compact Header */}  
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Assigned Batch + Students */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Assigned Batch */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Assigned Batch</h3>

                    {coordinatorData?.user?.assignedPlacementBatch ? (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 sm:p-5 hover:shadow-sm transition-shadow">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">Batch {coordinatorData?.user?.assignedPlacementBatch?.batchNumber} {coordinatorData?.user?.assignedPlacementBatch?.techStack ? `• ${coordinatorData.user.assignedPlacementBatch.techStack}` : ''}</h4>
                        <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                          <div><span className="font-medium text-gray-700">Year:</span> {coordinatorData?.user?.assignedPlacementBatch?.year || '-'}</div>
                          <div><span className="font-medium text-gray-700">Colleges:</span> {coordinatorData?.user?.assignedPlacementBatch?.colleges?.join(', ') || '-'}</div>
                          <div><span className="font-medium text-gray-700">Period:</span> {coordinatorData?.user?.assignedPlacementBatch?.startDate ? new Date(coordinatorData.user.assignedPlacementBatch.startDate).toLocaleDateString() : '-'} - {coordinatorData?.user?.assignedPlacementBatch?.endDate ? new Date(coordinatorData.user.assignedPlacementBatch.endDate).toLocaleDateString() : '-'}</div>
                          <div><span className="font-medium text-gray-700">TPO:</span> {coordinatorData?.user?.assignedPlacementBatch?.tpoId?.name || TEXT.batch.tpo.notAvailable}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">No batch assigned yet.</div>
                    )}
                  </div>

                  {/* Students */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">{TEXT.batch.students.header(coordinatorData?.user?.assignedPlacementBatch?.students?.length)}</h3>
                    {coordinatorData?.user?.assignedPlacementBatch?.students?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {coordinatorData?.user?.assignedPlacementBatch?.students?.map(student => (                          <div key={student._id} className="p-3 rounded-lg border border-gray-100 bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-800">{student.name}</div>
                                <div className="text-xs text-gray-500">{student.rollNo} • {student.college}</div>
                              </div>
                              <div className="text-xs text-gray-500">{student.branch}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500">{TEXT.batch.students.noStudents}</div>
                    )}
                  </div>
                </div>

                {/* Right: Stats + Quick Actions */}
                <div className="space-y-5">
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Overview</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                        <Shield className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">{TEXT.stats.certificates}</div>
                          <div className="font-bold text-xl text-blue-600">0</div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <div className="text-xs text-gray-600">{TEXT.stats.projects}</div>
                          <div className="font-bold text-xl text-green-600">0</div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                        <Award className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-600">{TEXT.stats.internships}</div>
                          <div className="font-bold text-xl text-blue-600">0</div>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-600">{TEXT.stats.feedbacks}</div>
                          <div className="font-bold text-xl text-purple-600">0</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">{TEXT.quickActions.title}</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <button className="px-2 py-1 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 text-left flex items-center gap-3 text-xs">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <div className="text-xs text-gray-700">{TEXT.quickActions.verifyCertificates}</div>
                      </button>

                      <button className="px-2 py-1 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 text-left flex items-center gap-3 text-xs">
                        <Award className="h-5 w-5 text-gray-400" />
                        <div className="text-xs text-gray-700">{TEXT.quickActions.reviewProjects}</div>
                      </button>

                      <button className="px-2 py-1 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 text-left flex items-center gap-3 text-xs">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div className="text-xs text-gray-700">{TEXT.quickActions.manageFeedbacks}</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'attendance' && <AttendanceMarking />}

        {activeTab === 'student-activity' && <CoordinatorStudentActivity />}
      </main>

      {/* Mobile bottom nav (matches TPO style) */}
      <div className="md:hidden">
        <BottomNav tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id)} />
      </div>
    </div>
  );
};

export default CoordinatorDashboard;