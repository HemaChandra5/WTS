import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import companyLogo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

/* ─── Inline SVG Icons ───────────────────────────────────────────────────── */

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const MailIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const BuildingIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

const LockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const AlertIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const SpinnerIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const BriefcaseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25V6a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0120.25 6v4.15M15 12H9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75h6a2.25 2.25 0 012.25 2.25v.75H6.75V6A2.25 2.25 0 019 3.75z" />
  </svg>
);

const ClipboardCheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const CheckBadgeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.623 3.716 3.745 3.745 0 01-3.716.623A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.716-.623 3.745 3.745 0 01-.623-3.716A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.623-3.716 3.745 3.745 0 013.716-.623A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.716.623 3.745 3.745 0 01.623 3.716A3.745 3.745 0 0121 12z" />
  </svg>
);

const ChartBarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

/* ─── Constants ──────────────────────────────────────────────────────────── */

const DEPARTMENTS = [
  'HR',
  'Python Developer',
  'Research',
  'Cybersecurity',
  'DevOps',
  'Testing',
  'Data Analyst',
];

const LEFT_FEATURES = [
  { Icon: BriefcaseIcon,      label: 'Assign work to team members',   desc: 'Distribute tasks with deadlines'        },
  { Icon: ClipboardCheckIcon, label: 'Mark & submit completed work',   desc: 'Log progress and deliverables'          },
  { Icon: CheckBadgeIcon,     label: 'Review & approve submissions',   desc: 'One-click approvals with feedback'      },
  { Icon: ChartBarIcon,       label: 'Track team productivity',        desc: 'Visual reports on output'               },
];

/* ─── Reusable field wrapper ─────────────────────────────────────────────── */

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">
      {label}
      {required && <span className="ml-1 text-[#a855f7]">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Shared input style ─────────────────────────────────────────────────── */

const inputBase =
  'w-full bg-[#faf8ff] border-[1.5px] border-[#ede9fe] rounded-[13px] py-3 pl-10 pr-4 text-[14px] text-[#1e1b4b] placeholder-[#d8b4fe] outline-none transition-all duration-150';

const inputHandlers = {
  onFocus: (e) => {
    e.target.style.borderColor = '#8b5cf6';
    e.target.style.background  = '#fff';
    e.target.style.boxShadow   = '0 0 0 3px rgba(139,92,246,0.12)';
  },
  onBlur: (e) => {
    e.target.style.borderColor = '#ede9fe';
    e.target.style.background  = '#faf8ff';
    e.target.style.boxShadow   = 'none';
  },
};

/* ─── Brand logo ─────────────────────────────────────────────────────────── */

const BrandLogo = ({ size = 'w-14 h-14' }) => (
  <div
    className={`${size} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}
    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.20)' }}
  >
    <img
      src={companyLogo}
      alt="ssKatt"
      className="w-[70%] h-[70%] object-contain"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML =
          '<span style="color:#fff;font-size:18px;font-weight:800;font-family:inherit">sK</span>';
      }}
    />
  </div>
);

const BrandLogoLight = ({ size = 'w-12 h-12' }) => (
  <div
    className={`${size} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}
    style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}
  >
    <img
      src={companyLogo}
      alt="ssKatt"
      className="w-[70%] h-[70%] object-contain"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML =
          '<span style="color:#fff;font-size:18px;font-weight:800;font-family:inherit">sK</span>';
      }}
    />
  </div>
);

/* ─── Success screen ─────────────────────────────────────────────────────── */

