// File: src/services/generalAuthService.js
import api from "./api.js";

// General authentication functions
export const generalLogin = (credentials) => {
  return api.post('/api/auth/login', credentials);
};

export const getDashboard = (userType) => {
  return api.get(`/api/auth/dashboard/${userType}`);
};

// TPO Profile functions
export const getProfile = (userType) => {
  return api.get(`/api/auth/profile/${userType}`);
};

export const updateProfile = (userType, profileData) => {
  return api.put(`/api/auth/profile/${userType}`, profileData);
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