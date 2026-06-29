// src/components/StatusBadge.jsx
import React from 'react';
import { ClockIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

/* Admin palette */
const D = {
  accent: '#3454D1', accentL: 'rgba(52,84,209,0.09)', accentB: 'rgba(52,84,209,0.22)',
  emerald: '#0E9F6E', emeraldD: 'rgba(14,159,110,0.09)', emeraldB: 'rgba(14,159,110,0.22)',
  amber: '#B7791F', amberD: 'rgba(183,121,31,0.09)', amberB: 'rgba(183,121,31,0.22)',
  rose: '#C23552', roseD: 'rgba(194,53,82,0.07)', roseB: 'rgba(194,53,82,0.20)',
};

/* Employee palette */
const L = {
  accent: '#4F46E5', accentL: 'rgba(79,70,229,0.09)', accentB: 'rgba(79,70,229,0.22)',
  emerald: '#10B981', emeraldD: 'rgba(16,185,129,0.09)', emeraldB: 'rgba(16,185,129,0.22)',
  amber: '#D97706', amberD: 'rgba(217,119,6,0.09)', amberB: 'rgba(217,119,6,0.22)',
  rose: '#DC2626', roseD: 'rgba(220,38,38,0.07)', roseB: 'rgba(220,38,38,0.20)',
};

const buildConfig = (T) => ({
  pending: {
    label: 'Pending Review', icon: ClockIcon,
    bg: T.amberD, border: T.amberB, color: T.amber,
  },
  reviewing: {
    label: 'Under Review', icon: EyeIcon,
    bg: T.accentL, border: T.accentB, color: T.accent,
  },
  approved: {
    label: 'Approved', icon: CheckCircleIcon,
    bg: T.emeraldD, border: T.emeraldB, color: T.emerald,
  },
  rejected: {
    label: 'Rejected', icon: XCircleIcon,
    bg: T.roseD, border: T.roseB, color: T.rose,
  },
});

/**
 * StatusBadge — shared status pill
 * @param {string} status — pending | reviewing | approved | rejected
 * @param {'sm'|'md'} size
 * @param {boolean} dark — true = admin palette
 */
const StatusBadge = ({ status, size = 'md', dark = false }) => {
  const T = dark ? D : L;
  const cfg = buildConfig(T)[status] || buildConfig(T).pending;
  const Icon = cfg.icon;
  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        gap: isSm ? 4 : 5,
        borderRadius: 20,
        padding: isSm ? '3px 9px' : '4px 12px',
        fontSize: isSm ? 10 : 11.5,
        fontWeight: 700,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        fontFamily: '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      }}
    >
      <Icon style={{ width: isSm ? 10 : 12, height: isSm ? 10 : 12, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;