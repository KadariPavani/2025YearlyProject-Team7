import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Settings, LogOut, Bell, ChevronDown, Calendar, Clock, 
  BookOpen, Award, Activity, GraduationCap, Phone, Mail, 
  CheckCircle, AlertCircle, UserCheck, Briefcase, School, Monitor, Building2, X,
  PlusCircle, CheckSquare, FileText, User, Menu, Target, TrendingUp
} from 'lucide-react';
import axios from 'axios';

// Import student components (these would be the original student components for quizzes/assignments)
// You'll need to create/import these components similar to trainer components
const StudentQuiz = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <CheckSquare className="h-6 w-6 text-blue-600" />
      Available Quizzes
    </h3>
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No quizzes available</p>
      <p className="text-gray-400 text-sm">Quizzes assigned by trainers will appear here</p>
    </div>
  </div>
);

const StudentAssignment = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <PlusCircle className="h-6 w-6 text-blue-600" />
      My Assignments
    </h3>
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <PlusCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No assignments available</p>
      <p className="text-gray-400 text-sm">Assignments from trainers will appear here</p>
    </div>
  </div>
);

const StudentResources = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <FileText className="h-6 w-6 text-blue-600" />
      Learning Resources
    </h3>
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No resources available</p>
      <p className="text-gray-400 text-sm">Learning materials and resources will appear here</p>
    </div>
  </div>
);

const StudentSyllabus = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <BookOpen className="h-6 w-6 text-blue-600" />
      Course Syllabus
    </h3>
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No syllabus available</p>
      <p className="text-gray-400 text-sm">Course syllabus will appear here once uploaded by trainers</p>
    </div>
  </div>
);

const StudentProgress = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <TrendingUp className="h-6 w-6 text-blue-600" />
      My Progress
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">Assignments</h4>
            <p className="text-blue-700 text-sm">Completed Tasks</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-blue-900 mb-2">0/0</div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-600 p-2 rounded-lg">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">Quizzes</h4>
            <p className="text-green-700 text-sm">Test Scores</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-green-900 mb-2">0/0</div>
        <div className="w-full bg-green-200 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-900">Attendance</h4>
            <p className="text-purple-700 text-sm">Class Participation</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-purple-900 mb-2">0%</div>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 rounded-xl p-6">
      <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No recent activity</p>
        <p className="text-gray-400 text-sm">Your learning progress will appear here</p>
      </div>
    </div>
  </div>
);

