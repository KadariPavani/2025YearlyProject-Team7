import api from './api';

export const requestAdminPasswordResetOTP = (email) => {
  return api.post('/api/admin/forgot-password', { email });
};

export const resetAdminPasswordWithOTP = ({ email, otp, newPassword }) => {
  return api.post('/api/admin/reset-password', { email, otp, newPassword });
};

export default {
  requestAdminPasswordResetOTP,
  resetAdminPasswordWithOTP
};

