import React, { useMemo, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn
} from 'lucide-react';
import { clearAllAuthTokens } from '../../utils/authUtils';

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
  const [lockedUntil, setLockedUntil] = useState(null);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const userTypeConfig = {
    tpo: {
      title: 'TPO Login',
      subtitle: 'Access your placement dashboard',
      dashboard: '/tpo-dashboard'
    },
    trainer: {
      title: 'Trainer Login',
      subtitle: 'Access your training dashboard',
      dashboard: '/trainer-dashboard'
    },
    student: {
      title: 'Student Login',
      subtitle: 'Access your student dashboard',
      dashboard: '/student-dashboard'
    },
    coordinator: {
      title: 'Coordinator Login',
      subtitle: 'Access your coordinator dashboard',
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
    setLockedUntil(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
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
        const token = result.token;
        const user = result.user;
        const effectiveUserType = user.userType || userType;

        clearAllAuthTokens();
        localStorage.setItem('token', token);
        localStorage.setItem('userType', effectiveUserType);
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem(`${userType}_remembered_email`, formData.email);
        } else {
          localStorage.removeItem(`${userType}_remembered_email`);
        }

        if (userType === 'trainer') {
          localStorage.setItem('trainerToken', token);
          localStorage.setItem('trainerData', JSON.stringify(user));
        }

        if (userType === 'coordinator') {
          localStorage.setItem('coordinatorToken', token);
          localStorage.setItem('coordinatorData', JSON.stringify(user));
        }

        const savedToken = localStorage.getItem('token');
        if (!savedToken) {
          setError('Failed to save login session. Please try again.');
          return;
        }

        navigate(config.dashboard);
      } else {
        const msg = result.message || 'Login failed';
        toast.error(msg);
        setError(msg);

        if (/User not found|Admin not found/i.test(msg)) {
          emailRef.current?.focus();
        } else if (/Invalid password|password/i.test(msg)) {
          passwordRef.current?.focus();
        } else if (/locked/i.test(msg)) {
          const m = msg.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/);
          if (m) setLockedUntil(new Date(m[0]));
        }
      }
    } catch (err) {
      toast.error(TEXT.messages.loginFailed);
      setError(TEXT.messages.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-[13px] font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{TEXT.buttons.home}</span>
      </button>

      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-slate-800 mb-1">{config.title}</h1>
          {/* <p className="text-[13px] text-slate-500">{config.subtitle}</p> */}
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                {TEXT.labels.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder={TEXT.placeholders.email}
                  disabled={!!lockedUntil}
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                {TEXT.labels.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder={TEXT.placeholders.password}
                  disabled={!!lockedUntil}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-[13px] text-slate-600">
                {TEXT.labels.rememberMe}
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-red-600 text-[13px]">{error}</p>
              </div>
            )}

            {lockedUntil && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-amber-700 text-[13px]">Account locked until {lockedUntil.toLocaleString()}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!lockedUntil}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-200/50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-white"></div>
              ) : (
                <LogIn className="h-[18px] w-[18px]" />
              )}
              {loading ? TEXT.buttons.signingIn : TEXT.buttons.signIn}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <button
              onClick={() => navigate(`/${userType}-forgot-password`)}
              className="text-blue-600 hover:text-blue-700 text-[13px] font-medium"
            >
              {TEXT.buttons.forgotPassword}
            </button>

            {userType === 'student' && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[12px] text-slate-400 mb-1">Already graduated?</p>
                <button
                  onClick={() => navigate('/past-student-login')}
                  className="text-purple-600 hover:text-purple-700 text-[13px] font-semibold"
                >
                  Past Student Login →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Admin contact info */}
        {/* <div className="mt-5 p-3.5 bg-blue-50/60 backdrop-blur-sm rounded-xl border border-blue-100/50">
          <p className="text-slate-500 text-[13px] text-center">
            {TEXT.messages.newUser(userType)}
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default GeneralLogin;
