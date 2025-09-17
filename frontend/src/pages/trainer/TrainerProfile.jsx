import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, BookOpen, 
  Edit3, Save, X, Eye, EyeOff, Lock, AlertCircle, CheckCircle,
  Briefcase, Linkedin, Award, Code, FileText
} from 'lucide-react';
import { getProfile, updateProfile, changePassword, checkPasswordChange } from '../../services/generalAuthService';

const TrainerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  // Form states
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchProfile();
    checkPasswordStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile('trainer');
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStatus = async () => {
    try {
      const response = await checkPasswordChange('trainer');
      if (response.data.success) {
        setNeedsPasswordChange(response.data.needsPasswordChange);
        if (response.data.needsPasswordChange) {
          setShowPasswordChangeModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to check password status:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...(formData.subjects || [])];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      subjects: newSubjects
    }));
  };

  const addSubject = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [...(prev.subjects || []), { name: '', type: 'technical' }]
    }));
  };

  const removeSubject = (index) => {
    const newSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      subjects: newSubjects
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/trainer-dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
            <div className="flex space-x-3">

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
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <span className="text-gray-600">Subjects</span>
                  <span className="font-semibold text-green-600">
                    {profile?.subjects?.length || 0}
                  </span>
                </div>
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

              {/* Subjects Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Subjects</h4>
                  {isEditing && (
                    <button
                      onClick={addSubject}
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <Award className="h-4 w-4" />
                      <span>Add Subject</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {(formData.subjects || []).map((subject, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={subject.name || ''}
                          onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Subject name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div className="w-40">
                        <select
                          value={subject.type || 'technical'}
                          onChange={(e) => handleSubjectChange(index, 'type', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                        >
                          <option value="technical">Technical</option>
                          <option value="non-technical">Non-Technical</option>
                        </select>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeSubject(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {(!formData.subjects || formData.subjects.length === 0) && !isEditing && (
                    <p className="text-gray-500 text-sm">No subjects assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default TrainerProfile;
