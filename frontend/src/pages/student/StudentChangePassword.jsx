import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Lock, Eye, EyeOff, Check, AlertCircle, GraduationCap
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/common/Header';
import ToastNotification from '../../components/ui/ToastNotification';

const StudentChangePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }; 
  
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryUnread, setCategoryUnread] = useState({});

  // User data state
  const [userData, setUserData] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/student-login");
  };

  const studentData = userData ? { user: userData, ...userData } : null;
  const computedStudentId = userData?.user?.id || userData?.user?._id || userData?.id || userData?._id;

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUserData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/student`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notifications = res.data.data || [];
      const unreadByCategory = res.data.unreadByCategory || {};
      const totalUnread = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);

      setNotifications(notifications);
      setCategoryUnread(unreadByCategory);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("userToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setLoading(false);
      showToast('error', 'New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/change-password/student`, {
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
        showToast('success','Password changed successfully!');
        setChangePasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          navigate('/student-dashboard');
        }, 2000);
      } else {
        showToast('error', result.message);
      }
    } catch (err) {
      showToast('error','Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Change Password"
        subtitle="Student Security Settings"
        icon={GraduationCap}
        userData={studentData}
        profileRoute="/student-profile"
        changePasswordRoute="/student-change-password"
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        categoryUnread={categoryUnread}
        unreadCount={unreadCount}
        userType="student"
        userId={computedStudentId}
        onIconClick={() => {
          if (window.location.pathname === '/student-dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/student-dashboard');
          }
        }}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <button
          onClick={() => navigate('/student-dashboard')}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-purple-600" />
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

            {toast && (
              <ToastNotification
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(null)}
              />
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/student-dashboard')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
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

export default StudentChangePassword;
