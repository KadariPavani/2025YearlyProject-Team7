// // File: src/services/api.js
// import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// console.log('API Base URL:', API_BASE_URL);

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   timeout: 15000,
// });

// // Request interceptor with enhanced debugging
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('userToken');
    
//     console.group('API Request Debug');
//     console.log('URL:', config.url);
//     console.log('Method:', config.method?.toUpperCase());
//     console.log('Has Token:', !!token);
    
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token.trim()}`;
//       console.log('Token Length:', token.length);
//       console.log('Token Format Correct:', token.startsWith('eyJ') && token.length > 100);
//     } else {
//       console.warn('No userToken found in localStorage');
//     }
    
//     if (config.data) {
//       console.log('Request Data:', config.data);
//     }
//     console.groupEnd();

//     return config;
//   },
//   (error) => {
//     console.error('Request Interceptor Error:', error);
//     return Promise.reject(error);
//   }
// );

// // Response interceptor with enhanced error handling
// api.interceptors.response.use(
//   (response) => {
//     console.log('API Response Success:', {
//       url: response.config.url,
//       status: response.status,
//       data: response.data
//     });
//     return response;
//   },
//   (error) => {
//     console.group('API Response Error');
//     console.error('URL:', error.config?.url);
//     console.error('Status:', error.response?.status);
//     console.error('Error Data:', error.response?.data);
//     console.error('Error Message:', error.message);
//     console.groupEnd();

//     // Handle specific error cases
//     if (error.response) {
//       // Server responded with error status
//       switch (error.response.status) {
//         case 401:
//           console.error('Unauthorized - Clearing tokens and redirecting');
//           localStorage.removeItem('userToken');
//           localStorage.removeItem('userData');
//           // Don't redirect immediately, let component handle it
//           break;
//         case 403:
//           console.error('Forbidden - Insufficient permissions');
//           break;
//         case 404:
//           console.error('Endpoint not found - Check route configuration');
//           break;
//         case 500:
//           console.error('Server error - Check backend logs');
//           break;
//         default:
//           console.error('Unhandled HTTP error:', error.response.status);
//       }
//     } else if (error.request) {
//       // Request was made but no response received
//       console.error('Network error - Server may be down');
//     } else {
//       // Something else happened
//       console.error('Unexpected error:', error.message);
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
