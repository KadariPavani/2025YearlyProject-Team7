import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Settings, LogOut, Bell, ChevronDown, Calendar, Clock, 
  BookOpen, X, Award, Activity, GraduationCap, Phone, Mail, 
  UserCheck, Briefcase, School, Monitor, Building2, TrendingUp, MapPin, 
  Filter, Search, PlusCircle, CheckSquare, FileText, User, Menu
} from 'lucide-react';
import axios from 'axios';

// Import the original trainer components
import Quiz from '../trainer/Quiz';
import Reference from '../trainer/Reference';
import Assignment from '../trainer/Assignment';
import Syllabus from '../trainer/Syllabus';
import TrainerAttendanceView from './TrainerAttendanceView';
const TrainerDashboard = () => {
  const [trainerData, setTrainerData] = useState(null);
  const [placementBatches, setPlacementBatches] = useState([]);
  const [placementStats, setPlacementStats] = useState({});
  const [regularBatches, setRegularBatches] = useState([]);
  const [availableBatches, setAvailableBatches] = useState({
    regular: [],
    placement: [],
    all: []
  });
  const [batchProgress, setBatchProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // Main tab navigation
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrainerData();
    fetchPlacementBatches();
    fetchRegularBatches();
    fetchAvailableBatches();
  }, []);

  const fetchTrainerData = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      const data = localStorage.getItem('trainerData');
      
      if (!token || !data) {
        navigate('/trainer-login');
        return;
      }

      const parsedData = JSON.parse(data);
      setTrainerData(parsedData);
    } catch (err) {
      setError('Failed to fetch trainer data');
      navigate('/trainer-login');
    }
  };

  const fetchPlacementBatches = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('trainerToken');
      const response = await fetch('/api/trainer/placement-training-batches', {
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

      const response = await axios.get('/api/quizzes/batches', {
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
        axios.get('/api/quizzes/batches', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { regular: [], placement: [], all: [] } })),
        axios.get('/api/assignments/batches', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { regular: [], placement: [], all: [] } })),
        axios.get('/api/references/batches', {
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
      await fetch('/api/trainer/logout', {
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

  // Render Regular Batches Tab - Using UI from first code
  const renderRegularBatches = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Regular Batches ({regularBatches.length})
        </h3>
        
        {regularBatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {regularBatches.map((batch) => (
              <div key={batch._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Batch {batch.batchNumber}</h4>
                    <p className="text-sm text-gray-600">Regular Training Batch</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    Active
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{batch.students?.length || 0} Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Students:</h5>
                  {batch.students && batch.students.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {batch.students.map((student) => (
                        <div key={student._id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-gray-700">{student.name}</span>
                          <span className="text-gray-500">- {student.email}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No students in this batch.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No regular batches assigned yet</p>
            <p className="text-gray-400 text-sm">Contact your administrator for batch assignments</p>
          </div>
        )}
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Trainer Dashboard</h1>
                <p className="text-sm opacity-90">Training Management Portal</p>
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
                        navigate('/trainer-profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/trainer-change-password');
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
                  Welcome, {trainerData?.name}!
                </h1>
                <p className="text-gray-600 mt-2">{trainerData?.subjectDealing} - {trainerData?.category} Trainer</p>
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
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Last Login</p>
                    <p className="text-lg font-bold text-green-900">{trainerData?.lastLogin ? new Date(trainerData.lastLogin).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-green-700 mt-1">Welcome Back!</p>
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 rounded-2xl p-5 border border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-500 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">Total Students</p>
                    <p className="text-lg font-bold text-pink-900">{placementStats.totalStudents || 0}</p>
                    <p className="text-xs text-pink-700 mt-1">Under Training</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Training Batches</p>
                    <p className="text-lg font-bold text-blue-900">{placementStats.totalBatches || 0}</p>
                    <p className="text-xs text-blue-700 mt-1">Assigned</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Experience</p>
                    <p className="text-lg font-bold text-amber-900">{trainerData?.experience || 0} Years</p>
                    <p className="text-xs text-amber-700 mt-1">Professional</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-8">
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'classes'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                My Classes
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Schedule
              </button>
              <button
                onClick={() => setActiveTab('regular-batches')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'regular-batches'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Regular Batches
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'students'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Students
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
                onClick={() => setActiveTab('references')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                  activeTab === 'references'
                    ? 'border-blue-700 text-blue-700 bg-blue-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                References
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Today's Classes */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  Today's Classes ({todaySchedule.length})
                </h3>
                
                {todaySchedule.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todaySchedule.map((classSession, index) => {
                      const timeStatus = getCurrentTimeStatus(classSession.scheduleSlot.startTime, classSession.scheduleSlot.endTime);
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{classSession.batchNumber}</h4>
                              <p className="text-sm text-gray-600">{classSession.techStack}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${timeStatus.color}`}>
                              {timeStatus.text}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{classSession.myAssignment.subject}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{classSession.scheduleSlot.startTime} - {classSession.scheduleSlot.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{classSession.studentCount} Students</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTimeSlotColor(classSession.myAssignment.timeSlot)}`}>
                              {getTimeSlotIcon(classSession.myAssignment.timeSlot)} {classSession.myAssignment.timeSlot}
                            </span>
                            <button 
                              onClick={() => setSelectedBatch(classSession)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details →
                            </button>
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

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveTab('assignments')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-center group"
                  >
                    <PlusCircle className="h-12 w-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-blue-600 font-medium">Create Assignment</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('quizzes')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 text-center group"
                  >
                    <CheckSquare className="h-12 w-12 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-green-600 font-medium">Create Quiz</p>
                  </button>

                  <button 
                    onClick={() => setActiveTab('syllabus')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 text-center group"
                  >
                    <BookOpen className="h-12 w-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-purple-600 font-medium">Manage Syllabus</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('attendance')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all duration-300 text-center group"
                  >
                    <Users className="h-12 w-12 text-gray-400 group-hover:text-pink-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-pink-600 font-medium">View Attandance</p>
                  </button>

                  <button 
                    onClick={() => setActiveTab('references')}
                    className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 text-center group"
                  >
                    <FileText className="h-12 w-12 text-gray-400 group-hover:text-orange-500 mx-auto mb-3 transition-colors" />
                    <p className="text-gray-600 group-hover:text-orange-600 font-medium">Upload References</p>
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{placementStats.totalBatches || 0}</div>
                    <div className="text-sm text-gray-600 mt-1">Training Batches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{placementStats.totalStudents || 0}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{regularBatches.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Regular Batches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{trainerData?.experience || 0}</div>
                    <div className="text-sm text-gray-600 mt-1">Years Experience</div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  My Training Classes ({placementBatches.length})
                </h3>
                
                {placementBatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {placementBatches.map((batch) => (
                      <div key={batch._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{batch.batchNumber}</h4>
                            <p className="text-sm text-gray-600">{batch.techStack} - Year {batch.year}</p>
                            <p className="text-sm text-gray-500">{batch.colleges.join(', ')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${batch.status === 'Ongoing' ? 'bg-green-100 text-green-800' : batch.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                            {batch.status}
                          </span>
                        </div>

                        {batch.myAssignment && (
                          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                            <h5 className="font-semibold text-gray-900 mb-3">My Assignment</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Subject:</span>
                                <span className="ml-2 text-gray-600">{batch.myAssignment.subject}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Time Slot:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getTimeSlotColor(batch.myAssignment.timeSlot)}`}>
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
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {batch.studentCount} Students
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(batch.startDate).toLocaleDateString()}
                            </span>
                          </div>
                          <button 
                            onClick={() => setSelectedBatch(batch)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Students
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  Weekly Class Schedule
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                  {Object.entries(weeklySchedule).map(([day, classes]) => (
                    <div key={day} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 text-center border-b border-gray-200 pb-2">
                        {day}
                      </h4>
                      <div className="space-y-2">
                        {classes.length > 0 ? classes.map((classSession, index) => (
                          <div key={index} className="bg-white rounded-md p-3 border border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {classSession.scheduleSlot.startTime} - {classSession.scheduleSlot.endTime}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {classSession.batchNumber}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {classSession.myAssignment.subject}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTimeSlotColor(classSession.myAssignment.timeSlot)}`}>
                              {getTimeSlotIcon(classSession.myAssignment.timeSlot)} {classSession.myAssignment.timeSlot}
                            </span>
                            <div className="text-xs text-blue-600 mt-1">
                              {classSession.studentCount} students
                            </div>
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
            </div>
          )}

          {/* Regular Batches Tab */}
          {activeTab === 'regular-batches' && renderRegularBatches()}


          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  All My Students ({placementBatches.reduce((acc, batch) => acc + batch.studentCount, 0)})
                </h3>
                
                {placementBatches.length > 0 ? (
                  <div className="space-y-8">
                    {placementBatches.map((batch) => (
                      <div key={batch._id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{batch.batchNumber}</h4>
                              <p className="text-sm text-gray-600">{batch.techStack} - {batch.colleges.join(', ')}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{batch.studentCount}</div>
                              <div className="text-sm text-gray-600">Students</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {batch.students && batch.students.map((student, idx) => (
                                <tr key={student._id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {student.name.charAt(0)}
                                      </div>
                                      <span className="font-medium text-gray-900">{student.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{student.rollNo}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.college}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.branch}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <a href={`mailto:${student.email}`} className="text-blue-600 hover:text-blue-800 text-sm">
                                      {student.email}
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
          {activeTab==='attendance' && <TrainerAttendanceView  />}

          {activeTab === 'references' && <Reference availableBatches={availableBatches} />}
        </div>
      </div>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl">
            <div className="bg-blue-700 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="h-7 w-7" />
                  {selectedBatch.batchNumber}
                </h3>
                <p className="text-blue-200 text-sm mt-1">{selectedBatch.techStack} - {selectedBatch.colleges.join(', ')}</p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1">Students</p>
                  <p className="text-lg font-bold text-blue-900">{selectedBatch.studentCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1">Tech Stack</p>
                  <p className="text-lg font-bold text-green-900">{selectedBatch.techStack}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-xs font-medium text-purple-600 mb-1">Year</p>
                  <p className="text-lg font-bold text-purple-900">{selectedBatch.year}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs font-medium text-amber-600 mb-1">Status</p>
                  <p className="text-lg font-bold text-amber-900">{selectedBatch.status}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">College</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {selectedBatch.students && selectedBatch.students.map((student, idx) => (
                        <tr key={student._id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{student.rollNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.college}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.branch}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a href={`mailto:${student.email}`} className="text-blue-600 hover:text-blue-800 text-sm">
                              {student.email}
                            </a>
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
    </div>
  );
};

export default TrainerDashboard;