const StudentCertificates = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
      <Award className="h-6 w-6 text-blue-600" />
      My Certificates
    </h3>
    <div className="text-center py-12 bg-gray-50 rounded-xl">
      <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 font-medium">No certificates earned yet</p>
      <p className="text-gray-400 text-sm">Complete assignments and quizzes to earn certificates</p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);
  const [placementBatchInfo, setPlacementBatchInfo] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
    fetchBatchInfo();
    fetchPlacementBatchInfo();
    fetchTodaySchedule();
    fetchAssignments();
    fetchQuizzes();
  }, []);

  const fetchStudentData = async () => {
    try {
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
        setError('Failed to fetch student data');
      }
    } catch (err) {
      setError('Failed to fetch student data');
    }
  };

  const fetchBatchInfo = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/student/my-batch', {
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
      const response = await fetch('/api/student/placement-training-batch-info', {
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
      const response = await fetch('/api/student/my-trainers-schedule', {
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
      const response = await axios.get('/api/student/assignments', {
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
      const response = await axios.get('/api/student/quizzes', {
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
      return { status: 'ongoing', color: 'bg-green-100 text-green-800 border-green-200', text: '🔴 Live Now' };
    } else if (currentTime < startTime) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800 border-blue-200', text: '⏰ Upcoming' };
    } else {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800 border-gray-200', text: '✅ Completed' };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
                <p className="text-sm opacity-90">Placement Training Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
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
          <div className="px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-blue-700">
                  Welcome, {studentData?.user?.name || 'Student'}!
                </h1>
                <p className="text-gray-600 mt-2">{studentData?.message || 'Welcome to your placement training portal'}</p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Data</span>
              </div>
            </div>
          </div>

          {/* Info Cards Row */}
          <div className="px-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Last Login</p>
                    <p className="text-lg font-bold text-green-900">{studentData?.lastLogin ? new Date(studentData.lastLogin).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-green-700 mt-1">Welcome Back!</p>
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 rounded-2xl p-5 border border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-500 p-2 rounded-lg">
                    <PlusCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">Assignments</p>
                    <p className="text-lg font-bold text-pink-900">{assignments.length || 0}</p>
                    <p className="text-xs text-pink-700 mt-1">Available</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Quizzes</p>
                    <p className="text-lg font-bold text-blue-900">{quizzes.length || 0}</p>
                    <p className="text-xs text-blue-700 mt-1">Available</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Certificates</p>
                    <p className="text-lg font-bold text-amber-900">0</p>
                    <p className="text-xs text-amber-700 mt-1">Earned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-8">
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('trainers')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'trainers'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                My Trainers
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Class Schedule
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'assignments'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <PlusCircle className="h-4 w-4 inline mr-1" />
                Assignments
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'quizzes'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CheckSquare className="h-4 w-4 inline mr-1" />
                Quizzes
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'resources'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Resources
              </button>
              <button
                onClick={() => setActiveTab('syllabus')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'syllabus'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-1" />
                Syllabus
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'progress'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Progress
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'certificates'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Award className="h-4 w-4 inline mr-1" />
                Certificates
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Batch & TPO Information */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  Batch & TPO Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Regular Batch Info */}
                  {batchInfo && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <School className="h-5 w-5" />
                        Your Batch
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">Batch Number:</span>
                          <span className="ml-2 text-blue-700">{batchInfo.batch.batchNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Colleges:</span>
                          <span className="ml-2 text-blue-700">{batchInfo.batch.colleges.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Duration:</span>
                          <span className="ml-2 text-blue-700">
                            {new Date(batchInfo.batch.startDate).toLocaleDateString()} - {new Date(batchInfo.batch.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TPO Info */}
                  {batchInfo?.tpo && (
                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Your TPO
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-green-800">Name:</span>
                          <span className="ml-2 text-green-700">{batchInfo.tpo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span className="text-green-700">{batchInfo.tpo.phone}</span>
                        </div>
                        <p className="text-xs text-green-600 mt-3 bg-green-100 p-2 rounded">
                          Contact your TPO for any queries related to placements and training
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Placement Training Batch Info */}
                {placementBatchInfo && (
                  <div className="mt-6 bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Placement Training Batch
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium text-purple-800">Batch:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.placementBatch.batchNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">Tech Stack:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.placementBatch.techStack}</span>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">Year:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.placementBatch.year}</span>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">Trainers:</span>
                        <span className="ml-2 text-purple-700">{placementBatchInfo.totalTrainers} Assigned</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Today's Classes */}
              {todaySchedule.length > 0 && (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock className="h-6 w-6 text-blue-600" />
                    Today's Classes ({todaySchedule.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todaySchedule.map((session, index) => {
                      const timeStatus = getCurrentTimeStatus(session.startTime, session.endTime);
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h5 className="font-semibold text-gray-900">{session.trainer.name}</h5>
                              <p className="text-sm text-gray-600">{session.subject}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${timeStatus.color}`}>
                              {timeStatus.text}
                            </span>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{session.startTime} - {session.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{session.trainer.email}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTimeSlotColor(session.timeSlot)}`}>
                            {getTimeSlotIcon(session.timeSlot)} {session.timeSlot}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveTab('assignments')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-center group"
                  >
                    <PlusCircle className="h-12 w-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-blue-600 font-medium">View Assignments</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('quizzes')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 text-center group"
                  >
                    <CheckSquare className="h-12 w-12 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-green-600 font-medium">Take Quizzes</p>
                  </button>

                  <button 
                    onClick={() => setActiveTab('progress')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 text-center group"
                  >
                    <TrendingUp className="h-12 w-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-purple-600 font-medium">View Progress</p>
                  </button>

                  <button 
                    onClick={() => setActiveTab('resources')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 text-center group"
                  >
                    <FileText className="h-12 w-12 text-gray-400 group-hover:text-orange-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-orange-600 font-medium">Study Resources</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trainers Tab */}
          {activeTab === 'trainers' && (
            <div className="space-y-6">
              {placementBatchInfo ? (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Your Training Team ({placementBatchInfo.totalTrainers} Trainers)
                  </h3>
                  
                  {/* Time Slot Based Trainer Display */}
                  {Object.entries(placementBatchInfo.trainerSchedule).map(([timeSlot, trainers]) => (
                    trainers.length > 0 && (
                      <div key={timeSlot} className="mb-8">
                        <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                          timeSlot === 'morning' ? 'text-yellow-700' :
                          timeSlot === 'afternoon' ? 'text-blue-700' : 'text-purple-700'
                        }`}>
                          <span className="text-2xl">{getTimeSlotIcon(timeSlot)}</span>
                          {timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} Session
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {trainers.map((assignment, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {assignment.trainer.name.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900">{assignment.trainer.name}</h5>
                                  <p className="text-sm text-gray-600">{assignment.trainer.category} Trainer</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3 mb-4">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Subject:</span>
                                  <span className="ml-2 text-sm text-gray-600">{assignment.subject}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Experience:</span>
                                  <span className="ml-2 text-sm text-gray-600">{assignment.trainer.experience} years</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{assignment.trainer.email}</span>
                                </div>
                                {assignment.trainer.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">{assignment.trainer.phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTimeSlotColor(timeSlot)}`}>
                                  {assignment.schedule?.length || 0} Classes/Week
                                </span>
                                <button
                                  onClick={() => setSelectedTrainer(assignment)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  View Schedule →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
                  <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No trainers assigned yet</p>
                  <p className="text-gray-400 text-sm">Complete your profile to get assigned to a training batch</p>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {placementBatchInfo ? (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    Weekly Class Schedule
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {Object.entries(placementBatchInfo.weeklySchedule).map(([day, sessions]) => (
                      <div key={day} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 text-center border-b border-gray-200 pb-2">
                          {day}
                        </h4>
                        <div className="space-y-2">
                          {sessions.length > 0 ? sessions.map((session, index) => (
                            <div key={index} className="bg-white rounded-md p-3 border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                {session.startTime} - {session.endTime}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 mb-1">
                                {session.trainer.name}
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                {session.subject}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getTimeSlotColor(session.timeSlot)}`}>
                                {getTimeSlotIcon(session.timeSlot)} {session.timeSlot}
                              </span>
                            </div>
                          )) : (
                            <div className="text-center py-4 text-gray-400 text-sm">
                              No classes
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No schedule available</p>
                  <p className="text-gray-400 text-sm">Complete your profile to see your class schedule</p>
                </div>
              )}
            </div>
          )}

          {/* Student Component Tabs */}
          {activeTab === 'assignments' && <StudentAssignment />}
          {activeTab === 'quizzes' && <StudentQuiz />}
          {activeTab === 'resources' && <StudentResources />}
          {activeTab === 'syllabus' && <StudentSyllabus />}
          {activeTab === 'progress' && <StudentProgress />}
          {activeTab === 'certificates' && <StudentCertificates />}
        </div>
      </div>

      {/* Trainer Detail Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
            <div className="bg-blue-700 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-7 w-7" />
                  {selectedTrainer.trainer.name}
                </h3>
                <p className="text-blue-200 text-sm mt-1">{selectedTrainer.subject} - {selectedTrainer.trainer.category} Trainer</p>
              </div>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1">Experience</p>
                  <p className="text-lg font-bold text-blue-900">{selectedTrainer.trainer.experience} Years</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1">Classes/Week</p>
                  <p className="text-lg font-bold text-green-900">{selectedTrainer.schedule?.length || 0}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{selectedTrainer.trainer.email}</span>
                  </div>
                  {selectedTrainer.trainer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{selectedTrainer.trainer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTrainer.schedule && selectedTrainer.schedule.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Weekly Schedule</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedTrainer.schedule.map((slot, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{slot.day}</div>
                            <div className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTimeSlotColor(selectedTrainer.timeSlot)}`}>
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