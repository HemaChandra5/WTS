// src/components/TaskRow.jsx
import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

/* ─── Ivory/gold employee tokens ────────────────────────────────────── */
const L = {
  border:   'rgba(212,175,122,0.18)',
  rowBg:    'rgba(212,175,122,0.045)',
  rowHov:   '#fffefb',
  txt0:     '#1c1917',
  txt1:     '#78716c',
  txt2:     '#a8a29e',
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.26)',
    color: '#b45309',
    dot: '#f59e0b',
    icon: ClockIcon,
  },
  in_progress: {
    label: 'In Progress',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.26)',
    color: '#1d4ed8',
    dot: '#3b82f6',
    icon: PlayIcon,
  },
  done: {
    label: 'Done',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.26)',
    color: '#065f46',
    dot: '#10b981',
    icon: CheckCircleIcon,
  },
};

const TaskRow = ({ task, onStatusChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rowHov, setRowHov] = useState(false);
  const [menuBtnHov, setMenuBtnHov] = useState(false);

  const cfg = STATUS_CONFIG[task?.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

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
          color: color || L.txt1, background: hov ? 'rgba(212,175,122,0.10)' : 'transparent',
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
        borderRadius: 14, border: `1px solid ${L.border}`,
        background: rowHov ? L.rowHov : L.rowBg,
        padding: '12px 16px',
        boxShadow: rowHov ? '0 2px 10px rgba(120,98,53,0.08)' : 'none',
        transition: 'all 0.18s', listStyle: 'none',
      }}
    >
      {/* left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div style={{
          display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center',
          borderRadius: 10, background: '#fffefb', border: `1px solid ${L.border}`, flexShrink: 0,
          boxShadow: '0 1px 3px rgba(120,98,53,0.06)',
        }}>
          <StatusIcon style={{ width: 15, height: 15, color: cfg.dot }} />
        </div>

        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: L.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task?.title || '(Untitled task)'}
          </p>
          {task?.description ? (
            <p style={{
              marginTop: 2, fontSize: 11, color: L.txt1, display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {task.description}
            </p>
          ) : (
            <p style={{ marginTop: 2, fontSize: 11, color: L.txt2 }}>No description</p>
          )}
        </div>
      </div>

      {/* right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* status pill */}
        <span
          title={cfg.label}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
            padding: '5px 11px', fontSize: 11, fontWeight: 700,
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
          }}
        >
          <span style={{ height: 6, width: 6, borderRadius: '50%', background: cfg.dot }} />
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
              borderRadius: 10, border: `1px solid ${L.border}`,
              background: menuBtnHov ? 'rgba(212,175,122,0.10)' : '#fffefb',
              color: L.txt1, cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <EllipsisVerticalIcon style={{ width: 16, height: 16 }} />
          </button>

          {menuOpen && (
            <>
              {/* click-away backdrop */}
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 30, cursor: 'default' }}
              />
              <div style={{
                position: 'absolute', right: 0, marginTop: 8, width: 176, zIndex: 40,
                borderRadius: 12, border: `1px solid ${L.border}`, background: '#fffefb',
                boxShadow: '0 20px 50px rgba(120,98,53,0.20)', overflow: 'hidden',
              }}>
                <MenuItem onClick={() => setStatus('pending')}>Mark as Pending</MenuItem>
                <MenuItem onClick={() => setStatus('in_progress')}>Mark In Progress</MenuItem>
                <MenuItem onClick={() => setStatus('done')} color="#059669">Mark Done</MenuItem>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
};

export default TaskRow;