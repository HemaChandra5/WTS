import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import companyLogo from '../assets/logo.png';

// Admin palette — matches the updated dark/light SaaS dashboard styling.
const D = {
  glass: '#FFFFFF',
  border: 'rgba(15,23,42,0.08)',
  text: '#0F1729',
  textMuted: '#5B6478',
  textDim: '#94A0B8',
  accent: '#4F46E5',
  accentSoft: 'rgba(79,70,229,0.10)',
  danger: '#F43F5E',
  dangerSoft: 'rgba(244,63,94,0.10)',
  panel: '#FFFFFF',
  panelEdge: 'rgba(15,23,42,0.10)',
};

const L = {
  glass: '#FFFFFF',
  border: 'rgba(15,23,42,0.08)',
  text: '#0F1729',
  textMuted: '#5B6478',
  textDim: '#94A0B8',
  accent: '#4F46E5',
  accentSoft: 'rgba(79,70,229,0.10)',
  danger: '#F43F5E',
  dangerSoft: 'rgba(244,63,94,0.10)',
  panel: '#FFFFFF',
  panelEdge: 'rgba(15,23,42,0.10)',
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
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: isAdmin ? 1400 : 1280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 32px',
          height: 76,
        }}
      >
        <Link
          to={isAdmin ? '/admin' : '/employee'}
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}
        >
          <img src={companyLogo} alt="ssKatt logo" style={{ height: 52, width: 52, objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg,#3454D1,#6D4FE0)',
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
                maxWidth: 240,
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
              height: 40,
              width: 40,
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
