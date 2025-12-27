import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, createBrowserRouter } from 'react-router-dom';
import axios from 'axios';

// --- NEW IMPORT: Infoverse Loading Animation ---
// Make sure this path matches where you saved InfoverseLoader.jsx
import InfoverseLoader from '../src/components/ui/InfoverseLoader.jsx'; 

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
// import ViewTPOsPage from './pages/admin/ViewTPOsPage';
import AddAdmin from './pages/admin/AddAdmin';
// import ViewAdmins from './pages/admin/ViewAdmins';
import ContactPage from "./pages/ContactPage";

// Import the dashboard components
import TPODashboard from './pages/tpo/TPODashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
// Student contest pages
const ContestOverview = React.lazy(() => import('./pages/student/ContestOverview'));
const ContestIDE = React.lazy(() => import('./pages/student/ContestIDE'));
const ContestLeaderboard = React.lazy(() => import('./pages/student/ContestLeaderboard'));
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
import CreateContest from './pages/trainer/CreateContest';
import ContestDetails from './pages/trainer/ContestDetails';
import TrainerContestLeaderboard from './pages/trainer/TrainerContestLeaderboard';
import StudentChangePassword from './pages/student/StudentChangePassword';
import CoordinatorChangePassword from './pages/coordinator/CoordinatorChangePassword';

// Import admin components
// import BatchListPage from './pages/admin/BatchListPage';
import BatchStudentsPage from './pages/admin/BatchStudentsPage';
import GeneralForgotPassword from './components/auth/GeneralForgotPassword';
import GeneralResetPassword from './components/auth/GeneralResetPassword';
import CrtManagementPage from './pages/admin/CrtManagementPage';
import ViewStudentsPage from './pages/admin/ViewStudentsPage';

// Import StudentQuiz
import StudentQuiz from './pages/student/StudentQuiz';
import StudentResources from './pages/student/StudentResources';
import StudentSyllabus from './pages/student/StudentSyllabus'; 
import StudentAssignment from './pages/student/StudentAssignment'; 
import StudentFeedback from './pages/student/StudentFeedback'; 

// Use the dedicated component from components/auth
import GeneralLogin from './components/auth/GeneralLogin';
// InfoVerse / Placements contact form
import GetInTouch from './components/common/GetInTouch';

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
  (error) => Promise.reject(error)
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

    // Handle 401 errors by redirecting to login, but avoid redirecting for login pages or login requests
    if (error.response?.status === 401) {
      const path = window.location.pathname || '';
      const reqUrl = error.config?.url || '';

      const loginPages = ['/super-admin-login', '/trainer-login', '/tpo-login', '/student-login', '/coordinator-login'];
      const isLoginPage = loginPages.some(p => path.startsWith(p));

      const loginEndpoints = ['/api/admin/super-admin-login', '/api/auth/login', '/api/trainer/login', '/api/auth/student-login'];
      const isLoginRequest = loginEndpoints.some(ep => reqUrl.includes(ep));

      // If the user is already on a login page or the failing request was a login attempt,
      // do not perform a full-page redirect — let the component handle the error so it can show messages & focus fields.
      if (isLoginPage || isLoginRequest) {
        return Promise.reject(error);
      }

      if (path.includes('trainer')) {
        localStorage.removeItem('trainerToken');
        localStorage.removeItem('trainerData');
        window.location.href = '/trainer-login';
      } else if (path.includes('admin')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/super-admin-login';
      } else {
        // Generic fallback: clear user session and redirect home
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/super-admin-login",
    element: <SuperAdminLogin />,
  },
  {
    path: "/otp-verification",
    element: <OTPVerification />,
  },
  {
    path: "/admin-forgot-password",
    element: <AdminForgotPassword />,
  },
  {
    path: "/admin-reset-password",
    element: <AdminResetPassword />,
  },
  {
    path: "/add-trainer",
    element: <AddTrainerPage />,
  },
  {
    path: "/add-tpo",
    element: <AddTPOPage />,
  },
  // {
  //   path: "/view-tpos",
  //   element: <ViewTPOsPage />,
  // },

  {
    path: "/add-admin",
    element: <AddAdmin />,
  },
  // {
  //   path: "/view-admins",
  //   element: <ViewAdmins />,
  // },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    path: "/admin/students",
    element: (
      <ProtectedAdminRoute>
        <ViewStudentsPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/tpo-login",
    element: <GeneralLogin />,
  },
  {
    path: "/trainer-login",
    element: <GeneralLogin />,
  },
  {
    path: "/trainer-register",
    element: <TrainerRegister />,
  },
  {
    path: "/student-login",
    element: <GeneralLogin />,
  },
  {
    path: "/coordinator-login",
    element: <GeneralLogin />,
  },
  {
    path: "/tpo-forgot-password",
    element: <GeneralForgotPassword />,
  },
  {
    path: "/trainer-forgot-password",
    element: <GeneralForgotPassword />,
  },
  {
    path: "/student-forgot-password",
    element: <GeneralForgotPassword />,
  },
  {
    path: "/coordinator-forgot-password",
    element: <GeneralForgotPassword />,
  },
  {
    path: "/forgot-password",
    element: <GeneralForgotPassword />,
  },
  {
    path: "/tpo-reset-password",
    element: <GeneralResetPassword />,
  },
  {
    path: "/trainer-reset-password",
    element: <GeneralResetPassword />,
  },
  {
    path: "/student-reset-password",
    element: <GeneralResetPassword />,
  },
  {
    path: "/coordinator-reset-password",
    element: <GeneralResetPassword />,
  },
  {
    path: "/reset-password",
    element: <GeneralResetPassword />,
  },
  {
    path: "/crt-management",
    element: (
      <ProtectedAdminRoute>
        <CrtManagementPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin-dashboard",
    element: (
      <ProtectedAdminRoute>
        <AdminDashboard />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/admin-profile",
    element: (
      <ProtectedAdminRoute>
        <AdminProfile />
      </ProtectedAdminRoute>
    ),
  },
  // {
  //   path: "/admin/batches",
  //   element: (
  //     <ProtectedAdminRoute>
  //       <BatchListPage />
  //     </ProtectedAdminRoute>
  //   ),
  // },
  {
    path: "/admin/batches/:batchId/students",
    element: (
      <ProtectedAdminRoute>
        <BatchStudentsPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/trainer-dashboard",
    element: (
      <TrainerProtectedRoute>
        <TrainerDashboard />
      </TrainerProtectedRoute>
    ),
  },
  {
    path: "/trainer-profile",
    element: (
      <TrainerProtectedRoute>
        <TrainerProfile />
      </TrainerProtectedRoute>
    ),
  },
  {
    path: "/trainer-change-password",
    element: (
      <TrainerProtectedRoute>
        <TrainerChangePassword />
      </TrainerProtectedRoute>
    ),
  },
  {
    path: "/tpo-dashboard",
    element: (
      <ProtectedUserRoute>
        <TPODashboard />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student-dashboard",
    element: (
      <ProtectedUserRoute>
        <StudentDashboard />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/coordinator-dashboard",
    element: (
      <ProtectedUserRoute>
        <CoordinatorDashboard />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/tpo-profile",
    element: (
      <ProtectedUserRoute>
        <TPOProfile />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student-profile",
    element: (
      <ProtectedUserRoute>
        <StudentProfile />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/coordinator-profile",
    element: (
      <ProtectedUserRoute>
        <CoordinatorProfile />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/admin-change-password",
    element: (
      <ProtectedAdminRoute>
        <AdminChangePassword />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: "/tpo-change-password",
    element: (
      <ProtectedUserRoute>
        <TPOChangePassword />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student-change-password",
    element: (
      <ProtectedUserRoute>
        <StudentChangePassword />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/coordinator-change-password",
    element: (
      <ProtectedUserRoute>
        <CoordinatorChangePassword />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student/quizzes",
    element: (
      <ProtectedUserRoute>
        <StudentQuiz />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student/resources",
    element: (
      <ProtectedUserRoute>
        <StudentResources />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student/syllabus",
    element: (
      <ProtectedUserRoute>
        <StudentSyllabus />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student/assignments",
    element: (
      <ProtectedUserRoute>
        <StudentAssignment />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "/student/feedback",
    element: (
      <ProtectedUserRoute>
        <StudentFeedback />
      </ProtectedUserRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  // --- Animation State Logic ---
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Show the logo animation for 3.5 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  // If loading is active, show ONLY the animation
  if (showIntro) {
    return <InfoverseLoader />;
  }
  // --- End Animation Logic ---

  return (
    <ErrorBoundary>
      <Router>
        <div className="App text-sm md:text-base">
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
              {/* <Route path="/view-tpos" element={<ViewTPOsPage />} /> */}
              <Route path="/add-admin" element={<AddAdmin />} />
              {/* <Route path="/view-admins" element={<ViewAdmins />} /> */}
              <Route path="/contact" element={<ContactPage />} />
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
              <Route path="/trainer-login" element={<GeneralLogin />} />
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
              {/* <Route
                path="/admin/batches"
                element={
                  <ProtectedAdminRoute>
                    <BatchListPage />
                  </ProtectedAdminRoute>
                }
              /> */}
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

              {/* Trainer contest routes */}
              <Route
                path="/trainer/contests/create"
                element={
                  <TrainerProtectedRoute>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <CreateContest />
                    </React.Suspense>
                  </TrainerProtectedRoute>
                }
              />
              <Route
                path="/trainer/contests/:id"
                element={
                  <TrainerProtectedRoute>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <ContestDetails />
                    </React.Suspense>
                  </TrainerProtectedRoute>
                }
              />

              <Route
                path="/trainer/contests/:id/leaderboard"
                element={
                  <TrainerProtectedRoute>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <TrainerContestLeaderboard />
                    </React.Suspense>
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

              {/* Student Contest Routes */}
              <Route
                path="/student/contests/:id"
                element={
                  <ProtectedUserRoute>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <ContestOverview />
                    </React.Suspense>
                  </ProtectedUserRoute>
                }
              />

              <Route
                path="/student/contests/:contestId/question/:questionId"
                element={
                  <ProtectedUserRoute>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <ContestIDE />
                    </React.Suspense>
                  </ProtectedUserRoute>
                }
              />

              <Route
                path="/student/contests/:id/leaderboard"
                element={
                  <ProtectedUserRoute>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <ContestLeaderboard />
                    </React.Suspense>
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

              {/* Student Quizzes Route */}
              <Route
                path="/student/quizzes"
                element={
                  <ProtectedUserRoute>
                    <StudentQuiz />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/student/resources"
                element={
                  <ProtectedUserRoute>
                    <StudentResources />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/student/syllabus"
                element={
                  <ProtectedUserRoute>
                    <StudentSyllabus />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/student/assignments"
                element={
                  <ProtectedUserRoute>
                    <StudentAssignment />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/student/feedback"
                element={
                  <ProtectedUserRoute>
                    <StudentFeedback />
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