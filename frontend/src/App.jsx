import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import components
import Landing from './pages/Landing';
import SuperAdminLogin from './components/auth/SuperAdminLogin';
import OTPVerification from './components/auth/OTPVerification';
import AdminForgotPassword from './components/auth/AdminForgotPassword';
import AdminResetPassword from './components/auth/AdminResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/AdminProfile';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Protected Route Component with better token validation
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      const adminData = localStorage.getItem('adminData');

      if (!token || !adminData) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        navigate('/super-admin-login', { replace: true });
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/super-admin-login" element={<SuperAdminLogin />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin-reset-password" element={<AdminResetPassword />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-profile" 
            element={
              <ProtectedRoute>
                <AdminProfile />
              </ProtectedRoute>
            } 
          />

          {/* Route for change password */}
          <Route 
            path="/admin-change-password" 
            element={
              <ProtectedRoute>
                <SuperAdminLogin />
              </ProtectedRoute>
            } 
          />

          {/* Placeholder routes for other dashboards */}
          <Route path="/tpo-login" element={<div className="min-h-screen bg-blue-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-blue-600 mb-4">TPO Login</h2><p className="text-gray-600">TPO login functionality will be implemented here</p></div></div>} />
          <Route path="/trainer-login" element={<div className="min-h-screen bg-green-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-green-600 mb-4">Trainer Login</h2><p className="text-gray-600">Trainer login functionality will be implemented here</p></div></div>} />
          <Route path="/student-login" element={<div className="min-h-screen bg-purple-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-purple-600 mb-4">Student Login</h2><p className="text-gray-600">Student login functionality will be implemented here</p></div></div>} />
          <Route path="/coordinator-login" element={<div className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-orange-600 mb-4">Coordinator Login</h2><p className="text-gray-600">Coordinator login functionality will be implemented here</p></div></div>} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;