const SuccessScreen = ({ formData }) => (
  <div
    className="min-h-screen flex items-center justify-center p-6"
    style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: 'linear-gradient(135deg, #faf8ff 0%, #fff 50%, #fdf4ff 100%)',
    }}
  >
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
      <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #f9a8d4, transparent)' }} />
    </div>

    <div className="relative z-10 w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full opacity-20"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }} />
          <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 20px 60px rgba(139,92,246,0.35)' }}>
            <ClockIcon className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#ede9fe] rounded-[24px] p-8"
        style={{ boxShadow: '0 8px 48px rgba(139,92,246,0.10)' }}>

        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-[#fdf4ff] border border-[#e9d5ff] rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
            <span className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-[0.08em]">
              Pending Admin Approval
            </span>
          </div>
        </div>

        <h1 className="text-[26px] font-bold text-[#1e1b4b] text-center mb-2">Account Submitted!</h1>
        <p className="text-[13px] text-[#9ca3af] text-center leading-relaxed mb-6">
          Your registration is complete. An admin will review and approve your account shortly.
          You'll be able to log in once approved.
        </p>

        <div className="bg-[#faf8ff] border border-[#ede9fe] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b5cf6] mb-4">
            What happens next?
          </p>
          <div className="flex flex-col gap-3">
            {[
              'Admin receives your registration request',
              'Admin reviews and approves your account',
              'You can then log in with your email & password',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
                >
                  {i + 1}
                </div>
                <span className="text-[13px] text-[#4b5563] leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#faf8ff] border border-[#ede9fe] rounded-2xl p-4 mb-6">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
          >
            {formData.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[#1e1b4b] truncate">{formData.name}</p>
            <p className="text-[12px] text-[#9ca3af] truncate">{formData.email}</p>
            {formData.department && (
              <span className="mt-1 inline-block bg-[#ede9fe] text-[#6d28d9] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                {formData.department}
              </span>
            )}
          </div>
        </div>

        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-[13px] py-3.5 text-[14px] font-bold text-white transition-all duration-150 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.30)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Go to Login
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
);

/* ─── Main Signup component ──────────────────────────────────────────────── */

export default function Signup() {
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword,      setShowPassword] = useState(false);
  const [showConfirm,       setShowConfirm]  = useState(false);
  const [error,             setError]        = useState('');
  const [loading,           setLoading]      = useState(false);
  const [submitted,         setSubmitted]    = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!formData.email.endsWith('@sskatt.com')) {
      setError('Only company emails (@sskatt.com) are allowed.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await signup({
      email:      formData.email,
      password:   formData.password,
      name:       formData.name,
      department: formData.department,
    });
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  if (submitted) return <SuccessScreen formData={formData} />;

  const passwordsMatch =
    formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

        html, body, #root { height: 100%; overflow: hidden; }

        .sp-root {
          height: 100vh;
          display: flex;
          font-family: 'Plus Jakarta Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #fff;
          overflow: hidden;
        }

        /* ══════ LEFT PANEL ══════ */
        .sp-left {
          display: none;
          position: relative;
          width: 44%;
          flex-direction: column;
          overflow: hidden;
        }
        @media (min-width: 1024px) { .sp-left { display: flex; } }

        .sp-left-bg {
          position: absolute; inset: 0;
          background: linear-gradient(155deg,
            #1a0533 0%, #2d0a5e 25%, #4a0f6e 45%,
            #6b1a7a 65%, #8b1a6b 80%, #a0185a 100%
          );
        }
        .sp-orb {
          position: absolute; border-radius: 50%;
          pointer-events: none; filter: blur(60px);
        }
        .sp-orb-1 {
          width: 380px; height: 380px; top: -100px; right: -70px;
          background: radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(168,85,247,0.3) 50%, transparent 75%);
          animation: sp-float1 8s ease-in-out infinite;
        }
        .sp-orb-2 {
          width: 300px; height: 300px; bottom: -80px; left: -50px;
          background: radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(236,72,153,0.25) 55%, transparent 75%);
          animation: sp-float2 10s ease-in-out infinite;
        }
        .sp-orb-3 {
          width: 170px; height: 170px; top: 42%; left: 32%;
          background: radial-gradient(circle, rgba(244,114,182,0.35) 0%, transparent 70%);
          animation: sp-float3 7s ease-in-out infinite;
        }
        @keyframes sp-float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-28px) scale(1.06)} }
        @keyframes sp-float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,22px) scale(1.04)} }
        @keyframes sp-float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(10px,-18px) scale(1.08)} }

        .sp-noise {
          position: absolute; inset: 0; opacity: 0.030; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .sp-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Left inner 3-row flex */
        .sp-left-inner {
          position: relative; z-index: 3;
          display: flex; flex-direction: column;
          height: 100%; padding: 40px 48px 36px;
        }

        /* Brand */
        .sp-brand { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
        .sp-brand-name { font-size: 20px; font-weight: 700; letter-spacing: 0.06em; color: #fff; }
        .sp-brand-tag  { font-size: 9.5px; font-weight: 400; letter-spacing: 0.10em; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-top: 3px; }

        /* Center */
        .sp-left-center { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 28px 0 20px; }

        .sp-headline {
          font-size: clamp(28px, 2.8vw, 42px); font-weight: 800;
          line-height: 1.12; color: #fff; letter-spacing: -0.024em; margin-bottom: 12px;
        }
        .sp-headline-accent {
          display: block;
          background: linear-gradient(90deg, #f472b6, #c084fc, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .sp-sub {
          font-size: 12.5px; font-weight: 300; color: rgba(255,255,255,0.46);
          line-height: 1.75; max-width: 280px; margin-bottom: 28px;
        }

        /* Feature cards */
        .sp-feature {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px; padding: 12px 14px; margin-bottom: 8px;
          transition: background 0.2s;
        }
        .sp-feature:last-child { margin-bottom: 0; }
        .sp-feature:hover { background: rgba(255,255,255,0.09); }
        .sp-feature-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.12);
        }
        .sp-feature-title { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.90); line-height: 1; }
        .sp-feature-desc  { font-size: 11px; font-weight: 300; color: rgba(255,255,255,0.38); margin-top: 2px; }

        /* Footer — matches login page style */
        .sp-left-foot { flex-shrink: 0; text-align: center; }
        .sp-left-foot-text {
          font-size: 10px; font-weight: 300;
          letter-spacing: 0.07em;
          color: rgba(255,255,255,0.25);
        }

        /* ══════ RIGHT PANEL ══════ */
        .sp-right {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #fff; position: relative;
          overflow-y: auto; overflow-x: hidden;
          padding: 32px 28px;
        }

        /* Subtle bg tint */
        .sp-right-bg {
          position: fixed; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 80% 0%, rgba(244,114,182,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 20% 100%, rgba(139,92,246,0.04) 0%, transparent 55%);
        }

        /* Watermark */
        .sp-wm {
          position: fixed; bottom: 20px; right: 28px;
          font-size: 80px; font-weight: 800; font-style: italic;
          background: linear-gradient(135deg, rgba(236,72,153,0.05), rgba(139,92,246,0.05));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          user-select: none; pointer-events: none; letter-spacing: -0.04em; line-height: 1;
        }

        /* Mobile brand */
        .sp-mobile-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        @media (min-width: 1024px) { .sp-mobile-brand { display: none; } }

        /* Form wrap */
        .sp-form-wrap { width: 100%; max-width: 440px; position: relative; z-index: 2; }

        /* Header */
        .sp-h1 {
          font-size: 26px; font-weight: 800; letter-spacing: -0.024em;
          line-height: 1.08; color: #1e1b4b; margin-bottom: 4px;
        }
        .sp-h1-sub { font-size: 12px; font-weight: 400; color: #9ca3af; line-height: 1.6; margin-bottom: 20px; }

        /* Card */
        .sp-card {
          background: #fff; border-radius: 22px; padding: 26px 26px 22px;
          border: 1.5px solid rgba(139,92,246,0.14);
          box-shadow:
            0 0 0 1px rgba(236,72,153,0.04),
            0 2px 8px rgba(139,92,246,0.05),
            0 8px 32px rgba(139,92,246,0.08),
            0 32px 72px rgba(236,72,153,0.06);
          position: relative; overflow: hidden;
        }
        .sp-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, #8b5cf6 30%, #ec4899 70%, transparent 100%);
        }

        /* Divider */
        .sp-divider { display: flex; align-items: center; gap: 10px; margin: 16px 0 0; }
        .sp-div-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(196,181,253,0.3), transparent); }
        .sp-div-txt { font-size: 9.5px; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: #d8b4fe; white-space: nowrap; }

        /* Card footer */
        .sp-card-foot { margin-top: 14px; text-align: center; }
        .sp-card-foot p { font-size: 12.5px; font-weight: 300; color: #9ca3af; }
        .sp-card-foot a {
          font-weight: 700; text-decoration: none;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          border-bottom: 1px solid transparent; padding-bottom: 1px; transition: border-color 0.2s;
        }
        .sp-card-foot a:hover { border-bottom-color: #ec4899; }
      `}</style>

      <div className="sp-root">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="sp-left">
          <div className="sp-left-bg" />
          <div className="sp-noise" />
          <div className="sp-grid" />
          <div className="sp-orb sp-orb-1" />
          <div className="sp-orb sp-orb-2" />
          <div className="sp-orb sp-orb-3" />

          <div className="sp-left-inner">

            {/* Brand */}
            <div className="sp-brand">
              <BrandLogo size="w-14 h-14" />
              <div>
                <div className="sp-brand-name">ssKatt</div>
                <div className="sp-brand-tag">Work Tracking System</div>
              </div>
            </div>

            {/* Center — pill removed */}
            <div className="sp-left-center">
              <h2 className="sp-headline">
                Join your team.<br />
                <span className="sp-headline-accent">Start contributing.</span>
              </h2>

              <p className="sp-sub">
                Register your account to assign tasks, track completions,
                and collaborate with your team.
              </p>

              <div>
                {LEFT_FEATURES.map(({ Icon, label, desc }) => (
                  <div className="sp-feature" key={label}>
                    <div className="sp-feature-icon">
                      <Icon className="w-4 h-4 text-white" style={{ opacity: 0.85 }} />
                    </div>
                    <div>
                      <div className="sp-feature-title">{label}</div>
                      <div className="sp-feature-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer — matches login page style */}
            <div className="sp-left-foot">
              <span className="sp-left-foot-text">
                © {new Date().getFullYear()} ssKatt. All rights reserved.
              </span>
            </div>

          </div>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="sp-right">
          <div className="sp-right-bg" />
          <div className="sp-wm">ssK</div>

          {/* Mobile brand */}
          <div className="sp-mobile-brand">
            <BrandLogoLight size="w-12 h-12" />
            <span style={{
              fontSize: 16, fontWeight: 700, letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>ssKatt</span>
          </div>

          <div className="sp-form-wrap">

            {/* Header — Employee Registration eyebrow removed */}
            <div>
              <h1 className="sp-h1">Create your account</h1>
              <p className="sp-h1-sub">Join as an employee · Admin approval required</p>
            </div>

            {/* Card */}
            <div className="sp-card">
              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 bg-[#fdf4ff] border border-[#e9d5ff] rounded-xl px-4 py-3">
                    <AlertIcon className="w-4 h-4 text-[#7c3aed] flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[#7c3aed]">{error}</p>
                  </div>
                )}

                {/* Full name */}
                <Field label="Full Name" required>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4b5fd] pointer-events-none" />
                    <input
                      name="name" type="text" value={formData.name} onChange={handleChange}
                      placeholder="Your full name" autoComplete="name" required
                      className={inputBase} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      {...inputHandlers}
                    />
                  </div>
                </Field>

                {/* Email */}
                <Field label="Email Address" required>
                  <div className="relative">
                    <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4b5fd] pointer-events-none" />
                    <input
                      name="email" type="email" value={formData.email} onChange={handleChange}
                      placeholder="yourname@sskatt.com" autoComplete="email" required
                      className={inputBase} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      {...inputHandlers}
                    />
                  </div>
                </Field>

                {/* Department */}
                <Field label="Department">
                  <div className="relative">
                    <BuildingIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4b5fd] pointer-events-none z-10" />
                    <select
                      name="department" value={formData.department} onChange={handleChange}
                      className={`${inputBase} appearance-none pr-10 cursor-pointer`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      {...inputHandlers}
                    >
                      <option value="">Select department (optional)</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4b5fd] pointer-events-none" />
                  </div>
                </Field>

                {/* Password row */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password" required>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4b5fd] pointer-events-none" />
                      <input
                        name="password" type={showPassword ? 'text' : 'password'}
                        value={formData.password} onChange={handleChange}
                        placeholder="Min 6 chars" autoComplete="new-password" required
                        className={`${inputBase} pr-10`}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        {...inputHandlers}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        aria-label="Toggle password"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4b5fd] hover:text-[#8b5cf6] transition-colors">
                        {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm" required>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c4b5fd] pointer-events-none" />
                      <input
                        name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                        value={formData.confirmPassword} onChange={handleChange}
                        placeholder="Re-enter" autoComplete="new-password" required
                        className={`${inputBase} pr-10`}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        {...inputHandlers}
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)}
                        aria-label="Toggle confirm password"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4b5fd] hover:text-[#8b5cf6] transition-colors">
                        {showConfirm ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                </div>

                {/* Password match indicator */}
                {passwordsMatch && (
                  <div className="flex items-center gap-2 bg-[#faf8ff] border border-[#ede9fe] rounded-xl px-3 py-2">
                    <CheckCircleIcon className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
                    <span className="text-[12px] font-semibold text-[#6d28d9]">Passwords match</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[13px] py-3.5 text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 35%, #db2777 75%, #ec4899 100%)',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.30)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Request Account
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

              {/* Divider + sign in */}
              <div className="sp-divider">
                <div className="sp-div-line" />
                <span className="sp-div-txt">Already have an account?</span>
                <div className="sp-div-line" />
              </div>

              <div className="sp-card-foot">
                <p>
                  <Link to="/login">Sign in here</Link>
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}