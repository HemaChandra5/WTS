// src/components/TaskRow.jsx
import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  EllipsisHorizontalIcon,
  CalendarDaysIcon,
  FlagIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const T = {
  bg0: '#F4F6FB',
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.022)',
  bg3: 'rgba(15,23,42,0.048)',
  bdr0: 'rgba(15,23,42,0.048)',
  bdr1: 'rgba(15,23,42,0.085)',
  bdr2: 'rgba(15,23,42,0.15)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  accent: '#4F46E5',
  accentL: 'rgba(79,70,229,0.08)',
  accentM: 'rgba(79,70,229,0.14)',
  accentB: 'rgba(79,70,229,0.22)',
  emerald: '#059669',
  emeraldL: 'rgba(5,150,105,0.07)',
  emeraldB: 'rgba(5,150,105,0.22)',
  amber: '#C77C00',
  amberL: 'rgba(199,124,0,0.08)',
  amberB: 'rgba(199,124,0,0.22)',
  rose: '#DC2626',
  roseL: 'rgba(220,38,38,0.07)',
  roseB: 'rgba(220,38,38,0.20)',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending', bg: T.amberL, border: T.amberB, color: T.amber, dot: T.amber,
    icon: ClockIcon, glow: 'rgba(199,124,0,0.16)', stripe: '#D97706',
  },
  in_progress: {
    label: 'In Progress', bg: T.accentL, border: T.accentB, color: T.accent, dot: T.accent,
    icon: PlayIcon, glow: 'rgba(79,70,229,0.16)', stripe: '#4F46E5',
  },
  done: {
    label: 'Completed', bg: T.emeraldL, border: T.emeraldB, color: T.emerald, dot: T.emerald,
    icon: CheckCircleIcon, glow: 'rgba(5,150,105,0.16)', stripe: '#059669',
  },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    bg: 'rgba(100,116,139,0.07)', border: 'rgba(100,116,139,0.18)', color: '#64748B', dot: '#94A3B8' },
  medium: { label: 'Medium', bg: T.amberL, border: T.amberB, color: T.amber, dot: T.amber },
  high:   { label: 'High',   bg: T.roseL,  border: T.roseB,  color: T.rose,  dot: T.rose },
};

