// CoordinatorDashboard.jsx - COMPLETE WITH TEXT LOGIC + ORIGINAL UI MAINTAINED + FIXED STUDENT ACTIVITY TAB
// Replace your CoordinatorDashboard.jsx with this

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Settings, LogOut, User, Mail, Phone, Clock,
  Calendar, BookOpen, ChevronDown, MapPin, Award, Users, Bell, 
  FileText, CheckCircle, Star, Shield
} from 'lucide-react';
import PasswordChangeNotification from '../../components/common/PasswordChangeNotification';
import AttendanceMarking from '../coordinator/AttandanceMarking';
import CoordinatorStudentActivity from './CoordinatorStudentActivity';

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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/auth/dashboard/coordinator', {
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
    }
  };

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
      navigate('/coordinator-login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Password Change Notification */}
      <PasswordChangeNotification 
        userType="coordinator" 
        onPasswordChange={() => navigate('/coordinator-profile')} 
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <UserCheck className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{TEXT.header.title}</h1>
                <p className="text-sm opacity-90">{TEXT.header.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Notification Bell */}
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>
              
              {/* Profile Button */}
              <button
                onClick={() => navigate('/coordinator-profile')}
                className="flex items-center space-x-2 p-2 text-white hover:text-gray-200 transition-colors"
              >
                <User className="h-6 w-6" />
                <span className="hidden sm:inline">{TEXT.header.profile}</span>
              </button>
              
              {/* Settings Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="flex items-center space-x-1 p-2 text-white hover:text-gray-200 transition-colors"
                >
                  <Settings className="h-6 w-6" />
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/coordinator-profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {TEXT.header.settings.viewProfile}
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/coordinator-change-password');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {TEXT.header.settings.changePassword}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white text-orange-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>{TEXT.header.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {TEXT.tabs.dashboard}
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attendance'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {TEXT.tabs.attendance}
            </button>
            <button
              onClick={() => setActiveTab('student-activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'student-activity'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {TEXT.tabs.studentActivity}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {TEXT.welcome.title(coordinatorData?.user?.name)}
                  </h2>
                  <p className="text-gray-600">
                    {TEXT.welcome.message(coordinatorData?.message)}
                  </p>
                </div>
                {coordinatorData?.user?.lastLogin && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{TEXT.welcome.lastLogin}</p>
                    <p className="text-sm font-medium">
                      {new Date(coordinatorData.user.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Batch Details Section */}
            {coordinatorData?.user?.assignedPlacementBatch && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">{TEXT.batch.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{TEXT.batch.detailsHeader}</h4>
                    <p>{TEXT.batch.fields.batchNumber} {coordinatorData.user.assignedPlacementBatch.batchNumber}</p>
                    <p>{TEXT.batch.fields.techStack} {coordinatorData.user.assignedPlacementBatch.techStack}</p>
                    <p>{TEXT.batch.fields.year} {coordinatorData.user.assignedPlacementBatch.year}</p>
                    <p>{TEXT.batch.fields.colleges} {coordinatorData.user.assignedPlacementBatch.colleges?.join(', ')}</p>
                    <p>{TEXT.batch.fields.startDate} {new Date(coordinatorData.user.assignedPlacementBatch.startDate).toLocaleDateString()}</p>
                    <p>{TEXT.batch.fields.endDate} {new Date(coordinatorData.user.assignedPlacementBatch.endDate).toLocaleDateString()}</p>
                    <p>{TEXT.batch.fields.status} {coordinatorData.user.assignedPlacementBatch.status}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{TEXT.batch.tpo.header}</h4>
                    <p>{TEXT.batch.tpo.name} {coordinatorData.user.assignedPlacementBatch.tpoId?.name || TEXT.batch.tpo.notAvailable}</p>
                    <p>{TEXT.batch.tpo.email} {coordinatorData.user.assignedPlacementBatch.tpoId?.email || TEXT.batch.tpo.notAvailable}</p>
                  </div>
                </div>
                
                <h4 className="font-medium text-lg mb-4">
                  {TEXT.batch.students.header(coordinatorData.user.assignedPlacementBatch.students?.length)}
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{TEXT.batch.students.tableHeaders.name}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{TEXT.batch.students.tableHeaders.rollNo}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{TEXT.batch.students.tableHeaders.email}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{TEXT.batch.students.tableHeaders.college}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{TEXT.batch.students.tableHeaders.branch}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {coordinatorData.user.assignedPlacementBatch.students?.length > 0 ? (
                        coordinatorData.user.assignedPlacementBatch.students.map((student) => (
                          <tr key={student._id}>
                            <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.rollNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.college}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.branch}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">{TEXT.batch.students.noStudents}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{TEXT.stats.certificates}</h3>
                    <p className="text-3xl font-bold text-orange-600">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{TEXT.stats.projects}</h3>
                    <p className="text-3xl font-bold text-green-600">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Award className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{TEXT.stats.internships}</h3>
                    <p className="text-3xl font-bold text-blue-600">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{TEXT.stats.feedbacks}</h3>
                    <p className="text-3xl font-bold text-purple-600">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">{TEXT.quickActions.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                  <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">{TEXT.quickActions.verifyCertificates}</p>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                  <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">{TEXT.quickActions.reviewProjects}</p>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">{TEXT.quickActions.manageFeedbacks}</p>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'attendance' && <AttendanceMarking />}

        {activeTab === 'student-activity' && <CoordinatorStudentActivity />}
      </main>
    </div>
  );
};

export default CoordinatorDashboard;