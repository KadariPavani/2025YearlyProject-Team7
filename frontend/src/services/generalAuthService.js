// File: src/services/generalAuthService.js

import api from './api';

// General authentication functions
export const generalLogin = (credentials) => {
  return api.post('/api/auth/login', credentials);
};

export const getDashboard = (userType) => {
  return api.get(`/api/auth/dashboard/${userType}`);
};

export const getProfile = (userType) => {
  return api.get(`/api/${userType}/profile`);  // Updated to reflect backend route pattern
};

export const updateProfile = (userType, profileData) => {
  return api.put(`/api/${userType}/profile`, profileData);  // Updated accordingly
};

export const changePassword = (userType, passwordData) => {
  return api.post(`/api/auth/change-password/${userType}`, passwordData);
};

export const checkPasswordChange = (userType) => {
  return api.get(`/api/auth/check-password-change/${userType}`);
};

export const forgotPassword = (userType, email) => {
  return api.post(`/api/auth/forgot-password/${userType}`, { email });
};

export const resetPassword = (userType, resetData) => {
  return api.post(`/api/auth/reset-password/${userType}`, resetData);
};

export const logout = () => {
  return api.post('/api/auth/logout');
};
