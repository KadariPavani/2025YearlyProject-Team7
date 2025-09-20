// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// import axios from 'axios';

// // Import components
// import Landing from './pages/Landing';
// import SuperAdminLogin from './components/auth/SuperAdminLogin';
// import OTPVerification from './components/auth/OTPVerification';
// import AdminForgotPassword from './components/auth/AdminForgotPassword';
// import AdminResetPassword from './components/auth/AdminResetPassword';
// import AdminDashboard from './pages/admin/AdminDashboard';
// import AdminProfile from './pages/admin/AdminProfile';

// // Configure axios defaults
// axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// axios.defaults.withCredentials = true;

// // Protected Route Component with better token validation
// const ProtectedRoute = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const checkAuth = () => {
//       const token = localStorage.getItem('adminToken');
//       const adminData = localStorage.getItem('adminData');

//       if (!token || !adminData) {
//         localStorage.removeItem('adminToken');
//         localStorage.removeItem('adminData');
//         navigate('/super-admin-login', { replace: true });
//       } else {
//         setIsAuthenticated(true);
//       }
//       setIsLoading(false);
//     };

//     checkAuth();
//   }, [navigate]);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
//       </div>
//     );
//   }

//   return isAuthenticated ? children : null;
// };

// function App() {
//   return (
//     <Router>
//       <div className="App">
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/" element={<Landing />} />
//           <Route path="/super-admin-login" element={<SuperAdminLogin />} />
//           <Route path="/otp-verification" element={<OTPVerification />} />
//           <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
//           <Route path="/admin-reset-password" element={<AdminResetPassword />} />
          
//           {/* Protected Admin Routes */}
//           <Route 
//             path="/admin-dashboard" 
//             element={
//               <ProtectedRoute>
//                 <AdminDashboard />
//               </ProtectedRoute>
//             } 
//           />
//           <Route 
//             path="/admin-profile" 
//             element={
//               <ProtectedRoute>
//                 <AdminProfile />
//               </ProtectedRoute>
//             } 
//           />

//           {/* Route for change password */}
//           <Route 
//             path="/admin-change-password" 
//             element={
//               <ProtectedRoute>
//                 <SuperAdminLogin />
//               </ProtectedRoute>
//             } 
//           />

//           {/* Placeholder routes for other dashboards */}
//           <Route path="/tpo-login" element={<div className="min-h-screen bg-blue-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-blue-600 mb-4">TPO Login</h2><p className="text-gray-600">TPO login functionality will be implemented here</p></div></div>} />
//           <Route path="/trainer-login" element={<div className="min-h-screen bg-green-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-green-600 mb-4">Trainer Login</h2><p className="text-gray-600">Trainer login functionality will be implemented here</p></div></div>} />
//           <Route path="/student-login" element={<div className="min-h-screen bg-purple-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-purple-600 mb-4">Student Login</h2><p className="text-gray-600">Student login functionality will be implemented here</p></div></div>} />
//           <Route path="/coordinator-login" element={<div className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="bg-white p-8 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-orange-600 mb-4">Coordinator Login</h2><p className="text-gray-600">Coordinator login functionality will be implemented here</p></div></div>} />

//           {/* Catch all route */}
//           <Route path="*" element={<Navigate to="/" />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
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
import AddTrainerPage from './pages/admin/AddTrainerPage';
import AddTPOPage from './pages/admin/AddTPOPage';
import ViewTPOsPage from './pages/admin/ViewTPOsPage';
import ViewTrainersPage from './pages/admin/ViewTrainersPage';
import AddAdmin from './pages/admin/AddAdmin';
import ViewAdmins from './pages/admin/ViewAdmins';
// Import the dashboard components
import TPODashboard from './pages/tpo/TPODashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';

// Import profile components
import TPOProfile from './pages/tpo/TPOProfile';
import TrainerProfile from './pages/trainer/TrainerProfile';
import StudentProfile from './pages/student/StudentProfile';
import CoordinatorProfile from './pages/coordinator/CoordinatorProfile';

// Import password change components
import AdminChangePassword from './pages/admin/AdminChangePassword';
import TPOChangePassword from './pages/tpo/TPOChangePassword';
import TrainerChangePassword from './pages/trainer/TrainerChangePassword';
import StudentChangePassword from './pages/student/StudentChangePassword';
import CoordinatorChangePassword from './pages/coordinator/CoordinatorChangePassword';

