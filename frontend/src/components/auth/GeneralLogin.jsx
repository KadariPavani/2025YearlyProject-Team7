// GeneralLogin.jsx - EXACT UI + REMEMBER ME + PERFECT LOGIN FUNCTIONALITY
// Replace your entire GeneralLogin.jsx with this

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn, Users, BookOpen, 
  GraduationCap, UserCheck
} from 'lucide-react';

// TEXT LOGIC - Centralized UI strings for consistency
const TEXT = {
  labels: {
    email: 'Email Address',
    password: 'Password',
    rememberMe: 'Remember me',
  },
  placeholders: {
    email: 'Enter your email',
    password: 'Enter your password',
  },
  buttons: {
    home: 'Home',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    forgotPassword: 'Forgot your password?',
  },
  messages: {
    newUser: (userType) => `New ${userType}? Contact your administrator for account setup.`,
    loginFailed: 'Login failed. Please try again.',
  },
};

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
  const [rememberMe, setRememberMe] = useState(false);

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

  // Load saved email if "Remember Me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem(`${userType}_remembered_email`);
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, [userType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login attempt:', { email: formData.email, userType });

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
      console.log('📥 Login response:', result);

      if (result.success) {
        const token = result.token;
        const user = result.user;
        const effectiveUserType = user.userType || userType;

        // PRIMARY STORAGE - Used by all dashboards
        localStorage.setItem('token', token);
        localStorage.setItem('userType', effectiveUserType);
        
        // LEGACY STORAGE - Keep for backward compatibility
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));

        // Remember Me functionality
        if (rememberMe) {
          localStorage.setItem(`${userType}_remembered_email`, formData.email);
        } else {
          localStorage.removeItem(`${userType}_remembered_email`);
        }
        
        // User-specific storage
        if (userType === 'trainer') {
          localStorage.setItem('trainerToken', token);
          localStorage.setItem('trainerData', JSON.stringify(user));
        }

        if (userType === 'coordinator') {
          localStorage.setItem('coordinatorToken', token);
          localStorage.setItem('coordinatorData', JSON.stringify(user));
        }

        console.log('✅ Token saved:', token.substring(0, 30) + '...');
        console.log('✅ UserType saved:', effectiveUserType);
        console.log('✅ User data saved:', user);

        // Verify token was saved
        const savedToken = localStorage.getItem('token');
        console.log('🔍 Verification - Token exists:', !!savedToken);

        if (!savedToken) {
          console.error('❌ CRITICAL: Token was not saved!');
          setError('Failed to save login session. Please try again.');
          return;
        }

        console.log('🎉 Login successful! Navigating to:', config.dashboard);
        navigate(config.dashboard);
      } else {
        console.error('❌ Login failed:', result.message);
        setError(result.message);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(TEXT.messages.loginFailed);
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
        <span className="text-sm">{TEXT.buttons.home}</span>
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
                {TEXT.labels.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg ${config.focusStyles} transition-colors`}
                  placeholder={TEXT.placeholders.email}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {TEXT.labels.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg ${config.focusStyles} transition-colors`}
                  placeholder={TEXT.placeholders.password}
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

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`h-4 w-4 text-${config.color}-600 focus:ring-${config.color}-500 border-gray-300 rounded`}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                {TEXT.labels.rememberMe}
              </label>
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
              {loading ? TEXT.buttons.signingIn : TEXT.buttons.signIn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(`/${userType}-forgot-password`)}
              className={`text-${config.color}-600 hover:text-${config.color}-800 text-sm font-medium`}
            >
              {TEXT.buttons.forgotPassword}
            </button>
          </div>
        </div>

        {/* Admin contact info */}
        <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-lg shadow-lg">
          <p className="text-gray-700 text-sm text-center">
            {TEXT.messages.newUser(userType)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneralLogin;
