import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn, Users, BookOpen, 
  GraduationCap, UserCheck
} from 'lucide-react';

// General Login Component
const GeneralLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userTypeConfig = {
    tpo: {
      title: 'TPO Login',
      icon: Users,
      color: 'blue',
      bgFrom: 'from-blue-600',
      bgTo: 'to-blue-700',
      dashboard: '/tpo-dashboard'
    },
    trainer: {
      title: 'Trainer Login',
      icon: BookOpen,
      color: 'green',
      bgFrom: 'from-green-600',
      bgTo: 'to-green-700',
      dashboard: '/trainer-dashboard'
    },
    student: {
      title: 'Student Login',
      icon: GraduationCap,
      color: 'purple',
      bgFrom: 'from-purple-600',
      bgTo: 'to-purple-700',
      dashboard: '/student-dashboard'
    },
    coordinator: {
      title: 'Coordinator Login',
      icon: UserCheck,
      color: 'orange',
      bgFrom: 'from-orange-600',
      bgTo: 'to-orange-700',
      dashboard: '/coordinator-dashboard'
    }
  };

  const userType = useMemo(() => {
    const path = location.pathname;
    if (path.includes('tpo-login')) return 'tpo';
    if (path.includes('trainer-login')) return 'trainer';
    if (path.includes('student-login')) return 'student';
    if (path.includes('coordinator-login')) return 'coordinator';
    return 'tpo';
  }, [location.pathname]);

  const config = userTypeConfig[userType] || userTypeConfig.tpo;
  const IconComponent = config.icon;

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
        if (userType === 'trainer') {
          localStorage.setItem('trainerToken', result.token);
          localStorage.setItem('trainerData', JSON.stringify(result.user));
        }
        navigate(config.dashboard);
      } else {
        setError(result.message);
      }
    } catch  {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgFrom} ${config.bgTo} flex items-center justify-center p-4`}>
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Home</span>
      </button>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconComponent className={`h-8 w-8 text-${config.color}-600`} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-white/80">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
              className={`w-full bg-gradient-to-r ${config.bgFrom} ${config.bgTo} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(`/${userType}-forgot-password`)}
              className={`text-${config.color}-600 hover:text-${config.color}-800 text-sm font-medium`}
            >
              Forgot your password?
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-white/80 text-sm text-center">
            New {userType}? Contact your administrator for account setup.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneralLogin;