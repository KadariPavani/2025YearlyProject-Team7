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
      subtitle: 'Access your placement dashboard',
      icon: Users,
      color: 'blue',
      lightBg: 'from-blue-50 via-blue-25 to-white',
      buttonBg: 'from-blue-500 to-blue-600',
      buttonHover: 'hover:from-blue-600 hover:to-blue-700',
      iconBg: 'bg-blue-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
      dashboard: '/tpo-dashboard'
    },
    trainer: {
      title: 'Trainer Login',
      subtitle: 'Access your training dashboard',
      icon: BookOpen,
      color: 'green',
      lightBg: 'from-green-50 via-green-25 to-white',
      buttonBg: 'from-green-500 to-green-600',
      buttonHover: 'hover:from-green-600 hover:to-green-700',
      iconBg: 'bg-green-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500',
      dashboard: '/trainer-dashboard'
    },
    student: {
      title: 'Student Login',
      subtitle: 'Access your student dashboard',
      icon: GraduationCap,
      color: 'purple',
      lightBg: 'from-purple-50 via-purple-25 to-white',
      buttonBg: 'from-purple-500 to-purple-600',
      buttonHover: 'hover:from-purple-600 hover:to-purple-700',
      iconBg: 'bg-purple-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500',
      dashboard: '/student-dashboard'
    },
    coordinator: {
      title: 'Coordinator Login',
      subtitle: 'Access your coordinator dashboard',
      icon: UserCheck,
      color: 'orange',
      lightBg: 'from-orange-50 via-orange-25 to-white',
      buttonBg: 'from-orange-500 to-orange-600',
      buttonHover: 'hover:from-orange-600 hover:to-orange-700',
      iconBg: 'bg-orange-500',
      focusStyles: 'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500',
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
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.lightBg} flex items-center justify-center p-4`}>
      {/* Fixed Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-10 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Home</span>
      </button>

      <div className="max-w-md w-full mt-8 sm:mt-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`${config.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-600">{config.subtitle}</p>
        </div>

        {/* Login Form */}
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
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${config.focusStyles} transition-colors`}
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
                  className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg ${config.focusStyles} transition-colors`}
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
              className={`w-full bg-gradient-to-r ${config.buttonBg} ${config.buttonHover} text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center shadow-lg`}
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

        {/* Admin contact info */}
        <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-lg shadow-lg">
          <p className="text-gray-700 text-sm text-center">
            New {userType}? Contact your administrator for account setup.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneralLogin;