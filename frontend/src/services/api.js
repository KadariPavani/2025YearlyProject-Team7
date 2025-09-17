// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add request interceptor for debugging
// api.interceptors.request.use(
//   (config) => {
//     console.log('API Request:', {
//       url: config.url,
//       method: config.method,
//       data: config.data
//     });
//     return config;
//   },
//   (error) => {
//     console.error('API Request Error:', error);
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor for debugging
// api.interceptors.response.use(
//   (response) => {
//     console.log('API Response:', response.data);
//     return response;
//   },
//   (error) => {
//     console.error('API Response Error:', error.response?.data || error);
//     return Promise.reject(error);
//   }
// );

// export default api;

// frontend/src/services/api.js (Updated)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('userToken');
    
    // Use appropriate token based on the endpoint
    if (config.url?.includes('/api/admin/')) {
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else if (config.url?.includes('/api/auth/')) {
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (error.config.url?.includes('/api/admin/')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/super-admin-login';
      } else if (error.config.url?.includes('/api/auth/')) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;