const fmtDate = (ts) => {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (ts) => {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const relTime = (ts) => {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const MenuItem = ({ onClick, color, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', textAlign: 'left', padding: '9px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, fontWeight: 600,
        color: hov ? (color || T.accent) : T.txt1,
        background: hov ? (color ? `${color}11` : T.accentL) : 'transparent',
        border: 'none', cursor: 'pointer', transition: 'all 0.12s', fontFamily: FONT,
      }}
    >
      {children}
    </button>
  );
};

const TaskRow = ({ task, onStatusChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rowHov, setRowHov] = useState(false);
  const [menuBtnHov, setMenuBtnHov] = useState(false);

  const cfg = STATUS_CONFIG[task?.status] || STATUS_CONFIG.pending;
  const priCfg = task?.priority ? (PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium) : null;
  const StatusIcon = cfg.icon;
  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const assignedDate = task?.createdAt ? fmtDate(task.createdAt) : null;
  const assignedTime = task?.createdAt ? fmtTime(task.createdAt) : null;
  const assignedRel  = task?.createdAt ? relTime(task.createdAt) : null;
  const assignedBy   = task?.assignedByName || task?.assignedBy || 'Admin';

  const setStatus = (status) => {
    setMenuOpen(false);
    onStatusChange?.(task.id, status);
  };

  return (
    <li
      onMouseEnter={() => setRowHov(true)}
      onMouseLeave={() => setRowHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
        borderRadius: 16,
        border: `1px solid ${isOverdue ? T.roseB : rowHov ? T.bdr2 : T.bdr0}`,
        background: isOverdue
          ? 'linear-gradient(135deg, rgba(220,38,38,0.04) 0%, #FFFFFF 100%)'
          : T.bg1,
        padding: '14px 16px 14px 20px',
        boxShadow: rowHov
          ? '0 10px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.04)'
          : '0 1px 3px rgba(15,23,42,0.04)',
        transform: rowHov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        listStyle: 'none', fontFamily: FONT,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: isOverdue ? T.rose : cfg.stripe,
        opacity: rowHov ? 1 : 0.4,
        transition: 'opacity 0.22s',
        borderRadius: '16px 0 0 16px',
      }} />

      {/* Status icon */}
      <div style={{
        display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
        borderRadius: 11, background: cfg.bg, border: `1px solid ${cfg.border}`,
        flexShrink: 0,
        boxShadow: rowHov ? `0 0 0 5px ${cfg.glow}` : 'none',
        transition: 'box-shadow 0.22s',
      }}>
        <StatusIcon style={{ width: 16, height: 16, color: cfg.color }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
          <p style={{
            fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.015em',
          }}>
            {task?.title || '(Untitled task)'}
          </p>
          {isOverdue && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: T.rose,
              background: T.roseL, border: `1px solid ${T.roseB}`,
              borderRadius: 5, padding: '2px 7px',
              letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
            }}>OVERDUE</span>
          )}
        </div>

        {/* Description */}
        {task?.description ? (
          <p style={{
            margin: '0 0 8px', fontSize: 11.5, color: T.txt2, lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {task.description}
          </p>
        ) : (
          <p style={{ margin: '0 0 8px', fontSize: 11.5, color: T.txt2, fontStyle: 'italic' }}>No description</p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Auto timestamp */}
          {assignedDate && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: T.bg2, border: `1px solid ${T.bdr0}`,
              borderRadius: 8, padding: '3px 9px',
            }}>
              <BoltIcon style={{ width: 10, height: 10, color: T.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: T.txt2, fontWeight: 500 }}>
                By <strong style={{ color: T.txt1, fontWeight: 700 }}>{assignedBy}</strong>
                {' · '}
                <span style={{ color: T.txt1, fontWeight: 600 }}>{assignedDate}</span>
                {' '}
                <span style={{
                  background: T.bg3, borderRadius: 5, padding: '1px 5px',
                  fontSize: 10, fontWeight: 700, color: T.txt1,
                }}>{assignedTime}</span>
                {assignedRel && (
                  <span style={{ color: T.txt2, fontWeight: 400 }}>{' · '}{assignedRel}</span>
                )}
              </span>
            </div>
          )}

          {/* Due date */}
          {task?.dueDate && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: isOverdue ? T.roseL : T.bg2,
              border: `1px solid ${isOverdue ? T.roseB : T.bdr0}`,
              borderRadius: 8, padding: '3px 9px',
            }}>
              <CalendarDaysIcon style={{ width: 10, height: 10, color: isOverdue ? T.rose : T.txt2, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: isOverdue ? T.rose : T.txt1 }}>
                Due {fmtDate(task.dueDate)}
              </span>
            </div>
          )}

          {/* Attachment */}
          {task?.attachmentUrl && (
            <a
              href={task.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10.5, fontWeight: 600, color: T.accent,
                textDecoration: 'none',
                background: T.accentL, border: `1px solid ${T.accentB}`,
                borderRadius: 8, padding: '3px 9px',
              }}
            >
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              View attachment
            </a>
          )}
        </div>
      </div>

      {/* Right side — priority + status + menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        {priCfg && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            borderRadius: 8, padding: '4px 10px', fontSize: 10.5, fontWeight: 700,
            background: priCfg.bg, border: `1px solid ${priCfg.border}`, color: priCfg.color,
            letterSpacing: '0.02em',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: priCfg.dot, flexShrink: 0 }} />
            {priCfg.label}
          </span>
        )}

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 20,
          padding: '4px 11px', fontSize: 11, fontWeight: 700,
          background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
          letterSpacing: '0.01em',
        }}>
          <span style={{ height: 5, width: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
          {cfg.label}
        </span>

        {/* Menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            onMouseEnter={() => setMenuBtnHov(true)}
            onMouseLeave={() => setMenuBtnHov(false)}
            aria-label="Task actions"
            style={{
              display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center',
              borderRadius: 10, border: `1px solid ${menuBtnHov ? T.bdr2 : T.bdr1}`,
              background: menuBtnHov ? T.bg3 : T.bg1,
              color: menuBtnHov ? T.txt0 : T.txt2,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: menuBtnHov ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
            }}
          >
            <EllipsisHorizontalIcon style={{ width: 16, height: 16 }} />
          </button>

          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30, cursor: 'default' }} />
              <div style={{
                position: 'absolute', right: 0, marginTop: 8, width: 184, zIndex: 40,
                borderRadius: 14, border: `1px solid ${T.bdr1}`, background: T.bg1,
                boxShadow: '0 24px 60px rgba(15,23,42,0.16), 0 4px 12px rgba(15,23,42,0.06)',
                overflow: 'hidden',
                animation: 'trMenuIn 0.16s cubic-bezier(.16,1,.3,1)',
              }}>
                <div style={{ padding: '8px 14px 6px', borderBottom: `1px solid ${T.bdr0}` }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: T.txt2 }}>
                    Change status
                  </span>
                </div>
                <MenuItem onClick={() => setStatus('pending')} color={T.amber}>
                  <ClockIcon style={{ width: 13, height: 13 }} />
                  Mark as Pending
                </MenuItem>
                <MenuItem onClick={() => setStatus('in_progress')} color={T.accent}>
                  <PlayIcon style={{ width: 13, height: 13 }} />
                  Mark In Progress
                </MenuItem>
                <MenuItem onClick={() => setStatus('done')} color={T.emerald}>
                  <CheckCircleIcon style={{ width: 13, height: 13 }} />
                  Mark Completed
                </MenuItem>
              </div>
              <style>{`@keyframes trMenuIn { from{opacity:0;transform:translateY(-6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default TaskRow;