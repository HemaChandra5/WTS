// src/components/StatusBadge.jsx
import React from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

/* ─── Dark tokens (Obsidian-Slate / admin) ──────────────────────────── */
const DARK_CONFIG = {
  pending: {
    label: 'Pending Review',
    icon: ClockIcon,
    bg: 'rgba(240,177,77,0.12)',
    border: 'rgba(240,177,77,0.30)',
    color: '#f0b14d',
    dot: '#f0b14d',
  },
  reviewing: {
    label: 'Under Review',
    icon: EyeIcon,
    bg: 'rgba(91,141,239,0.12)',
    border: 'rgba(91,141,239,0.30)',
    color: '#5b8def',
    dot: '#5b8def',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircleIcon,
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.30)',
    color: '#34d399',
    dot: '#34d399',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircleIcon,
    bg: 'rgba(240,112,138,0.12)',
    border: 'rgba(240,112,138,0.30)',
    color: '#f0708a',
    dot: '#f0708a',
  },
};

/* ─── Light tokens (ivory / employee) ───────────────────────────────── */
const LIGHT_CONFIG = {
  pending: {
    label: 'Pending Review',
    icon: ClockIcon,
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.28)',
    color: '#b45309',
    dot: '#f59e0b',
  },
  reviewing: {
    label: 'Under Review',
    icon: EyeIcon,
    bg: 'rgba(168,118,30,0.10)',
    border: 'rgba(168,118,30,0.28)',
    color: '#a8761e',
    dot: '#c9a25e',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircleIcon,
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.28)',
    color: '#065f46',
    dot: '#10b981',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircleIcon,
    bg: 'rgba(225,29,72,0.08)',
    border: 'rgba(225,29,72,0.22)',
    color: '#be123c',
    dot: '#e11d48',
  },
};

/**
 * StatusBadge — shared status pill.
 * @param {string} status - pending | reviewing | approved | rejected
 * @param {'sm'|'md'} size
 * @param {boolean} dark - true renders the Obsidian-Slate (admin) palette, false renders the ivory (employee) palette
 */
const StatusBadge = ({ status, size = 'md', dark = false }) => {
  const palette = dark ? DARK_CONFIG : LIGHT_CONFIG;
  const cfg = palette[status] || palette.pending;
  const Icon = cfg.icon;

  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 4 : 6,
        borderRadius: 999,
        padding: isSm ? '2px 8px' : '4px 11px',
        fontSize: isSm ? 10 : 12,
        fontWeight: 700,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      <Icon style={{ width: isSm ? 11 : 13, height: isSm ? 11 : 13, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;