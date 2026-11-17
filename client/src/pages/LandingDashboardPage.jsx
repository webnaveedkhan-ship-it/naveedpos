import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  Store,
  ShoppingCart,
  Package,
  BookOpen,
  TrendingUp,
  Receipt,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  MessageSquare,
  Building2,
  HelpCircle,
  Phone,
  BarChart3,
  Layers,
  Check,
  DollarSign,
  ChevronRight,
  Play,
  Lock,
} from 'lucide-react';

const LandingDashboardPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isSuperAdmin, isImpersonating } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [activeDemoModule, setActiveDemoModule] = useState('FOOTWEAR');

  // If already logged in, quick redirect button
  const handleGoToApp = () => {
    if (isSuperAdmin && !isImpersonating) {
      navigate('/super-admin');
    } else {
      navigate('/dashboard');
    }
  };

  // 1-Click Instant Demo Experience with specialized business module
  const handleLaunchDemo = async (moduleType = null) => {
    try {
      setIsDemoLoading(true);
      const modToUse = moduleType || activeDemoModule || 'GENERAL_STORE';
      localStorage.setItem('naveedpos_business_type', modToUse);
      await login('store@naveedpos.com', 'admin123');
      navigate('/dashboard');
    } catch {
      // Fallback navigate to login
      navigate('/login');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP GLOBAL NAVIGATION BAR                                 */}
      {/* ------------------------------------------------------------- */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0B132B]/80 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Naveed<span className="text-emerald-500">POS</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Cloud SaaS
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Pakistan's Retail POS & Smart Khata
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Features
            </a>
            <a href="#dashboard-preview" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Live Dashboard
            </a>
            <a href="#khata" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Khata Ledger
            </a>
            <a href="#inventory" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Variants & Stock
            </a>
            <a href="#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Pricing Plans
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <button
                onClick={handleGoToApp}
                className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                {/* 1. Login / Sign In Button */}
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700/80 flex items-center space-x-1.5"
                  title="Sign In to Existing Store"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Login</span>
                </Link>

                {/* 2. Start 14-Day Free Trial Button */}
                <Link
                  to="/free-trial"
                  className="px-3.5 sm:px-4 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center space-x-1.5 active:scale-95 ring-1 ring-white/20"
                  title="Start 14-Day Free Trial (No Card Needed)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-900 fill-amber-900/30" />
                  <span className="hidden sm:inline">Start</span> 14-Day Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION WITH DUAL CTAS & URDU VALUE PROPOSITION      */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>✨ 14-Day Free Trial • No Credit Card Required • Instant Setup</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Modern Pakistani Retail{' '}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
              POS &amp; Smart Khata
            </span>{' '}
            Cloud Software
          </h1>

          {/* Urdu Tagline */}
          <p
            dir="rtl"
            className="text-base sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 max-w-2xl mx-auto font-sans"
          >
            کاغذی کھاتہ، مسنگ اسٹاک اور مینوئل بلنگ کو خیرباد کہیں — کمپیوٹر، لیپ ٹاپ اور موبائل پر فوری چالو کریں
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Engineered exclusively for Pakistani footwear boutiques, garments marts, general stores, and perfume shops.
            Includes 80mm Urdu thermal invoices, WhatsApp receipts, and day-end cash drawer balancing.
          </p>

          {/* Dual Action Buttons: [ Start Free Trial ] & [ Store Login ] & [ Live Demo ] */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/free-trial"
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-900" />
              <span>Create Store &amp; Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center space-x-2 active:scale-95"
            >
              <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Sign In to Existing Store</span>
            </Link>

            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={isDemoLoading}
              className="px-5 py-3.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all flex items-center space-x-2 active:scale-95"
              title="Test Live Demo Dashboard with 1-Click"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
              <span>{isDemoLoading ? 'Launching Demo...' : '⚡ Test Live Demo Dashboard'}</span>
            </button>
          </div>

          {/* Trust Chips */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              100% Offline Resilience
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              80mm Urdu Thermal Printing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Multi-Industry Size &amp; Color Variants
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Pakistani Banknotes Day-End Audit
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. LIVE INTERACTIVE DASHBOARD PREVIEW MOCKUP                  */}
      {/* ------------------------------------------------------------- */}
      <section id="dashboard-preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C2541]/70 shadow-2xl p-4 sm:p-8 backdrop-blur-xl space-y-6">
          {/* Business Module Interactive Switcher Tabs on Landing Showcase */}
          <div className="space-y-2 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Explore Dedicated Dashboard for Your Business Type:
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                100% Specialized Layout, Metrics &amp; Workflows
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'FOOTWEAR', label: 'Footwear Mart', icon: '👟', urdu: 'جوتے اور چپل', badge: 'Sizes 6-11' },
                { id: 'GARMENTS', label: 'Garments & Boutique', icon: '👕', urdu: 'کپڑے اور ملبوسات', badge: 'Sizes S-XXL' },
                { id: 'GENERAL_STORE', label: 'Supermart & Kiryana', icon: '🛒', urdu: 'کریانہ اور جنرل اسٹور', badge: 'FMCG / Loose KG' },
                { id: 'PERFUME', label: 'Perfumery & Attar', icon: '🧪', urdu: 'عطر اور پرفیوم', badge: 'ML & Tolas' },
              ].map((m) => {
                const isSel = activeDemoModule === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveDemoModule(m.id)}
                    className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      isSel
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{m.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{m.label}</span>
                        <span className="text-[10px] opacity-80 block truncate font-sans">{m.urdu}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Bar of the Mock Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <div className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <div className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-mono font-bold text-slate-400 ml-2">
                NaveedPOS • {activeDemoModule === 'FOOTWEAR' ? 'Footwear Mart (Peshawari & Leather Shoes)' : activeDemoModule === 'GARMENTS' ? 'Khaadi Boutique & Garments Mart' : activeDemoModule === 'PERFUME' ? 'Al-Haramain Attar & Fragrance House' : 'Al-Madina Superstore & Cash & Carry'} (Trial Active)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                🟢 Live Module Active
              </span>
              <button
                onClick={() => handleLaunchDemo(activeDemoModule)}
                disabled={isDemoLoading}
                className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition shadow-sm flex items-center space-x-1"
              >
                <span>⚡ Test This Module Dashboard</span>
              </button>
            </div>
          </div>

          {/* Module-Tailored 4 KPI Stat Cards */}
          {activeDemoModule === 'FOOTWEAR' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Pairs Sold Today (جوڑے)</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">129 Pairs</div>
                <div className="text-[11px] font-bold text-emerald-600">Rs. 367,650 Gross</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Core Hot Size (سب سے تیز)</span>
                <div className="text-2xl font-black text-amber-600">Size 8 &amp; 9</div>
                <div className="text-[11px] text-slate-500">67% of customer demand</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Broken Size Runs (نامکمل)</span>
                <div className="text-2xl font-black text-rose-600">3 Models</div>
                <div className="text-[11px] text-rose-500">Restock core sizes needed</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Pairs in Shelf Stock</span>
                <div className="text-2xl font-black text-indigo-600">480 Pairs</div>
                <div className="text-[11px] text-indigo-600 font-bold">Estimated Cost: Rs. 840,000</div>
              </div>
            </div>
          )}

          {activeDemoModule === 'GARMENTS' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Apparel Pieces Sold</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">178 Pieces</div>
                <div className="text-[11px] font-bold text-emerald-600">Avg Rs. 4,100 per suit</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Dominant Sizes</span>
                <div className="text-2xl font-black text-emerald-600">Medium &amp; Large</div>
                <div className="text-[11px] text-slate-500">62% of fashion demand</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Pending Alterations (ٹیلرنگ)</span>
                <div className="text-2xl font-black text-amber-600">5 Fits</div>
                <div className="text-[11px] text-amber-600 font-bold">2 ready for customer pickup</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Summer Lawn Collection</span>
                <div className="text-2xl font-black text-purple-600">Rs. 729,000</div>
                <div className="text-[11px] text-purple-600 font-bold">33% gross profit margin</div>
              </div>
            </div>
          )}

          {activeDemoModule === 'GENERAL_STORE' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Checkout Invoices (بلز)</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">348 Bills</div>
                <div className="text-[11px] font-bold text-emerald-600">Peak: 6:00 PM – 9:00 PM</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Loose Weight Sales (کلو)</span>
                <div className="text-2xl font-black text-cyan-600">420 KG Sold</div>
                <div className="text-[11px] text-slate-500">Sugar, Atta &amp; Daal</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Expiry Alert (&lt;30 days)</span>
                <div className="text-2xl font-black text-rose-600">3 Items</div>
                <div className="text-[11px] text-rose-500">Dairy &amp; Bread alerts</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Wholesale Cartons</span>
                <div className="text-2xl font-black text-indigo-600">64 Cartons</div>
                <div className="text-[11px] text-indigo-600 font-bold">Unboxed for retail shelves</div>
              </div>
            </div>
          )}

          {activeDemoModule === 'PERFUME' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Volume Dispensed (ملی لیٹر)</span>
                <div className="text-2xl font-black text-purple-600">1,260 ML</div>
                <div className="text-[11px] font-bold text-purple-600">Equivalent to 44 Tolas</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Top Fragrance Note</span>
                <div className="text-2xl font-black text-amber-600">Dehn Al Oud</div>
                <div className="text-[11px] text-slate-500">36% of daily fragrance sales</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Tester Conversion Ratio</span>
                <div className="text-2xl font-black text-emerald-600">35.6%</div>
                <div className="text-[11px] text-slate-500">1 in 3 tester sprays converts</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold block">Custom Blends Mixed</span>
                <div className="text-2xl font-black text-pink-600">18 Blends</div>
                <div className="text-[11px] text-pink-600 font-bold">Pure oil formulas bottled</div>
              </div>
            </div>
          )}

          {/* Lower Two Columns: Recent Orders & Khata Balance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Live Terminal Recent Sales */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Recent POS Billing Invoices
                </span>
                <span className="text-[11px] font-mono text-slate-500">Auto-Refreshed</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">#POS-1049 • Cash Sale</span>
                    <span className="block text-[11px] text-slate-500">Men Leather Oxford (Size 9) x 1</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-sm">Rs. 4,500</span>
                    <span className="block text-[10px] text-slate-400">2 mins ago</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">#POS-1048 • Khata Udhar</span>
                    <span className="block text-[11px] text-slate-500">Tariq Khan • Stitched Kurta (L) x 2</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-600 text-sm">Rs. 6,200</span>
                    <span className="block text-[10px] text-slate-400">8 mins ago</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">#POS-1047 • JazzCash Wallet</span>
                    <span className="block text-[11px] text-slate-500">Khaadi Lawn 3pc x 1</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-purple-600 text-sm">Rs. 3,850</span>
                    <span className="block text-[10px] text-slate-400">15 mins ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Khata Ledger & Cash Reconciliation Column */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Khata &amp; Day-End Sham Ka Hisaab
              </span>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Market Udhar Receivable:</span>
                  <span className="font-black text-amber-600">Rs. 184,500</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Opening Register Cash:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Rs. 5,000</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Cash Expenses (Chaye / Bill):</span>
                  <span className="font-bold text-rose-600">- Rs. 1,450</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-black">
                  <span>Physical Cash in Drawer:</span>
                  <span className="text-emerald-600">Rs. 116,150</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                <span>Want to see this in your own shop?</span>
                <Link
                  to="/free-trial"
                  className="font-bold underline hover:text-emerald-950 dark:hover:text-emerald-100"
                >
                  Start Free Trial →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. FOUR SPECIALIZED PAKISTANI RETAIL MODULES                 */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Engineered for Pakistani Retail Realities
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Unlike foreign POS systems that require expensive hardware and complex setup, NaveedPOS is tailored to the exact workflow of Pakistani shopkeepers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. POS Terminal */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              POS Billing Counter
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Superfast barcode scanning, touch screen pills, keyboard shortcuts (F2, F4), and 80mm thermal receipts with 0% tax support.
            </p>
          </div>

          {/* 2. Khata & Udhar */}
          <div id="khata" className="p-6 rounded-2xl bg-white dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Smart Customer Khata
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Eliminate lost notebooks. Track Udhar, credit limits, and send 1-click WhatsApp bill slips with recovery payment reminders.
            </p>
          </div>

          {/* 3. Multi-Industry Inventory */}
          <div id="inventory" className="p-6 rounded-2xl bg-white dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Size &amp; Color Variants
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Full variant matrix for Footwear (Sizes 6-11), Garments (S/M/L/XL), and Marts. Built-in barcode label printing and zero-product safety.
            </p>
          </div>

          {/* 4. Sham Ka Hisaab */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1C2541]/50 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Day-End Cash Audit
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pakistani banknote counter (Rs. 5000 down to Rs. 10 coins). Instantly matches counted cash against cash sales, wasooli, and daily expenses.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. TRANSPARENT PRICING PLANS (FREE TRIAL VS PAID)             */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Honest Pakistani Rupee Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Start Free. Upgrade As Your Business Grows.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            No credit card needed to begin. Pay via JazzCash, EasyPaisa, or direct bank transfer when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Card 1: 14-Day Free Trial */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1C2541]/60 border-2 border-emerald-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-full">
              Recommended
            </div>
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Full-Access Evaluation
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                14-Day Free Trial
              </h3>
              <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                <span className="text-4xl font-black">Rs. 0</span>
                <span className="text-xs text-slate-500">/ 14 days</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Experience the full power of NaveedPOS in your live store with zero financial commitment.
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Unlimited POS Counter Billing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Full Customer Khata &amp; Wasooli</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>80mm Urdu Thermal Receipt Printing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Size &amp; Color Variants Catalog</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Instant Setup (Takes 60 seconds)</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/free-trial"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Standard Plan */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1C2541]/40 border border-slate-200 dark:border-slate-700/60 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Single Store
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Standard Retail
              </h3>
              <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                <span className="text-4xl font-black">Rs. 3,000</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Ideal for standalone retail shops, shoe stores, and garment outlets.
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>1 Store Account &amp; Counter</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Unlimited Products &amp; Invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Automated WhatsApp Bill Links</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Barcode Label Generator &amp; Print</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Daily Sales &amp; Net Profit Analytics</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/free-trial"
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <span>Choose Standard Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Premium / Mart Plan */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1C2541]/40 border border-slate-200 dark:border-slate-700/60 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Multi-Counter Marts
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Enterprise Mart
              </h3>
              <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                <span className="text-4xl font-black">Rs. 5,500</span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Built for busy superstores, departmental marts, and multi-staff counters.
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Multi-Cashier Counters &amp; RBAC</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Day-End Banknote Cash Drawer Audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Supplier Ledger &amp; Purchase Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Live Platform Telemetry &amp; Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Priority 24/7 Phone &amp; WhatsApp Support</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/free-trial"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <span>Choose Enterprise</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. CALL TO ACTION FOOTER BANNER                               */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to modernise your retail store?
            </h2>
            <p className="text-sm text-emerald-100 leading-relaxed font-sans">
              شروع کریں 14 دن کا مفت ٹرائل بغیر کسی کارڈ کے — چند منٹوں میں اپنا اسٹور چالو کریں۔
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Link
              to="/free-trial"
              className="px-6 py-3.5 bg-white text-slate-950 font-black text-sm rounded-xl shadow-lg hover:bg-slate-100 transition-all active:scale-95"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 bg-slate-950/30 hover:bg-slate-950/50 text-white font-bold text-sm rounded-xl border border-white/20 transition-all active:scale-95"
            >
              Store Login
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-8 bg-white dark:bg-[#0B132B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">NaveedPOS</span>
            <span>• Pakistan's #1 Retail POS &amp; Smart Khata Cloud SaaS</span>
          </div>

          <div className="flex items-center space-x-4 font-semibold">
            <Link to="/login" className="hover:text-emerald-600 transition">Store Login</Link>
            <Link to="/free-trial" className="hover:text-emerald-600 transition">Free Trial</Link>
            <Link to="/super-admin-login" className="hover:text-indigo-500 transition">Super Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingDashboardPage;
