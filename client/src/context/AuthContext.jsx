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
  const [tenantName, setTenantName] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.tenantName || u.storeName || u.shopName) {
          return u.tenantName || u.storeName || u.shopName;
        }
      }
      return localStorage.getItem('naveedpos_tenant_name') || 'Al-Madina Super Store';
    } catch {
      return 'Al-Madina Super Store';
    }
  });
  const [businessType, setBusinessTypeState] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.businessType) return u.businessType;
      }
      return localStorage.getItem('naveedpos_business_type') || 'GENERAL_STORE';
    } catch {
      return 'GENERAL_STORE';
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      // If we already have a token and user in localStorage, don't block the UI with a full-screen loader
      return !(savedToken && savedUser);
    } catch {
      return false;
    }
  });
  const [isImpersonating, setIsImpersonating] = useState(() => !!localStorage.getItem('impersonatingFrom'));

  useEffect(() => {
    // Safety guard: ensure loading state never hangs indefinitely on mobile
    const watchdog = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(watchdog);
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res?.data?.success && res.data.user) {
            const serverUser = res.data.user;
            const r = (serverUser.role || '').toUpperCase();
            const em = (serverUser.email || '').toLowerCase();
            const normalizedRole =
              em === 'naveed@naveedpos.com' || r === 'SUPER_ADMIN' || r === 'SUPERADMIN'
                ? 'SUPER_ADMIN'
                : (r === 'CASHIER' ? 'CASHIER' : 'STORE_OWNER');

            const nextUser = {
              ...serverUser,
              role: normalizedRole,
            };

            setUser(nextUser);
            if (serverUser.tenantName) {
              setTenantName(serverUser.tenantName);
              localStorage.setItem('naveedpos_tenant_name', serverUser.tenantName);
            }
            if (serverUser.businessType) {
              setBusinessTypeState(serverUser.businessType);
              localStorage.setItem('naveedpos_business_type', serverUser.businessType);
            }
            localStorage.setItem('user', JSON.stringify(nextUser));
          }
        } catch (error) {
          console.warn('Session verification notice:', error);
          if (error.response && error.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const normalizeUserData = (rawUser) => {
    if (!rawUser) return rawUser;
    const r = (rawUser.role || '').toUpperCase();
    const em = (rawUser.email || '').toLowerCase();
    const normalizedRole =
      em === 'naveed@naveedpos.com' || r === 'SUPER_ADMIN' || r === 'SUPERADMIN'
        ? 'SUPER_ADMIN'
        : (r === 'CASHIER' ? 'CASHIER' : 'STORE_OWNER');
    return {
      ...rawUser,
      role: normalizedRole,
    };
  };

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res?.data?.success && res.data.user) {
      const { token: receivedToken, user: rawUser } = res.data;
      const receivedUser = normalizeUserData(rawUser);
      setToken(receivedToken);
      setUser(receivedUser);
      if (receivedUser.tenantName) {
        setTenantName(receivedUser.tenantName);
        localStorage.setItem('naveedpos_tenant_name', receivedUser.tenantName);
      }
      if (receivedUser.businessType) {
        setBusinessTypeState(receivedUser.businessType);
        localStorage.setItem('naveedpos_business_type', receivedUser.businessType);
      }
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      return receivedUser;
    }
    if (res?.data?.user) {
      const receivedUser = normalizeUserData(res.data.user);
      const receivedToken = res.data.token || 'demo-token';
      setToken(receivedToken);
      setUser(receivedUser);
      if (receivedUser.tenantName) {
        setTenantName(receivedUser.tenantName);
        localStorage.setItem('naveedpos_tenant_name', receivedUser.tenantName);
      }
      if (receivedUser.businessType) {
        setBusinessTypeState(receivedUser.businessType);
        localStorage.setItem('naveedpos_business_type', receivedUser.businessType);
      }
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      return receivedUser;
    }
    throw new Error('Authentication failed');
  };

  const registerTrial = async (formData) => {
    const res = await authService.registerTrial(formData);
    if (res?.data?.success && res.data.user) {
      const { token: receivedToken, user: rawUser } = res.data;
      const receivedUser = normalizeUserData(rawUser);
      setToken(receivedToken);
      setUser(receivedUser);
      const storeName = receivedUser.tenantName || formData.shopName || formData.storeName || 'Al-Madina Super Store';
      setTenantName(storeName);
      localStorage.setItem('naveedpos_tenant_name', storeName);
      const bType = receivedUser.businessType || formData.businessType || 'GENERAL_STORE';
      setBusinessTypeState(bType);
      localStorage.setItem('naveedpos_business_type', bType);
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      return receivedUser;
    }
    if (res?.data?.user) {
      const receivedUser = normalizeUserData(res.data.user);
      const receivedToken = res.data.token || 'demo-token';
      setToken(receivedToken);
      setUser(receivedUser);
      const storeName = receivedUser.tenantName || formData.shopName || formData.storeName || 'Al-Madina Super Store';
      setTenantName(storeName);
      localStorage.setItem('naveedpos_tenant_name', storeName);
      const bType = receivedUser.businessType || formData.businessType || 'GENERAL_STORE';
      setBusinessTypeState(bType);
      localStorage.setItem('naveedpos_business_type', bType);
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      return receivedUser;
    }
    throw new Error('Registration failed');
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
      window.location.href = '/login';
    }
  };

  const switchBusinessType = async (newType) => {
    setBusinessTypeState(newType);
    try {
      localStorage.setItem('naveedpos_business_type', newType);
      if (user) {
        const updated = { ...user, businessType: newType };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
      await authService.updateBusinessType(newType);
    } catch (e) {
      console.warn('Switch business type sync notice:', e);
    }
  };

  const userRole = (user?.role || '').toUpperCase();
  const userEmail = (user?.email || '').toLowerCase();
  // Role Guard: SUPER_ADMIN is exclusively the platform owner (naveed@naveedpos.com) or SUPER_ADMIN role.
  // Store owners, retail managers, and cashiers are never treated as Super Admin.
  const isSuperAdmin =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'SUPERADMIN' ||
    userEmail === 'naveed@naveedpos.com';
  const isStoreAdmin = !isSuperAdmin && userRole !== 'CASHIER';
  const isCashier = userRole === 'CASHIER';
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
        tenantName: isSuperAdmin
          ? 'Super Admin SaaS Console'
          : (tenantName || user?.tenantName || user?.storeName || 'Al-Madina Super Store'),
        setTenantName: (name) => {
          setTenantName(name);
          localStorage.setItem('naveedpos_tenant_name', name);
        },
        tenantId: user?.tenantId || null,
        tenantPlan,
        businessType: user?.businessType || businessType || 'GENERAL_STORE',
        switchBusinessType,
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
