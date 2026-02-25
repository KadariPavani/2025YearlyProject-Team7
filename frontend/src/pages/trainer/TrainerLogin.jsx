import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, LogIn } from 'lucide-react';
import axios from 'axios';
import { clearAllAuthTokens } from '../../utils/authUtils';

const TrainerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [lockedUntil, setLockedUntil] = useState(null);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/trainer/login', formData);

      if (response.data.success) {
        clearAllAuthTokens();
        localStorage.setItem('trainerToken', response.data.token);
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('trainerData', JSON.stringify(response.data.data));

        setTimeout(() => {
          alert('Login successful!');
          navigate('/trainer-dashboard');
        }, 100);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);

      if (/Trainer not found|User not found|Admin not found/i.test(message)) {
        emailRef.current?.focus();
      } else if (/Invalid password|password/i.test(message)) {
        passwordRef.current?.focus();
      } else if (/locked/i.test(message)) {
        const m = message.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/);
        if (m) setLockedUntil(new Date(m[0]));
      }

      if (error.response?.status === 401) {
        setFormData({ email: '', password: '' });
      }
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
        <span>Home</span>
      </button>

      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-slate-800 mb-1">Trainer Login</h1>
          <p className="text-[13px] text-slate-500">Access your training dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  ref={emailRef}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all ${
                    errors.email ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="Enter your email"
                  disabled={!!lockedUntil}
                />
              </div>
              {errors.email && <p className="mt-1 text-[12px] text-red-500">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-11 py-2.5 border rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all ${
                    errors.password ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="Enter your password"
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
              {errors.password && <p className="mt-1 text-[12px] text-red-500">{errors.password}</p>}
            </div>

            {/* Locked message */}
            {lockedUntil && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-amber-700 text-[13px]">Account locked until {lockedUntil.toLocaleString()}</p>
              </div>
            )}

            {/* Submit Button */}
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/trainer-forgot-password')}
                className="text-blue-600 hover:text-blue-700 text-[13px] font-medium"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>

        {/* Admin contact info */}
        {/* <div className="mt-5 p-3.5 bg-blue-50/60 backdrop-blur-sm rounded-xl border border-blue-100/50">
          <p className="text-slate-500 text-[13px] text-center">
            New trainer? Contact your administrator for account setup.
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default TrainerLogin;
