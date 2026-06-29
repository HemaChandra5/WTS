import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import companyLogo from '../assets/logo.png';
 
// ─── Design Tokens — Premium Black (matches AdminDashboard) ───────────────────
const T = {
  bg0: '#08080A',
  bg1: '#0E0E12',
  bg2: '#13131A',
  bdr0: '#1A1A24',
  bdr1: '#222230',
  bdr2: '#2C2C3E',
  accent:      '#5B6EFF',
  accentHover: '#7080FF',
  accentBg:    '#10112A',
  txt0: '#EDEEF5',
  txt1: '#A8AEBE',
  txt2: '#5E6678',
  rose:    '#FF4D6A',
  roseBg:  '#1A060C',
  roseBdr: '#33101A',
  shadowCard: '0 0 0 1px #1A1A24, 0 2px 12px #00000060',
};
 
const LogoutIcon = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
 

 
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutHov, setLogoutHov] = useState(false);
 
  if (!user) return null;
 
  const isAdmin = user.role === 'admin';
  const designation = user.designation || user.title || user.position || user.department || '';
 
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
 
  return (
    <>
      <style>{`
        .sk-navbar {
          position: relative;
          z-index: 100;
          background: ${isAdmin ? '#111318' : '#F8FAFC'};
          border-bottom: 1px solid ${isAdmin ? '#232633' : '#E2E8F0'};
          box-shadow: ${isAdmin ? '0 1px 0 #232633' : '0 1px 0 rgba(15, 23, 42, 0.06)'};
        }
        .sk-navbar-inner {
          margin: 0 auto;
          max-width: ${isAdmin ? 1440 : 1280}px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 72px;
        }
 
        /* ── Logo ── */
        .sk-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .sk-logo-img {
          height: 36px;
          width: 36px;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid ${isAdmin ? T.bdr2 : '#D9E2F2'};
          background: ${isAdmin ? T.bg2 : '#FFFFFF'};
          padding: 3px;
        }
        .sk-logo-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .sk-logo-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: ${isAdmin ? T.txt0 : '#0F172A'};
          line-height: 1;
        }
        .sk-logo-name span {
          color: ${isAdmin ? '#DCE2F7' : '#4F46E5'};
        }
        .sk-logo-sub {
          font-size: 10px;
          font-weight: 500;
          color: ${isAdmin ? T.txt2 : '#64748B'};
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1;
        }
 
        /* ── Divider ── */
        .sk-divider {
          width: 1px;
          height: 28px;
          background: ${isAdmin ? T.bdr1 : '#E2E8F0'};
          flex-shrink: 0;
        }
 
        /* ── User Info ── */
        .sk-user-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          min-width: 0;
          max-width: min(260px, 38vw);
        }
        .sk-user-name {
          font-size: 14.5px;
          font-weight: 600;
          color: ${isAdmin ? T.txt0 : '#0F172A'};
          letter-spacing: -0.01em;
          width: 100%;
          line-height: 1.15;
          display: block;
          white-space: normal;
          overflow-wrap: anywhere;
          text-align: right;
        }
        .sk-user-role {
          font-size: 11.5px;
          font-weight: 500;
          color: ${isAdmin ? T.txt2 : '#64748B'};
          letter-spacing: 0.02em;
          line-height: 1.2;
          white-space: nowrap;
          margin-top: 2px;
        }
 
        /* ── Logout Button ── */
        .sk-logout {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          width: 38px;
          border-radius: 10px;
          border: 1px solid ${isAdmin ? T.bdr1 : '#E2E8F0'};
          background: ${isAdmin ? T.bg2 : '#FFFFFF'};
          color: ${isAdmin ? T.txt2 : '#64748B'};
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          outline: none;
        }
        .sk-logout:hover {
          background: ${isAdmin ? T.roseBg : '#EEF2FF'};
          border-color: ${isAdmin ? T.roseBdr : '#C7D2FE'};
          color: ${isAdmin ? T.rose : '#4F46E5'};
        }
 
        /* ── Right cluster ── */
        .sk-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
 
        @media (max-width: 640px) {
          .sk-navbar-inner { padding: 0 16px; }
          .sk-user-block { display: none; }
          .sk-logo-sub { display: none; }
        }
      `}</style>
 
      <header className="sk-navbar">
        <div className="sk-navbar-inner">
 
          {/* ── Logo ── */}
          <Link to={isAdmin ? '/admin' : '/employee'} className="sk-logo">
            <img src={companyLogo} alt="ssKatt" className="sk-logo-img" />
            <div className="sk-logo-text">
              <div className="sk-logo-name">
                ss<span>Katt</span>
              </div>
              <div className="sk-logo-sub">Work Tracking System</div>
            </div>
          </Link>
 
          {/* ── Right side ── */}
          <div className="sk-right">
 
            <div className="sk-divider" />
 
            {/* User info */}
            <div className="sk-user-block">
              <div className="sk-user-name">{user.name}</div>
              <div className="sk-user-role">
                {isAdmin ? 'Administrator' : designation || 'Employee'}
              </div>
            </div>
 
            {/* Logout */}
            <button
              type="button"
              className="sk-logout"
              onClick={handleLogout}
              title="Sign out"
              onMouseEnter={() => setLogoutHov(true)}
              onMouseLeave={() => setLogoutHov(false)}
            >
              <LogoutIcon />
            </button>
 
          </div>
        </div>
      </header>
    </>
  );
};
 
export default Navbar;
 