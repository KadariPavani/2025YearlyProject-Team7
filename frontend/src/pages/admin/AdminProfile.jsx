import React, { useState, useEffect } from 'react';
import { Shield, Mail, Key, Clock, UserCheck, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAdminProfile } from '../../services/adminService';

const AdminProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await getAdminProfile();
        if (response.data.success) {
          setProfileData(response.data.data);
          setError('');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          navigate('/super-admin-login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate('/admin-dashboard')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="max-w-4xl mx-auto">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
                  <p className="text-gray-600">Manage your account information</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="h-5 w-5" />
                    <span className="text-sm font-medium">Email Address</span>
                  </div>
                  <p className="text-gray-900">{profileData?.email}</p>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <UserCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">Role</span>
                  </div>
                  <p className="text-gray-900 capitalize">
                    {profileData?.role?.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Last Login */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm font-medium">Last Login</span>
                  </div>
                  <p className="text-gray-900">
                    {profileData?.lastLogin 
                      ? new Date(profileData.lastLogin).toLocaleString()
                      : 'Never'}
                  </p>
                </div>

                {/* Created At */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm font-medium">Account Created</span>
                  </div>
                  <p className="text-gray-900">
                    {profileData?.createdAt && new Date(profileData.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(profileData?.permissions || {}).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className={`h-4 w-4 rounded-full ${
                          value ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;