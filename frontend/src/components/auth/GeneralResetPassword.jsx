import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle
} from 'lucide-react';
import { resetPassword } from '../../services/generalAuthService';

const GeneralResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const userTypeConfig = {
    tpo: { title: 'TPO Reset Password', loginPath: '/tpo-login' },
    trainer: { title: 'Trainer Reset Password', loginPath: '/trainer-login' },
    student: { title: 'Student Reset Password', loginPath: '/student-login' },
    coordinator: { title: 'Coordinator Reset Password', loginPath: '/coordinator-login' }
  };

  const userType = useMemo(() => {
    const path = location.pathname;
    if (path.includes('tpo-reset-password')) return 'tpo';
    if (path.includes('trainer-reset-password')) return 'trainer';
    if (path.includes('student-reset-password')) return 'student';
    if (path.includes('coordinator-reset-password')) return 'coordinator';
    return 'tpo';
  }, [location.pathname]);

  const config = userTypeConfig[userType] || userTypeConfig.tpo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const email = sessionStorage.getItem('resetEmail');
      const response = await resetPassword(userType, {
        email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6">
            <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
            <h1 className="text-[22px] font-bold text-slate-800 mb-1">Password Reset!</h1>
            <p className="text-[13px] text-slate-500">Your password has been successfully reset</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-7 text-center">
            <div className="mb-6">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-3" />
              <h2 className="text-[18px] font-semibold text-slate-700 mb-2">
                Password Reset Successful
              </h2>
              <p className="text-[13px] text-slate-500">
                You can now sign in with your new password
              </p>
            </div>

            <button
              onClick={() => navigate(config.loginPath)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-200 shadow-md shadow-blue-200/50"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <button
        onClick={() => navigate(`/${userType}-forgot-password`)}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-[13px] font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-slate-800 mb-1">{config.title}</h1>
          <p className="text-[13px] text-slate-500">Enter OTP and new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                OTP Code
              </label>
              <input
                type="text"
                required
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-center tracking-widest transition-all"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-[13px]">{error}</p>
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
                <CheckCircle className="h-[18px] w-[18px]" />
              )}
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-500 text-[13px]">
              Didn't receive OTP?{' '}
              <button
                onClick={() => navigate(`/${userType}-forgot-password`)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Resend OTP
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralResetPassword;
