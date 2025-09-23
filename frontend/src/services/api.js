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
    // Add debug logging
    console.log('Request config:', {
      url: config.url,
      headers: config.headers,
      method: config.method
    });

    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('userToken');
    
    // Use appropriate token based on the endpoint
    if (config.url?.startsWith('/api/admin/')) {
      if (adminToken && adminToken.trim()) {
        config.headers['Authorization'] = `Bearer ${adminToken.trim()}`;
      }
    } else if (config.url?.startsWith('/api/auth/') || !config.url?.includes('/api/admin/')) {
      // Use userToken for auth endpoints and non-admin endpoints
      if (userToken && userToken.trim()) {
        config.headers['Authorization'] = `Bearer ${userToken.trim()}`;
      }
    }

    // Add debug logging for token issues
    if (config.headers['Authorization']) {
      console.log('Auth header set:', {
        url: config.url,
        headerPresent: true,
        headerFormat: config.headers['Authorization'].startsWith('Bearer '),
        tokenLength: config.headers['Authorization'].split(' ')[1]?.length || 0
      });
    }
    
    // Add debug logging
    console.log('Token added:', {
      hasAdminToken: !!adminToken,
      hasUserToken: !!userToken,
      finalAuthHeader: config.headers.Authorization
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only handle unauthorized errors for non-login requests
      if (!error.config.url?.includes('login')) {
        try {
          // Try to refresh token or validate session first
          const response = await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('userToken')}`
            }
          });
          
          if (!response.data.valid) {
            throw new Error('Session invalid');
          }
          
          // If session is still valid, retry the original request
          return axios(error.config);
        } catch (refreshError) {
          // Only clear tokens and redirect if session validation fails
          if (error.config.url?.includes('/api/admin/')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = '/super-admin-login';
          } else {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            window.location.href = '/';
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;