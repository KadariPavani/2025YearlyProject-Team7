import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Settings, LogOut, Bell, ChevronDown, Building, Calendar, Eye, ChevronRight, Building2, Code2, GraduationCap, X, TrendingUp, Clock, MapPin, Award, Filter, Search, UserPlus, UserCheck, Download, CalendarDays, BookOpen } from 'lucide-react';
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
  
  // Trainer Assignment state
  const [showTrainerAssignment, setShowTrainerAssignment] = useState(false);
  const [selectedBatchForAssignment, setSelectedBatchForAssignment] = useState(null);
  
  // New state for tab navigation and filters
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'batches', 'statistics', 'schedule'
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedTechStack, setSelectedTechStack] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Schedule data state
  const [scheduleData, setScheduleData] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchAssignedBatches();
    fetchPlacementTrainingBatches();
  }, []);

  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchScheduleData();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/auth/dashboard/tpo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const fetchPlacementTrainingBatches = async () => {
    setLoadingPlacementBatches(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/tpo/placement-training-batches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPlacementBatchData(data.data.organized);
        setPlacementStats(data.data.stats);
        // Set default year to latest
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const handleTrainerAssignment = (batchId) => {
    setSelectedBatchForAssignment(batchId);
    setShowTrainerAssignment(true);
  };

  const handleAssignmentUpdate = () => {
    // Refresh the placement training batches data and schedule data
    fetchPlacementTrainingBatches();
    fetchScheduleData();
    setShowTrainerAssignment(false);
    setSelectedBatchForAssignment(null);
  };

  const getTechStackColor = (techStack) => {
    const colors = {
      Java: 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200',
      Python: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
      'AI/ML': 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      NonCRT: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 border-slate-200',
    };
    return colors[techStack] || 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200';
  };

  const getTechStackBadgeColor = (techStack) => {
    const colors = {
      Java: 'bg-red-500',
      Python: 'bg-emerald-500',
      'AI/ML': 'bg-purple-500',
      NonCRT: 'bg-slate-500',
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
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
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

  // Get unique values for filters
  const years = Object.keys(placementBatchData).sort().reverse();
  const colleges = selectedYear !== 'all' && placementBatchData[selectedYear] 
    ? Object.keys(placementBatchData[selectedYear]) 
    : [];
  const techStacks = selectedYear !== 'all' && selectedCollege !== 'all' && placementBatchData[selectedYear]?.[selectedCollege]
    ? Object.keys(placementBatchData[selectedYear][selectedCollege])
    : [];

  // Get filtered batches
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

    // Apply search filter
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TPO Dashboard</h1>
                <p className="text-sm opacity-90">Training Placement Officer</p>
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
          <div className="px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-purple-700">
                  Training Placement Officer
                </h1>
                <p className="text-gray-600 mt-2">Welcome, {tpoData?.user?.name}! - {tpoData?.message}</p>
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
                    <p className="text-lg font-bold text-green-900">{tpoData?.lastLogin ? new Date(tpoData.lastLogin).toLocaleDateString() : 'N/A'}</p>
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
                    <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-1">Assigned Trainers</p>
                    <p className="text-lg font-bold text-pink-900">{tpoData?.assignedTrainers || 0}</p>
                    <p className="text-xs text-pink-700 mt-1">Active Staff</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Companies</p>
                    <p className="text-lg font-bold text-blue-900">{tpoData?.managedCompanies || 0}</p>
                    <p className="text-xs text-blue-700 mt-1">Managed</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500 p-2 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Total Batches</p>
                    <p className="text-lg font-bold text-amber-900">{tpoData?.assignedBatches || 0}</p>
                    <p className="text-xs text-amber-700 mt-1">Assigned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-8">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'dashboard'
                    ? 'border-purple-700 text-purple-700 bg-purple-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'batches'
                    ? 'border-purple-700 text-purple-700 bg-purple-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Training Batches
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'statistics'
                    ? 'border-purple-700 text-purple-700 bg-purple-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'schedule'
                    ? 'border-purple-700 text-purple-700 bg-purple-100'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="h-4 w-4 inline mr-2" />
                Overall Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Manage Students</p>
                  </button>
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Company Relations</p>
                  </button>
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Placement Schedule</p>
                  </button>
                </div>
              </div>

              {/* Recent Assigned Batches */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recently Assigned Batches</h3>
                {loadingBatches ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading batches...</p>
                  </div>
                ) : errorBatches ? (
                  <div className="text-red-500 mb-4">{errorBatches}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignedBatches.slice(0, 4).map(batch => (
                      <div key={batch.id} className="bg-gray-50 border rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
                        <h4 className="font-semibold text-lg mb-2">Batch {batch.batchNumber}</h4>
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
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-purple-700" />
                  <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setSelectedCollege('all');
                        setSelectedTechStack('all');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 disabled:bg-gray-100"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700 disabled:bg-gray-100"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Batches Grid */}
              {loadingPlacementBatches ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading batches...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBatches.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-200">
                      <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No batches found</p>
                    </div>
                  ) : (
                    filteredBatches.map(batch => {
                      const assignmentStatus = getTrainerAssignmentStatus(batch);
                      return (
                        <div key={batch._id} className="bg-white rounded-2xl shadow border border-gray-200 hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 overflow-hidden">
                          <div className={`h-2 ${getTechStackBadgeColor(batch.techStack).replace('bg-', 'bg-opacity-80 ')}`}></div>
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{batch.batchNumber}</h3>
                                <p className="text-sm text-gray-600 mt-1">{batch.college}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTechStackColor(batch.techStack)} border`}>
                                {batch.techStack}
                              </span>
                            </div>

                            <div className="space-y-3 mb-4 text-gray-700 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span><strong>{batch.studentCount}</strong> Students</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(batch.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>Year {batch.year}</span>
                              </div>
                              
                              {/* Trainer Assignment Status */}
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignmentStatus.color} border`}>
                                  {assignmentStatus.icon} {assignmentStatus.status}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedBatch(batch)}
                                className="flex-1 text-white bg-purple-700 hover:bg-purple-800 font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleTrainerAssignment(batch._id)}
                                className="flex-1 text-purple-700 bg-purple-100 hover:bg-purple-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
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

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Statistics</h2>
                {Object.keys(placementBatchData).sort().reverse().map(year => (
                  <div key={year} className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Academic Year {year}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.keys(placementBatchData[year]).map(college => {
                        const totalBatches = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalBatches, 0);
                        const totalStudents = Object.values(placementBatchData[year][college]).reduce((acc, tech) => acc + tech.totalStudents, 0);

                        return (
                          <div key={college} className="bg-gray-50 p-4 rounded border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">{college}</h4>
                            <p className="text-sm text-gray-600 mb-3">{totalBatches} batches • {totalStudents} students</p>
                            {Object.keys(placementBatchData[year][college]).map(techStack => (
                              <div key={techStack} className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">{techStack}</span>
                                <span className="text-gray-700">{placementBatchData[year][college][techStack].totalBatches} batches</span>
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
        </div>
      </div>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl">
            <div className="bg-purple-700 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="h-7 w-7" />
                  {selectedBatch.batchNumber}
                </h3>
                <p className="text-purple-200 text-sm mt-1">{selectedBatch.college} • Year {selectedBatch.year}</p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-xs font-medium text-purple-600 mb-1">Tech Stack</p>
                  <p className="text-lg font-bold text-purple-900">{selectedBatch.techStack}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1">Total Students</p>
                  <p className="text-lg font-bold text-blue-900">{selectedBatch.studentCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1">TPO</p>
                  <p className="text-lg font-bold text-green-900">{selectedBatch.tpoId?.name || 'Not assigned'}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-xs font-medium text-amber-600 mb-1">Start Date</p>
                  <p className="text-lg font-bold text-amber-900">{new Date(selectedBatch.startDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Assigned Trainers Section */}
              {selectedBatch.assignedTrainers && selectedBatch.assignedTrainers.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Assigned Trainers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBatch.assignedTrainers.map((assignment, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {assignment.trainer?.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{assignment.trainer?.name || 'Unknown'}</h5>
                            <p className="text-sm text-gray-600">{assignment.subject}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            assignment.timeSlot === 'morning' ? 'bg-yellow-100 text-yellow-800' :
                            assignment.timeSlot === 'afternoon' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
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

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">College</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tech Stack</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {selectedBatch.students.map((student, idx) => (
                        <tr key={student._id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{student.rollNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.college}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.branch}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
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
    </div>
  );
};

export default TPODashboard;