import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Settings, LogOut, X, User, Mail, Phone, Clock,
  Calendar, BookOpen, ChevronDown, MapPin, Award, Users, Bell, Tag
} from 'lucide-react';
import PasswordChangeNotification from '../../components/common/PasswordChangeNotification';

const TrainerDashboard = () => {
  const [trainerData, setTrainerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/auth/dashboard/trainer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setTrainerData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  // const fetchProfile = async () => {
  //   try {
  //     const token = localStorage.getItem('userToken');
  //     const response = await fetch('/api/auth/profile/trainer', {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });
  //     const result = await response.json();
  //     if (result.success) {
  //       setTrainerData(prev => ({ ...prev, profile: result.data }));
  //     }
  //   } catch {
  //     setError('Failed to fetch profile data');
  //   }
  // };

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
      navigate('/trainer-login');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Password Change Notification */}
      <PasswordChangeNotification 
        userType="trainer" 
        onPasswordChange={() => setShowChangePassword(true)} 
      />
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <GraduationCap className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Trainer Dashboard</h1>
                <p className="text-sm opacity-90">Training & Development</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>
              
              {/* <button
                onClick={() => {
                  setShowProfile(true);
                  fetchProfile();
                }}
                className="flex items-center space-x-2 p-2 text-white hover:text-gray-200 transition-colors"
              >
                <User className="h-6 w-6" />
                <span className="hidden sm:inline">Profile</span>
              </button> */}
              
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
                className="flex items-center space-x-2 bg-white text-green-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
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
                Welcome, {trainerData?.user?.name}!
              </h2>
              <p className="text-gray-600">
                {trainerData?.message}
              </p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-600">Experience</h3>
                <p className="text-2xl font-bold text-green-600">{trainerData?.experience || 0} years</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-600">Subjects</h3>
                <p className="text-2xl font-bold text-blue-600">{trainerData?.subjects || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-600">Batches</h3>
                <p className="text-2xl font-bold text-purple-600">{trainerData?.assignedBatches || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-600">Quizzes</h3>
                <p className="text-2xl font-bold text-orange-600">{trainerData?.createdQuizzes || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Manage Classes</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Create Quiz</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Assignments</p>
            </button>
          </div>
        </div>
      </main>




    </div>
  );
};

export default TrainerDashboard;