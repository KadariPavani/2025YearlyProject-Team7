import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  ChevronLeft
} from 'lucide-react';

/**
 * Professional Header Component - Consistent design across all dashboards
 * All header colors are centralized here - change colors in one place!
 */
const Header = ({
  title = 'Dashboard',
  subtitle = 'Management Portal',
  icon: Icon,
  userData = null,
  profileRoute = '/profile',
  changePasswordRoute = '/change-password',
  onLogout,
  notifications = [],
  onMarkAsRead,
  categoryUnread = {},
  unreadCount = 0,
  userType = 'user',
  userId = null,
  onIconClick = null
}) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
        setSelectedCategory(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setShowProfileDropdown(false);
    navigate(profileRoute);
  };

  const handleChangePasswordClick = () => {
    setShowProfileDropdown(false);
    navigate(changePasswordRoute);
  };

  const handleLogoutClick = () => {
    setShowProfileDropdown(false);
    if (onLogout) onLogout();
  };

  const handleNotificationClick = (notification) => {
    if (onMarkAsRead) onMarkAsRead(notification._id);
  };

  const categories = Object.keys(categoryUnread).length > 0 
    ? Object.keys(categoryUnread) 
    : [...new Set(notifications.map(n => n.category).filter(Boolean))];

  // CENTRALIZED HEADER COLORS - CHANGE HERE FOR ALL HEADERS
  // Dark blue to light blue gradient for all headers across the website
  const colors = { 
    from: '#2563eb',  // Dark blue (blue-900)
    to: '#60a5fa',    // Light blue (blue-400)
    icon: '#2563eb'   // Medium blue (blue-600)
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${colors.from}b3 0%, ${colors.to}99 100%)`,
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Left Section */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {Icon && (
              <div 
                className={`bg-white p-2 rounded-lg md:rounded-xl shadow-md ${
                  onIconClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''
                }`}
                onClick={onIconClick}
              >
                <Icon className="h-6 w-6 md:h-8 md:w-8" style={{ color: colors.icon }} />
              </div>
            )}
            <div>
              <h1 className="text-lg md:text-2xl font-bold drop-shadow-md">{title}</h1>
              <p className="text-xs md:text-sm opacity-95 hidden sm:block drop-shadow">{subtitle}</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3 md:space-x-6">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setSelectedCategory(null);
                }}
                className="relative p-2 text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6 drop-shadow-md" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown - Mobile Optimized */}
              {showNotifications && (
                <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto mt-3 sm:w-80 md:w-96 z-50 bg-white border border-gray-200 shadow-2xl rounded-2xl p-3 sm:p-4 space-y-3 max-h-[calc(100vh-100px)] sm:max-h-[28rem] md:max-h-[32rem] overflow-y-auto">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <h3 className="text-gray-900 font-semibold flex items-center gap-2 text-sm md:text-base">
                      <Bell className="h-4 w-4 text-gray-600" /> Notifications
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 sm:px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                      {unreadCount} new
                    </span>
                  </div>

                  {!selectedCategory && categories.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {categories.map((category) => (
                        <div
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer transition-all gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">{category}</span>
                            {categoryUnread[category] > 0 && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>}
                          </div>
                          <span className="text-xs text-gray-600 font-medium whitespace-nowrap flex-shrink-0">
                            {categoryUnread[category] > 0 ? `${categoryUnread[category]} new` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!selectedCategory && categories.length === 0 && notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  )}

                  {selectedCategory && (
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium flex-shrink-0"
                        >
                          <ChevronLeft className="h-4 w-4" /> Back
                        </button>
                        <h4 className="text-gray-900 font-semibold text-xs sm:text-sm truncate">{selectedCategory}</h4>
                      </div>

                      {notifications.filter(n => n.category === selectedCategory).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                      ) : (
                        notifications
                          .filter(n => n.category === selectedCategory)
                          .map((notification) => {
                            const recipient = notification.recipients?.find(
                              (r) => r.recipientId?.toString() === userId?.toString()
                            );
                            const isUnread = recipient && !recipient.isRead;

                            return (
                              <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-2.5 sm:p-3 mb-2 rounded-xl cursor-pointer border transition-all ${
                                  isUnread ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-white hover:bg-gray-50 border-gray-200'
                                }`}
                              >
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1 break-words whitespace-pre-wrap">{notification.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-200"
                aria-label="Profile menu"
              >
                {userData?.profileImage ? (
                  <img
                    src={userData.profileImage}
                    alt="Profile"
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full border-2 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full border-2 border-white bg-white/30 flex items-center justify-center shadow-md">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                )}
                <span className="text-sm font-medium hidden md:inline-block drop-shadow-md">
                  {userData?.name || 'User'}
                </span>
                <ChevronDown className="h-4 w-4 drop-shadow-md" />
              </button>

              {/* Profile Menu - Solid Background */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-10 border border-gray-200">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4 mr-3 text-gray-600" />
                    View Profile
                  </button>
                  <button
                    onClick={handleChangePasswordClick}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-600" />
                    Change Password
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
