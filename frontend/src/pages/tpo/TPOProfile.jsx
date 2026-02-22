import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Calendar, Briefcase,
  Edit3, Save, X, Linkedin, ArrowLeft,
  Users, BookOpen, Building, Clock, GraduationCap,
  CalendarDays, UserCheck, Activity, Shield
} from 'lucide-react';
import { getProfile, updateProfile } from '../../services/generalAuthService';
import api from '../../services/api';
import Header from '../../components/common/Header';
import ToastNotification from '../../components/ui/ToastNotification';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeletons';
import useHeaderData from '../../hooks/useHeaderData';

const TPOProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    experience: 0,
    linkedIn: ''
  });

  const header = useHeaderData('tpo', profile ? { user: profile, ...profile } : null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProfile('tpo');
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData({
          name: response.data.data.name || '',
          experience: response.data.data.experience || 0,
          linkedIn: response.data.data.linkedIn || ''
        });
      } else {
        setError(response.data.message || 'Failed to fetch profile');
      }
    } catch (err) {
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

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('userToken');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [batchesRes, placementRes, studentsRes, scheduleRes, approvalsRes] = await Promise.allSettled([
        fetch(`${baseURL}/api/tpo/batches`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/api/tpo/placement-training-batches`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/api/tpo/students-by-batch`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/api/tpo/schedule-timetable`, { headers }).then(r => r.json()),
        fetch(`${baseURL}/api/tpo/pending-approvals`, { headers }).then(r => r.json())
      ]);

      const assignedBatches = batchesRes.status === 'fulfilled' && batchesRes.value.success
        ? batchesRes.value.data : [];

      const placementData = placementRes.status === 'fulfilled' && placementRes.value.success
        ? placementRes.value.data : {};

      const studentData = studentsRes.status === 'fulfilled' && studentsRes.value.success
        ? studentsRes.value.data : {};

      const scheduleData = scheduleRes.status === 'fulfilled' && scheduleRes.value.success
        ? scheduleRes.value.data : [];

      const pendingApprovals = approvalsRes.status === 'fulfilled' && approvalsRes.value.success
        ? approvalsRes.value.data : [];

      let placementBatchCount = 0;
      let placementStudentCount = 0;
      const organized = placementData.organized || {};
      Object.values(organized).forEach(colleges => {
        Object.values(colleges).forEach(techMap => {
          Object.values(techMap).forEach(group => {
            const batches = (group.batches || []).filter(b => (b.studentCount || b.students?.length || 0) > 0);
            placementBatchCount += batches.length;
            placementStudentCount += batches.reduce((acc, b) => acc + (b.studentCount || b.students?.length || 0), 0);
          });
        });
      });

      const trainerIds = new Set();
      let totalClasses = 0;
      (Array.isArray(scheduleData) ? scheduleData : []).forEach(batch => {
        (batch.assignedTrainers || []).forEach(t => {
          if (t.trainer?._id) trainerIds.add(t.trainer._id);
          totalClasses += (t.schedule?.length || 0);
        });
      });

      setStats({
        assignedBatches: assignedBatches.length,
        totalStudents: studentData.stats?.totalStudents || 0,
        crtStudents: studentData.stats?.crtStudents || 0,
        placementBatches: placementBatchCount,
        placementStudents: placementStudentCount,
        trainerAssignments: trainerIds.size,
        scheduledClasses: totalClasses,
        pendingApprovals: pendingApprovals.length
      });
    } catch (err) {
    } finally {
      setLoadingStats(false);
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
      experience: profile?.experience || 0,
      linkedIn: profile?.linkedIn || ''
    });
    setIsEditing(false);
    setError('');
  };

  const getInitials = (name) => {
    if (!name) return 'TP';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading && !profile) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="TPO Profile"
        subtitle="Manage Your Profile"
        {...header.headerProps}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pt-20 sm:pt-24">
        {/* Back */}
        <button
          onClick={() => navigate('/tpo-dashboard')}
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
          {/* Thin accent strip */}
          <div className="h-1.5 bg-blue-600" />

          <div className="p-4 sm:p-6">
            {/* Desktop: row | Mobile: centered stack */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-lg sm:text-2xl font-bold text-white">{getInitials(profile?.name)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {/* Name */}
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full sm:w-auto px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-lg font-semibold text-gray-900"
                    placeholder="Full Name"
                  />
                ) : (
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{profile?.name || '—'}</h1>
                )}
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Training & Placement Officer</p>

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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Briefcase className="h-3 w-3" />
                    {profile?.experience || 0} yrs experience
                  </span>
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
                  {profile?.linkedIn ? (
                    <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </a>
                  ) : isEditing ? null : (
                    <span className="inline-flex items-center gap-1.5 text-gray-400 italic">
                      <Linkedin className="h-3.5 w-3.5" />
                      Not linked
                    </span>
                  )}
                </div>
              </div>

              {/* Edit button - top right on desktop */}
              <div className="flex-shrink-0 flex justify-center sm:justify-end">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Edit fields (inline, below profile info when editing) */}
            {isEditing && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] sm:text-xs text-gray-500 font-medium mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    min="0" max="50"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] sm:text-xs text-gray-500 font-medium mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedIn"
                    value={formData.linkedIn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ──── STATS SECTION: Training & Placement ──── */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-4 sm:mb-5">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-gray-200">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Training & Batches</h2>
          </div>
          <div className="p-3 sm:p-4">
            {loadingStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-5 bg-gray-200 rounded w-10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Assigned Batches</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.assignedBatches ?? 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Placement Batches</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.placementBatches ?? 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-amber-50 items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Trainer Assignments</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.trainerAssignments ?? 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-purple-50 items-center justify-center flex-shrink-0">
                      <CalendarDays className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Scheduled Classes</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.scheduledClasses ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ──── STATS SECTION: Students ──── */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-4 sm:mb-5">
          <div className="bg-green-50 px-4 py-2.5 border-b border-gray-200">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Students Overview</h2>
          </div>
          <div className="p-3 sm:p-4">
            {loadingStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-5 bg-gray-200 rounded w-10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-blue-50 items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Total Students</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.totalStudents ?? 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-green-50 items-center justify-center flex-shrink-0">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">CRT Students</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.crtStudents ?? 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-amber-50 items-center justify-center flex-shrink-0">
                      <Building className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">In Placement Training</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.placementStudents ?? 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-md bg-red-50 items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Pending Approvals</p>
                      <p className="text-sm sm:text-xl font-bold text-gray-900">{stats?.pendingApprovals ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ──── BOTTOM ROW: Account Info ──── */}
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
                  TPO
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Experience</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">{profile?.experience || 0} years</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Joined</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Last Login</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">
                  {profile?.lastLogin
                    ? new Date(profile.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TPOProfile;
