// src/components/StatusBadge.jsx
import React from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

/* ─── Executive Light tokens (admin) — identical palette to AdminDashboard ── */
const D = {
  accent: '#3454D1',
  txt1: '#5B6478',
  emerald: '#0E9F6E', emeraldD: 'rgba(14,159,110,0.10)', emeraldB: 'rgba(14,159,110,0.22)',
  amber: '#B7791F', amberD: 'rgba(183,121,31,0.10)', amberB: 'rgba(183,121,31,0.22)',
  rose: '#C23552', roseD: 'rgba(194,53,82,0.08)', roseB: 'rgba(194,53,82,0.20)',
  accentL: 'rgba(52,84,209,0.10)', accentB: 'rgba(52,84,209,0.22)',
};

/* ─── Light SaaS tokens (employee) — identical palette to EmployeeDashboard ── */
const L = {
  accent: '#4F46E5',
  txt1: '#475569',
  emerald: '#10B981', emeraldD: 'rgba(16,185,129,0.12)', emeraldB: 'rgba(16,185,129,0.26)',
  amber: '#F59E0B', amberD: 'rgba(245,158,11,0.14)', amberB: 'rgba(245,158,11,0.28)',
  rose: '#F43F5E', roseD: 'rgba(244,63,94,0.12)', roseB: 'rgba(244,63,94,0.26)',
  accentL: 'rgba(79,70,229,0.12)', accentB: 'rgba(79,70,229,0.26)',
};

const buildConfig = (T) => ({
  pending: {
    label: 'Pending Review',
    icon: ClockIcon,
    bg: T.amberD,
    border: T.amberB,
    color: T.amber,
  },
  reviewing: {
    label: 'Under Review',
    icon: EyeIcon,
    bg: T.accentL,
    border: T.accentB,
    color: T.accent,
  },
  approved: {
    label: 'Approved',
    icon: CheckCircleIcon,
    bg: T.emeraldD,
    border: T.emeraldB,
    color: T.emerald,
  },
  rejected: {
    label: 'Rejected',
    icon: XCircleIcon,
    bg: T.roseD,
    border: T.roseB,
    color: T.rose,
  },
});

/**
 * StatusBadge — shared status pill, styled to match the Executive Light
 * (admin) and SaaS Light (employee) design system used across the app.
 * @param {string} status - pending | reviewing | approved | rejected
 * @param {'sm'|'md'} size
 * @param {boolean} dark - true renders the Executive Light (admin) palette, false renders the SaaS Light (employee) palette
 */
const StatusBadge = ({ status, size = 'md', dark = false }) => {
  const T = dark ? D : L;
  const cfg = buildConfig(T)[status] || buildConfig(T).pending;
  const Icon = cfg.icon;
  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 4 : 6,
        borderRadius: 999,
        padding: isSm ? '2px 9px' : '4px 12px',
        fontSize: isSm ? 10 : 11.5,
        fontWeight: 700,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        fontFamily: 'inherit',
        boxShadow: `0 1px 2px rgba(15,23,42,0.03)`,
      }}
    >
      <Icon style={{ width: isSm ? 11 : 13, height: isSm ? 11 : 13, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;