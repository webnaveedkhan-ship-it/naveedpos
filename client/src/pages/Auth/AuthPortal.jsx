import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import Modal from '../../components/common/Modal';
import {
  Store,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Rocket,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Headphones,
  Building2,
  CreditCard,
  Activity,
} from 'lucide-react';

// Pakistani Phone Formatter (03XX-XXXXXXX)
const formatPakistaniPhone = (val) => {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
};

const validatePakistaniPhone = (val) => {
  const clean = val.replace(/[- ]/g, '');
  return /^03\d{9}$/.test(clean);
};

const validateEmail = (val) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
};

const AuthPortal = ({ defaultTab = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, registerTrial } = useAuth();

  // Active tab state: 'login' | 'superadmin' | 'signup'
  const isSignUpRoute = location.pathname === '/signup' || defaultTab === 'signup';
  const isSuperAdminRoute = location.pathname === '/super-admin-login' || defaultTab === 'superadmin';
  const [activeTab, setActiveTab] = useState(
    isSignUpRoute ? 'signup' : isSuperAdminRoute ? 'superadmin' : 'login'
  );

  // Form Fields State
  const [identifier, setIdentifier] = useState(
    isSuperAdminRoute ? 'naveed@naveedpos.com' : 'admin@naveedpos.com'
  );
  const [password, setPassword] = useState('admin123');
  const [shopName, setShopName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Strict zero-scroll enforcement: Lock body scroll on auth screen
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Sync tab with URL path changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setActiveTab('signup');
    } else if (location.pathname === '/super-admin-login' || defaultTab === 'superadmin') {
      setActiveTab('superadmin');
      setIdentifier('naveed@naveedpos.com');
      setPassword('admin123');
    } else if (location.pathname === '/login') {
      setActiveTab('login');
    }
  }, [location.pathname, defaultTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSubscriptionError('');
    if (tab === 'superadmin') {
      setIdentifier('naveed@naveedpos.com');
      setPassword('admin123');
      if (location.pathname !== '/super-admin-login') {
        window.history.replaceState(null, '', '/super-admin-login');
      }
    } else if (tab === 'signup') {
      setIdentifier('');
      setPassword('');
      if (location.pathname !== '/signup') {
        window.history.replaceState(null, '', '/signup');
      }
    } else {
      if (identifier === 'naveed@naveedpos.com') {
        setIdentifier('admin@naveedpos.com');
        setPassword('admin123');
      }
      if (location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
    }
  };

  // 1. Submit Store / Super Admin Login
  const handleLoginSubmit = async (e, overrideId = null, overridePass = null) => {
    if (e) e.preventDefault();
    const idToUse = (overrideId || identifier || '').trim();
    const passToUse = overridePass || password;

    if (!idToUse || !passToUse) {
      setErrorMsg('Please enter both your email/phone and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      setSubscriptionError('');

      const loggedInUser = await login(idToUse, passToUse);

      if (loggedInUser) {
        // Strict Super Admin Access Gate:
        // naveed@naveedpos.com or role SUPER_ADMIN -> /super-admin
        // All merchant stores -> /dashboard
        const isMasterSuperAdmin =
          loggedInUser.role === 'SUPER_ADMIN' ||
          (loggedInUser.email && loggedInUser.email.toLowerCase() === 'naveed@naveedpos.com');

        if (isMasterSuperAdmin) {
          navigate('/super-admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      console.error('Login Error:', err);
      const code = err.response?.data?.code;

      let msg = err.response?.data?.message;
      if (!msg) {
        if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          msg = 'Unable to connect to backend server. Please verify connection.';
        } else if (err.response?.status === 401) {
          msg = 'Invalid credentials. Please verify your email/phone and password.';
        } else {
          msg = 'Login failed. Please check your credentials and try again.';
        }
      }

      if (code === 'SUBSCRIPTION_LOCKED' || err.response?.status === 403) {
        setSubscriptionError(msg);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit Start Free Trial (Create Store)
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim() || !identifier.trim() || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    // Determine email & phone from identifier
    const isEmailInput = validateEmail(identifier);
    const cleanPhone = identifier.replace(/[- ]/g, '');
    const isPhoneInput = validatePakistaniPhone(cleanPhone);

    if (!isEmailInput && !isPhoneInput) {
      setErrorMsg('Please enter a valid email address or Pakistani mobile (03XX-XXXXXXX).');
      return;
    }

    const payload = {
      shopName: shopName.trim(),
      ownerName: `${shopName.trim()} Owner`,
      email: isEmailInput ? identifier.trim().toLowerCase() : `${cleanPhone}@store.naveedpos.com`,
      phone: isPhoneInput ? cleanPhone : '',
      city: 'Islamabad',
      password,
    };

    try {
      setIsLoading(true);
      setErrorMsg('');
      setSubscriptionError('');

      const registeredUser = await registerTrial(payload);

      if (registeredUser) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Sign Up Error:', err);
      setErrorMsg(
        err.response?.data?.message || 'Failed to create trial store. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 transition-colors duration-200 select-none p-3 sm:p-5 lg:p-6 relative">
      {/* Dynamic Ambient Glow Gradients (Dark Mode) */}
      <div className="hidden dark:block absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#1C2541]/40 via-cyan-950/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="hidden dark:block absolute bottom-0 right-10 w-[450px] h-[450px] bg-gradient-to-tl from-[#0A1128]/70 via-emerald-950/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP COMPACT NAV BAR                                        */}
      {/* ------------------------------------------------------------- */}
      <header className="h-12 w-full max-w-6xl mx-auto flex items-center justify-between px-1 z-10 flex-shrink-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Naveed<span className="text-emerald-500">POS</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Retail SaaS
            </span>
          </div>
        </div>

        {/* Right Controls: Super Admin Toggle, Helpline & Theme Toggle */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Super Admin Switch Button */}
          <button
            type="button"
            onClick={() => handleTabChange(activeTab === 'superadmin' ? 'login' : 'superadmin')}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 shadow-sm ${
              activeTab === 'superadmin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
            }`}
            title="Toggle Super Admin Console"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Super Admin</span>
            <span>Console</span>
          </button>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Headphones className="w-3.5 h-3.5 text-emerald-500" />
            <span>+92 300 0000000</span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SPLIT HERO SECTION (STRICT FIT TO 100VH)             */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex items-center justify-center min-h-0 w-full max-w-6xl mx-auto py-1 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center w-full max-h-full">
          {/* Left Column: High-Converting Value Copy (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-4 text-left">
            {activeTab === 'superadmin' ? (
              /* Super Admin Platform Highlights */
              <>
                <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 px-3 py-1 rounded-full text-xs font-bold w-fit">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>🛡️ Platform Owner &amp; Multi-Tenant Fleet Control</span>
                </div>

                <div>
                  <h2 className="text-2xl xl:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    SaaS Fleet Management &amp;{' '}
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      Super Admin Console
                    </span>
                  </h2>
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300/90 mt-1.5 font-sans">
                    Real-time tenant telemetry, billing approvals, live system broadcasts &amp; audit trails.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Tenants Directory
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Manage plan tiers, extend subscriptions &amp; 1-click store impersonation.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Payment Approvals
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Review &amp; verify JazzCash, EasyPaisa, and bank transfer receipts.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        System Broadcasts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Push urgent announcements &amp; alerts to all retail POS terminals.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Security &amp; Audit Trail
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Complete activity logs with IP tracking and actor timestamps.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Retail Store Highlights */
              <>
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 px-3 py-1 rounded-full text-xs font-bold w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>✨ 14-Day Free Trial — No Credit Card Needed</span>
                </div>

                <div>
                  <h2 className="text-2xl xl:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Digital Billing &amp; Khata for{' '}
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                      Retailers &amp; Marts
                    </span>
                  </h2>
                  <p
                    dir="rtl"
                    className="text-sm font-bold text-emerald-600 dark:text-emerald-300/90 mt-1.5 font-sans"
                  >
                    کاغذی حساب اور ادھار کے جھنجھٹ سے نجات — تیز ترین بلنگ اور خودکار ریکوری
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Fast Barcode Billing
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      80mm thermal receipts with 0% tax &amp; loose weight sales.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        WhatsApp Receipts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Direct WhatsApp bills &amp; automated recovery reminders.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Customer Udhar Ledger
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Stop losing credit balances in notebooks. 1-tap wasooli.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Sham Ka Hisaab
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      Daily net profit, drawer cash reconciliation &amp; turnover.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Clean Compact Card (No Overflow) */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white/95 dark:bg-[#1C2541]/85 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 p-5 sm:p-6 transition-all duration-200">
              {/* Triple Tabs: [ Store Login ] [ Super Admin ] [ Start Free Trial ] */}
              <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-[#0B132B]/90 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className={`py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 sm:space-x-1.5 ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Store</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('superadmin')}
                  className={`py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 sm:space-x-1.5 ${
                    activeTab === 'superadmin'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className={`py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 sm:space-x-1.5 ${
                    activeTab === 'signup'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                  <span>Free Trial</span>
                </button>
              </div>

              {/* Subscription Alert Banner */}
              {subscriptionError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold block">Subscription Notice:</span>
                    <span>{subscriptionError}</span>
                  </div>
                </div>
              )}

              {/* Standard Error Banner */}
              {errorMsg && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  <span className="text-[11px] font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Forms */}
              {activeTab === 'superadmin' ? (
                /* ------------------------------------------------------- */
                /* TAB: SUPER ADMIN LOGIN FORM                            */
                /* ------------------------------------------------------- */
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-center space-x-2 text-xs text-indigo-700 dark:text-indigo-300">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                    <span className="text-[11px] font-medium leading-tight">
                      Platform Control Plane: Manage all tenant stores, plans &amp; billing.
                    </span>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Super Admin Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="naveed@naveedpos.com"
                        required
                        autoComplete="username"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0B132B]/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs sm:text-sm font-medium outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Master Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#0B132B]/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs sm:text-sm font-medium outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition focus:outline-none"
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* CTA 1: Login to Super Admin */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5 group disabled:opacity-50 min-tap"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Access Super Admin Console</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* CTA 2: 1-Click Instant Demo Access */}
                  <button
                    type="button"
                    onClick={() => handleLoginSubmit(null, 'naveed@naveedpos.com', 'admin123')}
                    disabled={isLoading}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center space-x-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>⚡ 1-Click Instant Super Admin Access</span>
                  </button>
                </form>
              ) : activeTab === 'login' ? (
                /* ------------------------------------------------------- */
                /* TAB 1: STORE LOGIN FORM                                 */
                /* ------------------------------------------------------- */
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {/* Email or Phone Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Store Email or Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="owner@myshop.com or 03XX-XXXXXXX"
                        required
                        autoComplete="username"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0B132B]/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-cyan-400 rounded-xl text-xs sm:text-sm font-medium outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(true)}
                        className="text-[11px] text-emerald-600 dark:text-cyan-400 hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#0B132B]/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-cyan-400 rounded-xl text-xs sm:text-sm font-medium outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition focus:outline-none"
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-100 dark:bg-[#0B132B] border-slate-300 dark:border-slate-700"
                      />
                      <span>Remember this session</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleTabChange('superadmin')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Super Admin?
                    </button>
                  </div>

                  {/* Full-Width CTA: Login to Store */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5 group disabled:opacity-50 min-tap"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Login to Store</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ------------------------------------------------------- */
                /* TAB 2: START FREE TRIAL (SIGNUP) FORM                  */
                /* ------------------------------------------------------- */
                <form onSubmit={handleSignUpSubmit} className="space-y-3">
                  {/* Store Name Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Store Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Store className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Al Madina Supermart"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0B132B]/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-cyan-400 rounded-xl text-xs sm:text-sm font-medium outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Email or Mobile Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email or Mobile (03XX-XXXXXXX) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIdentifier(val.startsWith('03') ? formatPakistaniPhone(val) : val);
                        }}
                        placeholder="owner@myshop.com or 0300-1234567"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#0B132B]/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-cyan-400 rounded-xl text-xs sm:text-sm font-medium outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Create Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-[#0B132B]/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-cyan-400 rounded-xl text-xs sm:text-sm font-medium outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition focus:outline-none"
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Full-Width CTA: Create My Store */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5 group disabled:opacity-50 min-tap"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        <span>Create My Store</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. MINIMAL FOOTER STRIP (SINGLE LINE)                         */}
      {/* ------------------------------------------------------------- */}
      <footer className="h-8 w-full max-w-6xl mx-auto flex items-center justify-center text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 z-10 flex-shrink-0">
        <p>&copy; 2026 NaveedPOS • Built for Pakistani Retailers &amp; Marts</p>
      </footer>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Store Account Recovery"
        maxWidth="max-w-sm"
      >
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            In NaveedPOS multi-tenant architecture, store passwords can be safely reset by reaching platform technical support with your registered shop email or phone number.
          </p>
          <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-slate-800 dark:text-slate-200">
            <p>
              <strong className="font-sans text-slate-500 dark:text-slate-400">Support:</strong> support@naveedpos.com
            </p>
            <p>
              <strong className="font-sans text-slate-500 dark:text-slate-400">WhatsApp:</strong> +92 300 0000000
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForgotModalOpen(false)}
            className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AuthPortal;
