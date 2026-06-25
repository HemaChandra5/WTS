// src/components/Layout.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/* ─── Executive Light tokens (admin) — identical to AdminDashboard.jsx ──── */
const D = {
  bg0: '#FAFAFA',
  glass: '#FFFFFF',
  glassBorder: 'rgba(15,23,42,0.08)',
  bdr1: 'rgba(15,23,42,0.10)',
  txt0: '#0F1729',
  txt1: '#5B6478',
  txt2: '#94A0B8',
  accent: '#3454D1',
  accentB: '#2A41A8',
  accentL: 'rgba(52,84,209,0.10)',
  emerald: '#0E9F6E',
  emeraldD: 'rgba(14,159,110,0.10)',
  rose: '#C23552',
  roseD: 'rgba(194,53,82,0.08)',
};

/* ─── Light SaaS tokens (employee) — identical to EmployeeDashboard.jsx ── */
const L = {
  bg0: '#F7F9FC',
  glass: '#FFFFFF',
  glassBorder: 'rgba(15,23,42,0.10)',
  bdr1: 'rgba(15,23,42,0.10)',
  txt0: '#0F172A',
  txt1: '#475569',
  txt2: '#64748B',
  accent: '#4F46E5',
  accentB: '#4338CA',
  accentL: 'rgba(79,70,229,0.12)',
  emerald: '#10B981',
  emeraldD: 'rgba(16,185,129,0.12)',
  rose: '#F43F5E',
  roseD: 'rgba(244,63,94,0.12)',
};

const FONT = '"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const T = isAdmin ? D : L;

  const initials = (user?.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, background: T.bg0 }}>
      {/* ── Navbar ── */}
      <nav
        style={{
          position: 'sticky', top: 0, zIndex: 30, isolation: 'isolate',
          background: T.glass,
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          borderBottom: `1px solid ${T.glassBorder}`,
          boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 8px 24px rgba(15,23,42,0.04)',
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left — Logo + role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentB} 100%)`,
              boxShadow: `0 4px 14px ${T.accentL}, 0 1px 0 rgba(255,255,255,0.25) inset`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isAdmin
                ? <ShieldCheckIcon style={{ width: 20, height: 20, color: '#fff' }} />
                : <UserCircleIcon style={{ width: 20, height: 20, color: '#fff' }} />}
            </div>

            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
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
              background: isAdmin ? T.accentL : T.emeraldD,
              border: `1px solid ${isAdmin ? 'rgba(52,84,209,0.22)' : 'rgba(16,185,129,0.24)'}`,
              fontSize: 11, fontWeight: 700,
              color: isAdmin ? T.accent : T.emerald,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isAdmin ? T.accent : T.emerald }} />
              {isAdmin ? 'Admin' : 'Employee'}
            </span>
          </div>

          {/* Right — User info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0', fontWeight: 500 }}>
                {user?.email}{user?.department ? ` · ${user.department}` : ''}
              </p>
            </div>

            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentB})`,
              boxShadow: `0 2px 10px ${T.accentL}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0, userSelect: 'none',
            }}>
              {initials}
            </div>

            <div style={{ width: 1, height: 28, background: T.bdr1, margin: '0 2px' }} />

            <LogoutButton onClick={logout} T={T} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
};

const LogoutButton = ({ onClick, T }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        borderRadius: 10, padding: '8px 16px',
        background: hov ? T.roseD : 'transparent',
        border: `1px solid ${hov ? 'rgba(244,63,94,0.28)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.18s',
        fontSize: 13, fontWeight: 600,
        color: hov ? T.rose : T.txt1,
        fontFamily: 'inherit',
      }}
    >
      <ArrowRightOnRectangleIcon style={{ width: 16, height: 16 }} />
      Logout
    </button>
  );
};

export default Layout;