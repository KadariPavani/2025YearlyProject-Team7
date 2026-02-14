import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Role-specific config
const ROLE_CONFIG = {
  tpo: {
    tokenKeys: ['userToken'],
    notificationEndpoint: '/api/notifications/tpo',
    userDataEndpoint: '/api/auth/dashboard/tpo',
    loginRoute: '/tpo-login',
    dashboardRoute: '/tpo-dashboard',
    profileRoute: '/tpo-profile',
    changePasswordRoute: '/tpo-change-password',
    storageKeys: ['userToken', 'userData'],
    defaultCategories: {},
  },
  trainer: {
    tokenKeys: ['userToken', 'trainerToken'],
    notificationEndpoint: '/api/trainer/notifications',
    userDataEndpoint: '/api/trainer/profile',
    loginRoute: '/trainer-login',
    dashboardRoute: '/trainer-dashboard',
    profileRoute: '/trainer-profile',
    changePasswordRoute: '/trainer-change-password',
    storageKeys: ['userToken', 'trainerToken', 'userData'],
    defaultCategories: { "My Classes": 0, "Placement Calendar": 0 },
  },
  student: {
    tokenKeys: ['userToken'],
    notificationEndpoint: '/api/notifications/student',
    userDataEndpoint: '/api/student/profile',
    loginRoute: '/student-login',
    dashboardRoute: '/student-dashboard',
    profileRoute: '/student-profile',
    changePasswordRoute: '/student-change-password',
    storageKeys: ['userToken', 'userData'],
    defaultCategories: {},
  },
  coordinator: {
    tokenKeys: ['userToken'],
    notificationEndpoint: '/api/notifications/coordinator',
    userDataEndpoint: '/api/auth/dashboard/coordinator',
    loginRoute: '/coordinator-login',
    dashboardRoute: '/coordinator-dashboard',
    profileRoute: '/coordinator-profile',
    changePasswordRoute: '/coordinator-change-password',
    storageKeys: ['userToken', 'userData'],
    defaultCategories: {},
  },
};

/**
 * Hook that provides all header-related data: userData, notifications, logout, routes.
 * Eliminates duplicated fetchNotifications/markAsRead/markAllAsRead/fetchUserData/handleLogout
 * across dashboard, profile, and change-password pages.
 *
 * @param {string} role - 'tpo' | 'trainer' | 'student' | 'coordinator'
 * @param {object} [existingUserData] - If the page already fetches userData (e.g. dashboards), pass it here to skip re-fetching.
 */
// Read cached userData from localStorage for instant display (no flash of "User")
const getCachedUserData = () => {
  try {
    const stored = localStorage.getItem('userData');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.user || parsed;
    }
  } catch {}
  return null;
};

const useHeaderData = (role, existingUserData = null) => {
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role];

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryUnread, setCategoryUnread] = useState({});
  const [userData, setUserData] = useState(
    existingUserData ? (existingUserData?.user || existingUserData) : getCachedUserData()
  );

  const getToken = useCallback(() => {
    for (const key of config.tokenKeys) {
      const token = localStorage.getItem(key);
      if (token) return token;
    }
    return null;
  }, [config.tokenKeys]);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await axios.get(`${API}${config.notificationEndpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const notifs = res.data.data || [];
      const unreadByCategory = {
        ...config.defaultCategories,
        ...(res.data.unreadByCategory || {}),
      };
      const totalUnread = Object.values(unreadByCategory).reduce((a, b) => a + b, 0);

      setNotifications(notifs);
      setCategoryUnread(unreadByCategory);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [getToken, config.notificationEndpoint, config.defaultCategories]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = getToken();
      await axios.put(
        `${API}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [getToken, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = getToken();
      await axios.put(
        `${API}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [getToken, fetchNotifications]);

  const fetchUserData = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await axios.get(`${API}${config.userDataEndpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const raw = res.data.data;
        // Normalize: dashboard endpoints return { user: { name, ... }, batches, ... }
        // while profile endpoints return { name, email, ... } directly.
        const normalized = raw?.user || raw;
        setUserData(normalized);
        // Update localStorage cache so subsequent navigations have instant name
        try {
          const cached = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem('userData', JSON.stringify({ ...cached, name: normalized.name, email: normalized.email }));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  }, [getToken, config.userDataEndpoint]);

  const handleLogout = useCallback(() => {
    config.storageKeys.forEach((key) => localStorage.removeItem(key));
    navigate(config.loginRoute);
  }, [config.storageKeys, config.loginRoute, navigate]);

  const handleIconClick = useCallback(() => {
    if (window.location.pathname === config.dashboardRoute) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(config.dashboardRoute);
    }
  }, [config.dashboardRoute, navigate]);

  // Auto-fetch on mount when no existing data provided
  useEffect(() => {
    if (!existingUserData) {
      fetchUserData();
    }
    fetchNotifications();
  }, []);

  // Sync external userData changes (normalize the same way)
  useEffect(() => {
    if (existingUserData) {
      setUserData(existingUserData?.user || existingUserData);
    }
  }, [existingUserData]);

  // Compute userId from userData
  const userId = userData?._id || userData?.id;

  // Spreadable object containing all Header-compatible props
  const headerProps = {
    userData,
    profileRoute: config.profileRoute,
    changePasswordRoute: config.changePasswordRoute,
    onLogout: handleLogout,
    notifications,
    onMarkAsRead: markAsRead,
    onMarkAllAsRead: markAllAsRead,
    categoryUnread,
    unreadCount,
    userType: role,
    userId,
    onIconClick: handleIconClick,
  };

  return {
    headerProps,
    fetchNotifications,
    handleLogout,
    dashboardRoute: config.dashboardRoute,
  };
};

export default useHeaderData;
