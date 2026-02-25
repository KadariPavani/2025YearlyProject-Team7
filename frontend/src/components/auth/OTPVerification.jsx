import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { clearAllAuthTokens } from '../../utils/authUtils';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(() => {
    const sentAt = sessionStorage.getItem('otpSentAt');
    if (!sentAt) return 300;
    const elapsed = Math.floor((Date.now() - parseInt(sentAt, 10)) / 1000);
    const remaining = 300 - elapsed;
    return remaining > 0 ? remaining : 0;
  });
  const [canResend, setCanResend] = useState(() => {
    const sentAt = sessionStorage.getItem('otpSentAt');
    if (!sentAt) return false;
    const elapsed = Math.floor((Date.now() - parseInt(sentAt, 10)) / 1000);
    return elapsed >= 300;
  });

  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const successfullyVerified = useRef(false);

  const adminEmail = sessionStorage.getItem('adminEmail');

  useEffect(() => {
    // Only redirect to login if adminEmail is missing AND we haven't just
    // completed a successful verification (which clears sessionStorage before
    // the low-priority navigation to dashboard is committed).
    if (!adminEmail) {
      if (!successfullyVerified.current) {
        navigate('/super-admin-login');
      }
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [adminEmail, navigate]);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/admin/verify-otp', {
        email: adminEmail,
        otp: otpString
      });

      if (response.data.success) {
        successfullyVerified.current = true;
        clearAllAuthTokens();
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
        sessionStorage.removeItem('adminEmail');
        navigate('/admin-dashboard', { replace: true });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/admin/resend-otp', { email: adminEmail });
      sessionStorage.setItem('otpSentAt', Date.now().toString());
      setTimer(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/super-admin-login')}
        className="fixed top-4 left-4 z-10 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-[13px] font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Login</span>
      </button>

      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/IFlogo.png" alt="Infoverse" className="h-12 mx-auto mb-4" />
          <h1 className="text-[22px] font-bold text-slate-800 mb-1">Verify OTP</h1>
          <p className="text-[13px] text-slate-500">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-slate-700">{adminEmail}</span>
          </p>
        </div>

        {/* OTP Form */}
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 border border-blue-100/50 p-7">
          <form onSubmit={handleVerifyOTP}>
            {/* OTP Input */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 sm:w-11 sm:h-11 text-center text-base sm:text-lg font-bold border-2 border-slate-200 rounded-xl text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center mb-4">
              {timer > 0 ? (
                <p className="text-[13px] text-slate-500">
                  OTP expires in <span className="font-semibold text-blue-600">{formatTime(timer)}</span>
                </p>
              ) : (
                <p className="text-[13px] text-red-500">OTP has expired</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-[13px]">{error}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || timer <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 px-4 rounded-xl text-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed mb-3 shadow-md shadow-blue-200/50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>

            {/* Resend Button */}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || loading}
              className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-slate-400 text-[13px] font-medium transition-colors py-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Resend OTP</span>
            </button>
          </form>
        </div>

        {/* Security Notice */}
        {/* <div className="mt-5 p-3.5 bg-blue-50/60 backdrop-blur-sm rounded-xl border border-blue-100/50">
          <p className="text-[13px] text-slate-500 text-center">
            For security reasons, this OTP will expire in 5 minutes
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default OTPVerification;
