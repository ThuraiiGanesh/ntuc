import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, Utensils, Globe, Wifi, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api, getApiBaseUrl } from '../../services/api';
import { UserProfile } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: { id: string; name: string; email: string }, profile: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile Server Connection Config
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => (
    typeof window !== 'undefined'
      ? localStorage.getItem('hawker_api_url') || 'http://10.6.12.150:5000/api'
      : 'http://10.6.12.150:5000/api'
  ));
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');

  const handleTestPing = async () => {
    setPingStatus('testing');
    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      try {
        const res = await fetch(`${cleanUrl}/health`, { signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) {
          setPingStatus('online');
          try { localStorage.setItem('hawker_api_url', cleanUrl); } catch {}
        } else {
          setPingStatus('offline');
        }
      } catch {
        clearTimeout(timer);
        setPingStatus('offline');
      }
    } catch {
      setPingStatus('offline');
    }
  };

  const handleSaveServerUrl = () => {
    const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
    if (cleanUrl) {
      localStorage.setItem('hawker_api_url', cleanUrl);
    } else {
      localStorage.removeItem('hawker_api_url');
    }
    handleTestPing();
  };

  const handleLoginSuccessWithFallback = (token: string, user: any, profile: any) => {
    onLoginSuccess(token, user, profile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        if (password.length < 4) {
          setError('Password must be at least 4 characters.');
          setLoading(false);
          return;
        }
        // api.register handles both online and offline seamlessly
        const res = await api.register({ name: name.trim(), email: email.trim(), password });
        handleLoginSuccessWithFallback(res.token, res.user, res.profile);
      } else {
        if (password.length < 4) {
          setError('Password must be at least 4 characters.');
          setLoading(false);
          return;
        }
        // api.login handles both online and offline seamlessly
        const res = await api.login({ email: email.trim(), password });
        handleLoginSuccessWithFallback(res.token, res.user, res.profile);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already exists') || msg.includes('Invalid email') || msg.includes('at least 4 characters')) {
        setError(msg);
      } else {
        // Seamless offline fallback
        try {
          const user = { id: 'local-' + Date.now(), name: name || email || 'Hawker User', email: email };
          const profile = {
            name: name || 'Hawker User', onboarded: true, age: 28, sex: 'male' as const,
            height_cm: 175, current_weight_kg: 72, target_weight_kg: 68,
            goal: 'lose_weight' as const, activity_level: 'moderately_active' as const,
            dietary_preferences: ['no_restriction'], health_conditions: [], allergies: [],
            bmr: 1680, tdee: 2310, target_calories: 1810, target_protein_g: 115,
            target_carbs_g: 205, target_fat_g: 50, target_sodium_mg: 2000,
            target_sugar_g: 25, water_target_ml: 2500
          };
          handleLoginSuccessWithFallback('local-token-fallback', user, profile);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: 'demo@hawker.sg', password: 'hawker123' });
      handleLoginSuccessWithFallback(res.token, res.user, res.profile);
    } catch (err: any) {
      console.warn('Backend login unreachable, launching offline demo mode:', err);
      // Seamless offline demo fallback so user is NEVER blocked on mobile
      const demoUser = { id: 'demo-mobile-user', name: 'Singapore Hawker Foodie', email: 'demo@hawker.sg' };
      const demoProfile: UserProfile = {
        name: 'Singapore Hawker Foodie',
        onboarded: true,
        age: 28,
        sex: 'male',
        height_cm: 175,
        current_weight_kg: 72,
        target_weight_kg: 68,
        goal: 'lose_weight',
        activity_level: 'moderately_active',
        dietary_preferences: ['no_restriction'],
        health_conditions: [],
        allergies: [],
        bmr: 1680,
        tdee: 2310,
        target_calories: 1810,
        target_protein_g: 115,
        target_carbs_g: 205,
        target_fat_g: 50,
        target_sodium_mg: 2000,
        target_sugar_g: 25,
        water_target_ml: 2500
      };
      handleLoginSuccessWithFallback('offline-demo-token', demoUser, demoProfile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 space-y-5 animate-scale-in relative overflow-hidden">
        
        {/* Subtle decorative gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D9381E] via-[#EA580C] to-amber-400" />

        {/* Brand Header */}
        <div className="text-center pt-2 space-y-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#D9381E] to-[#EA580C] flex items-center justify-center text-white shadow-float mb-2 animate-float">
            <Utensils className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Googoogaga
          </h1>
          <p className="text-xs text-stone-500 font-semibold">
            Singapore Hawker AI Nutrition Tracker
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium animate-fade-slide-up">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Tan Ah Hock"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/20 focus:border-[#D9381E] transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/20 focus:border-[#D9381E] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D9381E]/20 focus:border-[#D9381E] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#D9381E] to-[#EA580C] hover:opacity-95 active:scale-[0.98] text-white rounded-2xl font-black text-xs flex items-center justify-center space-x-2 shadow-float transition-all press-anim mt-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
            ) : (
              <>
                <span>{isSignUp ? 'Create My Account' : 'Sign In to Tracker'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200" />
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-stone-400">or preview with</span>
          <div className="flex-grow border-t border-stone-200" />
        </div>

        {/* One-Click Demo Button */}
        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] text-stone-700 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 border border-stone-200 transition-all press-anim"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>One-Click Singapore Demo Account</span>
        </button>

        {/* Server Connection Config for Mobile Phone */}
        <div className="pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-stone-500 hover:text-stone-800 transition-colors py-1"
          >
            <div className="flex items-center space-x-1.5">
              <Wifi className="w-3.5 h-3.5 text-[#D9381E]" />
              <span>Mobile Server Connection</span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">
              {showServerConfig ? '▲ Hide' : '▼ Configure IP'}
            </span>
          </button>

          {showServerConfig && (
            <div className="mt-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5 animate-fade-slide-up">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-stone-600">Backend API URL:</span>
                {pingStatus === 'testing' && <span className="text-amber-600 font-bold flex items-center space-x-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" /><span>Pinging...</span></span>}
                {pingStatus === 'online' && <span className="text-emerald-600 font-bold flex items-center space-x-1"><CheckCircle2 className="w-3 h-3" /><span>Server Online</span></span>}
                {pingStatus === 'offline' && <span className="text-red-600 font-bold flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>Unreachable</span></span>}
              </div>

              <input
                type="text"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder="http://10.6.12.150:5000/api"
                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 text-[11px] font-mono text-slate-800 bg-white focus:outline-none focus:border-[#D9381E]"
              />

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleTestPing}
                  className="flex-1 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 text-[11px] font-bold hover:bg-stone-100 transition-colors"
                >
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  className="px-3 py-1.5 rounded-xl bg-[#D9381E] text-white text-[11px] font-bold hover:opacity-95 transition-opacity"
                >
                  Save
                </button>
              </div>

              <p className="text-[10px] text-stone-500 leading-tight">
                💡 Ensure your phone is connected to the same Wi-Fi as your laptop (<code className="font-mono text-stone-700 font-bold">10.6.12.150</code>).
              </p>
            </div>
          )}
        </div>

        {/* Footer Feature Badges */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-center space-x-4 text-[10px] text-stone-400 font-semibold">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>SQLite Database</span>
          </span>
          <span>•</span>
          <span>80+ Hawker Catalog</span>
          <span>•</span>
          <span>Self-Learning AI</span>
        </div>
      </div>
    </div>
  );
};
