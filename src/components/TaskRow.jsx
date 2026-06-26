import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  EllipsisVerticalIcon,
  CalendarDaysIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

/* ─── Light SaaS tokens (employee) — identical to EmployeeDashboard.jsx ── */
const T = {
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.03)',
  bg3: 'rgba(15,23,42,0.06)',
  bdr0: 'rgba(15,23,42,0.06)',
  bdr1: 'rgba(15,23,42,0.10)',
  txt0: '#0F172A',
  txt1: '#475569',
  txt2: '#64748B',
  accent: '#4F46E5',
  emerald: '#10B981', emeraldD: 'rgba(16,185,129,0.12)', emeraldB: 'rgba(16,185,129,0.26)',
  amber: '#F59E0B', amberD: 'rgba(245,158,11,0.14)', amberB: 'rgba(245,158,11,0.28)',
  rose: '#F43F5E', roseD: 'rgba(244,63,94,0.12)', roseB: 'rgba(244,63,94,0.26)',
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: T.amberD, border: T.amberB, color: T.amber, icon: ClockIcon },
  in_progress: { label: 'In Progress', bg: 'rgba(79,70,229,0.12)', border: 'rgba(79,70,229,0.26)', color: T.accent, icon: PlayIcon },
  done: { label: 'Completed', bg: T.emeraldD, border: T.emeraldB, color: T.emerald, icon: CheckCircleIcon },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.20)', color: T.txt1 },
  medium: { label: 'Medium', bg: T.amberD, border: T.amberB, color: T.amber },
  high: { label: 'High', bg: T.roseD, border: T.roseB, color: T.rose },
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TaskRow = ({ task, onStatusChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rowHov, setRowHov] = useState(false);
  const [menuBtnHov, setMenuBtnHov] = useState(false);

  const cfg = STATUS_CONFIG[task?.status] || STATUS_CONFIG.pending;
  const priCfg = task?.priority ? (PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium) : null;
  const StatusIcon = cfg.icon;
  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const setStatus = (status) => {
    setMenuOpen(false);
    onStatusChange?.(task.id, status);
  };

  const MenuItem = ({ children, onClick, color }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 12, fontWeight: 700,
          color: color || T.txt1, background: hov ? T.bg3 : 'transparent',
          border: 'none', cursor: 'pointer', transition: 'background 0.12s', fontFamily: 'inherit',
        }}
      >
        {children}
      </button>
    );
  };

  return (
    <li
      onMouseEnter={() => setRowHov(true)}
      onMouseLeave={() => setRowHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        borderRadius: 14,
        border: `1px solid ${isOverdue ? T.roseB : T.bdr0}`,
        background: isOverdue ? T.roseD : rowHov ? T.bg2 : T.bg1,
        padding: '12px 16px',
        boxShadow: rowHov ? '0 6px 18px rgba(15,23,42,0.08)' : '0 1px 2px rgba(15,23,42,0.03)',
        transform: rowHov ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.18s', listStyle: 'none',
      }}
    >
      {/* left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div style={{
          display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center',
          borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, flexShrink: 0,
          boxShadow: `0 0 0 3px ${cfg.bg}`,
        }}>
          <StatusIcon style={{ width: 15, height: 15, color: cfg.color }} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task?.title || '(Untitled task)'}
            </p>
            {isOverdue && (
              <span style={{ fontSize: 9.5, fontWeight: 700, color: T.rose, background: T.roseD, border: `1px solid ${T.roseB}`, borderRadius: 6, padding: '1px 7px', letterSpacing: '0.04em' }}>
                OVERDUE
              </span>
            )}
          </div>
          {task?.description ? (
            <p style={{
              marginTop: 2, fontSize: 11, color: T.txt1, display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {task.description}
            </p>
          ) : (
            <p style={{ marginTop: 2, fontSize: 11, color: T.txt2 }}>No description</p>
          )}
          {task?.dueDate && (
            <p style={{ marginTop: 4, fontSize: 11, color: isOverdue ? T.rose : T.txt2, fontWeight: isOverdue ? 600 : 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarDaysIcon style={{ width: 12, height: 12 }} /> Due {formatDate(task.dueDate)}
            </p>
          )}
        </div>
      </div>

      {/* right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {priCfg && (
          <span
            title={`${priCfg.label} priority`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 6,
              padding: '4px 9px', fontSize: 10.5, fontWeight: 700,
              background: priCfg.bg, border: `1px solid ${priCfg.border}`, color: priCfg.color,
              letterSpacing: '0.02em',
            }}
          >
            <FlagIcon style={{ width: 11, height: 11 }} />
            {priCfg.label}
          </span>
        )}

        {/* status pill */}
        <span
          title={cfg.label}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
            padding: '5px 11px', fontSize: 11, fontWeight: 700,
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
          }}
        >
          <span style={{ height: 6, width: 6, borderRadius: '50%', background: cfg.color }} />
          {cfg.label}
        </span>

        {/* menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            onMouseEnter={() => setMenuBtnHov(true)}
            onMouseLeave={() => setMenuBtnHov(false)}
            aria-label="Task actions"
            style={{
              display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center',
              borderRadius: 10, border: `1px solid ${T.bdr1}`,
              background: menuBtnHov ? T.bg3 : T.bg1,
              color: T.txt1, cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <EllipsisVerticalIcon style={{ width: 16, height: 16 }} />
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 30, cursor: 'default' }}
              />
              <div style={{
                position: 'absolute', right: 0, marginTop: 8, width: 176, zIndex: 40,
                borderRadius: 12, border: `1px solid ${T.bdr1}`, background: T.bg1,
                boxShadow: '0 20px 50px rgba(15,23,42,0.18)', overflow: 'hidden',
                animation: 'wts-tr-menu 0.16s cubic-bezier(.16,1,.3,1)',
              }}>
                <MenuItem onClick={() => setStatus('pending')}>Mark as Pending</MenuItem>
                <MenuItem onClick={() => setStatus('in_progress')}>Mark In Progress</MenuItem>
                <MenuItem onClick={() => setStatus('done')} color={T.emerald}>Mark Completed</MenuItem>
              </div>
              <style>{`@keyframes wts-tr-menu { from { opacity:0; transform: translateY(-4px) scale(0.98);} to { opacity:1; transform: translateY(0) scale(1);} }`}</style>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default TaskRow;