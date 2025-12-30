// File: src/services/generalAuthService.js
import api from "./api.js";

// General authentication functions
export const generalLogin = (credentials) => {
  return api.post('/api/auth/login', credentials);
};

export const getDashboard = (userType) => {
  return api.get(`/api/auth/dashboard/${userType}`);
};

// Profile / password endpoints mapping helper
const profileEndpoint = (userType) => {
  switch (userType) {
    case 'student':
      return '/api/student/profile';
    case 'admin':
      return '/api/admin/profile';
    default:
      return `/api/auth/profile/${userType}`; // tpo, trainer, etc.
  }
};

const checkPasswordEndpoint = (userType) => {
  switch (userType) {
    case 'student':
      return '/api/student/check-password-change';
    case 'admin':
      return '/api/admin/check-password-change';
    default:
      return `/api/auth/check-password-change/${userType}`;
  }
};

export const getProfile = (userType) => api.get(profileEndpoint(userType));
export const updateProfile = (userType, profileData) => api.put(profileEndpoint(userType), profileData);
export const changePassword = (userType, passwordData) => api.post(`/api/auth/change-password/${userType}`, passwordData);
export const checkPasswordChange = (userType) => api.get(checkPasswordEndpoint(userType));

export const forgotPassword = (userType, email) => {
  return api.post(`/api/auth/forgot-password/${userType}`, { email });
};

export const resetPassword = (userType, resetData) => {
  return api.post(`/api/auth/reset-password/${userType}`, resetData);
};

export const logout = () => {
  return api.post('/api/auth/logout');
};