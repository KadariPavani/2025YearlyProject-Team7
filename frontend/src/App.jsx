import React, { useEffect, useState, Suspense } from 'react';
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
// import SuperAdminLogin from './components/auth/SuperAdminLogin';
// import AdminResetPassword from './components/auth/AdminResetPassword';
// import AdminForgotPassword from './components/auth/AdminForgotPassword';

// Import admin components
import BatchListPage from './pages/admin/BatchListPage';
import BatchStudentsPage from './pages/admin/BatchStudentsPage';
import GeneralForgotPassword from './components/auth/GeneralForgotPassword';
import GeneralResetPassword from './components/auth/GeneralResetPassword';
import CrtManagementPage from './pages/admin/CrtManagementPage';
import ViewStudentsPage from './pages/admin/ViewStudentsPage';
// Lazy-loaded trainer components
const TrainerRegister = React.lazy(() => import('./pages/trainer/TrainerRegister').catch(() => ({
  default: () => (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Trainer Registration</h2>
        <p className="text-gray-600">Trainer registration component is being developed...</p>
        <div className="mt-4">
          <a href="/trainer-login" className="text-green-600 hover:text-green-800">
            Go to Trainer Login →
          </a>
        </div>
      </div>
    </div>
  ),
})));

const TrainerLogin = React.lazy(() => import('./pages/trainer/TrainerLogin').catch(() => ({
  default: () => (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Trainer Login</h2>
        <p className="text-gray-600">Trainer login component is being developed...</p>
        <div className="mt-4">
          <a href="/trainer-register" className="text-green-600 hover:text-green-800">
            Register as Trainer →
          </a>
        </div>
      </div>
    </div>
  ),
})));

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Add axios interceptor for better error handling
axios.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = localStorage.getItem('trainerToken') || 
                  localStorage.getItem('adminToken') || 
                  localStorage.getItem('userToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error details:', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
      response: {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      },
    });
    
    // Handle 401 errors by redirecting to login
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path.includes('trainer')) {
        localStorage.removeItem('trainerToken');
        localStorage.removeItem('trainerData');
        window.location.href = '/trainer-login';
      } else if (path.includes('admin')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/super-admin-login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading Component
const LoadingSpinner = ({ color = 'green' }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${color}-500`}></div>
  </div>
);

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
      try {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminData');
        if (!token || !adminData) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          navigate('/super-admin-login', { replace: true });
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        navigate('/super-admin-login', { replace: true });
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <LoadingSpinner color="red" />;
  }
  return isAuthenticated ? children : null;
};

// Protected Route Component for Trainer
const TrainerProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('trainerToken');
        const trainerData = localStorage.getItem('trainerData');
        if (!token || !trainerData) {
          localStorage.removeItem('trainerToken');
          localStorage.removeItem('trainerData');
          navigate('/trainer-login', { replace: true });
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Trainer auth check error:', error);
        navigate('/trainer-login', { replace: true });
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <LoadingSpinner color="green" />;
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
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
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
              <Route 
                path="/admin/students" 
                element={
                  <ProtectedAdminRoute>
                    <ViewStudentsPage />
                  </ProtectedAdminRoute>
                } 
              />
              
              {/* General User Login Routes */}
              <Route path="/tpo-login" element={<GeneralLogin />} />
              <Route path="/trainer-login" element={<TrainerLogin />} />
              <Route path="/trainer-register" element={<TrainerRegister />} />
              <Route path="/student-login" element={<GeneralLogin />} />
              <Route path="/coordinator-login" element={<GeneralLogin />} />

              {/* General User Forgot Password Routes */}
              <Route path="/tpo-forgot-password" element={<GeneralForgotPassword />} />
              <Route path="/trainer-forgot-password" element={<GeneralForgotPassword />} />
              <Route path="/student-forgot-password" element={<GeneralForgotPassword />} />
              <Route path="/coordinator-forgot-password" element={<GeneralForgotPassword />} />
              <Route path="/forgot-password" element={<GeneralForgotPassword />} />

              {/* General User Reset Password Routes */}
              <Route path="/tpo-reset-password" element={<GeneralResetPassword />} />
              <Route path="/trainer-reset-password" element={<GeneralResetPassword />} />
              <Route path="/student-reset-password" element={<GeneralResetPassword />} />
              <Route path="/coordinator-reset-password" element={<GeneralResetPassword />} />
              <Route path="/reset-password" element={<GeneralResetPassword />} />
<Route
  path="/crt-management"
  element={
    <ProtectedAdminRoute>
      <CrtManagementPage />
    </ProtectedAdminRoute>
  }
/>
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

              {/* Protected Trainer Routes */}
              {/* Batch Management Routes */}
              <Route 
                path="/admin/batches" 
                element={
                  <ProtectedAdminRoute>
                    <BatchListPage />
                  </ProtectedAdminRoute>
                } 
              />
              <Route 
                path="/admin/batches/:batchId/students" 
                element={
                  <ProtectedAdminRoute>
                    <BatchStudentsPage />
                  </ProtectedAdminRoute>
                } 
              />

              <Route
                path="/trainer-dashboard"
                element={
                  <TrainerProtectedRoute>
                    <TrainerDashboard />
                  </TrainerProtectedRoute>
                }
              />
              <Route
                path="/trainer-profile"
                element={
                  <TrainerProtectedRoute>
                    <TrainerProfile />
                  </TrainerProtectedRoute>
                }
              />
              <Route
                path="/trainer-change-password"
                element={
                  <TrainerProtectedRoute>
                    <TrainerChangePassword />
                  </TrainerProtectedRoute>
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
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;