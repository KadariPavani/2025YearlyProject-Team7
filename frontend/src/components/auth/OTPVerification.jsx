import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, RefreshCw } from 'lucide-react';
import axios from 'axios';
import api from '../../services/api'; // Add this import

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const adminEmail = sessionStorage.getItem('adminEmail');

  useEffect(() => {
    // Redirect if no email in session
    if (!adminEmail) {
      navigate('/super-admin-login');
      return;
    }

    // Timer countdown
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

    // Auto-focus next input
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
        // First store the auth data
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
        
        // Clean up session storage
        sessionStorage.removeItem('adminEmail');
        
        // Use in-app navigation to avoid a full reload which causes brief redirect flicker
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/super-admin-login')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Login</span>
      </button>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-600">
            Enter the 6-digit code sent to<br />
            <span className="font-medium text-gray-900">{adminEmail}</span>
          </p>
        </div>

        {/* OTP Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleVerifyOTP}>
            {/* OTP Input */}
            <div className="flex justify-center space-x-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center mb-4">
              {timer > 0 ? (
                <p className="text-sm text-gray-600">
                  OTP expires in <span className="font-medium text-red-600">{formatTime(timer)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-600">OTP has expired</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || timer <= 0}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed mb-4"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
              className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 disabled:text-gray-400 font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Resend OTP</span>
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            For security reasons, this OTP will expire in 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;