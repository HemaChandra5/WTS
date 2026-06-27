import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import companyLogo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

/* ─── Icons ──────────────────────────────────────────────────────────────── */

const UserIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const FolderIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
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
const ChevronDownIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

/* ─── Content ─────────────────────────────────────────────────────────────── */

const DEPARTMENTS = [
  'Python Developer',
  'Data Analyst',
  'Testing',
  'Research',
  'Digital Marketing',
  'DevOps',
  'HR',
  'Cyber Security',
  'Engineering',
];

const STEPS_INFO = [
  { n: '01', title: 'Create Your Profile', desc: 'Enter your details and pick your department to get started instantly.' },
  { n: '02', title: 'Admin Verification', desc: 'Your account is reviewed and approved by your organisation admin.' },
  { n: '03', title: 'Get Assigned Work', desc: 'Receive tasks, upload files, and track every submission live.' },
];

/* ─── Main Signup component ──────────────────────────────────────────────── */

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '', email: '', department: '', password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));

    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.email || !formData.password || !formData.department) {
      setError('Please fill in all required fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await signup({
      email:      normalizedEmail,
      password:   formData.password,
      name:       formData.username,
      department: formData.department,
    });
    setLoading(false);

    if (result.success) {
      setRegistrationSuccess(true);
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; }

        @keyframes s-page-in {
          from { opacity: 0; transform: translateY(14px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes s-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes s-success-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .s-root {
          height: 100vh; width: 100%; overflow: hidden;
          display: flex;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #0A0712;
          animation: s-page-in 0.55s cubic-bezier(0.22,1,0.36,1);
        }

        /* ══════════════ LEFT PANEL — FORM ══════════════ */
        .s-left {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #0A0712; position: relative;
          height: 100%; overflow: hidden;
          padding: clamp(16px, 4vh, 32px) 24px;
        }

        .s-mobile-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; animation: s-rise 0.55s ease both; }
        @media (min-width: 1024px) { .s-mobile-brand { display: none; } }
        .s-mobile-mark {
          width: 56px; height: 56px; border-radius: 14px;
          background: #fff;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .s-mobile-mark img { width: 36px; height: 36px; object-fit: contain; }
        .s-mobile-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 24px; font-weight: 800; color: #F2EBFA; letter-spacing: -0.02em;
        }

        .s-form-wrap { position: relative; z-index: 1; width: 100%; max-width: 420px; animation: s-rise 0.6s ease 0.1s both; }

        .s-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase;
          color: #E879B9; margin-bottom: 10px;
        }

        .s-hdr { margin-bottom: 16px; }
        .s-hdr-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 26px; font-weight: 800; letter-spacing: -0.03em;
          line-height: 1.15; color: #F7F2FC; margin-bottom: 6px;
        }
        .s-hdr-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 400; color: #9685AE; line-height: 1.5;
        }

        .s-error {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(244,63,94,0.10); border: 1px solid rgba(244,63,94,0.28);
          border-radius: 11px; padding: 10px 12px; margin-bottom: 13px;
        }
        .s-error-icon { color: #FB7185; flex-shrink: 0; margin-top: 1px; }
        .s-error-text {
          font-family: 'Inter', sans-serif;
          font-size: 12px; color: #FCA5B1; line-height: 1.45;
        }

        .s-success-box {
          margin-bottom: 13px;
          border-radius: 16px;
          border: 1px solid rgba(74, 222, 128, 0.52);
          background: linear-gradient(135deg, #0B4A31, #0E5A3A);
          color: #BBF7D0;
          padding: 12px 14px;
          animation: s-success-fade 0.35s ease-out;
          box-shadow: 0 10px 24px rgba(16, 185, 129, 0.18), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .s-success-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          margin-bottom: 6px; color: #DCFCE7;
          letter-spacing: -0.01em;
        }
        .s-success-msg {
          font-family: 'Inter', sans-serif;
          font-size: 12px; line-height: 1.5;
          color: #BBF7D0; opacity: 0.95;
        }

        .s-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: #8A7AA0; margin-bottom: 6px;
        }
        .s-req { color: #F472B6; }

        .s-field { position: relative; margin-bottom: 13px; }
        .s-field-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #6E5E84; pointer-events: none; display: flex;
        }
        .s-input, .s-select {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 11.5px 14px 11.5px 38px;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px; color: #F2EBFA;
          outline: none; transition: border-color 0.18s, background 0.18s;
        }
        .s-select { appearance: none; padding-right: 34px; cursor: pointer; }
        .s-select option { background: #1A1026; color: #F2EBFA; }
        .s-input::placeholder { color: #5E4F75; }
        .s-input:focus, .s-select:focus {
          border-color: rgba(219,39,119,0.55);
          background: rgba(255,255,255,0.06);
        }
        .s-input:disabled, .s-select:disabled { opacity: 0.55; cursor: not-allowed; }
        .s-select-arrow {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          color: #6E5E84; pointer-events: none; display: flex;
        }
        .s-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #6E5E84;
          display: flex; padding: 2px; transition: color 0.18s;
        }
        .s-eye:hover { color: #B6A8CC; }

        .s-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(100deg, #DB2777, #7C3AED);
          border: none; border-radius: 12px;
          padding: 13px 20px; margin-top: 2px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700; color: #fff;
          letter-spacing: -0.01em; cursor: pointer;
          box-shadow: 0 10px 24px rgba(219,39,119,0.3), 0 4px 10px rgba(124,58,237,0.22);
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.25s;
        }
        .s-btn:hover { opacity: 0.92; box-shadow: 0 14px 30px rgba(219,39,119,0.4), 0 6px 14px rgba(124,58,237,0.28); }
        .s-btn:active { transform: scale(0.99); }
        .s-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .s-btn-arrow { display: flex; transition: transform 0.2s; }
        .s-btn:hover .s-btn-arrow { transform: translateX(2px); }

        .s-spin {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
          animation: s-spin-rot 0.7s linear infinite;
        }
        @keyframes s-spin-rot { to { transform: rotate(360deg); } }

        .s-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0 12px; }
        .s-div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .s-div-txt {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; color: #6E5E84; white-space: nowrap;
        }

        .s-foot { text-align: center; }
        .s-foot p {
          font-family: 'Inter', sans-serif;
          font-size: 12.5px; font-weight: 400; color: #9685AE;
        }
        .s-foot a { font-weight: 600; color: #C77DFF; text-decoration: none; transition: color 0.18s; }
        .s-foot a:hover { color: #F472B6; }

        /* ══════════════ RIGHT PANEL — BRAND / GRID BG ══════════════ */
        .s-right {
          display: none;
          position: relative; width: 50%; flex-shrink: 0;
          flex-direction: column; overflow: hidden;
          background:
            radial-gradient(circle at 75% 18%, rgba(168,85,247,0.10), transparent 45%),
            linear-gradient(165deg, #2A1240 0%, #200B33 45%, #170821 100%);
        }
        @media (min-width: 1024px) { .s-right { display: flex; } }

        .s-right::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(ellipse at 70% 25%, rgba(0,0,0,0.9), transparent 70%);
          pointer-events: none;
        }
        .s-right::after {
          content: '';
          position: absolute; left: 0; top: 6%; bottom: 6%; width: 1px;
          background: linear-gradient(180deg, transparent, rgba(168,85,247,0.35) 30%, rgba(219,39,119,0.35) 70%, transparent);
          z-index: 3;
        }

        .s-glow-1 {
          position: absolute; top: -16%; right: -8%;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.26) 0%, transparent 70%);
          filter: blur(20px); pointer-events: none;
          animation: s-drift 11s ease-in-out infinite alternate;
        }
        .s-glow-2 {
          position: absolute; bottom: -18%; left: -10%;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(219,39,119,0.22) 0%, transparent 70%);
          filter: blur(22px); pointer-events: none;
          animation: s-drift 11s ease-in-out infinite alternate-reverse;
        }
        @keyframes s-drift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(-14px, 16px) scale(1.05); }
        }

        .s-right-inner {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          height: 100%;
          padding: clamp(20px, 4vh, 40px) clamp(32px, 4.5vw, 54px);
        }

        .s-brand { display: flex; align-items: center; gap: 16px; flex-shrink: 0; animation: s-rise 0.6s ease both; }
        .s-brand-mark {
          width: 66px; height: 66px; border-radius: 16px;
          background: #fff;
          box-shadow: 0 12px 30px rgba(124,58,237,0.25);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
        }
        .s-brand-mark img { width: 42px; height: 42px; object-fit: contain; }
        .s-brand-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 28px; font-weight: 800; color: #F4EEFB; letter-spacing: -0.03em;
        }

        .s-center { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; padding: 14px 0; }

        .s-headline {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(24px, 3.2vw, 38px); font-weight: 800;
          line-height: 1.08; letter-spacing: -0.03em;
          color: #F7F2FC; margin-bottom: 14px;
          animation: s-rise 0.6s ease 0.05s both;
        }
        .s-headline-accent {
          background: linear-gradient(100deg, #F472B6, #C77DFF);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .s-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px; font-weight: 400;
          color: #B6A8CC; line-height: 1.7;
          max-width: 400px; margin-bottom: 26px;
          animation: s-rise 0.6s ease 0.1s both;
        }

        .s-process { display: flex; flex-direction: column; gap: 14px; max-width: 440px; animation: s-rise 0.6s ease 0.15s both; }
        .s-proc-item { display: flex; align-items: flex-start; gap: 14px; }
        .s-proc-num {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(219,39,119,0.16); border: 1px solid rgba(219,39,119,0.35);
          display: flex; align-items: center; justify-content: center;
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 600;
          color: #F472B6; flex-shrink: 0;
        }
        .s-proc-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px; font-weight: 700; color: #F2EBFA; margin-bottom: 3px;
          letter-spacing: -0.01em;
        }
        .s-proc-desc {
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 400; color: #9685AE; line-height: 1.5;
        }

        .s-right-foot {
          flex-shrink: 0;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; color: #6E5E84;
        }

        @media (max-height: 680px) {
          .s-process { gap: 10px; }
          .s-proc-desc { display: none; }
        }
      `}</style>

      <div className="s-root">

        {/* ══════════════ LEFT PANEL — FORM ══════════════ */}
        <div className="s-left">

          <div className="s-form-wrap">

            <div className="s-mobile-brand">
              <div className="s-mobile-mark">
                <img
                  src={companyLogo}
                  alt="ssKatt"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML =
                      `<span style="color:#7C3AED;font-size:18px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif">sK</span>`;
                  }}
                />
              </div>
              <span className="s-mobile-name">ssKatt</span>
            </div>

            <p className="s-eyebrow">Employee Onboarding</p>
            <div className="s-hdr">
              <h1 className="s-hdr-title">Create Account</h1>
              <p className="s-hdr-sub">Join your organisation on ssKatt</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="s-error">
                  <span className="s-error-icon"><AlertIcon /></span>
                  <p className="s-error-text">{error}</p>
                </div>
              )}

              {registrationSuccess && (
                <div className="s-success-box" role="status" aria-live="polite">
                  <p className="s-success-title">✓ Registration Submitted</p>
                  <p className="s-success-msg">
                    Your account has been created successfully. Please wait for administrator approval before signing in.
                  </p>
                </div>
              )}

              <label className="s-label" htmlFor="s-username">Username</label>
              <div className="s-field">
                <span className="s-field-icon"><UserIcon /></span>
                <input
                  id="s-username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  autoComplete="username"
                  required
                  disabled={loading || registrationSuccess}
                  className="s-input"
                />
              </div>

              <label className="s-label" htmlFor="s-email">Work Email</label>
              <div className="s-field">
                <span className="s-field-icon"><MailIcon /></span>
                <input
                  id="s-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@sskatt.com"
                  autoComplete="email"
                  required
                  disabled={loading || registrationSuccess}
                  className="s-input"
                />
              </div>

              <label className="s-label" htmlFor="s-dept">Department </label>
              <div className="s-field">
                <span className="s-field-icon"><FolderIcon /></span>
                <select
                  id="s-dept"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={loading || registrationSuccess}
                  className="s-select"
                >
                  <option value="" disabled>Select your department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="s-select-arrow"><ChevronDownIcon /></span>
              </div>

              <label className="s-label" htmlFor="s-pw">Password</label>
              <div className="s-field">
                <span className="s-field-icon"><LockIcon /></span>
                <input
                  id="s-pw"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  disabled={loading || registrationSuccess}
                  className="s-input"
                />
                <button
                  type="button"
                  className="s-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <button type="submit" disabled={loading || registrationSuccess} className="s-btn">
                {registrationSuccess ? (
                  <>
                    <span>Submitted</span>
                  </>
                ) : loading ? (
                  <>
                    <div className="s-spin" />
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="s-btn-arrow"><ArrowRightIcon /></span>
                  </>
                )}
              </button>

            </form>

            <div className="s-divider">
              <div className="s-div-line" />
              <span className="s-div-txt">Already have an account?</span>
              <div className="s-div-line" />
            </div>

            <div className="s-foot">
              <p><Link to="/login">← Sign In</Link></p>
            </div>

          </div>
        </div>

        {/* ══════════════ RIGHT PANEL — INFO ══════════════ */}
        <div className="s-right">
          <div className="s-glow-1" />
          <div className="s-glow-2" />

          <div className="s-right-inner">

            <div className="s-brand">
              <div className="s-brand-mark">
                <img
                  src={companyLogo}
                  alt="ssKatt"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML =
                      `<span style="color:#7C3AED;font-size:22px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif">sK</span>`;
                  }}
                />
              </div>
              <span className="s-brand-name">ssKatt</span>
            </div>

            <div className="s-center">
              <h2 className="s-headline">
                Join Your Team on<br />
                <span className="s-headline-accent">ssKatt</span>
              </h2>

              <p className="s-sub">
                Set up your profile to start receiving tasks, sharing files
                with your team, and tracking every assignment from request
                to completion.
              </p>

              <div className="s-process">
                {STEPS_INFO.map((p) => (
                  <div className="s-proc-item" key={p.n}>
                    <div className="s-proc-num">{p.n}</div>
                    <div>
                      <p className="s-proc-title">{p.title}</p>
                      <p className="s-proc-desc">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="s-right-foot">© {new Date().getFullYear()} ssKatt. All rights reserved.</p>

          </div>
        </div>

      </div>
    </>
  );
}