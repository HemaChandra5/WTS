// src/components/Layout.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/* Admin tokens */
const D = {
  bg0: '#F4F6FB',
  glass: '#FFFFFF',
  glassBorder: 'rgba(15,23,42,0.08)',
  bdr1: 'rgba(15,23,42,0.09)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  accent: '#3454D1',
  accentB: '#2A41A8',
  accentL: 'rgba(52,84,209,0.09)',
  emerald: '#0E9F6E',
  emeraldD: 'rgba(14,159,110,0.09)',
  rose: '#C23552',
  roseD: 'rgba(194,53,82,0.08)',
};

/* Employee tokens */
const L = {
  bg0: '#F4F6FB',
  glass: '#FFFFFF',
  glassBorder: 'rgba(15,23,42,0.09)',
  bdr1: 'rgba(15,23,42,0.09)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  accent: '#4F46E5',
  accentB: '#4338CA',
  accentL: 'rgba(79,70,229,0.10)',
  emerald: '#10B981',
  emeraldD: 'rgba(16,185,129,0.10)',
  rose: '#DC2626',
  roseD: 'rgba(220,38,38,0.08)',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const T = isAdmin ? D : L;

  const initials = (user?.name || 'U')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, background: T.bg0 }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: T.glass,
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: `1px solid ${T.glassBorder}`,
        boxShadow: '0 1px 0 rgba(15,23,42,0.06)',
      }}>
        <div style={{
          maxWidth: 1440, margin: '0 auto', padding: '0 32px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo */}
            <div style={{
              position: 'relative', width: 38, height: 38, borderRadius: 11,
              background: `linear-gradient(145deg, ${T.accent} 0%, ${T.accentB} 100%)`,
              boxShadow: `0 4px 12px ${T.accentL}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -12, right: -12, width: 36, height: 36,
                borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
              }} />
              {isAdmin
                ? <ShieldCheckIcon style={{ width: 18, height: 18, color: '#fff', position: 'relative' }} />
                : <UserCircleIcon style={{ width: 18, height: 18, color: '#fff', position: 'relative' }} />
              }
            </div>

            <div>
              <h1 style={{ fontSize: 14.5, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Work Tracking
              </h1>
              <p style={{ fontSize: 10.5, color: T.txt2, margin: '1px 0 0', fontWeight: 600, letterSpacing: '0.02em' }}>
                {isAdmin ? 'Admin Console' : 'Employee Portal'}
              </p>
            </div>

            {/* Role pill */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              borderRadius: 20, padding: '4px 11px',
              background: isAdmin ? T.accentL : T.emeraldD,
              border: `1px solid ${isAdmin ? 'rgba(52,84,209,0.22)' : 'rgba(16,185,129,0.24)'}`,
              fontSize: 10.5, fontWeight: 700,
              color: isAdmin ? T.accent : T.emerald,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: isAdmin ? T.accent : T.emerald,
              }} />
              {isAdmin ? 'Admin' : 'Employee'}
            </span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.01em' }}>{user?.name}</p>
              <p style={{ fontSize: 10.5, color: T.txt2, margin: '2px 0 0', fontWeight: 500 }}>
                {user?.email}{user?.department ? ` · ${user.department}` : ''}
              </p>
            </div>

            {/* Avatar */}
            <div style={{
              position: 'relative', width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(145deg, ${T.accent}, ${T.accentB})`,
              boxShadow: `0 2px 8px ${T.accentL}, 0 0 0 2px ${T.glass}, 0 0 0 3.5px ${T.glassBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12.5, fontWeight: 700, color: '#fff', flexShrink: 0, userSelect: 'none',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -12, right: -12, width: 30, height: 30,
                borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
              }} />
              <span style={{ position: 'relative' }}>{initials}</span>
            </div>

            <div style={{ width: 1, height: 24, background: T.bdr1 }} />

            <LogoutButton onClick={logout} T={T} />
          </div>
        </div>
      </nav>

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
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: 10, padding: '7px 14px',
        background: hov ? T.roseD : 'transparent',
        border: `1px solid ${hov ? 'rgba(220,38,38,0.26)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.18s',
        fontSize: 12.5, fontWeight: 600,
        color: hov ? T.rose : T.txt1,
        fontFamily: 'inherit',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hov ? '0 4px 12px rgba(220,38,38,0.14)' : 'none',
      }}
    >
      <ArrowRightOnRectangleIcon style={{ width: 15, height: 15 }} />
      Logout
    </button>
  );
};

export default Layout;