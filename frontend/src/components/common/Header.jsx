import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  ChevronLeft,
  CheckCheck
} from 'lucide-react';

/**
 * Professional Header Component - Consistent design across all dashboards
 * All header colors are centralized here - change colors in one place!
 */
const Header = ({
  title = 'Dashboard',
  subtitle = 'Management Portal',
  // When true, shows the title/subtitle inside the header. Default: false (title is rendered by pages)
  showTitleInHeader = false,
  // Prefer a logo image (use a public path or import). If not provided, falls back to Icon component.
  logoSrc = '/IFlogo.png',
  logoAlt = 'InfoVerse',
  icon: Icon,
  userData = null,
  profileRoute = '/profile',
  changePasswordRoute = '/change-password',
  onLogout,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
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
    icon: '#374151'   // Dark gray for icons (gray-700)
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-white text-gray-900 shadow-sm"
      style={{
        background: '#ffffff',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 md:py-3 min-h-[56px]">
          {/* Left Section */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {logoSrc ? (
              <div 
                className={`p-1 md:p-1 rounded-md ${onIconClick ? 'cursor-pointer hover:bg-white/10 transition-colors duration-200' : ''}`}
                onClick={onIconClick}
              >
                <img src={logoSrc} alt={logoAlt} className="h-10 w-10 md:h-12 md:w-12 object-contain" />
              </div>
            ) : Icon && (
              <div 
                className={`bg-white p-2 rounded-lg md:rounded-xl shadow-md ${
                  onIconClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''
                }`}
                onClick={onIconClick}
              >
                <Icon className="h-6 w-6 md:h-8 md:w-8" style={{ color: colors.icon }} />
              </div>
            )}
            {showTitleInHeader && (
              <div>
                <h1 className="text-base md:text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">{subtitle}</p>
              </div>
            )}
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
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown - Mobile Optimized */}
              {showNotifications && (
                <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto mt-3 sm:w-80 md:w-96 z-50 bg-white/95 border border-white/10 shadow-lg rounded-xl p-3 sm:p-4 space-y-3 max-h-[calc(100vh-100px)] sm:max-h-[28rem] md:max-h-[32rem] overflow-y-auto">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <h3 className="text-gray-900 font-semibold flex items-center gap-2 text-sm md:text-base">
                      <Bell className="h-4 w-4 text-gray-600" /> Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && onMarkAllAsRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAllAsRead();
                          }}
                          className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 sm:px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1 transition-colors"
                          title="Mark all as read"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Mark All Read
                        </button>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 sm:px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                        {unreadCount} new
                      </span>
                    </div>
                  </div>

                  {!selectedCategory && categories.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {categories.map((category) => (
                        <div
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer transition-all gap-2 relative"
                        >
                          {categoryUnread[category] > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 ring-2 ring-white"></span>
                          )}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">{category}</span>
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
                        <h4 className="text-gray-900 font-semibold text-xs sm:text-sm truncate flex-1 text-center">{selectedCategory}</h4>
                      </div>

                      {notifications.filter(n => n.category === selectedCategory).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                      ) : (
                        notifications
                          .filter(n => n.category === selectedCategory)
                          .map((notification) => {
                            const recipient = notification.recipients?.find(
                              (r) => {
                                const rId = r.recipientId?._id || r.recipientId;
                                return rId?.toString() === userId?.toString();
                              }
                            );
                            const isUnread = recipient && !recipient.isRead;

                            return (
                              <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-2.5 sm:p-3 mb-2 rounded-xl cursor-pointer border transition-all relative ${
                                  isUnread ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-white hover:bg-gray-50 border-gray-200'
                                }`}
                              >
                                {isUnread && (
                                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                                )}
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words pr-4">{notification.title}</p>
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
                className="flex items-center space-x-2 p-1 bg-transparent rounded-md hover:bg-gray-100 transition-colors duration-200 text-gray-700"
                aria-label="Profile menu"
              >
                {userData?.profileImage ? (
                  <img
                    src={userData.profileImage}
                    alt="Profile"
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
                  </div>
                )}
                <span className="text-sm font-medium hidden md:inline-block text-gray-800">
                  {userData?.name || userData?.user?.name || 'User'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-700" />
              </button>

              {/* Profile Menu - Solid Background */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-sm py-2 z-10 border border-gray-200">
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
