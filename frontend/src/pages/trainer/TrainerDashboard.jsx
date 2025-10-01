import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, BookOpen, Calendar, Bell, Users, Activity, FileText, Clock,
  PlusCircle, CheckSquare, LogOut, Menu, X, Settings, ChevronDown,
  GraduationCap,
} from 'lucide-react';
import axios from 'axios';

// Import components
import Quiz from '../trainer/Quiz';
import Reference from '../trainer/Reference';
import Assignment from '../trainer/Assignment';
import Syllabus from '../trainer/Syllabus';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const [trainerData, setTrainerData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('overview');
  const [batches, setBatches] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('trainerToken');
    const data = localStorage.getItem('trainerData');
    if (!token || !data) {
      console.log('No trainer token or data found, redirecting to login');
      navigate('/trainer-login');
      return;
    }
    const parsedData = JSON.parse(data);
    console.log('Parsed trainer data:', parsedData);
    setTrainerData(parsedData);
    fetchBatches();
  }, [navigate]);

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.get('/api/quizzes/batches', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBatches(response.data || []);
    } catch (err) {
      console.error('Failed to fetch batches:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      setBatches([]);
      // Don't set error for missing batch endpoint as it's optional
    }
  };

  const fetchBatchProgress = async (quizId) => {
    try {
      const token = localStorage.getItem('trainerToken');
      if (!token) throw new Error('No trainer token found');
      const response = await axios.get(`/api/quizzes/${quizId}/batch-progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBatchProgress(response.data);
    } catch (err) {
      console.error('Failed to fetch batch progress:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      setError(err.response?.data?.message || 'Failed to fetch batch progress');
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('trainerToken');
      await axios.post('/api/trainer/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
      });
    } finally {
      localStorage.removeItem('trainerToken');
      localStorage.removeItem('trainerData');
      navigate('/trainer-login');
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'assignments', label: 'Assignments', icon: PlusCircle },
    { id: 'quizzes', label: 'Quizzes', icon: CheckSquare },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'references', label: 'References', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'batches', label: 'Batches', icon: Users },
    { id: 'daily-activity', label: 'Daily Activity', icon: Activity },
    { id: 'timetable', label: 'Time Table', icon: Clock },
  ];

  const renderOverview = () => (
    <div className="p-6">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => setError('')} 
            className="text-red-600 hover:text-red-800 text-sm underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {trainerData?.name || 'Trainer'}!
            </h2>
            <p className="text-gray-600">
              Manage your training activities and students
            </p>
            {trainerData?.subjectDealing && (
              <p className="text-sm text-green-600 font-medium mt-1">
                Subject: {trainerData.subjectDealing} ({trainerData.category})
              </p>
            )}
          </div>
          {trainerData?.lastLogin && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="text-sm font-medium">
                {new Date(trainerData.lastLogin).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-gray-600">Total Students</h3>
              <p className="text-2xl font-bold text-green-600">
                {batches.reduce((acc, batch) => acc + (batch.students?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-gray-600">Active Batches</h3>
              <p className="text-2xl font-bold text-blue-600">{batches.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <PlusCircle className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-gray-600">Assignments</h3>
              <p className="text-2xl font-bold text-purple-600">{trainerData?.createdAssignments?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <CheckSquare className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-gray-600">Quizzes</h3>
              <p className="text-2xl font-bold text-orange-600">{trainerData?.createdQuizzes?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveComponent('batches')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Manage Classes</p>
          </button>
          <button
            onClick={() => setActiveComponent('quizzes')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <CheckSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Create Quiz</p>
          </button>
          <button
            onClick={() => setActiveComponent('assignments')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <PlusCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Assignments</p>
          </button>
          <button
            onClick={() => setActiveComponent('syllabus')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">Syllabus</p>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => setActiveComponent(item.id)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border hover:border-green-500"
            >
              <div className="flex items-center mb-4">
                <Icon className="h-8 w-8 text-green-500" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">{item.label}</h3>
              </div>
              <p className="text-gray-600 text-sm">
                {item.id === 'assignments' && 'Create and manage assignments for your students'}
                {item.id === 'quizzes' && 'Create quizzes and assessments for evaluation'}
                {item.id === 'syllabus' && 'Create and update course syllabus'}
                {item.id === 'references' && 'Upload and organize learning resources'}
                {item.id === 'calendar' && 'View and manage your schedule and events'}
                {item.id === 'notifications' && 'Check important notifications and updates'}
                {item.id === 'batches' && 'Manage your student batches and groups'}
                {item.id === 'daily-activity' && 'Track daily activities and progress'}
                {item.id === 'timetable' && 'Manage class schedules and timetables'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Trainer Profile</h2>
      {trainerData && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
              <p className="text-lg text-gray-900">{trainerData.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
              <p className="text-lg text-gray-900">{trainerData.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Employee ID</label>
              <p className="text-lg text-gray-900">{trainerData.employeeId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
              <p className="text-lg text-gray-900">{trainerData.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Experience</label>
              <p className="text-lg text-gray-900">{trainerData.experience} years</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Subject</label>
              <p className="text-lg text-gray-900">{trainerData.subjectDealing}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Category</label>
              <p className="text-lg text-gray-900 capitalize">{trainerData.category}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                trainerData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {trainerData.status}
              </span>
            </div>
          </div>
          {trainerData.linkedIn && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">LinkedIn Profile</label>
              <a 
                href={trainerData.linkedIn} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {trainerData.linkedIn}
              </a>
            </div>
          )}
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={() => navigate('/trainer-profile')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderBatches = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Batches</h2>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {batches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Batches Assigned</h3>
          <p className="text-gray-600">You haven't been assigned to any batches yet. Contact your administrator for batch assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <div key={batch._id} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900">{batch.name}</h3>
              <p className="text-gray-600">Students: {batch.students?.length || 0}</p>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setActiveComponent(`batch-members-${batch._id}`)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Users className="h-5 w-5 mr-1" />
                  View Members
                </button>
                <button
                  onClick={() => {
                    fetchBatchProgress(batch._id);
                    setActiveComponent(`batch-progress-${batch._id}`);
                  }}
                  className="flex items-center text-green-600 hover:text-green-800"
                >
                  <Activity className="h-5 w-5 mr-1" />
                  View Progress
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBatchMembers = (batchId) => {
    const batch = batches.find((b) => b._id === batchId);
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{batch?.name} - Members</h2>
        <button
          onClick={() => setActiveComponent('batches')}
          className="text-green-600 hover:text-green-800 mb-4 flex items-center"
        >
          <span>← Back to Batches</span>
        </button>
        <div className="bg-white rounded-xl shadow-lg p-6">
          {batch?.students?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batch.students.map((student, index) => (
                <div key={student._id || index} className="border rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students in this batch.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBatchProgress = (batchId) => {
    const batch = batches.find((b) => b._id === batchId);
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{batch?.name} - Progress</h2>
        <button
          onClick={() => setActiveComponent('batches')}
          className="text-green-600 hover:text-green-800 mb-4 flex items-center"
        >
          <span>← Back to Batches</span>
        </button>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {batchProgress && batchProgress.progress?.length ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-gray-600">Student Name</th>
                    <th className="py-2 text-gray-600">Score</th>
                    <th className="py-2 text-gray-600">Percentage</th>
                    <th className="py-2 text-gray-600">Performance</th>
                    <th className="py-2 text-gray-600">Time Spent</th>
                    <th className="py-2 text-gray-600">Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {batchProgress.progress.map((student) => (
                    <tr key={student.studentId} className="border-b">
                      <td className="py-2">{student.studentName}</td>
                      <td className="py-2">{student.score}</td>
                      <td className="py-2">{student.percentage}%</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-white ${
                            student.performanceCategory === 'green'
                              ? 'bg-green-500'
                              : student.performanceCategory === 'yellow'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        >
                          {student.performanceCategory}
                        </span>
                      </td>
                      <td className="py-2">{student.timeSpent} min</td>
                      <td className="py-2">{new Date(student.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No progress data available for this batch.</p>
          </div>
        )}
      </div>
    );
  };

  const renderComponent = () => {
    if (activeComponent === 'overview') return renderOverview();
    if (activeComponent === 'profile') return renderProfile();
    if (activeComponent === 'batches') return renderBatches();
    if (activeComponent === 'assignments') return <Assignment />;
    if (activeComponent === 'quizzes') return <Quiz />;
    if (activeComponent === 'syllabus') return <Syllabus />;
    if (activeComponent === 'references') return <Reference />;
    if (activeComponent.startsWith('batch-members-')) {
      const batchId = activeComponent.split('batch-members-')[1];
      return renderBatchMembers(batchId);
    }
    if (activeComponent.startsWith('batch-progress-')) {
      const batchId = activeComponent.split('batch-progress-')[1];
      return renderBatchProgress(batchId);
    }
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {activeComponent.charAt(0).toUpperCase() + activeComponent.slice(1).replace('-', ' ')} 
          <span className="text-sm font-normal text-gray-600 ml-2">(Under Development)</span>
        </h2>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-600 mb-4">This feature is currently being developed and will be available soon.</p>
          <button
            onClick={() => setActiveComponent('overview')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Overview
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Trainer Dashboard</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveComponent(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors ${
                  activeComponent === item.id ? 'bg-green-50 text-green-600' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden">
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              {activeComponent.charAt(0).toUpperCase() + activeComponent.slice(1).replace('-', ' ')}
            </h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    setActiveComponent('profile');
                    setShowSettingsDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/trainer-change-password');
                    setShowSettingsDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : (
            renderComponent()
          )}
        </main>
      </div>
    </div>
  );
};

export default TrainerDashboard;