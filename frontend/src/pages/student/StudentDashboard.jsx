import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Settings, LogOut, User, Mail, Phone, Clock,
  Calendar, BookOpen, ChevronDown, MapPin, Award, Users, Bell, 
  FileText, Code, CheckCircle, Star, AlertCircle
} from 'lucide-react';
import PasswordChangeNotification from '../../components/common/PasswordChangeNotification';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Quick action cards
  const quickActions = [
    { 
      title: 'Profile',
      icon: User,
      description: 'View and edit your profile',
      onClick: () => navigate('/student/profile'),
      color: 'bg-blue-500'
    },
    {
      title: 'Assignments',
      icon: FileText,
      description: 'View your assignments',
      onClick: () => navigate('/student/assignments'),
      color: 'bg-green-500'
    },
    {
      title: 'Attendance',
      icon: Clock,
      description: 'Check your attendance',
      onClick: () => navigate('/student/attendance'),
      color: 'bg-yellow-500'
    },
    {
      title: 'Coding Practice',
      icon: Code,
      description: 'Practice coding problems',
      onClick: () => navigate('/student/coding'),
      color: 'bg-purple-500'
    }
  ];

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/auth/dashboard/student', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setStudentData(result.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
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
      navigate('/student-login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg inline-flex items-center text-red-700 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
          <button 
            onClick={fetchDashboard}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Password Change Notification */}
      <PasswordChangeNotification 
        userType="student" 
        onPasswordChange={() => navigate('/student-profile')} 
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
                <p className="text-sm opacity-90">Student Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>
              
              <button
                onClick={() => navigate('/student-profile')}
                className="flex items-center space-x-2 p-2 text-white hover:text-gray-200 transition-colors"
              >
                <User className="h-6 w-6" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              
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
                        navigate('/student-profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/student-change-password');
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
                className="flex items-center space-x-2 bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {studentData?.user?.name || 'Student'}!
              </h2>
              <p className="text-gray-600">
                {studentData?.message || 'Welcome to your student portal'}
              </p>
            </div>
            {studentData?.lastLogin && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-sm font-medium">
                  {new Date(studentData.lastLogin).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Code className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Coding Tests</h3>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Certificates</h3>
                <p className="text-3xl font-bold text-yellow-600">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`${action.color} text-white p-6 rounded-xl hover:opacity-90 transition-opacity`}
                >
                  <Icon className="h-8 w-8 mx-auto mb-3" />
                  <h4 className="font-semibold text-lg mb-1">{action.title}</h4>
                  <p className="text-sm opacity-90">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
