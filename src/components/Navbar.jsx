import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

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

const TYPE_ACCENTS = {
  task: { dot: '#2563eb', chip: 'rgba(37,99,235,0.12)' },
  file: { dot: '#0f766e', chip: 'rgba(15,118,110,0.12)' },
  approval: { dot: '#059669', chip: 'rgba(5,150,105,0.12)' },
  rejection: { dot: '#e11d48', chip: 'rgba(225,29,72,0.12)' },
  system: { dot: '#6b7280', chip: 'rgba(107,114,128,0.14)' },
};

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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LogoutIcon = (p) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const NotificationPanel = ({ notifications, onClear, onClearAll, isAdmin }) => {
  const t = isAdmin ? D : L;
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 14px)',
        zIndex: 200,
        width: 'min(380px, calc(100vw - 24px))',
        borderRadius: 20,
        border: `1px solid ${t.panelEdge}`,
        background: t.panel,
        boxShadow: isAdmin
          ? '0 30px 80px rgba(0,0,0,0.65)'
          : '0 30px 70px rgba(120,98,53,0.24)',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -7,
          right: 14,
          width: 14,
          height: 14,
          background: t.panel,
          borderLeft: `1px solid ${t.panelEdge}`,
          borderTop: `1px solid ${t.panelEdge}`,
          transform: 'rotate(45deg)',
          borderRadius: '3px 0 0 0',
        }}
      />

      <div style={{ borderRadius: 20, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 18px 14px',
            borderBottom: `1px solid ${isAdmin ? 'rgba(255,255,255,0.08)' : 'rgba(212,175,122,0.18)'}`,
            background: isAdmin
              ? 'linear-gradient(135deg, rgba(91,141,239,0.16), rgba(255,255,255,0.01))'
              : 'linear-gradient(135deg, rgba(168,118,30,0.13), rgba(255,255,255,0.55))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: '-0.01em' }}>Live notifications</p>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: t.textMuted }}>
                {notifications.length > 0 ? `${notifications.length} recent update${notifications.length > 1 ? 's' : ''}` : 'No updates yet'}
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                style={{
                  border: 'none',
                  background: isAdmin ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.68)',
                  color: t.text,
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '54px 20px', textAlign: 'center' }}>
              <BellIcon style={{ width: 34, height: 34, color: t.textDim, margin: '0 auto', display: 'block' }} />
              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13.5, color: t.textMuted, fontWeight: 600 }}>
                Inbox is clear
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const accent = TYPE_ACCENTS[n.type] || TYPE_ACCENTS.system;
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '8px 1fr auto',
                    alignItems: 'start',
                    gap: 12,
                    padding: '13px 16px',
                    borderBottom: `1px solid ${isAdmin ? 'rgba(255,255,255,0.06)' : 'rgba(212,175,122,0.14)'}`,
                  }}
                >
                  <span
                    style={{
                      marginTop: 6,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: accent.dot,
                      boxShadow: `0 0 0 4px ${accent.chip}`,
                    }}
                  />

                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, color: t.text, fontWeight: 700, fontSize: 13.5, letterSpacing: '-0.01em' }}>{n.title}</p>
                    <p style={{ margin: '2px 0 0', color: t.textMuted, fontSize: 12.5, lineHeight: 1.45 }}>{n.message}</p>
                    <p style={{ margin: '4px 0 0', color: t.textDim, fontSize: 11 }}>{timeAgo(n.time)}</p>
                  </div>

                  <button
                    onClick={() => onClear(n.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: t.textDim,
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 8,
                    }}
                  >
                    <CloseIcon />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, clearNotification, clearAllNotifications, fetchNotifications } = useNotifications();

  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoutHov, setLogoutHov] = useState(false);
  const [bellHov, setBellHov] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const t = isAdmin ? D : L;
  const designation = user.designation || user.title || user.position || user.department || '';
  const hasNotifs = notifications.length > 0;
  const notifCount = notifications.length;

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
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications((p) => !p)}
              onMouseEnter={() => setBellHov(true)}
              onMouseLeave={() => setBellHov(false)}
              type="button"
              aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
              style={{
                position: 'relative',
                display: 'flex',
                height: isAdmin ? 38 : 40,
                width: isAdmin ? 38 : 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                border: 'none',
                background: bellHov || showNotifications ? t.accentSoft : 'transparent',
                color: showNotifications ? t.accent : t.textMuted,
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: 'none',
              }}
            >
              {hasNotifs ? <BellSolidIcon style={{ color: t.accent }} /> : <BellIcon style={{ color: t.textMuted }} />}
              {hasNotifs && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    display: 'flex',
                    height: 17,
                    width: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: t.danger,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    border: `2px solid ${isAdmin ? '#000' : t.bg}`,
                  }}
                >
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationPanel
                notifications={notifications}
                onClear={clearNotification}
                onClearAll={clearAllNotifications}
                isAdmin={isAdmin}
              />
            )}
          </div>

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
