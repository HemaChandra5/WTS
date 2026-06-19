import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import companyLogo from '../assets/logo.png';

/* ════════════════════════════════════════════════════════
   SVG ICONS
════════════════════════════════════════════════════════ */

const MailIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const AlertIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

/* ════════════════════════════════════════════════════════
   LEFT PANEL STEPS DATA
════════════════════════════════════════════════════════ */

const STEPS = [
  {
    num: '01',
    title: 'Authenticate Securely',
    desc: 'Enterprise-grade identity verification with encrypted credentials.',
  },
  {
    num: '02',
    title: 'Assign & Track Work',
    desc: 'Assign tasks, send work, and monitor progress in real time.',
  },
  {
    num: '03',
    title: 'Approve & Store Files',
    desc: 'Review submissions, approve work, and manage file storage.',
  },
];

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin' : '/employee');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root {
          height: 100%;
          overflow: hidden;
        }

        .pg-root {
          height: 100vh;
          display: flex;
          font-family: 'Plus Jakarta Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #fff;
          overflow: hidden;
        }

        /* ══════════════════════════════════
           LEFT PANEL
        ══════════════════════════════════ */
        .pg-left {
          display: none;
          position: relative;
          flex-direction: column;
          width: 50%;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .pg-left { display: flex; }
        }

        .pg-left-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(155deg,
            #1a0533 0%,
            #2d0a5e 25%,
            #4a0f6e 45%,
            #6b1a7a 65%,
            #8b1a6b 80%,
            #a0185a 100%
          );
        }

        .pg-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(60px);
        }
        .pg-orb-1 {
          width: 420px; height: 420px;
          top: -120px; right: -80px;
          background: radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(168,85,247,0.3) 50%, transparent 75%);
          animation: pg-float1 8s ease-in-out infinite;
        }
        .pg-orb-2 {
          width: 350px; height: 350px;
          bottom: -100px; left: -60px;
          background: radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(236,72,153,0.25) 55%, transparent 75%);
          animation: pg-float2 10s ease-in-out infinite;
        }
        .pg-orb-3 {
          width: 200px; height: 200px;
          top: 45%; left: 35%;
          background: radial-gradient(circle, rgba(244,114,182,0.35) 0%, transparent 70%);
          animation: pg-float3 7s ease-in-out infinite;
        }
        .pg-orb-4 {
          width: 160px; height: 160px;
          top: 20%; left: 10%;
          background: radial-gradient(circle, rgba(192,132,252,0.3) 0%, transparent 70%);
          animation: pg-float1 9s ease-in-out infinite reverse;
        }

        @keyframes pg-float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, -30px) scale(1.06); }
        }
        @keyframes pg-float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-15px, 25px) scale(1.04); }
        }
        @keyframes pg-float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(10px, -20px) scale(1.08); }
        }

        .pg-noise {
          position: absolute; inset: 0; opacity: 0.032;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        .pg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* Left inner layout — 3 rows: brand / center / footer */
        .pg-left-inner {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 40px 52px 36px;
          gap: 0;
        }

        /* ── Brand ── */
        .pg-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        .pg-brand-mark {
          width: 58px; height: 58px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
          flex-shrink: 0;
        }
        .pg-brand-mark img {
          width: 40px; height: 40px;
          object-fit: contain;
        }
        .pg-brand-name {
          font-size: 20px; font-weight: 700;
          letter-spacing: 0.06em;
          color: #fff;
        }
        .pg-brand-tag {
          font-size: 9.5px; font-weight: 400;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: rgba(255,255,255,0.42);
          margin-top: 3px;
        }

        /* ── Center content — flex-grow to fill remaining space ── */
        .pg-left-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 0 24px;
        }

        .pg-overline {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px;
        }
        .pg-overline-line {
          width: 22px; height: 1px;
          background: linear-gradient(90deg, rgba(244,114,182,0.9), transparent);
        }
        .pg-overline-text {
          font-size: 9px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: rgba(244,114,182,0.85);
        }

        .pg-headline {
          font-size: clamp(30px, 3vw, 46px);
          font-weight: 800;
          line-height: 1.10;
          color: #fff;
          letter-spacing: -0.025em;
          margin-bottom: 14px;
        }
        .pg-headline-accent {
          display: block;
          background: linear-gradient(90deg, #f472b6, #c084fc, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pg-sub {
          font-size: 12.5px; font-weight: 300;
          color: rgba(255,255,255,0.48);
          line-height: 1.75;
          max-width: 290px;
          margin-bottom: 32px;
        }

        .pg-steps { display: flex; flex-direction: column; }
        .pg-step {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 16px;
          align-items: start;
          padding: 14px 0;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .pg-step:last-child { border-bottom: 1px solid rgba(255,255,255,0.07); }

        .pg-step-num {
          font-size: 11px; font-weight: 600;
          color: rgba(244,114,182,0.7);
          letter-spacing: 0.06em;
          padding-top: 1px;
          font-variant-numeric: tabular-nums;
        }
        .pg-step-title {
          font-size: 12.5px; font-weight: 600;
          color: rgba(255,255,255,0.92);
          margin-bottom: 2px;
        }
        .pg-step-desc {
          font-size: 11px; font-weight: 300;
          color: rgba(255,255,255,0.36);
          line-height: 1.6;
        }

        /* ── Left footer ── */
        .pg-left-foot {
          flex-shrink: 0;
          text-align: center;
        }
        .pg-left-foot-text {
          font-size: 10px; font-weight: 300;
          letter-spacing: 0.07em;
          color: rgba(255,255,255,0.25);
        }

        /* ══════════════════════════════════
           RIGHT PANEL
        ══════════════════════════════════ */
        .pg-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
          position: relative;
          overflow: hidden;
          padding: 32px 28px;
        }

        .pg-right-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 80% 0%, rgba(244,114,182,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 20% 100%, rgba(139,92,246,0.04) 0%, transparent 55%);
          pointer-events: none;
        }

        .pg-wm {
          position: absolute;
          bottom: 20px; right: 28px;
          font-size: 90px; font-weight: 800; font-style: italic;
          background: linear-gradient(135deg, rgba(236,72,153,0.05), rgba(139,92,246,0.05));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          user-select: none; pointer-events: none;
          letter-spacing: -0.04em; line-height: 1;
        }

        /* Mobile brand (shown only below 1024px) */
        .pg-mobile-brand {
          display: flex; align-items: center; gap: 11px;
          margin-bottom: 28px;
        }
        @media (min-width: 1024px) { .pg-mobile-brand { display: none; } }

        .pg-mobile-mark {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(139,92,246,0.4);
        }
        .pg-mobile-mark img { width: 28px; height: 28px; object-fit: contain; }
        .pg-mobile-name {
          font-size: 16px; font-weight: 700;
          letter-spacing: 0.08em;
          background: linear-gradient(135deg, #7c3aed, #db2777);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Form wrap */
        .pg-form-wrap {
          width: 100%; max-width: 392px;
          position: relative; z-index: 2;
        }

        /* Header above the card */
        .pg-header { margin-bottom: 20px; }

        .pg-h1 {
          font-size: 28px; font-weight: 800;
          letter-spacing: -0.025em; line-height: 1.08;
          color: #1a0533;
          margin-bottom: 6px;
        }
        .pg-h1 em {
          font-style: italic; font-weight: 700;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .pg-h1-sub {
          font-size: 12px; font-weight: 400;
          color: #9ca3af; line-height: 1.6;
        }

        /* Card */
        .pg-card {
          background: #fff;
          border-radius: 22px;
          padding: 26px 26px 22px;
          border: 1.5px solid rgba(139,92,246,0.14);
          box-shadow:
            0 0 0 1px rgba(236,72,153,0.04),
            0 2px 8px rgba(139,92,246,0.05),
            0 8px 32px rgba(139,92,246,0.08),
            0 32px 72px rgba(236,72,153,0.06);
          position: relative;
          overflow: hidden;
        }
        .pg-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, #8b5cf6 30%, #ec4899 70%, transparent 100%);
        }
        .pg-card::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 150px; height: 150px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Error banner */
        .pg-error {
          display: flex; align-items: flex-start; gap: 9px;
          background: linear-gradient(135deg, rgba(253,242,248,1), rgba(250,245,255,1));
          border: 1px solid rgba(236,72,153,0.25);
          border-radius: 12px;
          padding: 10px 13px;
          margin-bottom: 16px;
        }
        .pg-error-icon { color: #db2777; margin-top: 1px; flex-shrink: 0; }
        .pg-error-text { font-size: 12px; color: #9d174d; line-height: 1.5; }

        /* Labels */
        .pg-label {
          display: block;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #9ca3af; margin-bottom: 7px;
        }

        /* Input wrapper */
        .pg-input-wrap { position: relative; margin-bottom: 14px; }

        .pg-icon-left {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #c4b5fd; pointer-events: none;
          display: flex; transition: color 0.2s;
        }
        .pg-input-wrap:focus-within .pg-icon-left { color: #8b5cf6; }

        .pg-input {
          width: 100%;
          background: rgba(250,248,255,0.8);
          border: 1.5px solid rgba(196,181,253,0.4);
          border-radius: 13px;
          padding: 12px 42px 12px 40px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px; font-weight: 400;
          color: #1a0533;
          outline: none;
          transition: all 0.2s;
          -webkit-appearance: none;
        }
        .pg-input::placeholder { color: #d8b4fe; }
        .pg-input:hover:not(:focus) {
          border-color: rgba(139,92,246,0.35);
          background: rgba(250,248,255,1);
        }
        .pg-input:focus {
          border-color: #8b5cf6;
          background: #fff;
          box-shadow: 0 0 0 3.5px rgba(139,92,246,0.12), 0 1px 4px rgba(139,92,246,0.1);
        }

        .pg-eye {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #c4b5fd; display: flex; padding: 4px; border-radius: 6px;
          transition: color 0.18s, background 0.18s;
        }
        .pg-eye:hover { color: #8b5cf6; background: rgba(139,92,246,0.07); }

        /* Forgot */
        .pg-forgot-row { display: flex; justify-content: flex-end; margin-top: 6px; }
        .pg-forgot {
          font-size: 11.5px; font-weight: 500;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none; padding-bottom: 1px;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }
        .pg-forgot:hover { border-bottom-color: #ec4899; }

        /* CTA */
        .pg-cta-wrap { margin-top: 18px; }
        .pg-cta {
          width: 100%;
          border: none; border-radius: 13px;
          padding: 13px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.06em; color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #7c3aed 0%, #9333ea 35%, #db2777 75%, #ec4899 100%);
          background-size: 200% 200%;
          background-position: 0% 50%;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.15) inset,
            0 4px 16px rgba(139,92,246,0.4),
            0 12px 32px rgba(236,72,153,0.25);
          transition: background-position 0.5s ease, box-shadow 0.2s, transform 0.15s;
        }
        .pg-cta:hover:not(:disabled) {
          background-position: 100% 50%;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.15) inset,
            0 6px 24px rgba(139,92,246,0.55),
            0 16px 40px rgba(236,72,153,0.35);
        }
        .pg-cta:active:not(:disabled) { transform: scale(0.986); }
        .pg-cta:disabled { opacity: 0.52; cursor: not-allowed; }
        .pg-cta::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 50%);
          pointer-events: none;
        }
        .pg-cta-arrow {
          width: 15px; height: 15px;
          transition: transform 0.2s;
          position: relative; z-index: 1;
        }
        .pg-cta:hover:not(:disabled) .pg-cta-arrow { transform: translateX(3px); }
        .pg-cta-label { position: relative; z-index: 1; }

        /* Spinner */
        .pg-spin {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pg-rotate 0.65s linear infinite;
          flex-shrink: 0;
        }
        @keyframes pg-rotate { to { transform: rotate(360deg); } }

        /* Divider */
        .pg-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 18px 0 0;
        }
        .pg-div-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(196,181,253,0.35), transparent);
        }
        .pg-div-txt {
          font-size: 9.5px; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #d8b4fe; white-space: nowrap;
        }

        /* Card footer */
        .pg-card-foot { margin-top: 14px; text-align: center; }
        .pg-card-foot p { font-size: 12.5px; font-weight: 300; color: #9ca3af; }
        .pg-card-foot a {
          font-weight: 700; text-decoration: none;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          border-bottom: 1px solid transparent;
          padding-bottom: 1px;
          transition: border-color 0.2s;
        }
        .pg-card-foot a:hover { border-bottom-color: #ec4899; }
      `}</style>

      <div className="pg-root">

        {/* ══════════════════ LEFT PANEL ══════════════════ */}
        <div className="pg-left">
          <div className="pg-left-bg" />
          <div className="pg-noise" />
          <div className="pg-grid" />
          <div className="pg-orb pg-orb-1" />
          <div className="pg-orb pg-orb-2" />
          <div className="pg-orb pg-orb-3" />
          <div className="pg-orb pg-orb-4" />

          <div className="pg-left-inner">

            {/* Brand */}
            <div className="pg-brand">
              <div className="pg-brand-mark">
                <img src={companyLogo} alt="ssKatt" />
              </div>
              <div>
                <div className="pg-brand-name">ssKatt</div>
                <div className="pg-brand-tag">Work Tracking System</div>
              </div>
            </div>

            {/* Center — grows to fill vertical space */}
            <div className="pg-left-center">
              <div className="pg-overline">
                <div className="pg-overline-line" />
                <span className="pg-overline-text">How it works</span>
              </div>

              <h2 className="pg-headline">
                Track work,<br />
                <span className="pg-headline-accent">stay ahead,</span><br />
                every day.
              </h2>

              <p className="pg-sub">
                Assign tasks, send work, approve submissions,
                and manage files — all in one secure workspace.
              </p>

              <div className="pg-steps">
                {STEPS.map((s) => (
                  <div className="pg-step" key={s.num}>
                    <span className="pg-step-num">{s.num}</span>
                    <div>
                      <div className="pg-step-title">{s.title}</div>
                      <div className="pg-step-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pg-left-foot">
              <span className="pg-left-foot-text">
                © {new Date().getFullYear()} ssKatt. All rights reserved.
              </span>
            </div>

          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL ══════════════════ */}
        <div className="pg-right">
          <div className="pg-right-bg" />
          <div className="pg-wm">ssK</div>

          {/* Mobile brand */}
          <div className="pg-mobile-brand">
            <div className="pg-mobile-mark">
              <img src={companyLogo} alt="ssKatt" />
            </div>
            <span className="pg-mobile-name">ssKatt</span>
          </div>

          <div className="pg-form-wrap">

            {/* Header */}
            <div className="pg-header">
              <h1 className="pg-h1">Welcome <em>back</em></h1>
              <p className="pg-h1-sub">Enter your credentials to access your workspace.</p>
            </div>

            {/* Card */}
            <div className="pg-card">
              <form onSubmit={handleSubmit} noValidate>

                {error && (
                  <div className="pg-error">
                    <span className="pg-error-icon"><AlertIcon /></span>
                    <p className="pg-error-text">{error}</p>
                  </div>
                )}

                {/* Email */}
                <label className="pg-label" htmlFor="email">Email Address</label>
                <div className="pg-input-wrap">
                  <span className="pg-icon-left"><MailIcon /></span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@sskatt.com"
                    autoComplete="email"
                    required
                    className="pg-input"
                  />
                </div>

                {/* Password */}
                <label className="pg-label" htmlFor="password" style={{ marginTop: 14, display: 'block' }}>
                  Password
                </label>
                <div className="pg-input-wrap" style={{ marginBottom: 0 }}>
                  <span className="pg-icon-left"><LockIcon /></span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="pg-input"
                  />
                  <button
                    type="button"
                    className="pg-eye"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Forgot */}
                <div className="pg-forgot-row">
                  <Link to="/forgot-password" className="pg-forgot">Forgot password?</Link>
                </div>

                {/* Sign In */}
                <div className="pg-cta-wrap">
                  <button type="submit" disabled={loading} className="pg-cta">
                    {loading ? (
                      <>
                        <div className="pg-spin" />
                        <span className="pg-cta-label">Authenticating…</span>
                      </>
                    ) : (
                      <>
                        <span className="pg-cta-label">Sign In</span>
                        <svg className="pg-cta-arrow" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Divider */}
              <div className="pg-divider">
                <div className="pg-div-line" />
                <span className="pg-div-txt">New to ssKatt?</span>
                <div className="pg-div-line" />
              </div>

              {/* Card footer */}
              <div className="pg-card-foot">
                <p>Don't have an account?{' '}<Link to="/signup">Request access</Link></p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default Login;
