import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { LoginResponse } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

interface AuthContextType {
  user: LoginResponse | null;
  loading: boolean;
  login: (mobileNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);

      if (token && userData) {
        // Token exists, set user data
        // Note: In production, you might want to verify token validity
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (mobileNumber: string, password: string) => {
    try {
      const response = await authApi.login(mobileNumber, password);

      // Store token and user data
      // The backend now returns token in response body for mobile compatibility
      const { token, ...userData } = response as any;
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        // Fallback: if token not in response, we'll use cookie-based auth
        // In this case, the axios interceptor will handle it
        await AsyncStorage.setItem(TOKEN_KEY, 'cookie_based_auth');
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));

      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
