import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, UserCheck, 
  Edit3, Save, X, Eye, EyeOff, Lock, AlertCircle, CheckCircle,
  GraduationCap, Award, Users
} from 'lucide-react';
import { getProfile, updateProfile, changePassword, checkPasswordChange } from '../../services/generalAuthService';
import Header from '../../components/common/Header';

const CoordinatorProfile = () => {
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
      const response = await getProfile('coordinator');
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
      const response = await checkPasswordChange('coordinator');
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

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await updateProfile('coordinator', formData);
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await changePassword('coordinator', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setShowPasswordModal(false);
        setShowPasswordChangeModal(false);
        setNeedsPasswordChange(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSuccess('Password changed successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError('');
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

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const coordinatorData = profile ? { user: profile, ...profile } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Component */}
      <Header
        title="Coordinator Profile"
        subtitle="Manage Your Profile"
        icon={UserCheck}
        userData={coordinatorData}
        profileRoute="/coordinator-profile"
        changePasswordRoute="/coordinator-change-password"
        onLogout={handleLogout}
        onIconClick={() => {
          if (window.location.pathname === '/coordinator-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/coordinator-dashboard');
          }
        }}
      />

      {/* Main Content */}
      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        {/* Back Button and Actions */}
        <div className="max-w-7xl mx-auto mb-5 mt-5">
          <div className="flex justify-end gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
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
                </>
              )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm animate-fade-in">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm sm:text-base">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  {/* Profile Image with Upload */}
                  <div className="relative w-32 h-32 mx-auto mb-4 group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 shadow-inner">
                      {formData.profileImageUrl || profile?.profileImageUrl ? (
                        <img
                          src={formData.profileImageUrl || profile?.profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <UserCheck className="h-14 w-14 text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Coordinator Info */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {profile?.name || 'Coordinator Name'}
                  </h2>
                  <p className="text-gray-600 mb-4">{profile?.rollNo || 'Roll Number'}</p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-medium">Student Coordinator</span>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="mt-4 space-y-3 text-left">
                    {profile?.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border hover:border-gray-200 transition">
                        <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-900 break-all">{profile.email}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border hover:border-gray-200 transition">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-4 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Award className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Verification Stats</h3>
                    <p className="text-sm text-gray-600">Your verification activities</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border hover:border-gray-200 transition">
                    <span className="text-sm text-gray-700">Certificates Verified</span>
                    <span className="font-semibold text-gray-900">
                      {profile?.verifiedCertificates?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border hover:border-gray-200 transition">
                    <span className="text-sm text-gray-700">Projects Verified</span>
                    <span className="font-semibold text-gray-900">
                      {profile?.verifiedProjects?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border hover:border-gray-200 transition">
                    <span className="text-sm text-gray-700">Internships Verified</span>
                    <span className="font-semibold text-gray-900">
                      {profile?.verifiedInternships?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border hover:border-gray-200 transition">
                    <span className="text-sm text-gray-700">Feedbacks Managed</span>
                    <span className="font-semibold text-gray-900">
                      {profile?.managedFeedbacks?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Profile Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Profile Details</h2>
                  <p className="text-sm text-gray-500">View or update your personal information.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block mb-1 text-xs text-gray-600">Name</label>
                    {!isEditing ? (
                      <div className="bg-gray-50 px-4 py-2.5 rounded-md border border-transparent hover:border-gray-200 transition">
                        <p className="text-sm text-gray-900 font-medium break-words">{formData.name || 'Not provided'}</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleInputChange}
                        className="w-full border rounded p-2 h-10"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-xs text-gray-600">Roll Number</label>
                    {!isEditing ? (
                      <div className="bg-gray-50 px-4 py-2.5 rounded-md border border-transparent hover:border-gray-200 transition">
                        <p className="text-sm text-gray-900 font-medium break-words">{formData.rollNo || 'Not provided'}</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name="rollNo"
                        value={formData.rollNo || ''}
                        onChange={handleInputChange}
                        className="w-full border rounded p-2 h-10"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-xs text-gray-600">Email</label>
                    {!isEditing ? (
                      <div className="bg-gray-50 px-4 py-2.5 rounded-md border border-transparent hover:border-gray-200 transition">
                        <p className="text-sm text-gray-900 font-medium break-words">{formData.email || 'Not provided'}</p>
                      </div>
                    ) : (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="w-full border rounded p-2 h-10"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-xs text-gray-600">Phone</label>
                    {!isEditing ? (
                      <div className="bg-gray-50 px-4 py-2.5 rounded-md border border-transparent hover:border-gray-200 transition">
                        <p className="text-sm text-gray-900 font-medium break-words">{formData.phone || 'Not provided'}</p>
                      </div>
                    ) : (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full border rounded p-2 h-10"
                      />
                    )}
                  </div>
                </div>

                {/* Batch Information */}
                <div className="mt-8">
                  <div className="bg-white rounded-lg shadow-md p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <GraduationCap className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Assigned Batch Details</h3>
                        <p className="text-sm text-gray-600">Your assigned placement training batch</p>
                      </div>
                    </div>
                  {profile?.assignedPlacementBatch ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded border hover:border-gray-200 transition">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Batch Number</p>
                          <p className="font-semibold text-gray-900">{profile.assignedPlacementBatch.batchNumber}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border hover:border-gray-200 transition">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Tech Stack</p>
                          <p className="font-semibold text-gray-900">{profile.assignedPlacementBatch.techStack}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border hover:border-gray-200 transition">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Start Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(profile.assignedPlacementBatch.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border hover:border-gray-200 transition">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">End Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(profile.assignedPlacementBatch.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Assigned Trainers */}
                      {profile.assignedPlacementBatch.assignedTrainers?.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-lg font-semibold text-gray-900 mb-3">Assigned Trainers</h5>
                          <div className="space-y-3">
                            {profile.assignedPlacementBatch.assignedTrainers.map((assignment, idx) => (
                              <div key={idx} className="bg-gray-50 rounded p-4 border hover:border-gray-200 transition">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{assignment.trainer.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">{assignment.subject}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                    assignment.timeSlot === 'morning' ? 'bg-blue-100 text-blue-800' :
                                    assignment.timeSlot === 'afternoon' ? 'bg-orange-100 text-orange-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {assignment.timeSlot}
                                  </span>
                                </div>
                                {assignment.schedule && assignment.schedule.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Schedule:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {assignment.schedule.map((slot, sidx) => (
                                        <div key={sidx} className="flex items-center gap-2 text-xs text-gray-600 bg-white p-2 rounded border">
                                          <Calendar className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                          <span className="font-medium">{slot.day}:</span>
                                          <span className="text-gray-500">{slot.startTime} - {slot.endTime}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 border border-dashed border-gray-200 rounded text-center">
                      <p className="text-sm text-gray-400 italic">No batch assigned yet</p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {(showPasswordModal || showPasswordChangeModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showPasswordChangeModal ? 'Change Password Required' : 'Change Password'}
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setShowPasswordChangeModal(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {showPasswordChangeModal && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  For security reasons, you need to change your password before continuing.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {!showPasswordChangeModal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setShowPasswordChangeModal(false);
                  setError('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorProfile;
