import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

import companyLogo from '../assets/logo.png';

/* ─── Dark design tokens (admin) — mirrors AdminDashboard.jsx's `T` ───── */
const D = {
  bg1:      '#000000',
  glass:    'rgba(20,20,22,0.55)',
  glassHov: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.09)',
  bdr0:     'rgba(255,255,255,0.05)',
  bdr1:     'rgba(255,255,255,0.09)',
  bdr2:     'rgba(255,255,255,0.15)',
  txt0:     '#f5f6fa',
  txt1:     '#9aa1b8',
  txt2:     '#5c6178',
  accent:   '#5b8def',
  accentL:  'rgba(91,141,239,0.14)',
  emerald:  '#34d399',
  amber:    '#f0b14d',
  rose:     '#f0708a',
  roseD:    'rgba(240,112,138,0.12)',
};

/* ─── Light design tokens (employee) — rich-white luxury, mirrors
   EmployeeDashboard.jsx's ivory/gold glass surfaces ──────────────────── */
const L = {
  bg:      '#fffdf9',
  glass:   'rgba(255,253,249,0.72)',
  border:  'rgba(212,175,122,0.20)',
  borderHov: 'rgba(212,175,122,0.38)',
  shadow:  '0 1px 2px rgba(120,98,53,0.04), 0 8px 24px rgba(120,98,53,0.06)',
  txt0:    '#1c1917',
  txt1:    '#78716c',
  txt2:    '#a8a29e',
  accent:  '#a8761e',
  accentL: 'rgba(168,118,30,0.10)',
  rose:    '#e11d48',
  roseL:   '#fff1f2',
};

/* ─── Shared timeAgo ─────────────────────────────────────────────────── */
const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ─── Inline SVG icons (professional / SaaS-style line icons) ──────────── */
const BellIcon = (p) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const BellSolidIcon = (p) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const CloseIcon = (p) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
/* Professional "sign out" glyph — door + arrow, slightly more refined weight */
const LogoutIcon = (p) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ─── Admin Notification Panel (dark) ───────────────────────────────── */
const AdminNotificationPanel = ({ notifications, onClear, onClearAll }) => (
  <div style={{
    position: 'absolute', right: 0, top: 'calc(100% + 14px)', zIndex: 200, width: 320,
    borderRadius: 16, border: `1px solid ${D.glassBorder}`, background: '#161618',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'visible',
  }}>
    {/* Caret pointing back to the bell */}
    <div style={{
      position: 'absolute', top: -7, right: 12, width: 14, height: 14,
      background: '#161618', borderLeft: `1px solid ${D.glassBorder}`, borderTop: `1px solid ${D.glassBorder}`,
      transform: 'rotate(45deg)', borderRadius: '3px 0 0 0',
    }} />
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${D.bdr1}`, padding: '14px 16px' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: D.txt0, margin: 0 }}>Notifications</p>
      {notifications.length > 0 && (
        <button onClick={onClearAll} style={{ fontSize: 12, color: D.txt0, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
          Clear all
        </button>
      )}
    </div>
    <div style={{ maxHeight: 340, overflowY: 'auto' }}>
      {notifications.length === 0 ? (
        <div style={{ padding: '44px 0', textAlign: 'center' }}>
          <BellIcon style={{ width: 30, height: 30, color: D.txt2, margin: '0 auto', display: 'block', opacity: 0.4 }} />
          <p style={{ marginTop: 10, fontSize: 13, color: D.txt2 }}>No notifications</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: `1px solid ${D.bdr0}`, padding: '12px 16px', transition: 'background 0.12s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              marginTop: 5, width: 7, height: 7, flexShrink: 0, borderRadius: '50%',
              background: n.type === 'file' ? D.accent : n.type === 'employee' ? D.amber : D.emerald,
            }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.txt0, margin: 0 }}>{n.title}</p>
              <p style={{ fontSize: 12, color: D.txt1, margin: '3px 0 0' }}>{n.message}</p>
              <p style={{ fontSize: 11, color: D.txt2, margin: '3px 0 0' }}>{timeAgo(n.time)}</p>
            </div>
            <button onClick={() => onClear(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.txt2, display: 'flex', padding: 0, flexShrink: 0 }}>
              <CloseIcon />
            </button>
          </div>
        ))
      )}
    </div>
    </div>
  </div>
);

/* ─── Employee Notification Panel (light) ───────────────────────────── */
const EmployeeNotificationPanel = ({ notifications, onClear, onClearAll }) => (
  <div style={{
    position: 'absolute', right: 0, top: 'calc(100% + 14px)', zIndex: 200, width: 340,
    borderRadius: 18, border: `1px solid ${L.border}`, background: '#fffefb',
    boxShadow: '0 24px 60px rgba(120,98,53,0.22)', overflow: 'visible',
  }}>
    {/* Caret pointing back to the bell */}
    <div style={{
      position: 'absolute', top: -7, right: 13, width: 14, height: 14,
      background: '#fffefb', borderLeft: `1px solid ${L.border}`, borderTop: `1px solid ${L.border}`,
      transform: 'rotate(45deg)', borderRadius: '3px 0 0 0',
    }} />
    <div style={{ borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${L.border}`, padding: '14px 18px' }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: L.txt0, margin: 0 }}>Notifications</p>
      {notifications.length > 0 && (
        <button onClick={onClearAll} style={{ fontSize: 13, color: L.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
          Clear all
        </button>
      )}
    </div>
    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
      {notifications.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <BellIcon style={{ width: 36, height: 36, color: L.txt2, margin: '0 auto', display: 'block' }} />
          <p style={{ marginTop: 10, fontSize: 14, color: L.txt1, fontWeight: 500 }}>No notifications yet</p>
          <p style={{ fontSize: 12, color: L.txt2, margin: '4px 0 0' }}>Task & file updates will appear here</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: `1px solid rgba(212,175,122,0.12)`, padding: '13px 18px', transition: 'background 0.1s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,122,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              marginTop: 6, width: 8, height: 8, flexShrink: 0, borderRadius: '50%',
              background: n.type === 'task' ? '#d97706' : n.type === 'approval' ? '#059669' : n.type === 'rejection' ? '#e11d48' : L.accent,
            }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: L.txt0, margin: 0 }}>{n.title}</p>
              <p style={{ fontSize: 13, color: L.txt1, margin: '3px 0 0' }}>{n.message}</p>
              <p style={{ fontSize: 11, color: L.txt2, margin: '4px 0 0' }}>{timeAgo(n.time)}</p>
            </div>
            <button onClick={() => onClear(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: L.txt2, display: 'flex', padding: 0, flexShrink: 0, transition: 'color 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.color = L.txt0}
              onMouseLeave={e => e.currentTarget.style.color = L.txt2}>
              <CloseIcon />
            </button>
          </div>
        ))
      )}
    </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
   MAIN NAVBAR COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
