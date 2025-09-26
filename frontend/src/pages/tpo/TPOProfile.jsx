// File: src/components/TPOProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, Users, 
  Edit3, Save, X, Lock, AlertCircle, CheckCircle,
  Briefcase, Linkedin, Building, BookOpen, Target
} from 'lucide-react';
import { getProfile, updateProfile, checkPasswordChange } from '../../services/generalAuthService';

const TPOProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form states - only fields that exist in your schema
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    experience: 0,
    linkedIn: ''
  });

  useEffect(() => {
    fetchProfile();
    checkPasswordStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProfile('tpo');
      
      if (response.data.success) {
        setProfile(response.data.data);
        // Only set the fields that exist in your schema
        setFormData({
          name: response.data.data.name || '',
          phone: response.data.data.phone || '',
          experience: response.data.data.experience || 0,
          linkedIn: response.data.data.linkedIn || ''
        });
      } else {
        setError(response.data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch profile');
      
      if (err.response?.status === 401) {
        setTimeout(() => {
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStatus = async () => {
    try {
      const response = await checkPasswordChange('tpo');
      if (response.data.success) {
        // Handle password change requirement if needed
        console.log('Password change status:', response.data.needsPasswordChange);
      }
    } catch (err) {
      console.error('Failed to check password status:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await updateProfile('tpo', formData);
      
      if (response.data.success) {
        setProfile(response.data.data);
        setIsEditing(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      experience: profile?.experience || 0,
      linkedIn: profile?.linkedIn || ''
    });
    setIsEditing(false);
    setError('');
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/tpo-dashboard')}
                className="text-gray-500 hover:text-gray-700 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">TPO Profile</h1>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                  <Users className="h-16 w-16 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {profile?.name || 'TPO Name'}
                </h2>
                <p className="text-gray-600 mb-4 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Training & Placement Officer
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                  <Mail className="h-4 w-4" />
                  <span>{profile?.email || 'email@college.edu'}</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">{profile?.experience || 0} years experience</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Assigned Trainers
                  </span>
                  <span className="font-bold text-blue-600 text-lg">
                    {profile?.assignedTrainers?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Assigned Batches
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {profile?.assignedBatches?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Managed Companies
                  </span>
                  <span className="font-bold text-purple-600 text-lg">
                    {profile?.managedCompanies?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <User className="h-6 w-6 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                {!isEditing && profile?.updatedAt && (
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      placeholder="your.email@college.edu"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      required
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10 digits required</p>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    min="0"
                    max="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  />
                </div>

                {/* LinkedIn */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Linkedin className="h-4 w-4 mr-1" />
                    LinkedIn Profile
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      name="linkedIn"
                      value={formData.linkedIn}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                </div>

                {/* Status (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className={`px-4 py-3 rounded-lg ${
                    profile?.status === 'active' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className="font-medium capitalize">{profile?.status || 'active'}</span>
                  </div>
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    User Role
                  </label>
                  <div className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                    <span className="font-medium capitalize">{profile?.role || 'tpo'}</span>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">Fields marked with * are required. Email cannot be changed.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TPOProfile;