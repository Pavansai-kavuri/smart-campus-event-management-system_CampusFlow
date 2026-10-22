import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../lib/api';

export type UserRole = 'STUDENT' | 'ORGANIZER' | 'ADMIN';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  department: string;
  yearOfStudy?: number;
  avatar?: string;
  bio?: string;
  interests: string[];
  themePreference?: 'system' | 'light' | 'dark';
  notificationPreferences?: {
    inApp: boolean;
    emailReminders: boolean;
    scheduleUpdates: boolean;
    certificateAlerts: boolean;
    announcements: boolean;
  };
  isDemo?: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerAccount: (payload: Record<string, any>) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  loginWithGoogle: (payload: { credential?: string; email?: string; name?: string; avatar?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: UserProfile }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithCredentials = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    sessionStorage.removeItem('cf_explicit_logout');
    localStorage.setItem('cf_token', res.token);
    setUser(res.user);
    showToast({
      title: `Welcome back, ${res.user.name}!`,
      description: `Signed in as ${res.user.role}`,
      variant: 'success',
    });
  };

  const registerAccount = async (payload: Record<string, any>) => {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    sessionStorage.removeItem('cf_explicit_logout');
    localStorage.setItem('cf_token', res.token);
    setUser(res.user);
    showToast({
      title: `Account created, ${res.user.name}!`,
      description: 'Welcome to CampusFlow — Smart Student Events.',
      variant: 'success',
    });
  };

  const switchDemoRole = async (role: UserRole) => {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    sessionStorage.removeItem('cf_explicit_logout');
    localStorage.setItem('cf_token', res.token);
    setUser(res.user);
    showToast({
      title: `Switched to ${res.user.name}`,
      description: `Active Role: ${res.user.role}`,
      variant: 'info',
    });
  };

  const loginWithGoogle = async (payload: { email: string; name?: string; avatar?: string }) => {
    const res = await apiRequest<{ token: string; user: UserProfile }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    sessionStorage.removeItem('cf_explicit_logout');
    localStorage.setItem('cf_token', res.token);
    setUser(res.user);
    showToast({
      title: `Signed in with Google!`,
      description: `Welcome to CampusFlow, ${res.user.name}`,
      variant: 'success',
    });
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    sessionStorage.setItem('cf_explicit_logout', '1');
    localStorage.removeItem('cf_token');
    setUser(null);
    showToast({
      title: 'Signed out',
      description: 'Your session has been closed safely.',
      variant: 'info',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        toasts,
        showToast,
        dismissToast,
        loginWithCredentials,
        registerAccount,
        switchDemoRole,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
