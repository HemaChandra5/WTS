import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import companyLogo from '../assets/logo.png';

/* ─── Icons ──────────────────────────────────────────────────────────────── */

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
const TaskIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const FolderIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

/* ─── Content ─────────────────────────────────────────────────────────────── */

const FEATURES = [
  { Icon: TaskIcon,   title: 'Assign & Track Tasks',   desc: 'Create tasks, set priorities, and monitor progress live' },
  { Icon: FolderIcon, title: 'Share & Review Files',    desc: 'Upload work, request approvals, and keep an audit trail' },
  { Icon: ShieldIcon, title: 'Role-Based Access',       desc: 'Admin, manager, and employee permission tiers' },
];

const STATS = [
  { value: '98%', label: 'On-Time Delivery' },
  { value: '5×',  label: 'Faster Reviews' },
  { value: '24/7', label: 'Team Visibility' },
];

/* ─── Main component ─────────────────────────────────────────────────────── */

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; }

        @keyframes l-page-in {
          from { opacity: 0; transform: translateY(14px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes l-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .l-root {
          height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #0A0712;
          animation: l-page-in 0.55s cubic-bezier(0.22,1,0.36,1);
        }

        /* ══════════════ LEFT PANEL — BRAND / GRID BG ══════════════ */
        .l-left {
          display: none;
          position: relative;
          width: 50%;
          flex-shrink: 0;
          flex-direction: column;
          overflow: hidden;
          background:
            radial-gradient(circle at 25% 18%, rgba(168,85,247,0.10), transparent 45%),
            linear-gradient(165deg, #2A1240 0%, #200B33 45%, #170821 100%);
        }
        @media (min-width: 1024px) { .l-left { display: flex; } }

        .l-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(ellipse at 30% 30%, rgba(0,0,0,0.9), transparent 70%);
          pointer-events: none;
        }
        .l-left::after {
          content: '';
          position: absolute;
          right: 0; top: 6%; bottom: 6%; width: 1px;
          background: linear-gradient(180deg, transparent, rgba(219,39,119,0.35) 30%, rgba(168,85,247,0.35) 70%, transparent);
        }

        .l-glow-1 {
          position: absolute; top: -16%; left: -8%;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(219,39,119,0.22) 0%, transparent 70%);
          filter: blur(20px); pointer-events: none;
          animation: l-drift 11s ease-in-out infinite alternate;
        }
        .l-glow-2 {
          position: absolute; bottom: -18%; right: -10%;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%);
          filter: blur(22px); pointer-events: none;
          animation: l-drift 11s ease-in-out infinite alternate-reverse;
        }
        @keyframes l-drift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(14px, 16px) scale(1.05); }
        }

        .l-left-inner {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          height: 100%;
          padding: clamp(20px, 4vh, 40px) clamp(32px, 4.5vw, 54px);
        }

        /* Brand — big */
        .l-brand { display: flex; align-items: center; gap: 16px; flex-shrink: 0; animation: l-rise 0.6s ease both; }
        .l-brand-mark {
          width: 66px; height: 66px; border-radius: 16px;
          background: #fff;
          box-shadow: 0 12px 30px rgba(219,39,119,0.28);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
        }
        .l-brand-mark img { width: 42px; height: 42px; object-fit: contain; }
        .l-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px; font-weight: 700;
          color: #F4EEFB; letter-spacing: -0.015em;
        }

        .l-center { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; padding: 14px 0; }

        .l-headline {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(26px, 3.6vw, 42px); font-weight: 700;
          line-height: 1.1; letter-spacing: -0.02em;
          color: #F7F2FC; margin-bottom: 14px;
          animation: l-rise 0.6s ease 0.05s both;
        }
        .l-headline-accent {
          background: linear-gradient(100deg, #C77DFF, #F472B6);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .l-sub {
          font-size: 13.5px; font-weight: 400;
          color: #B6A8CC; line-height: 1.65;
          max-width: 420px; margin-bottom: 24px;
          animation: l-rise 0.6s ease 0.1s both;
        }

        .l-stats { display: flex; gap: 0; margin-bottom: 26px; animation: l-rise 0.6s ease 0.15s both; }
        .l-stat { flex: 1; }
        .l-stat:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.10); padding-right: 16px; }
        .l-stat:not(:first-child) { padding-left: 16px; }
        .l-stat-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px; font-weight: 700; color: #F472B6; letter-spacing: -0.01em; margin-bottom: 3px;
        }
        .l-stat-lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase;
          color: #8A7AA0;
        }

        .l-features { display: flex; flex-direction: column; gap: 10px; max-width: 460px; animation: l-rise 0.6s ease 0.2s both; }
        .l-feat {
          display: flex; align-items: flex-start; gap: 13px;
          padding: 12px 16px; border-radius: 13px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .l-feat-icon {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(219,39,119,0.35));
          color: #F0D6FA;
        }
        .l-feat-title { font-size: 13px; font-weight: 600; color: #F2EBFA; margin-bottom: 1px; }
        .l-feat-desc { font-size: 11.5px; font-weight: 400; color: #9685AE; line-height: 1.4; }

        .l-left-foot {
          flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #6E5E84;
        }

        /* ══════════════ RIGHT PANEL — FORM ══════════════ */
        .l-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0A0712;
          position: relative;
          height: 100%;
          padding: clamp(16px, 4vh, 36px) 24px;
          overflow: hidden;
        }

        .l-mobile-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; animation: l-rise 0.55s ease both; }
        @media (min-width: 1024px) { .l-mobile-brand { display: none; } }
        .l-mobile-mark {
          width: 56px; height: 56px; border-radius: 14px;
          background: #fff;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .l-mobile-mark img { width: 36px; height: 36px; object-fit: contain; }
        .l-mobile-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px; font-weight: 700; color: #F2EBFA; letter-spacing: -0.01em;
        }

        .l-form-wrap { position: relative; z-index: 1; width: 100%; max-width: 420px; animation: l-rise 0.6s ease 0.1s both; }

        .l-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #E879B9;
          margin-bottom: 10px;
        }

        .l-hdr { margin-bottom: 18px; }
        .l-hdr-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 26px; font-weight: 700; letter-spacing: -0.02em;
          line-height: 1.2; color: #F7F2FC; margin-bottom: 6px;
        }
        .l-hdr-sub { font-size: 13px; font-weight: 400; color: #9685AE; line-height: 1.55; }

        .l-error {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(244,63,94,0.10); border: 1px solid rgba(244,63,94,0.28);
          border-radius: 11px; padding: 10px 12px; margin-bottom: 14px;
        }
        .l-error-icon { color: #FB7185; flex-shrink: 0; margin-top: 1px; }
        .l-error-text { font-size: 12px; color: #FCA5B1; line-height: 1.45; }

        .l-label {
          display: block; font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase;
          color: #8A7AA0; margin-bottom: 7px;
        }

        .l-field { position: relative; margin-bottom: 14px; }
        .l-field-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #6E5E84; pointer-events: none; display: flex;
        }
        .l-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 12px 14px 12px 38px;
          font-size: 13.5px; color: #F2EBFA;
          outline: none; transition: border-color 0.18s, background 0.18s;
        }
        .l-input::placeholder { color: #5E4F75; }
        .l-input:focus {
          border-color: rgba(219,39,119,0.55);
          background: rgba(255,255,255,0.06);
        }
        .l-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #6E5E84;
          display: flex; padding: 2px; transition: color 0.18s;
        }
        .l-eye:hover { color: #B6A8CC; }

        .l-forgot-row { display: flex; justify-content: flex-end; margin-bottom: 16px; margin-top: -4px; }
        .l-forgot { font-size: 12px; font-weight: 500; color: #C77DFF; text-decoration: none; transition: color 0.18s; }
        .l-forgot:hover { color: #F472B6; }

        .l-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(100deg, #7C3AED, #DB2777);
          border: none; border-radius: 12px;
          padding: 13px 20px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px; font-weight: 600; color: #fff;
          letter-spacing: -0.005em;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(124,58,237,0.32), 0 4px 10px rgba(219,39,119,0.22);
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.25s;
        }
        .l-btn:hover { opacity: 0.92; box-shadow: 0 14px 30px rgba(124,58,237,0.4), 0 6px 14px rgba(219,39,119,0.28); }
        .l-btn:active { transform: scale(0.99); }
        .l-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .l-btn-arrow { width: 16px; height: 16px; transition: transform 0.2s; }
        .l-btn:hover .l-btn-arrow { transform: translateX(2px); }

        .l-spin {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
          animation: l-spin-rot 0.7s linear infinite;
        }
        @keyframes l-spin-rot { to { transform: rotate(360deg); } }

        .l-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 14px; }
        .l-div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .l-div-txt { font-size: 11px; color: #6E5E84; white-space: nowrap; }

        .l-foot { text-align: center; }
        .l-foot p { font-size: 12.5px; font-weight: 400; color: #9685AE; }
        .l-foot a { font-weight: 600; color: #C77DFF; text-decoration: none; transition: color 0.18s; }
        .l-foot a:hover { color: #F472B6; }

        @media (max-height: 680px) {
          .l-features { display: none; }
        }
      `}</style>

      <div className="l-root">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="l-left">
          <div className="l-glow-1" />
          <div className="l-glow-2" />

          <div className="l-left-inner">

            <div className="l-brand">
              <div className="l-brand-mark">
                <img
                  src={companyLogo}
                  alt="ssKatt"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML =
                      `<span style="color:#7C3AED;font-size:22px;font-weight:700;font-family:'Space Grotesk',sans-serif">sK</span>`;
                  }}
                />
              </div>
              <span className="l-brand-name">ssKatt</span>
            </div>

            <div className="l-center">
              <h2 className="l-headline">
                Assign Work.<br />
                <span className="l-headline-accent">Track Progress.</span><br />
                Deliver Together.
              </h2>

              <p className="l-sub">
                The shared workspace where admins assign tasks, employees
                deliver files, and everyone stays in sync — in real time.
              </p>

              <div className="l-stats">
                {STATS.map((s) => (
                  <div className="l-stat" key={s.label}>
                    <p className="l-stat-val">{s.value}</p>
                    <p className="l-stat-lbl">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="l-features">
                {FEATURES.map(({ Icon, title, desc }) => (
                  <div className="l-feat" key={title}>
                    <div className="l-feat-icon">
                      <Icon />
                    </div>
                    <div>
                      <p className="l-feat-title">{title}</p>
                      <p className="l-feat-desc">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="l-left-foot">© {new Date().getFullYear()} ssKatt. All rights reserved.</p>

          </div>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="l-right">

          <div className="l-form-wrap">

            <div className="l-mobile-brand">
              <div className="l-mobile-mark">
                <img
                  src={companyLogo}
                  alt="ssKatt"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML =
                      `<span style="color:#7C3AED;font-size:18px;font-weight:700;font-family:'Space Grotesk',sans-serif">sK</span>`;
                  }}
                />
              </div>
              <span className="l-mobile-name">ssKatt</span>
            </div>

            <p className="l-eyebrow">Secure Access Portal</p>
            <div className="l-hdr">
              <h1 className="l-hdr-title">Welcome Back</h1>
              <p className="l-hdr-sub">Sign in to your ssKatt workspace</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="l-error">
                  <span className="l-error-icon"><AlertIcon /></span>
                  <p className="l-error-text">{error}</p>
                </div>
              )}

              <label className="l-label" htmlFor="l-email">Email</label>
              <div className="l-field">
                <span className="l-field-icon"><MailIcon /></span>
                <input
                  id="l-email"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@sskatt.com"
                  autoComplete="email"
                  required
                  className="l-input"
                />
              </div>

              <label className="l-label" htmlFor="l-password">Password</label>
              <div className="l-field">
                <span className="l-field-icon"><LockIcon /></span>
                <input
                  id="l-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="l-input"
                />
                <button
                  type="button"
                  className="l-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="l-forgot-row">
                <Link to="/forgot-password" className="l-forgot">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading} className="l-btn">
                {loading ? (
                  <>
                    <div className="l-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="l-btn-arrow" />
                  </>
                )}
              </button>

            </form>

            <div className="l-divider">
              <div className="l-div-line" />
              <span className="l-div-txt">New to ssKatt?</span>
              <div className="l-div-line" />
            </div>

            <div className="l-foot">
              <p>Don't have an account? <Link to="/signup">Create Account →</Link></p>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default Login;