const Navbar = () => {
  const { user, logout }                                      = useAuth();
const {
  notifications,
  clearNotification,
  clearAllNotifications,
  fetchNotifications,
} = useNotifications();

const navigate = useNavigate();
useEffect(() => {
  fetchNotifications();
}, []);

  const [showNotifications,      setShowNotifications]      = useState(false);
  const [empNotifications,       setEmpNotifications]       = useState([]);
  const [logoutHov,              setLogoutHov]              = useState(false);
  const [bellHov,                 setBellHov]                = useState(false);
  const notifRef = useRef(null);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  /* Designation shown under the name for employees — falls back through
     common field names so it works regardless of how the backend labels it. */
  const designation = user.designation || user.title || user.position || user.department || '';

  /* ── Employee notifications: synced from EmployeeDashboard via window ── */
  useEffect(() => {
    if (isAdmin) return;

    // Initial read
    if (window.__empNotifications) setEmpNotifications(window.__empNotifications);

    const handler = (e) => {
      if (window.__empNotifications) setEmpNotifications([...window.__empNotifications]);
    };
    window.addEventListener('emp-notif-update', handler);
    return () => window.removeEventListener('emp-notif-update', handler);
  }, [isAdmin]);

  const empClearNotif    = useCallback((id) => { window.__empClearNotif?.(id);    if (window.__empNotifications) setEmpNotifications([...window.__empNotifications]); }, []);
  const empClearAllNotif = useCallback(()  => { window.__empClearAllNotifs?.();  setEmpNotifications([]); }, []);

  /* ── Close panel on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ── Derived notification data ── */
  const adminNotifCount = notifications.length;
  const empNotifCount   = empNotifications.length;
  const hasNotifs       = isAdmin ? adminNotifCount > 0 : empNotifCount > 0;
  const notifCount      = isAdmin ? adminNotifCount     : empNotifCount;

  /* ════════════════════════════════════════════════════════ ADMIN ═════ */
  if (isAdmin) {
    return (
      <header style={{
        position: 'relative', zIndex: 30,
        borderBottom: `1px solid ${D.glassBorder}`,
        background: D.glass, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        isolation: 'isolate',
      }}>
        <div style={{ margin: '0 auto', maxWidth: 1400, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px' }}>

          {/* Logo */}
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src={companyLogo} alt="ssKatt logo" style={{ height: 52, width: 52, objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(90deg,#5b8def,#a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                ssKatt
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: D.txt2, marginTop: 2 }}>Work Tracking System</span>
            </div>
          </Link>

          <div style={{ flex: 1 }} />

          {/* Right section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>

            {/* Notification bell — borderless */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(p => !p)}
                onMouseEnter={() => setBellHov(true)}
                onMouseLeave={() => setBellHov(false)}
                type="button"
                aria-label="Notifications"
                style={{
                  position: 'relative', display: 'flex', height: 38, width: 38,
                  alignItems: 'center', justifyContent: 'center', borderRadius: 11,
                  border: 'none', background: bellHov || showNotifications ? D.glassHov : 'transparent',
                  color: D.txt1, cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                {hasNotifs
                  ? <BellSolidIcon style={{ color: D.accent }} />
                  : <BellIcon />
                }
                {hasNotifs && (
                  <span style={{
                    position: 'absolute', top: -3, right: -3, display: 'flex', height: 16, width: 16,
                    alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: D.rose,
                    fontSize: 9.5, fontWeight: 700, color: '#fff', border: `2px solid #000`,
                  }}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <AdminNotificationPanel
                  notifications={notifications}
                  onClear={clearNotification}
                  onClearAll={clearAllNotifications}
                />
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 26, background: D.bdr1, flexShrink: 0, margin: '0 2px' }} />

            {/* User info — just name + "Admin" */}
            <div className="navbar-user-info" style={{ textAlign: 'right' }}>
              <div style={{ maxWidth: 240, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 14, fontWeight: 600, color: D.txt0 }}>
                {user.name}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: D.txt2, marginTop: 2 }}>
                Admin
              </div>
            </div>

            {/* Logout — borderless */}
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              onMouseEnter={() => setLogoutHov(true)}
              onMouseLeave={() => setLogoutHov(false)}
              style={{
                display: 'inline-flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center',
                borderRadius: 11, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: logoutHov ? D.roseD : 'transparent',
                color: logoutHov ? D.rose : D.txt1,
              }}
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        <style>{`
          @media(max-width:767px){.navbar-user-info{display:none!important}}
        `}</style>
      </header>
    );
  }

  /* ════════════════════════════════════════════════════════ EMPLOYEE ══ */
  return (
    <header style={{
      borderBottom: `1px solid ${L.border}`,
      background: L.glass,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      boxShadow: L.shadow,
      position: 'relative',
      zIndex: 30,
      isolation: 'isolate',
    }}>
      <div style={{ margin: '0 auto', maxWidth: 1280, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', height: 72 }}>

        {/* Logo */}
        <Link to="/employee" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
          <img src={companyLogo} alt="ssKatt logo" style={{ height: 44, width: 44, objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{
              fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg,#a8761e,#c9a25e)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              ssKatt
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: L.txt2, letterSpacing: '0.01em' }}>Work Tracking System</span>
          </div>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>

          {/* Notification bell — borderless */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(p => !p)}
              onMouseEnter={() => setBellHov(true)}
              onMouseLeave={() => setBellHov(false)}
              type="button"
              aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
              style={{
                position: 'relative', display: 'flex', height: 40, width: 40,
                alignItems: 'center', justifyContent: 'center', borderRadius: 12,
                border: 'none',
                background: bellHov || showNotifications ? L.accentL : 'transparent',
                color: showNotifications ? L.accent : L.txt1,
                cursor: 'pointer', transition: 'all 0.15s', outline: 'none',
              }}
            >
              {hasNotifs
                ? <BellSolidIcon style={{ color: L.accent }} />
                : <BellIcon style={{ color: L.txt1 }} />
              }
              {hasNotifs && (
                <span style={{
                  position: 'absolute', top: -3, right: -3, display: 'flex', height: 17, width: 17,
                  alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: L.rose,
                  fontSize: 10, fontWeight: 700, color: '#fff', border: `2px solid ${L.bg}`,
                  fontFamily: 'inherit',
                }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <EmployeeNotificationPanel
                notifications={empNotifications}
                onClear={empClearNotif}
                onClearAll={empClearAllNotif}
              />
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 30, background: L.border, flexShrink: 0, margin: '0 2px' }} />

          {/* User info (desktop) — name + designation, no avatar */}
          <div className="navbar-user-info" style={{ textAlign: 'right' }}>
            <div style={{
              maxWidth: 220, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              fontSize: 14, fontWeight: 700, color: L.txt0,
            }}>
              {user.name}
            </div>
            {designation && (
              <div style={{ fontSize: 12, fontWeight: 500, color: L.txt2, textTransform: 'capitalize', marginTop: 2 }}>
                {designation}
              </div>
            )}
          </div>

          {/* Logout — borderless */}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            onMouseEnter={e => { e.currentTarget.style.background = L.roseL; e.currentTarget.style.color = L.rose; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = L.txt1; }}
            style={{
              display: 'inline-flex', height: 40, width: 40, alignItems: 'center', justifyContent: 'center',
              borderRadius: 12, border: 'none', background: 'transparent',
              color: L.txt1, cursor: 'pointer', transition: 'all 0.15s', outline: 'none',
            }}
          >
            <LogoutIcon />
          </button>
        </div>

      </div>

      <style>{`
        @media(max-width:767px){.navbar-user-info{display:none!important}}
      `}</style>
    </header>
  );
};

export default Navbar;