import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { forgotPassword } from '../../services/generalAuthService';

const GeneralForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const userTypeConfig = {
    tpo: { title: 'TPO Forgot Password', loginPath: '/tpo-login', resetPath: '/tpo-reset-password' },
    trainer: { title: 'Trainer Forgot Password', loginPath: '/trainer-login', resetPath: '/trainer-reset-password' },
    student: { title: 'Student Forgot Password', loginPath: '/student-login', resetPath: '/student-reset-password' },
    coordinator: { title: 'Coordinator Forgot Password', loginPath: '/coordinator-login', resetPath: '/coordinator-reset-password' }
  };

  const userType = useMemo(() => {
    const path = location.pathname;
    if (path.includes('tpo-forgot-password')) return 'tpo';
    if (path.includes('trainer-forgot-password')) return 'trainer';
    if (path.includes('student-forgot-password')) return 'student';
    if (path.includes('coordinator-forgot-password')) return 'coordinator';
    return 'tpo';
  }, [location.pathname]);

  const config = userTypeConfig[userType] || userTypeConfig.tpo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(userType, email);

      if (response.data.success) {
        sessionStorage.setItem('resetEmail', email);
        sessionStorage.setItem('resetUserType', userType);
        setMessage('OTP sent to your email. Redirecting...');
        setTimeout(() => navigate(config.resetPath), 2000);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <button
        onClick={() => navigate(config.loginPath)}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-[13px] font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Login</span>
      </button>

      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-slate-800 mb-1">{config.title}</h1>
          <p className="text-[13px] text-slate-500">Enter your email address to receive a verification code</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-[18px] w-[18px]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-red-600 text-[13px]">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <p className="text-green-700 text-[13px]">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-200/50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-white"></div>
              ) : (
                <Send className="h-[18px] w-[18px]" />
              )}
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeneralForgotPassword;
