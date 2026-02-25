import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Eye, EyeOff, ArrowLeft, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { clearAllAuthTokens } from '../../utils/authUtils';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PastStudentLogin = () => {
  const navigate = useNavigate();
  const [rollNo, setRollNo]       = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API}/api/past-student/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rollNo: rollNo.trim().toUpperCase(), password })
      });
      const data = await res.json();

      if (data.success) {
        clearAllAuthTokens();
        localStorage.setItem('pastStudentToken', data.token);
        localStorage.setItem('pastStudentData',  JSON.stringify(data.student));
        toast.success(`Welcome, ${data.student.name}!`);
        navigate('/past-student-portal');
      } else {
        setError(data.message || 'Login failed');
        toast.error(data.message || 'Login failed');
      }
    } catch {
      setError('Connection error. Please try again.');
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100 flex items-center justify-center p-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/student-login')}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Student Login
      </button>

      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-gray-900 mb-1">Past Student Login</h1>
          <p className="text-sm text-gray-500">View and update your placement profile</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-7 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Roll number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Roll Number
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-[18px] w-[18px]" />
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={e => setRollNo(e.target.value)}
                  placeholder="e.g. 21001A0501"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all uppercase"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
                <span className="ml-2 font-normal text-gray-400 text-xs">(default: your roll number)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-[18px] w-[18px]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-purple-200/50"
            >
              {loading
                ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-200 border-t-white" />
                : <LogIn className="h-[18px] w-[18px]" />
              }
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              First time logging in? Use your <strong className="text-gray-600">roll number</strong> as the password.
              You can change it after logging in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastStudentLogin;
