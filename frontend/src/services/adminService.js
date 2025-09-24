// import api from './api';

import api from './api';

export const updateStudent = (studentId, studentData) => {
  const token = localStorage.getItem('adminToken');
  return api.put(`/api/admin/students/${studentId}`, studentData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const deleteStudent = (studentId) => {
  const token = localStorage.getItem('adminToken');
  return api.delete(`/api/admin/students/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
// };

// export const getAdminProfile = () => {
//   const token = localStorage.getItem('adminToken');
//   if (!token) {
//     throw new Error('No authentication token found');
//   }
  
//   return api.get('/api/admin/profile', {
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   });
// };

// export default {
//   requestAdminPasswordResetOTP,
//   resetAdminPasswordWithOTP,
//   changeAdminPassword,
//   getAdminProfile
// };

// frontend/src/services/adminService.js
// import api from './api';

// Existing admin functions
export const adminLogin = (credentials) => {
  return api.post('/api/admin/super-admin-login', credentials);
};

export const verifyAdminOTP = (data) => {
  return api.post('/api/admin/verify-otp', data);
};

export const requestAdminPasswordResetOTP = (email) => {
  return api.post('/api/admin/forgot-password', { email });
};

export const resetAdminPasswordWithOTP = (data) => {
  return api.post('/api/admin/reset-password', data);
};

export const changeAdminPassword = (data) => {
  return api.post('/api/admin/change-password', data);
};

export const getAdminProfile = () => {
  return api.get('/api/admin/profile');
};

export const getAdminDashboard = () => {
  return api.get('/api/admin/dashboard');
};

export const logoutAdmin = () => {
  return api.post('/api/admin/logout');
};

// New trainer and TPO functions
export const addTrainer = (trainerData) => {
  return api.post('/api/admin/add-trainer', trainerData);
};

export const addTPO = (tpoData) => {
  return api.post('/api/admin/add-tpo', tpoData);
};

export const getAllTrainers = () => {
  return api.get('/api/admin/trainers');
};

export const getAllTPOs = () => {
  return api.get('/api/admin/tpos');
};

// Batch Management
export const getAllBatches = () => {
  return api.get('/api/admin/batches');
};

export const getBatchStudents = (batchId) => {
  return api.get(`/api/admin/batches/${batchId}/students`);
};

export const updateBatch = (batchId, batchData) => {
  return api.put(`/api/admin/batches/${batchId}`, batchData);
};

export const deleteBatch = (batchId) => {
  return api.delete(`/api/admin/batches/${batchId}`);
};
