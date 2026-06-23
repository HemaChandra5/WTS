import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import companyLogo from '../assets/logo.png';

const D = {
  glass: 'rgba(20,20,22,0.62)',
  border: 'rgba(255,255,255,0.09)',
  text: '#f5f6fa',
  textMuted: '#9aa1b8',
  textDim: '#5c6178',
  accent: '#5b8def',
  accentSoft: 'rgba(91,141,239,0.14)',
  danger: '#f0708a',
  dangerSoft: 'rgba(240,112,138,0.12)',
  panel: '#121216',
  panelEdge: 'rgba(255,255,255,0.11)',
};

const L = {
  bg: '#fffdf9',
  glass: 'rgba(255,253,249,0.78)',
  border: 'rgba(212,175,122,0.25)',
  text: '#1c1917',
  textMuted: '#78716c',
  textDim: '#a8a29e',
  accent: '#a8761e',
  accentSoft: 'rgba(168,118,30,0.10)',
  danger: '#e11d48',
  dangerSoft: '#fff1f2',
  panel: '#fffefb',
  panelEdge: 'rgba(212,175,122,0.22)',
};


const LogoutIcon = (p) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
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
  const t = isAdmin ? D : L;
  const designation = user.designation || user.title || user.position || user.department || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 30,
        isolation: 'isolate',
        borderBottom: `1px solid ${t.border}`,
        background: t.glass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isAdmin ? 'none' : '0 1px 2px rgba(120,98,53,0.04), 0 8px 24px rgba(120,98,53,0.06)',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: isAdmin ? 1400 : 1280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isAdmin ? '14px 32px' : '0 36px',
          height: isAdmin ? 'auto' : 72,
        }}
      >
        <Link
          to={isAdmin ? '/admin' : '/employee'}
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}
        >
          <img src={companyLogo} alt="ssKatt logo" style={{ height: isAdmin ? 52 : 44, width: isAdmin ? 52 : 44, objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: isAdmin ? '1.75rem' : '1.5rem',
                fontWeight: isAdmin ? 700 : 800,
                letterSpacing: '-0.02em',
                background: isAdmin
                  ? 'linear-gradient(90deg,#5b8def,#67d6ff)'
                  : 'linear-gradient(90deg,#a8761e,#c9a25e)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              ssKatt
            </span>
            <span style={{ fontSize: isAdmin ? 12.5 : 11.5, fontWeight: 500, color: t.textDim, marginTop: 2 }}>
              Work Tracking System
            </span>
          </div>
        </Link>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 1, height: isAdmin ? 26 : 30, background: t.border, flexShrink: 0, margin: '0 2px' }} />

          <div className="navbar-user-info" style={{ textAlign: 'right' }}>
            <div
              style={{
                maxWidth: isAdmin ? 240 : 220,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                fontSize: 14,
                fontWeight: isAdmin ? 600 : 700,
                color: t.text,
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: t.textDim,
                marginTop: 2,
                textTransform: designation ? 'capitalize' : 'none',
              }}
            >
              {isAdmin ? 'Admin' : designation || 'Employee'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            onMouseEnter={() => setLogoutHov(true)}
            onMouseLeave={() => setLogoutHov(false)}
            style={{
              display: 'inline-flex',
              height: isAdmin ? 38 : 40,
              width: isAdmin ? 38 : 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: logoutHov ? t.dangerSoft : 'transparent',
              color: logoutHov ? t.danger : t.textMuted,
              outline: 'none',
            }}
          >
            <LogoutIcon />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .navbar-user-info { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
