import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { changeAdminPassword } from '../../services/adminService';
import Header from '../../components/common/Header';
import toast, { Toaster } from 'react-hot-toast';

const AdminChangePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error('New passwords do not match');
      setLoading(false);
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const adminData = JSON.parse(localStorage.getItem('adminData'));
      await changeAdminPassword({
        email: adminData.email,
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword
      });

      toast.success('Password changed successfully!');
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/super-admin-login");
  };

  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="Change Password"
        subtitle="Update your password"
        showTitleInHeader={false}
        userData={adminData}
        profileRoute="/admin-profile"
        changePasswordRoute="/admin-change-password"
        onLogout={handleLogout}
        onIconClick={() => navigate('/admin-dashboard')}
      />
      <Toaster position="top-center" reverseOrder={false} />

      {/* Back Button - Fixed at top right */}
      <div className="fixed top-24 right-4 sm:right-8 z-10">
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:text-gray-900 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 pt-24">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-sm sm:text-lg font-semibold text-gray-900">Change Password</h1>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    currentPassword: e.target.value
                  })}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    newPassword: e.target.value
                  })}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({
                    ...changePasswordData,
                    confirmPassword: e.target.value
                  })}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                className="px-4 py-2 text-xs sm:text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
};

export default AdminChangePassword;
