import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';
import Header from '../../components/common/Header';
import useHeaderData from '../../hooks/useHeaderData';

const TPOChangePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const header = useHeaderData('tpo');

  const validatePassword = (password) => {
    const minLength = 8;
    const hasLowerCase = /[a-z]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');

    return errors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      setError('All password fields are required');
      setLoading(false);
      return;
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    const passwordErrors = validatePassword(changePasswordData.newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('\\n'));
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Not authenticated. Please login again.');
        navigate('/tpo-login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/change-password/tpo`, {
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

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password');
      }

      if (result.success) {
        setSuccessMessage('Password changed successfully!');
        setChangePasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          navigate('/tpo-dashboard');
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
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Change Password"
        subtitle="TPO Security Settings"
        {...header.headerProps}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <button
          onClick={() => navigate('/tpo-dashboard')}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h2>
            <p className="text-gray-600">Update your password to keep your account secure</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    currentPassword: e.target.value
                  })}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    newPassword: e.target.value
                  })}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    confirmPassword: e.target.value
                  })}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your new password"
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

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <Check className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-green-700">{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/tpo-dashboard')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default TPOChangePassword;
