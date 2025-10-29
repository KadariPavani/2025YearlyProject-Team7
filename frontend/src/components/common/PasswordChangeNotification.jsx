import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Lock } from 'lucide-react';
import { checkPasswordChange } from '../../services/generalAuthService';
import axios from 'axios';

const PasswordChangeNotification = ({ userType, onPasswordChange }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPasswordStatus();
  }, [userType]);

  const checkPasswordStatus = async () => {
    try {
      const token = localStorage.getItem('userToken'); 
      const response = await axios.get('/api/auth/password-status', {
        params: { userType },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setNeedsPasswordChange(response.data.needsPasswordChange);
        setShowNotification(response.data.needsPasswordChange);
      }
    } catch (err) {
      console.error('Failed to check password status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  const handleChangePassword = () => {
    if (onPasswordChange) {
      onPasswordChange();
    }
  };

  if (loading || !showNotification || !needsPasswordChange) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Password Change Required
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              For security reasons, you need to change your password. This is required for all users.
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleChangePassword}
                className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center space-x-1"
              >
                <Lock className="h-4 w-4" />
                <span>Change Now</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-yellow-400 hover:text-yellow-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeNotification;
