import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Mail, ArrowLeft, Send, AlertCircle, CheckCircle,
  Users, BookOpen, GraduationCap, UserCheck
} from 'lucide-react';
import { forgotPassword } from '../../services/generalAuthService';

const GeneralForgotPassword = () => {
  const { userType } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const userTypeConfig = {
    tpo: {
      title: 'TPO Forgot Password',
      icon: Users,
      color: 'blue',
      bgFrom: 'from-blue-600',
      bgTo: 'to-blue-700',
      loginPath: '/tpo-login'
    },
    trainer: {
      title: 'Trainer Forgot Password',
      icon: BookOpen,
      color: 'green',
      bgFrom: 'from-green-600',
      bgTo: 'to-green-700',
      loginPath: '/trainer-login'
    },
    student: {
      title: 'Student Forgot Password',
      icon: GraduationCap,
      color: 'purple',
      bgFrom: 'from-purple-600',
      bgTo: 'to-purple-700',
      loginPath: '/student-login'
    },
    coordinator: {
      title: 'Coordinator Forgot Password',
      icon: UserCheck,
      color: 'orange',
      bgFrom: 'from-orange-600',
      bgTo: 'to-orange-700',
      loginPath: '/coordinator-login'
    }
  };

  const config = userTypeConfig[userType] || userTypeConfig.tpo;
  const IconComponent = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await forgotPassword(userType, email);
      
      if (response.data.success) {
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
      <div className={`min-h-screen bg-gradient-to-br ${config.bgFrom} ${config.bgTo} flex items-center justify-center p-4`}>
        <button
          onClick={() => navigate(config.loginPath)}
          className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Login</span>
        </button>

        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">OTP Sent!</h1>
            <p className="text-white/80">Check your email for the reset code</p>
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
                className={`w-full bg-gradient-to-r ${config.bgFrom} ${config.bgTo} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity`}
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
    <div className={`min-h-screen bg-gradient-to-br ${config.bgFrom} ${config.bgTo} flex items-center justify-center p-4`}>
      <button
        onClick={() => navigate(config.loginPath)}
        className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Login</span>
      </button>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconComponent className={`h-8 w-8 text-${config.color}-600`} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-white/80">Enter your email to receive reset code</p>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className={`w-full bg-gradient-to-r ${config.bgFrom} ${config.bgTo} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center`}
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
