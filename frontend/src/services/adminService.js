// // import api from './api';

// import api from './api';

// export const updateStudent = (studentId, studentData) => {
//   const token = localStorage.getItem('adminToken');
//   return api.put(`/api/admin/students/${studentId}`, studentData, {
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   });
// };

// export const deleteStudent = (studentId) => {
//   const token = localStorage.getItem('adminToken');
//   return api.delete(`/api/admin/students/${studentId}`, {
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   });
// };
// // };

// // export const getAdminProfile = () => {
// //   const token = localStorage.getItem('adminToken');
// //   if (!token) {
// //     throw new Error('No authentication token found');
// //   }
  
// //   return api.get('/api/admin/profile', {
// //     headers: {
// //       Authorization: `Bearer ${token}`
// //     }
// //   });
// // };

// // export default {
// //   requestAdminPasswordResetOTP,
// //   resetAdminPasswordWithOTP,
// //   changeAdminPassword,
// //   getAdminProfile
// // };

// // frontend/src/services/adminService.js
// // import api from './api';

// // Existing admin functions
// export const adminLogin = (credentials) => {
//   return api.post('/api/admin/super-admin-login', credentials);
// };

// export const verifyAdminOTP = (data) => {
//   return api.post('/api/admin/verify-otp', data);
// };

// export const requestAdminPasswordResetOTP = (email) => {
//   return api.post('/api/admin/forgot-password', { email });
// };

// export const resetAdminPasswordWithOTP = (data) => {
//   return api.post('/api/admin/reset-password', data);
// };

// export const changeAdminPassword = (data) => {
//   return api.post('/api/admin/change-password', data);
// };

// export const getAdminProfile = () => {
//   return api.get('/api/admin/profile');
// };

// export const getAdminDashboard = () => {
//   return api.get('/api/admin/dashboard');
// };

// export const logoutAdmin = () => {
//   return api.post('/api/admin/logout');
// };

// // New trainer and TPO functions
// export const addTrainer = (trainerData) => {
//   return api.post('/api/admin/add-trainer', trainerData);
// };

// export const addTPO = (tpoData) => {
//   return api.post('/api/admin/add-tpo', tpoData);
// };

// export const getAllTrainers = () => {
//   return api.get('/api/admin/trainers');
// };

// export const getAllTPOs = () => {
//   return api.get('/api/admin/tpos');
// };

// // Batch Management
// export const getAllBatches = () => {
//   return api.get('/api/admin/batches');
// };

// export const getBatchStudents = (batchId) => {
//   return api.get(`/api/admin/batches/${batchId}/students`);
// };

// export const updateBatch = (batchId, batchData) => {
//   return api.put(`/api/admin/batches/${batchId}`, batchData);
// };

// export const deleteBatch = (batchId) => {
//   return api.delete(`/api/admin/batches/${batchId}`);
// };


import api from './api'; // Axios instance or equivalent pre-configured

// Helper to get auth headers
const authHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return { Authorization: `Bearer ${token}` };
};

// Admin Auth & Profile APIs
export const adminLogin = (credentials) => api.post('/api/admin/super-admin-login', credentials);

export const verifyAdminOTP = (data) => api.post('/api/admin/verify-otp', data);

export const requestAdminPasswordResetOTP = (email) => api.post('/api/admin/forgot-password', { email });

export const resetAdminPasswordWithOTP = (data) => api.post('/api/admin/reset-password', data);

export const changeAdminPassword = (data) => api.post('/api/admin/change-password', data);

export const getAdminProfile = () => api.get('/api/admin/profile', { headers: authHeaders() });

export const getAdminDashboard = () => api.get('/api/admin/dashboard', { headers: authHeaders() });

export const logoutAdmin = () => api.post('/api/admin/logout', null, { headers: authHeaders() });

// Trainers and TPOs APIs
export const addTrainer = (trainerData) => api.post('/api/admin/add-trainer', trainerData, { headers: authHeaders() });

export const addTPO = (tpoData) => api.post('/api/admin/add-tpo', tpoData, { headers: authHeaders() });

export const getAllTrainers = () => api.get('/api/admin/trainers', { headers: authHeaders() });

export const getAllTPOs = () => api.get('/api/admin/tpos', { headers: authHeaders() });

// Batch Management APIs
export const getAllBatches = () => api.get('/api/admin/batches', { headers: authHeaders() });

export const getBatchStudents = (batchId) => api.get(`/api/admin/batches/${batchId}/students`, { headers: authHeaders() });

export const updateBatch = (batchId, batchData) => api.put(`/api/admin/batches/${batchId}`, batchData, { headers: authHeaders() });

export const deleteBatch = (batchId) => api.delete(`/api/admin/batches/${batchId}`, { headers: authHeaders() });

// Student Management APIs
export const updateStudent = (studentId, studentData) => api.put(`/api/admin/students/${studentId}`, studentData, { headers: authHeaders() });

export const deleteStudent = (studentId) => api.delete(`/api/admin/students/${studentId}`, { headers: authHeaders() });
