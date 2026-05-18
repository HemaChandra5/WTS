import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import companyLogo from '../assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'admin') navigate('/admin');
      else navigate('/employee');
    } else {
      setError(result.error);
    }
  };

  const quickLogin = (email, password) => {
    setFormData({ email, password });
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col items-center justify-center">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-blue-800 to-cyan-700" />
        {/* Subtle mesh overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #7dd3fc 0%, transparent 50%), radial-gradient(circle at 80% 20%, #38bdf8 0%, transparent 40%), radial-gradient(circle at 60% 80%, #a5f3fc 0%, transparent 40%)',
          }}
        />

        {/* Floating cards / decorative shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 rotate-12" />
        <div className="absolute top-24 right-16 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 -rotate-6" />
        <div className="absolute bottom-20 left-16 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 rotate-6" />
        <div className="absolute bottom-10 right-10 w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 -rotate-12" />

        {/* Top-left brand in left panel */}
        <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
          <img
            src={companyLogo}
            alt="SSKATT Logo"
            className="h-11 w-11 rounded-xl object-contain bg-white/20 p-1 backdrop-blur-sm border border-white/30 shadow-lg"
          />
          <span className="text-lg font-extrabold text-white tracking-tight">SSKATT</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 px-14 text-center">
          {/* Big icon */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm border border-white/30 shadow-2xl">
            <ShieldCheckIcon className="h-12 w-12 text-white" />
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Secure Access <br />
            <span className="text-cyan-300">Portal</span>
          </h2>
          <p className="mt-4 text-sky-100 text-base leading-relaxed max-w-xs mx-auto">
            One place to manage your team, track progress, and stay productive every day.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              { icon: '🔒', label: 'Enterprise-grade security' },
              { icon: '⚡', label: 'Real-time dashboard updates' },
              { icon: '🛡️', label: 'Role-based access control' },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 px-5 py-3 backdrop-blur-sm"
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium text-white">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <img
            src={companyLogo}
            alt="SSKATT Logo"
            className="h-12 w-12 rounded-2xl object-contain"
          />
          <span className="text-xl font-extrabold text-slate-900">SSKATT</span>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Heading */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-1">
              Welcome back
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Sign in to your <br className="hidden sm:block" />account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to continue to your dashboard.
            </p>
          </div>

          {/* Card */}
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_40px_rgba(14,165,233,0.10)] p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
            Email Address
          </label>
          <div className="relative group">
            <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
            Password
          </label>
          <div className="relative group">
            <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:from-sky-500 hover:to-cyan-400 hover:shadow-sky-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Demo Accounts
        </span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {/* Quick Login Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => quickLogin('admin@sskatt.com', 'admin@123')}
          className="group flex flex-col items-start gap-1.5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3.5 text-left transition-all hover:border-amber-300 hover:bg-amber-100 hover:shadow-md hover:shadow-amber-100 active:scale-[0.97]"
        >
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-200 group-hover:bg-amber-300 transition-colors">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-amber-700" />
            </div>
            <span className="text-xs font-bold text-amber-800">Admin</span>
          </div>
          <span className="text-[10px] font-medium text-amber-600 leading-tight">
            admin@sskatt.com
          </span>
        </button>

        <button
          type="button"
          onClick={() => quickLogin('john@sskatt.com', 'john@123')}
          className="group flex flex-col items-start gap-1.5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3.5 text-left transition-all hover:border-sky-300 hover:bg-sky-100 hover:shadow-md hover:shadow-sky-100 active:scale-[0.97]"
        >
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-200 group-hover:bg-sky-300 transition-colors">
              <UserCircleIcon className="h-3.5 w-3.5 text-sky-700" />
            </div>
            <span className="text-xs font-bold text-sky-800">Employee</span>
          </div>
          <span className="text-[10px] font-medium text-sky-500 leading-tight">
            john@sskatt.com
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-bold text-sky-600 hover:text-cyan-600 transition-colors hover:underline underline-offset-2"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>

    {/* Bottom credential note */}
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-center text-[11px] text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-500">Demo credentials</span>
        <br />
        Admin: admin@sskatt.com / admin@123
        <br />
        Employee: john@sskatt.com / john@123
      </p>
    </div>
  </div>
      </div >
    </div >
  );
};

export default Login;
