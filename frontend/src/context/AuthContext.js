import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                loading: false,
                error: null
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
};

const initialState = {
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const initAuth = () => {
            const user = authService.getCurrentUser();
            const isAuthenticated = authService.isAuthenticated();
            
            if (isAuthenticated && user) {
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: { user }
                });
            } else {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'CLEAR_ERROR' });
            
            const data = await authService.login(email, password);
            
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: data.user }
            });
            
            return data;
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.error || 'Login failed'
            });
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'CLEAR_ERROR' });
            
            const data = await authService.register(userData);
            
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: data.user }
            });
            
            return data;
        } catch (error) {
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.error || 'Registration failed'
            });
            throw error;
        }
    };

    const logout = () => {
        // Call server to notify logout, then clear all client-side session tokens
        try {
            authService.logout();
        } catch (e) {
        }

        // Clear all known token keys and session data
        try {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            localStorage.removeItem('trainerToken');
            localStorage.removeItem('trainerData');
            localStorage.removeItem('coordinatorToken');
            localStorage.removeItem('coordinatorData');
            sessionStorage.removeItem('adminEmail');
          } catch (e) {
        }

        dispatch({ type: 'LOGOUT' });
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        clearError,
        isAdmin: () => authService.isAdmin()
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
