// File: frontend/src/pages/coordinator/CoordinatorDashboard.jsx (Updated - enhance to show batch details)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Settings, LogOut, User, Mail, Phone, Clock,
  Calendar, BookOpen, ChevronDown, MapPin, Award, Users, Bell, 
  FileText, CheckCircle, Star, Shield
} from 'lucide-react';
import PasswordChangeNotification from '../../components/common/PasswordChangeNotification';

const CoordinatorDashboard = () => {
  const [coordinatorData, setCoordinatorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [message, setMessage] = useState('');
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
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
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
                <h1 className="text-2xl font-bold">Coordinator Dashboard</h1>
                <p className="text-sm opacity-90">Student Coordinator Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-400 rounded-full"></span>
              </button>
              
              <button
                onClick={() => navigate('/coordinator-profile')}
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
                        navigate('/coordinator-profile');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsDropdown(false);
                        navigate('/coordinator-change-password');
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
                className="flex items-center space-x-2 bg-white text-orange-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors font-medium"
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
                Welcome, {coordinatorData?.user?.name || 'Coordinator'}!
              </h2>
              <p className="text-gray-600">
                {coordinatorData?.message || 'Welcome to your coordinator portal'}
              </p>
            </div>
            {coordinatorData?.user?.lastLogin && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-sm font-medium">
                  {new Date(coordinatorData.user.lastLogin).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Batch Details Section - New */}
        {coordinatorData?.user?.assignedPlacementBatch && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Assigned Placement Training Batch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Batch Details</h4>
                <p>Batch Number: {coordinatorData.user.assignedPlacementBatch.batchNumber}</p>
                <p>Tech Stack: {coordinatorData.user.assignedPlacementBatch.techStack}</p>
                <p>Year: {coordinatorData.user.assignedPlacementBatch.year}</p>
                <p>Colleges: {coordinatorData.user.assignedPlacementBatch.colleges.join(', ')}</p>
                <p>Start Date: {new Date(coordinatorData.user.assignedPlacementBatch.startDate).toLocaleDateString()}</p>
                <p>End Date: {new Date(coordinatorData.user.assignedPlacementBatch.endDate).toLocaleDateString()}</p>
                <p>Status: {coordinatorData.user.assignedPlacementBatch.status}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">TPO</h4>
                <p>Name: {coordinatorData.user.assignedPlacementBatch.tpoId?.name || 'N/A'}</p>
                <p>Email: {coordinatorData.user.assignedPlacementBatch.tpoId?.email || 'N/A'}</p>
              </div>
            </div>
            
            <h4 className="font-medium text-lg mb-4">Students in Batch ({coordinatorData.user.assignedPlacementBatch.students?.length || 0})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coordinatorData.user.assignedPlacementBatch.students?.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.rollNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.college}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.branch}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No students assigned</td>
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
                <h3 className="text-lg font-semibold text-gray-900">Certificates</h3>
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
                <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
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
                <h3 className="text-lg font-semibold text-gray-900">Internships</h3>
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
                <h3 className="text-lg font-semibold text-gray-900">Feedbacks</h3>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Verify Certificates</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Review Projects</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Manage Feedbacks</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;