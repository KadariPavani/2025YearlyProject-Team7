import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle,
  Users, BookOpen, GraduationCap, UserCheck
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
    tpo: {
      title: 'TPO Reset Password',
      icon: Users,
      color: 'blue',
      lightBg: 'from-blue-50 via-blue-25 to-white',
      buttonBg: 'from-blue-500 to-blue-600',
      buttonHover: 'hover:from-blue-600 hover:to-blue-700',
      iconBg: 'bg-blue-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
      loginPath: '/tpo-login'
    },
    trainer: {
      title: 'Trainer Reset Password',
      icon: BookOpen,
      color: 'green',
      lightBg: 'from-green-50 via-green-25 to-white',
      buttonBg: 'from-green-500 to-green-600',
      buttonHover: 'hover:from-green-600 hover:to-green-700',
      iconBg: 'bg-green-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
      loginPath: '/trainer-login'
    },
    student: {
      title: 'Student Reset Password',
      icon: GraduationCap,
      color: 'purple',
      lightBg: 'from-purple-50 via-purple-25 to-white',
      buttonBg: 'from-purple-500 to-purple-600',
      buttonHover: 'hover:from-purple-600 hover:to-purple-700',
      iconBg: 'bg-purple-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500',
      loginPath: '/student-login'
    },
    coordinator: {
      title: 'Coordinator Reset Password',
      icon: UserCheck,
      color: 'orange',
      lightBg: 'from-orange-50 via-orange-25 to-white',
      buttonBg: 'from-orange-500 to-orange-600',
      buttonHover: 'hover:from-orange-600 hover:to-orange-700',
      iconBg: 'bg-orange-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500',
      loginPath: '/coordinator-login'
    }
  };

  // Better React pattern from your team member
  const userType = useMemo(() => {
    const path = location.pathname;
    if (path.includes('tpo-reset-password')) return 'tpo';
    if (path.includes('trainer-reset-password')) return 'trainer';
    if (path.includes('student-reset-password')) return 'student';
    if (path.includes('coordinator-reset-password')) return 'coordinator';
    return 'tpo';
  }, [location.pathname]);

  const config = userTypeConfig[userType] || userTypeConfig.tpo;
  const IconComponent = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
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
      // Team member's session storage integration - CRITICAL!
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
      <div className={`min-h-screen bg-gradient-to-br ${config.lightBg} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full mt-8 sm:mt-0">
          <div className="text-center mb-8">
            <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset!</h1>
            <p className="text-gray-600">Your password has been successfully reset</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Password Reset Successful
              </h2>
              <p className="text-gray-600">
                You can now sign in with your new password
              </p>
            </div>

            <button
              onClick={() => navigate(config.loginPath)}
              className={`w-full bg-gradient-to-r ${config.buttonBg} ${config.buttonHover} text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg`}
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.lightBg} flex items-center justify-center p-4`}>
      {/* Fixed Back to Home Button - Same as Login Pages */}
      <button
        onClick={() => navigate(`/${userType}-forgot-password`)}
        className="fixed top-4 left-4 z-10 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Back</span>
      </button>

      <div className="max-w-md w-full mt-8 sm:mt-0">
        <div className="text-center mb-8">
          <div className={`${config.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-600">Enter OTP and new password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                required
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${config.focusStyles} text-center text-lg tracking-widest transition-colors`}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg ${config.focusStyles} transition-colors`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg ${config.focusStyles} transition-colors`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${config.buttonBg} ${config.buttonHover} text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center shadow-lg`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Didn't receive OTP?{' '}
              <button
                onClick={() => navigate(`/${userType}-forgot-password`)}
                className={`text-${config.color}-600 hover:text-${config.color}-800 font-medium`}
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
