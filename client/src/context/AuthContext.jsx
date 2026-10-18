import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiRequest, getToken, setToken } from '../services/api.js';
import { load, save, remove } from '../services/storageService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => load('user', null, (u) => u && typeof u.email === 'string'));
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const syncMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest('/auth/me', { token });
      setUser(data.user);
      save('user', data.user);
    } catch (err) {
      if (err.status === 401) {
        setToken(null);
        remove('user');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncMe();
  }, [syncMe]);

  const login = useCallback(async (email, password) => {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password }, requireOnline: true });
    setToken(data.token);
    save('user', data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const data = await apiRequest('/admin/login', { method: 'POST', body: { email, password }, requireOnline: true });
    setToken(data.token);
    save('user', data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiRequest('/auth/register', { method: 'POST', body: payload, requireOnline: true });
    setToken(data.token);
    save('user', data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const sendRegisterOtp = useCallback(async (payload) => {
    return await apiRequest('/auth/register/send-otp', {
      method: 'POST',
      body: payload,
      requireOnline: true,
    });
  }, []);

  const verifyRegisterOtp = useCallback(async (email, otp) => {
    const data = await apiRequest('/auth/register/verify-otp', {
      method: 'POST',
      body: { email, otp },
      requireOnline: true,
    });
    setToken(data.token);
    save('user', data.user);
    setUser(data.user);
    return data;
  }, []);

  const resendRegisterOtp = useCallback(async (email, purpose = 'register') => {
    return await apiRequest('/auth/register/resend-otp', {
      method: 'POST',
      body: { email, purpose },
      requireOnline: true,
    });
  }, []);

  const sendForgotPasswordOtp = useCallback(async (email) => {
    return await apiRequest('/auth/forgot-password/send-otp', {
      method: 'POST',
      body: { email },
      requireOnline: true,
    });
  }, []);

  const verifyResetPassword = useCallback(async (email, otp, newPassword) => {
    return await apiRequest('/auth/forgot-password/verify-reset', {
      method: 'POST',
      body: { email, otp, newPassword },
      requireOnline: true,
    });
  }, []);

  const loginWithGoogle = useCallback(async (payload) => {
    const data = await apiRequest('/auth/google', {
      method: 'POST',
      body: payload,
      requireOnline: true,
    });
    setToken(data.token);
    save('user', data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const data = await apiRequest('/auth/me', { method: 'PUT', body: payload, requireOnline: true });
    save('user', data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    remove('user');
    setUser(null);
    toast.success('Logged out');
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    adminLogin,
    register,
    sendRegisterOtp,
    verifyRegisterOtp,
    resendRegisterOtp,
    sendForgotPasswordOtp,
    verifyResetPassword,
    loginWithGoogle,
    updateProfile,
    logout,
  }), [
    user,
    loading,
    login,
    adminLogin,
    register,
    sendRegisterOtp,
    verifyRegisterOtp,
    resendRegisterOtp,
    sendForgotPasswordOtp,
    verifyResetPassword,
    loginWithGoogle,
    updateProfile,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
