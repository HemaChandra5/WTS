// src/components/Layout.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/* ─── Obsidian-Slate dark tokens (admin) ────────────────────────────── */
const D = {
  bg:       '#000000',
  glass:    'rgba(20,20,22,0.55)',
  bdr0:     'rgba(255,255,255,0.05)',
  bdr1:     'rgba(255,255,255,0.09)',
  txt0:     '#f5f6fa',
  txt1:     '#9aa1b8',
  txt2:     '#5c6178',
  accent:   '#5b8def',
  accentL:  'rgba(91,141,239,0.14)',
  rose:     '#f0708a',
  roseL:    'rgba(240,112,138,0.12)',
};

/* ─── Ivory/gold light tokens (employee) ────────────────────────────── */
const L = {
  bg:       '#fffdf9',
  glass:    'rgba(255,253,249,0.82)',
  border:   'rgba(212,175,122,0.20)',
  txt0:     '#1c1917',
  txt1:     '#78716c',
  txt2:     '#a8a29e',
  accent:   '#a8761e',
  accentL:  'rgba(168,118,30,0.10)',
  emerald:  '#059669',
  emeraldL: 'rgba(16,185,129,0.10)',
  rose:     '#e11d48',
  roseL:    'rgba(225,29,72,0.08)',
};

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const T = isAdmin ? D : L;

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', background: T.bg }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'relative', zIndex: 30, isolation: 'isolate',
        background: T.glass,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: `1px solid ${isAdmin ? T.bdr1 : T.border}`,
        boxShadow: isAdmin ? 'none' : '0 1px 2px rgba(120,98,53,0.04), 0 8px 24px rgba(120,98,53,0.06)',
      }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Left — Logo + role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Logo mark */}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: isAdmin
                ? 'linear-gradient(135deg, #5b8def 0%, #a78bfa 100%)'
                : `linear-gradient(135deg, ${L.accent} 0%, #c9a25e 100%)`,
              boxShadow: isAdmin
                ? '0 4px 16px rgba(91,141,239,0.30), 0 1px 0 rgba(255,255,255,0.18) inset'
                : '0 4px 16px rgba(168,118,30,0.28), 0 1px 0 rgba(255,255,255,0.22) inset',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isAdmin
                ? <ShieldCheckIcon style={{ width: 20, height: 20, color: '#fff' }} />
                : <UserCircleIcon  style={{ width: 20, height: 20, color: '#fff' }} />
              }
            </div>

            <div>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: T.txt0, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Work Tracking System
              </h1>
              <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0', fontWeight: 600 }}>
                {isAdmin ? 'Admin Dashboard' : 'Employee Portal'}
              </p>
            </div>

            {/* Role badge */}
            <span style={{
              marginLeft: 4,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              borderRadius: 999, padding: '4px 12px',
              background: isAdmin ? T.accentL : T.emeraldL,
              border: `1px solid ${isAdmin ? 'rgba(91,141,239,0.28)' : 'rgba(16,185,129,0.25)'}`,
              fontSize: 11, fontWeight: 800,
              color: isAdmin ? T.accent : T.emerald,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: isAdmin ? T.accent : '#10b981',
              }} />
              {isAdmin ? 'Admin' : 'Employee'}
            </span>
          </div>

          {/* Right — User info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* User info */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0 }}>
                {user?.name}
              </p>
              <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0', fontWeight: 500 }}>
                {user?.email}{user?.department ? ` · ${user.department}` : ''}
              </p>
            </div>

            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: isAdmin
                ? 'linear-gradient(135deg, #5b8def, #a78bfa)'
                : 'linear-gradient(135deg, #c9a25e, #a8761e)',
              boxShadow: isAdmin ? '0 2px 10px rgba(91,141,239,0.30)' : '0 2px 10px rgba(168,118,30,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0, userSelect: 'none',
            }}>
              {initials}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: isAdmin ? T.bdr1 : T.border, margin: '0 2px' }} />

            {/* Logout */}
            <LogoutButton onClick={logout} isAdmin={isAdmin} T={T} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

const LogoutButton = ({ onClick, isAdmin, T }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        borderRadius: 11, padding: '8px 16px',
        background: hov ? T.roseL : 'transparent',
        border: `1px solid ${hov ? 'rgba(240,112,138,0.30)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.18s',
        fontSize: 13, fontWeight: 600,
        color: hov ? T.rose : T.txt1,
      }}
    >
      <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} />
      Logout
    </button>
  );
};

export default Layout;