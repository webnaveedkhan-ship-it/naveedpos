import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(() => !!localStorage.getItem('impersonatingFrom'));

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      return receivedUser;
    }
  };

  const registerTrial = async (formData) => {
    const res = await authService.registerTrial(formData);
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      return receivedUser;
    }
  };

  const impersonateStore = async (tenantId) => {
    const res = await authService.impersonate(tenantId);
    if (res.data.success) {
      if (!localStorage.getItem('impersonatingFrom')) {
        localStorage.setItem('impersonatingFrom', JSON.stringify({ token, user }));
      }
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      setIsImpersonating(true);
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      return receivedUser;
    }
  };

  const exitImpersonation = () => {
    const saved = localStorage.getItem('impersonatingFrom');
    if (saved) {
      try {
        const { token: origToken, user: origUser } = JSON.parse(saved);
        localStorage.removeItem('impersonatingFrom');
        setIsImpersonating(false);
        setToken(origToken);
        setUser(origUser);
        localStorage.setItem('token', origToken);
        localStorage.setItem('user', JSON.stringify(origUser));
        window.location.href = '/super-admin';
      } catch (e) {
        logout();
      }
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore logout network errors
    } finally {
      setUser(null);
      setToken(null);
      setIsImpersonating(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonatingFrom');
    }
  };

  const userRole = (user?.role || '').toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isStoreAdmin = userRole === 'STORE_ADMIN' || isSuperAdmin;
  const isCashier = userRole === 'CASHIER' || isStoreAdmin;
  const tenantPlan = user?.tenantPlan || (isSuperAdmin ? 'premium' : 'trial');
  const planLimits = user?.planLimits || (isSuperAdmin ? {
    allowBarcodeGen: true,
    allowWhatsApp: true,
    allowDrawerReconciliation: true,
    allowFractionalUnits: true,
    allowBackupExport: true,
    maxProducts: 999999,
    maxKhataCustomers: 999999,
  } : {
    allowBarcodeGen: true,
    allowWhatsApp: true,
    allowDrawerReconciliation: true,
    allowFractionalUnits: true,
    allowBackupExport: true,
    maxProducts: 1500,
    maxKhataCustomers: 999999,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isSuperAdmin,
        isStoreAdmin,
        isCashier,
        isAdmin: isStoreAdmin, // alias for backwards compatibility
        tenantName: user?.tenantName || (isSuperAdmin ? 'Super Admin SaaS Console' : 'Retail Store'),
        tenantId: user?.tenantId || null,
        tenantPlan,
        planLimits,
        isImpersonating,
        login,
        registerTrial,
        impersonateStore,
        exitImpersonation,
        logout,
      }}
    >
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