// Import auth components
import GeneralForgotPassword from './components/auth/GeneralForgotPassword';
import GeneralResetPassword from './components/auth/GeneralResetPassword';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// General Login Component for TPO, Trainer, Student, Coordinator
const GeneralLogin = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract userType from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('tpo-login')) setUserType('tpo');
    else if (path.includes('trainer-login')) setUserType('trainer');
    else if (path.includes('student-login')) setUserType('student');
    else if (path.includes('coordinator-login')) setUserType('coordinator');
  }, []);

  const userTypeConfig = {
    tpo: {
      title: 'TPO Login',
      color: 'blue',
      bgFrom: 'from-blue-600',
      bgTo: 'to-blue-700',
      dashboard: '/tpo-dashboard'
    },
    trainer: {
      title: 'Trainer Login',
      color: 'green',
      bgFrom: 'from-green-600',
      bgTo: 'to-green-700',
      dashboard: '/trainer-dashboard'
    },
    student: {
      title: 'Student Login',
      color: 'purple',
      bgFrom: 'from-purple-600',
      bgTo: 'to-purple-700',
      dashboard: '/student-dashboard'
    },
    coordinator: {
      title: 'Coordinator Login',
      color: 'orange',
      bgFrom: 'from-orange-600',
      bgTo: 'to-orange-700',
      dashboard: '/coordinator-dashboard'
    }
  };

  const config = userTypeConfig[userType] || userTypeConfig.tpo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          userType
        })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('userToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        navigate(config.dashboard);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgFrom} ${config.bgTo} flex items-center justify-center p-4`}>
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
      >
        <span>← Back to Home</span>
      </button>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-white opacity-80">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${config.bgFrom} ${config.bgTo} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Forgot your password? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


// Protected Route Component for Admin
const ProtectedAdminRoute = ({ children }) => {
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

// Protected Route Component for General Users
const ProtectedUserRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('userToken');
      const userData = localStorage.getItem('userData');

      if (!token || !userData) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        navigate('/', { replace: true });
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
          
          {/* Admin Authentication Routes */}
          <Route path="/super-admin-login" element={<SuperAdminLogin />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin-reset-password" element={<AdminResetPassword />} />
          <Route path="/add-trainer" element={<AddTrainerPage />} />
          <Route path="/add-tpo" element={<AddTPOPage />} />
          <Route path="/view-tpos" element={<ViewTPOsPage />} />
          <Route path="/view-trainers" element={<ViewTrainersPage />} /> 
          <Route path="/add-admin" element={<AddAdmin />} />
          <Route path="/view-admins" element={<ViewAdmins />} />
          {/* General User Login Routes */}
          <Route path="/tpo-login" element={<GeneralLogin />} />
          <Route path="/trainer-login" element={<GeneralLogin />} />
          <Route path="/student-login" element={<GeneralLogin />} />
          <Route path="/coordinator-login" element={<GeneralLogin />} />

          {/* General User Forgot Password Routes */}
          <Route path="/tpo-forgot-password" element={<GeneralForgotPassword />} />
          <Route path="/trainer-forgot-password" element={<GeneralForgotPassword />} />
          <Route path="/student-forgot-password" element={<GeneralForgotPassword />} />
          <Route path="/coordinator-forgot-password" element={<GeneralForgotPassword />} />

          {/* General User Reset Password Routes */}
          <Route path="/tpo-reset-password" element={<GeneralResetPassword />} />
          <Route path="/trainer-reset-password" element={<GeneralResetPassword />} />
          <Route path="/student-reset-password" element={<GeneralResetPassword />} />
          <Route path="/coordinator-reset-password" element={<GeneralResetPassword />} />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin-profile" 
            element={
              <ProtectedAdminRoute>
                <AdminProfile />
              </ProtectedAdminRoute>
            } 
          />

          {/* Protected User Dashboard Routes */}
          <Route 
            path="/tpo-dashboard" 
            element={
              <ProtectedUserRoute>
                <TPODashboard />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/trainer-dashboard" 
            element={
              <ProtectedUserRoute>
                <TrainerDashboard />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedUserRoute>
                <StudentDashboard />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/coordinator-dashboard" 
            element={
              <ProtectedUserRoute>
                <CoordinatorDashboard />
              </ProtectedUserRoute>
            } 
          />

          {/* Protected User Profile Routes */}
          <Route 
            path="/tpo-profile" 
            element={
              <ProtectedUserRoute>
                <TPOProfile />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/trainer-profile" 
            element={
              <ProtectedUserRoute>
                <TrainerProfile />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/student-profile" 
            element={
              <ProtectedUserRoute>
                <StudentProfile />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/coordinator-profile" 
            element={
              <ProtectedUserRoute>
                <CoordinatorProfile />
              </ProtectedUserRoute>
            } 
          />

          {/* Protected Password Change Routes */}
          <Route 
            path="/admin-change-password" 
            element={
              <ProtectedAdminRoute>
                <AdminChangePassword />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/tpo-change-password" 
            element={
              <ProtectedUserRoute>
                <TPOChangePassword />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/trainer-change-password" 
            element={
              <ProtectedUserRoute>
                <TrainerChangePassword />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/student-change-password" 
            element={
              <ProtectedUserRoute>
                <StudentChangePassword />
              </ProtectedUserRoute>
            } 
          />
          <Route 
            path="/coordinator-change-password" 
            element={
              <ProtectedUserRoute>
                <CoordinatorChangePassword />
              </ProtectedUserRoute>
            } 
          />

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;