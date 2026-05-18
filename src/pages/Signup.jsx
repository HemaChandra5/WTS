import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import companyLogo from '../assets/logo.png';
import signupBg from '../assets/signup-bg.png';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  BoltIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────────────────────────
   Floating decorative square used in the left panel
───────────────────────────────────────────────────────────────────────────── */
const FloatSquare = ({
  size,
  top,
  left,
  right,
  bottom,
  opacity = 'opacity-20',
  delay = '0s',
}) => (
  <div
    className={`absolute rounded-2xl border border-white/30 bg-white/10 backdrop-blur-sm ${opacity}`}
    style={{
      width: size,
      height: size,
      top,
      left,
      right,
      bottom,
      animation: `floatY 6s ease-in-out infinite`,
      animationDelay: delay,
    }}
  />
);

/* ─────────────────────────────────────────────────────────────────────────────
   Feature pill used in the left panel
───────────────────────────────────────────────────────────────────────────── */
const FeaturePill = ({
  icon,
  label,
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-default">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
      {icon}
    </div>
    <span className="text-sm font-semibold text-white">{label}</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Input field wrapper
───────────────────────────────────────────────────────────────────────────── */
const InputField = ({
  label,
  required,
  icon,
  children,
}) => (
  <div className="group">
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
      {label}
      {required && <span className="ml-1 text-violet-500">*</span>}
    </label>
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-focus-within:bg-violet-100 transition-colors">
        <span className="text-slate-400 group-focus-within:text-violet-500 transition-colors [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      </div>
      {children}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Main Signup component
───────────────────────────────────────────────────────────────────────────── */
const departments = [
  'HR',
  'Python Developer',
  'Research',
  'Cybersecurity',
  'Devops',
  'Testing',
  'Data Analyst',
];

export default function Signup() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!formData.email.endsWith('@sskatt.com')) {
      setError('Only company emails (@sskatt.com) are allowed.');
      setLoading(false);
      return;
    }

    const result = signup({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      department: formData.department,
    });

    setLoading(false);

    if (result.success && result.pendingApproval) {
      setSubmitted(true);
    } else if (!result.success) {
      setError(result.error);
    }
  };

  /* ── Pending-approval success screen ──────────────────────────────────────── */
  if (submitted) {
    return (
      <>
        <style>{`
          @keyframes floatY {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-14px); }
          }
        `}</style>

        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4">
          {/* Blobs */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-200 opacity-30 blur-3xl" />
            <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-200 opacity-30 blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-md text-center">
            {/* Animated clock icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-300 opacity-30" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-200">
                  <ClockIcon className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-2xl shadow-violet-100/60 backdrop-blur-xl">
              <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 ring-1 ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pending Admin Approval
              </div>

              <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Account Submitted!</h1>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Your registration is complete. An admin will review and approve your account shortly.
                You'll be able to log in once approved.
              </p>

              {/* Steps */}
              <div className="mt-6 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-left">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  What happens next?
                </p>
                <ul className="space-y-3">
                  {[
                    'Admin receives your registration request',
                    'Admin reviews and approves your account',
                    'You can then log in with your email & password',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-amber-900">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-[10px] font-bold text-white shadow-sm">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* User recap */}
              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-base font-bold text-white shadow-md">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{formData.name}</p>
                  <p className="truncate text-xs text-slate-400">{formData.email}</p>
                  {formData.department && (
                    <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      {formData.department}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to="/login"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
              >
                Go to Login →
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Registration form ─────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
      `}</style>

      <div className="flex min-h-screen bg-white">
        {/* ════════════════════════════════════════════
            LEFT PANEL — image + gradient overlay
        ════════════════════════════════════════════ */}
        <div
          className="relative hidden overflow-hidden lg:flex lg:w-[45%] flex-col"
          style={{
            backgroundImage: `url(${signupBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Deep gradient overlay for readability & premium look */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(49,10,90,0.82) 0%, rgba(79,36,148,0.70) 40%, rgba(30,64,175,0.65) 100%)',
            }}
          />
          {/* Bottom vignette */}
          <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, rgba(15,7,40,0.85) 0%, transparent 100%)' }} />

          {/* Floating decorative squares */}
          <FloatSquare size="72px" top="5%" left="8%" opacity="opacity-20" delay="0s" />
          <FloatSquare size="48px" top="8%" right="12%" opacity="opacity-15" delay="1.5s" />
          <FloatSquare size="56px" top="30%" right="6%" opacity="opacity-10" delay="3s" />
          <FloatSquare size="40px" bottom="18%" left="10%" opacity="opacity-15" delay="2s" />
          <FloatSquare size="64px" bottom="6%" right="14%" opacity="opacity-10" delay="0.8s" />

          {/* Grid dots pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Glow blobs */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full p-12">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img
                src={companyLogo}
                alt="SSKATT Logo"
                className="h-11 w-11 rounded-xl object-contain bg-white/20 p-1 backdrop-blur-sm border border-white/30 shadow-lg"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">SSKATT</span>
            </div>

            {/* Center hero */}
            <div className="flex flex-col items-center text-center">
              {/* Big shield icon */}
              <div
                className="mb-10 flex h-28 w-28 items-center justify-center rounded-3xl border border-white/30 bg-white/15 shadow-2xl backdrop-blur-sm"
                style={{ animation: 'floatY 5s ease-in-out infinite' }}
              >
                <ShieldCheckIcon className="h-14 w-14 text-white" />
              </div>

              <h2 className="text-4xl font-extrabold leading-tight text-white">
                Secure Access
                <br />
                <span className="text-violet-200">Portal</span>
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-violet-100/80">
                One place to manage your team, track progress, and stay productive every day.
              </p>

              {/* Feature pills */}
              <div className="mt-10 w-full max-w-xs space-y-3">
                <FeaturePill
                  icon={<span className="text-base">🔒</span>}
                  label="Enterprise-grade security"
                />
                <FeaturePill
                  icon={<BoltIcon className="h-4 w-4 text-amber-300" />}
                  label="Real-time dashboard updates"
                />
                <FeaturePill
                  icon={<ShieldExclamationIcon className="h-4 w-4 text-cyan-300" />}
                  label="Role-based access control"
                />
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-violet-200/60">
              © {new Date().getFullYear()} SSKATT · All rights reserved
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT PANEL — form
        ════════════════════════════════════════════ */}
        <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-10 sm:px-10 lg:w-[55%]">
          {/* Mobile brand */}
          <div className="mb-8 flex w-full max-w-md items-center gap-3 lg:hidden">
            <img
              src={companyLogo}
              alt="SSKATT Logo"
              className="h-9 w-9 rounded-xl object-contain"
            />
            <span className="text-lg font-extrabold text-slate-900">SSKATT</span>
          </div>

          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-violet-500">
                Employee Registration
              </p>
              <h1 className="text-3xl font-extrabold leading-tight text-slate-900">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Join as an employee · Admin approval required
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5">
                <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <InputField label="Full Name" required icon={<UserCircleIcon />}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-14 pr-4 text-sm font-medium text-slate-800 placeholder-slate-300 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all"
                  required
                />
              </InputField>

              {/* Email */}
              <InputField label="Email Address" required icon={<EnvelopeIcon />}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="yourname@sskatt.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-14 pr-4 text-sm font-medium text-slate-800 placeholder-slate-300 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all"
                  required
                />
              </InputField>

              {/* Department */}
              <InputField label="Department (optional)" icon={<BuildingOfficeIcon />}>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-14 pr-10 text-sm font-medium text-slate-800 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all cursor-pointer"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </InputField>

              {/* Password row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Password */}
                <InputField label="Password" required icon={<LockClosedIcon />}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-14 pr-11 text-sm font-medium text-slate-800 placeholder-slate-300 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </InputField>

                {/* Confirm Password */}
                <InputField label="Confirm" required icon={<LockClosedIcon />}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-14 pr-11 text-sm font-medium text-slate-800 placeholder-slate-300 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </InputField>
              </div>

              {/* Password match badge */}
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
                  <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-violet-500" />
                  <span className="text-xs font-semibold text-violet-700">Passwords match</span>
                </div>
              )}

              {/* Agreement checkbox */}
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-violet-300 hover:bg-violet-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={agreedToGuidelines}
                  onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-violet-600"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setGuidelinesOpen(true)}
                    className="font-semibold text-violet-600 underline underline-offset-2 hover:text-violet-700 transition-colors"
                  >
                    SSKATT Company Guidelines
                  </button>
                  {' '}and accept full responsibility for compliance.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !agreedToGuidelines}
                className="relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-violet-300 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-violet-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Request Account
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs font-medium text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-violet-600 underline underline-offset-2 hover:text-violet-700 transition-colors"
              >
                Sign in
              </Link>
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-6">
              {[
                { icon: '🔒', label: 'Secure & Encrypted' },
                { icon: '✅', label: 'Admin Verified' },
                { icon: '🏢', label: 'Company Only' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[10px] font-medium text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Guidelines Pill Button ── */}
      <button
        type="button"
        onClick={() => setGuidelinesOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-violet-300/50 hover:from-violet-400 hover:to-indigo-500 hover:shadow-violet-400/60 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        {/* Book open icon */}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        Guidelines
      </button>

      {/* ── Guidelines Modal ── */}
      {guidelinesOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setGuidelinesOpen(false)}
          />

          {/* Modal panel */}
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl shadow-slate-900/20 overflow-hidden animate-[slideUp_0.25s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">SSKATT Company Guidelines</h2>
                  <p className="text-[11px] text-violet-200">Employee Code of Conduct &amp; Policy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuidelinesOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[55vh] overflow-y-auto px-6 py-5 space-y-4">
              {[
                {
                  icon: '🔒',
                  title: 'Data Confidentiality',
                  text: 'All company files and documents are strictly confidential. Do not share, copy, or distribute any internal data with unauthorized parties inside or outside the organization.',
                },
                {
                  icon: '💻',
                  title: 'Acceptable Use',
                  text: 'This portal is for official SSKATT work only. Personal or unauthorized use of company systems is strictly prohibited and may result in disciplinary action.',
                },
                {
                  icon: '🛡️',
                  title: 'Account Security',
                  text: 'Keep your login credentials private at all times. Never share your password with anyone. Report any suspicious activity or unauthorized access immediately to your administrator.',
                },
                {
                  icon: '📁',
                  title: 'File Management',
                  text: 'Upload only work-related files. Prohibited content includes malware, pirated material, or anything that violates company policy or applicable law.',
                },
                {
                  icon: '⚖️',
                  title: 'Compliance',
                  text: 'All employees must comply with SSKATT IT policies, data protection regulations, and applicable legal requirements. Violations may lead to account suspension or further action.',
                },
                {
                  icon: '🤝',
                  title: 'Respect & Professionalism',
                  text: 'Treat all colleagues and shared resources with respect. Harassment, discrimination, or misuse of the platform in any form will not be tolerated.',
                },
              ].map((g) => (
                <div key={g.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="mt-0.5 text-xl flex-shrink-0">{g.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{g.title}</p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{g.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={() => setGuidelinesOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { setAgreedToGuidelines(true); setGuidelinesOpen(false); }}
                className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-[0.98]"
              >
                ✓ I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
