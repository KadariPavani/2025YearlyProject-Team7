import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, ArrowLeft, Send, AlertCircle, CheckCircle,
  Users, BookOpen, GraduationCap, UserCheck
} from 'lucide-react';
import { forgotPassword } from '../../services/generalAuthService';

const GeneralForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const userTypeConfig = {
    tpo: {
      title: 'TPO Forgot Password',
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
      title: 'Trainer Forgot Password',
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
      title: 'Student Forgot Password',
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
      title: 'Coordinator Forgot Password',
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
    if (path.includes('tpo-forgot-password')) return 'tpo';
    if (path.includes('trainer-forgot-password')) return 'trainer';
    if (path.includes('student-forgot-password')) return 'student';
    if (path.includes('coordinator-forgot-password')) return 'coordinator';
    return 'tpo';
  }, [location.pathname]);

  const config = userTypeConfig[userType] || userTypeConfig.tpo;
  const IconComponent = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await forgotPassword(userType, email);
      
      if (response.data.success) {
        // Team member's session storage functionality - IMPORTANT!
        sessionStorage.setItem('resetEmail', email);
        sessionStorage.setItem('resetUserType', userType);
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${config.lightBg} flex items-center justify-center p-4`}>
        {/* Fixed Back to Home Button */}
        <button
          onClick={() => navigate(config.loginPath)}
          className="fixed top-4 left-4 z-10 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Login</span>
        </button>

        <div className="max-w-md w-full mt-8 sm:mt-0">
          <div className="text-center mb-8">
            <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">OTP Sent!</h1>
            <p className="text-gray-600">Check your email for the reset code</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Password Reset OTP Sent
              </h2>
              <p className="text-gray-600">
                We've sent a password reset OTP to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate(`/${userType}-reset-password`)}
                className={`w-full bg-gradient-to-r ${config.buttonBg} ${config.buttonHover} text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg`}
              >
                Enter OTP & Reset Password
              </button>
              
              <button
                onClick={() => navigate(config.loginPath)}
                className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.lightBg} flex items-center justify-center p-4`}>
      {/* Fixed Back to Home Button - Same as Login Pages */}
      <button
        onClick={() => navigate(config.loginPath)}
        className="fixed top-4 left-4 z-10 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Back to Login</span>
      </button>

      <div className="max-w-md w-full mt-8 sm:mt-0">
        <div className="text-center mb-8">
          <div className={`${config.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-600">Enter your email to receive reset code</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${config.focusStyles} transition-colors`}
                  placeholder="Enter your email"
                />
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
                <Send className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Sending OTP...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Remember your password?{' '}
              <button
                onClick={() => navigate(config.loginPath)}
                className={`text-${config.color}-600 hover:text-${config.color}-800 font-medium`}
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralForgotPassword;
