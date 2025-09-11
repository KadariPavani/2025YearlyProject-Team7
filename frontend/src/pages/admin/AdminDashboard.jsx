import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Bell,
  Settings,
  LogOut,
  Eye,
  Lock,
  EyeOff,
  ChevronDown,
  X,
  UserCircle // Add this import
} from 'lucide-react';
import axios from 'axios';
import { changeAdminPassword } from '../../services/adminService';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No token found');
      }

      await axios.get('/api/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setError('');
    } catch (error) {
      setError('Failed to fetch dashboard data');
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.replace('/super-admin-login');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('/api/admin/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      navigate('/');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      await changeAdminPassword({
        email: adminData.email,
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword
      });

      setPasswordMessage('Password changed successfully');
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordMessage('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Landing page style */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Welcome */}
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-lg">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm opacity-90">Welcome to InfoVerse Admin Panel</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>
              
              {/* Add Profile Button */}
              <button
                onClick={() => navigate('/admin-profile')}
                className="flex items-center space-x-2 p-2 text-white hover:text-gray-200 transition-colors"
              >
                <UserCircle className="h-6 w-6" />
                <span className="hidden sm:inline">Profile</span>
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
                        navigate('/admin-profile')
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        setShowChangePassword(true);
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
                className="flex items-center space-x-2 bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Empty for now */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Dashboard</h2>
          <p className="text-gray-600">Select an option from the navigation menu to get started.</p>
        </div>
      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowChangePassword(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-2xl font-bold mb-4">Change Password</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      currentPassword: e.target.value
                    })}
                    required
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      newPassword: e.target.value
                    })}
                    required
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={changePasswordData.confirmPassword}
                    onChange={(e) => setChangePasswordData({
                      ...changePasswordData,
                      confirmPassword: e.target.value
                    })}
                    required
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {passwordMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{passwordMessage}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;