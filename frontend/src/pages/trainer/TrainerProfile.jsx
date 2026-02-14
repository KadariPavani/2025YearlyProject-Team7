import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Briefcase, Linkedin, Edit3, Save, X,
  AlertCircle, CheckCircle, BookOpen, UserCheck, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { getProfile, updateProfile } from '../../services/generalAuthService';
import Header from '../../components/common/Header';
import ToastNotification from '../../components/ui/ToastNotification';
import useHeaderData from '../../hooks/useHeaderData';

const TrainerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({});

  const header = useHeaderData('trainer', profile ? { user: profile, ...profile } : null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("trainerToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trainer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      if (data.success) {
        setProfile(data.data);
        setFormData(data.data);
      } else {
        setError(data.message || "Failed to fetch profile");
      }
    } catch {
      setError("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await updateProfile('trainer', formData);
      if (response.data.success) {
        setProfile(response.data.data);
        setIsEditing(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError('');
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Trainer Profile"
        subtitle="Manage Your Profile"
        {...header.headerProps}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/trainer-dashboard')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        {/* Toast Notification Component */}
        {(error || success) && (
          <ToastNotification
            type={error ? "error" : "success"}
            message={error || success}
            onClose={() => {
              setError("");
              setSuccess("");
            }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
                <span>Save</span>
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

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {profile?.name || 'Trainer Name'}
                </h2>
                <p className="text-gray-600 mb-4">{profile?.employeeId || 'Employee ID'}</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Briefcase className="h-4 w-4" />
                  <span>{profile?.experience || 0} years experience</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Assigned Batches</span>
                  <span className="font-semibold text-green-600">
                    {profile?.assignedBatches?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created Quizzes</span>
                  <span className="font-semibold text-green-600">
                    {profile?.createdQuizzes?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created Assignments</span>
                  <span className="font-semibold text-green-600">
                    {profile?.createdAssignments?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="url"
                      name="linkedIn"
                      value={formData.linkedIn || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Dealing Section */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Dealing</label>
                  <input
                    type="text"
                    name="subjectDealing"
                    value={formData.subjectDealing || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    placeholder="e.g. Python"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                  >
                    <option value="">Select category</option>
                    <option value="technical">Technical</option>
                    <option value="non-technical">Non-Technical</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainerProfile;
