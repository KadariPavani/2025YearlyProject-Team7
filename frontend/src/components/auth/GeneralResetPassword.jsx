import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle,
  Users, BookOpen, GraduationCap, UserCheck
} from 'lucide-react';
import { resetPassword } from '../../services/generalAuthService';

const GeneralResetPassword = () => {
  const { userType } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
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
      bgFrom: 'from-blue-600',
      bgTo: 'to-blue-700',
      loginPath: '/tpo-login'
    },
    trainer: {
      title: 'Trainer Reset Password',
      icon: BookOpen,
      color: 'green',
      bgFrom: 'from-green-600',
      bgTo: 'to-green-700',
      loginPath: '/trainer-login'
    },
    student: {
      title: 'Student Reset Password',
      icon: GraduationCap,
      color: 'purple',
      bgFrom: 'from-purple-600',
      bgTo: 'to-purple-700',
      loginPath: '/student-login'
    },
    coordinator: {
      title: 'Coordinator Reset Password',
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
      const response = await resetPassword(userType, {
        email: formData.email,
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
      <div className={`min-h-screen bg-gradient-to-br ${config.bgFrom} ${config.bgTo} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Password Reset!</h1>
            <p className="text-white/80">Your password has been successfully reset</p>
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
              className={`w-full bg-gradient-to-r ${config.bgFrom} ${config.bgTo} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity`}
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgFrom} ${config.bgTo} flex items-center justify-center p-4`}>
      <button
        onClick={() => navigate(`/${userType}-forgot-password`)}
        className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconComponent className={`h-8 w-8 text-${config.color}-600`} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-white/80">Enter OTP and new password</p>
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
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                required
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className={`w-full bg-gradient-to-r ${config.bgFrom} ${config.bgTo} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center`}
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
