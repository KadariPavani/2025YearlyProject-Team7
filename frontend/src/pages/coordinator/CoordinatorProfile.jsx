import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Calendar, Edit3, Save, X, ArrowLeft,
  Eye, EyeOff, Lock, UserCheck, GraduationCap, Users,
  BookOpen, Clock, Shield
} from 'lucide-react';
import { getProfile, updateProfile, changePassword, checkPasswordChange } from '../../services/generalAuthService';
import Header from '../../components/common/Header';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import ToastNotification from '../../components/ui/ToastNotification';
import useHeaderData from '../../hooks/useHeaderData';

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

  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const header = useHeaderData('coordinator', profile ? { user: profile, ...profile } : null);

  useEffect(() => { fetchProfile(); checkPasswordStatus(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile('coordinator');
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData({ name: response.data.data.name || '', phone: response.data.data.phone || '' });
      }
    } catch (err) {
      setError('Failed to fetch profile');
      if (err.response?.status === 401) {
        setTimeout(() => { localStorage.removeItem('userToken'); localStorage.removeItem('userData'); window.location.href = '/login'; }, 2000);
      }
    } finally { setLoading(false); }
  };

  const checkPasswordStatus = async () => {
    try {
      const response = await checkPasswordChange('coordinator');
      if (response.data.success && response.data.needsPasswordChange) {
        setNeedsPasswordChange(true);
        setShowPasswordChangeModal(true);
      }
    } catch (err) { console.error('Failed to check password status:', err); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) return setError('Passwords do not match');
    if (passwordData.newPassword.length < 6) return setError('Password must be at least 6 characters long');

    try {
      setLoading(true);
      const response = await changePassword('coordinator', { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
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
    } finally { setLoading(false); }
  };

  const handleCancel = () => {
    setFormData({ name: profile?.name || '', phone: profile?.phone || '' });
    setIsEditing(false);
    setError('');
  };

  const getInitials = (name) => {
    if (!name) return 'CO';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading && !profile) return <LoadingSkeleton />;

  const batch = profile?.assignedPlacementBatch;
  const trainers = batch?.assignedTrainers || [];
  const students = batch?.students || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="Coordinator Profile"
        subtitle="Manage Your Profile"
        {...header.headerProps}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pt-20 sm:pt-24">
        {/* Back */}
        <button
          onClick={() => navigate('/coordinator-dashboard')}
          className="mb-3 sm:mb-4 flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Back to Dashboard
        </button>

        {/* Toast */}
        {(error || success) && (
          <ToastNotification
            type={error ? 'error' : 'success'}
            message={error || success}
            onClose={() => { setError(''); setSuccess(''); }}
          />
        )}

        {/* ──── PROFILE HEADER CARD ──── */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-4 sm:mb-5">
          <div className="h-1.5 bg-blue-600" />

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg sm:text-2xl font-bold text-white">{getInitials(profile?.name)}</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {isEditing ? (
                  <input
                    type="text" name="name" value={formData.name} onChange={handleInputChange}
                    className="w-full sm:w-auto px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-lg font-semibold text-gray-900"
                    placeholder="Full Name"
                  />
                ) : (
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{profile?.name || '—'}</h1>
                )}
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Student Coordinator</p>

                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium border ${
                    profile?.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {profile?.status || 'active'}
                  </span>
                  {profile?.rollNo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <GraduationCap className="h-3 w-3" />
                      {profile.rollNo}
                    </span>
                  )}
                  {batch?.batchNumber && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      <BookOpen className="h-3 w-3" />
                      Batch {batch.batchNumber}
                    </span>
                  )}
                </div>

                {/* Contact row */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-3 text-xs sm:text-sm text-gray-600">
                  {profile?.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate max-w-[200px]">{profile.email}</span>
                    </span>
                  )}
                  {profile?.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <div className="flex-shrink-0 flex justify-center sm:justify-end">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5">
                    <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={loading}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
                      <Save className="h-3.5 w-3.5" /> Save
                    </button>
                    <button onClick={handleCancel}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Edit fields */}
            {isEditing && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs text-gray-500 font-medium mb-1">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    placeholder="Phone number" />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ──── TRAINERS SECTION ──── */}
        {trainers.length > 0 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-4 sm:mb-5">
            <div className="bg-green-50 px-4 py-2.5 border-b border-gray-200">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Assigned Trainers</h2>
            </div>
            <div className="p-3 sm:p-4">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Trainer</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Slot</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trainers.map((a, idx) => (
                      <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{a.trainer?.name || '—'}</td>
                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{a.subject}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                            a.timeSlot === 'morning' ? 'bg-yellow-100 text-yellow-800'
                            : a.timeSlot === 'afternoon' ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                          }`}>{a.timeSlot}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {a.schedule?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {a.schedule.map((s, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs text-gray-600">
                                  <Clock className="h-2.5 w-2.5" />
                                  {s.day} {s.startTime}–{s.endTime}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ──── ACCOUNT INFORMATION ──── */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Account Information</h2>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Role</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-500" />
                  Coordinator
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Roll No</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">{profile?.rollNo || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Joined</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Last Login</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">
                  {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {(showPasswordModal || showPasswordChangeModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full max-h-[90vh] rounded-t-2xl sm:rounded-lg shadow-xl sm:max-w-md sm:mx-4 flex flex-col">
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pt-2 sm:pt-4 pb-3 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                {showPasswordChangeModal ? 'Change Password Required' : 'Change Password'}
              </h3>
              <button onClick={() => { setShowPasswordModal(false); setShowPasswordChangeModal(false); setError(''); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {showPasswordChangeModal && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-xs sm:text-sm">For security reasons, you need to change your password before continuing.</p>
                </div>
              )}

              {!showPasswordChangeModal && (
                <div>
                  <label className="block text-xs text-gray-600 font-medium mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                    <input type={showPasswords.current ? 'text' : 'password'} value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPasswords.current ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <input type={showPasswords.new ? 'text' : 'password'} value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPasswords.new ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <input type={showPasswords.confirm ? 'text' : 'password'} value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPasswords.confirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setShowPasswordModal(false); setShowPasswordChangeModal(false); setError(''); }}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handlePasswordChange} disabled={loading}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
