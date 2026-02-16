import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

const CoordinatorChangePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/change-password/coordinator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: changePasswordData.currentPassword,
          newPassword: changePasswordData.newPassword
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessage('Password changed successfully! Redirecting...');
        setTimeout(() => {
          navigate('/coordinator-dashboard');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <button
        onClick={() => navigate('/coordinator-dashboard')}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-[13px] font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-slate-800 mb-1">Change Password</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-7">
          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    currentPassword: e.target.value
                  })}
                  required
                  className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    newPassword: e.target.value
                  })}
                  required
                  className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              <p className="text-[12px] text-slate-500 mt-1.5">Must be at least 6 characters</p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    confirmPassword: e.target.value
                  })}
                  required
                  className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-red-600 text-[13px]">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <p className="text-green-700 text-[13px]">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-200/50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-white"></div>
              ) : (
                <KeyRound className="h-[18px] w-[18px]" />
              )}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorChangePassword;
