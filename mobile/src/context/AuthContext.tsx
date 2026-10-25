import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { LoginResponse } from '../types';
import { tokenStorage } from '../lib/tokenStorage';
import { authEvents } from '../lib/authEvents';
import { queryClient, persistOptions } from '../lib/queryClient';
import { clearAllDrafts } from '../lib/drafts';

const USER_KEY = 'user_data';

/** A signed-in teacher. The app is teacher-only, so staffId is always set. */
export interface AuthUser {
  userId: number;
  schoolId: number;
  role: 'TEACHER';
  staffId: number;
  staffName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (mobileNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const NOT_A_TEACHER_MESSAGE =
  'This app is for teachers. Please use the school website to sign in with an admin account.';

const toAuthUser = (data: LoginResponse): AuthUser | null => {
  if (data.role !== 'TEACHER' || !data.staffId) return null;
  return {
    userId: data.userId,
    schoolId: data.schoolId,
    role: 'TEACHER',
    staffId: data.staffId,
    staffName: data.staffName ?? null,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setUser(null);
    await Promise.allSettled([
      tokenStorage.clear(),
      AsyncStorage.removeItem(USER_KEY),
      persistOptions.persister.removeClient(),
      clearAllDrafts(),
    ]);
    queryClient.clear();
  }, []);

  // Any 401 from the API ends the session
  useEffect(() => authEvents.onUnauthorized(() => void logout()), [logout]);

  // Restore the saved session immediately (works offline), then confirm it
  // with the server in the background.
  useEffect(() => {
    const restore = async () => {
      try {
        const [token, stored] = await Promise.all([tokenStorage.get(), AsyncStorage.getItem(USER_KEY)]);
        const cachedUser = stored ? toAuthUser(JSON.parse(stored)) : null;
        if (!token || !cachedUser) {
          if (token || stored) await logout();
          return;
        }
        setUser(cachedUser);

        authApi
          .validateToken()
          .then(async fresh => {
            const freshUser = toAuthUser(fresh);
            if (!freshUser) return logout();
            setUser(freshUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          })
          // A 401 is handled by the client interceptor; network errors keep
          // the cached session so the app still works offline.
          .catch(() => {});
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [logout]);

  const login = useCallback(async (mobileNumber: string, password: string) => {
    const { token, ...data } = await authApi.login(mobileNumber, password);
    const authUser = toAuthUser(data);
    if (!authUser) throw new Error(NOT_A_TEACHER_MESSAGE);
    if (!token) throw new Error('Login failed. Please try again.');

    await tokenStorage.set(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser));
    queryClient.clear();
    setUser(authUser);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, login, logout, isAuthenticated: !!user }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** For screens that only render when signed in. */
export const useCurrentUser = (): AuthUser => {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser called while signed out');
  return user;
};
