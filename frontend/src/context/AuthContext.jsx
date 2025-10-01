import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/validate-session');
        if (response.data.valid) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          // Clear invalid session
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
        }
      } catch (error) {
        console.error('Session validation error:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      }
      
      setLoading(false);
    };

    validateSession();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('userToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      
      setIsAuthenticated(true);
      setUser(user);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
