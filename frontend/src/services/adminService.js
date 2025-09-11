import api from './api';

export const requestAdminPasswordResetOTP = (email) => {
  return api.post('/api/admin/forgot-password', { email });
};

export const resetAdminPasswordWithOTP = ({ email, otp, newPassword }) => {
  return api.post('/api/admin/reset-password', { email, otp, newPassword });
};

export const changeAdminPassword = ({ email, currentPassword, newPassword }) => {
  const token = localStorage.getItem('adminToken');
  return api.post('/api/admin/change-password', 
    { email, currentPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};

export const getAdminProfile = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return api.get('/api/admin/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export default {
  requestAdminPasswordResetOTP,
  resetAdminPasswordWithOTP,
  changeAdminPassword,
  getAdminProfile
};

