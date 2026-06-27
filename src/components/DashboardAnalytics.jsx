import React, { useMemo, useState } from 'react';

/* ════════════════════════════════════════════════════════════════════════
   DashboardAnalytics
   ----------------------------------------------------------------------------
   Drop-in analytics module for AdminDashboard.jsx / EmployeeDashboard.jsx.

   • Zero extra dependencies — every chart (donut, trend area, radial gauge,
     contribution heatmap, leaderboard bars) is hand-rolled SVG/CSS, so it
     never fights a bundler or design system that isn't already in the repo.
   • Theme-aware — pass the exact same `T` design-token object each
     dashboard already defines. Drop it into the dark glass Admin shell or
     the light SaaS Employee shell and it re-colors itself automatically.
   • Defensive — every field is read optionally (adminNote / feedback /
     reviewNote, reviewedAt / updatedAt, etc.) so it won't throw if the
     backend hasn't shipped a field yet; sections render honest empty
     states instead of fabricated numbers.

   USAGE
   -----
   import DashboardAnalytics from './DashboardAnalytics';

   // Admin — org-wide analytics + team leaderboard + department mix
   <DashboardAnalytics
     theme={T}
     variant="admin"
     files={fileList}
     tasks={tasks}
     employees={employees}
     onNavigate={(tab) => setActiveTab(tab)}
   />

   // Employee — same component, scoped to their own data, leaderboard hidden
   <DashboardAnalytics
     theme={T}
     variant="employee"
     files={userFiles}
     tasks={myTasks}
   />

   DATA SHAPE (all fields read defensively — nothing here is required)
   -----------------------------------------------------------------------
   file: { id, originalName, userName, userEmail, department, status,
           createdAt, size, adminNote|feedback|reviewNote|comment,
           reviewedAt|updatedAt|decidedAt }
   task: { id, title, status, priority, dueDate, assignedToEmail,
           assignedToName, createdAt }
   employee: { id, name, email, department }
   ════════════════════════════════════════════════════════════════════════ */

/* ───────────────────────────── Icons (inline SVG) ───────────────────────── */
const Ic = {
  Doc: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  Check: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 16 9" /></svg>,
  X: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  Clock: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Eye: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  Calendar: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Flag: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
  Users: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Message: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  AlertTriangle: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Activity: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  Download: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  ArrowUp: (p) => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" {...p}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>,
  ArrowDown: (p) => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" {...p}><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>,
  Chart: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="9.5" y="7" width="4" height="14" rx="1" /><rect x="16" y="4" width="4" height="17" rx="1" /></svg>,
  Building: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /></svg>,
};

/* ───────────────────────────── Helpers ───────────────────────────────── */
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round = (n) => Math.round(n);
const pct = (n, d) => (d ? round((n / d) * 100) : 0);

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(148,163,184,${alpha})`;
  if (hex.startsWith('rgb')) return hex; // already rgba/rgb — pass through
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const int = parseInt(h, 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const startOfDay = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

const formatShortDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff)) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatShortDate(date);
};

const exportToCSV = (rows, filename) => {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// Read the first present field from a list of possible aliases — keeps the
// component working across slightly different API shapes without crashing.
const firstField = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
  }
  return null;
};
const getFeedback = (file) => firstField(file, ['adminNote', 'feedback', 'reviewNote', 'review_note', 'comment', 'rejectionReason', 'rejection_reason', 'adminComment']);
const getReviewedAt = (file) => firstField(file, ['reviewedAt', 'reviewed_at', 'decidedAt', 'updatedAt', 'updated_at']);
const getAssigneeName = (task) => firstField(task, ['assignedToName', 'assignedToEmail', 'assigned_to_name', 'assigned_to_email']) || 'Unassigned';

const statusMeta = (theme, status) => ({
  pending: { label: 'Pending', color: theme.amber, bg: theme.amberD },
  reviewing: { label: 'Reviewing', color: theme.accent, bg: theme.accentL },
  approved: { label: 'Approved', color: theme.emerald, bg: theme.emeraldD },
  rejected: { label: 'Rejected', color: theme.rose, bg: theme.roseD },
}[status] || { label: status || 'Unknown', color: theme.txt2, bg: theme.bg3 });

// Build N daily buckets ending today (inclusive) from any timestamp-bearing list.
const buildDayBuckets = (items, days, getDate) => {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i));
    return { date: d, label: d.toLocaleDateString('en', { weekday: 'short' }), shortLabel: formatShortDate(d), value: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.date.getTime(), i]));
  (items || []).forEach((item) => {
    const raw = getDate(item);
    if (!raw) return;
    const d = startOfDay(new Date(raw));
    if (Number.isNaN(d.getTime())) return;
    const i = index.get(d.getTime());
    if (i !== undefined) buckets[i].value += 1;
  });
  return buckets;
};

const periodDelta = (buckets) => {
  const half = Math.floor(buckets.length / 2);
  if (!half) return 0;
  const prev = buckets.slice(0, half).reduce((s, b) => s + b.value, 0);
  const curr = buckets.slice(half).reduce((s, b) => s + b.value, 0);
  if (prev === 0) return curr > 0 ? 100 : 0;
  return round(((curr - prev) / prev) * 100);
};

/* ═════════════════════════ Presentational primitives ════════════════════ */

// Glass panel — identical surface treatment to the Card used elsewhere in
// both dashboards, so this slots in without looking like a foreign widget.
const Panel = ({ theme, title, subtitle, icon: IconCmp, iconColor, action, children, style }) => (
  <div style={{
    background: theme.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)',
    border: `1px solid ${theme.glassBorder}`, borderRadius: 18, padding: 18, ...style,
  }}>
    {(title || IconCmp || action) && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {title && <p style={{ fontSize: 13.5, fontWeight: 600, color: theme.txt0, margin: 0 }}>{title}</p>}
          {subtitle && <p style={{ fontSize: 11, color: theme.txt2, margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {action}
          {IconCmp && <IconCmp style={{ color: iconColor || theme.accent }} />}
        </div>
      </div>
    )}
    {children}
  </div>
);

// Honest empty state — never fabricate numbers when there's no data yet.
const EmptyState = ({ theme, icon: IconCmp, title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '34px 14px', textAlign: 'center', borderRadius: 14, border: `1.5px dashed ${theme.bdr1}` }}>
    <IconCmp style={{ width: 28, height: 28, color: theme.txt2 }} />
    <p style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: theme.txt2 }}>{title}</p>
    {subtitle && <p style={{ fontSize: 11, color: theme.txt2, margin: '3px 0 0', maxWidth: 240 }}>{subtitle}</p>}
  </div>
);

const StatusTag = ({ theme, status }) => {
  const m = statusMeta(theme, status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '2px 9px', fontSize: 10, fontWeight: 700, color: m.color, background: m.bg, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  );
};

const DueChip = ({ theme, diffDays }) => {
  let label, color, bg;
  if (diffDays < 0) { label = `${Math.abs(diffDays)}d overdue`; color = theme.rose; bg = theme.roseD; }
  else if (diffDays === 0) { label = 'Due today'; color = theme.amber; bg = theme.amberD; }
  else if (diffDays <= 3) { label = `Due in ${diffDays}d`; color = theme.amber; bg = theme.amberD; }
  else { label = `Due in ${diffDays}d`; color = theme.accent; bg = theme.accentL; }
  return <span style={{ fontSize: 10.5, fontWeight: 700, color, background: bg, borderRadius: 999, padding: '2px 9px', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>;
};

// KPI tile — same visual language as the StatCard already used elsewhere,
// rebuilt locally (and theme-driven via hexToRgba) so this file has zero
// import dependency on the host dashboard's component tree.
const StatTile = ({ theme, icon: IconCmp, label, value, sub, trend, color, onClick }) => {
  const [hov, setHov] = useState(false);
  const wash = hexToRgba(color, 0.10);
  const edge = hexToRgba(color, 0.24);
  const clickable = typeof onClick === 'function';
  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '16px 18px',
        background: `linear-gradient(160deg, ${wash}, ${theme.bg1})`,
        border: `1px solid ${hov && clickable ? edge : theme.bdr0}`,
        textAlign: 'left', width: '100%', fontFamily: 'inherit',
        cursor: clickable ? 'pointer' : 'default',
        transform: hov && clickable ? 'translateY(-2px)' : 'none',
        boxShadow: hov && clickable ? `0 14px 28px ${hexToRgba(color, 0.14)}` : '0 1px 2px rgba(15,23,42,0.04)',
        transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
      }}
    >
      <div style={{ position: 'absolute', top: -36, right: -36, width: 100, height: 100, borderRadius: '50%', background: wash, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ borderRadius: 11, background: theme.bg3, border: `1px solid ${edge}`, padding: 8, display: 'flex' }}>
            <IconCmp style={{ color, width: 15, height: 15 }} />
          </div>
          {trend !== undefined && trend !== null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, borderRadius: 999, padding: '2px 7px', fontSize: 10, fontWeight: 700, background: theme.bg3, color: theme.txt1, border: `1px solid ${theme.bdr1}` }}>
              {trend >= 0 ? <Ic.ArrowUp /> : <Ic.ArrowDown />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p style={{ fontSize: '1.55rem', fontWeight: 700, color: theme.txt0, letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme.txt1, margin: '7px 0 0' }}>{label}</p>
        {sub && <p style={{ fontSize: 10.5, color: theme.txt2, margin: '3px 0 0' }}>{sub}</p>}
      </div>
    </Tag>
  );
};

// Donut chart — status distribution. Pure SVG stroke-dasharray segments,
// no canvas, no chart library, fully theme-colored.
const DonutChart = ({ theme, segments, size = 168, thickness = 20, centerValue, centerLabel }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = segments.filter((s) => s.value > 0);
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.bg4} strokeWidth={thickness} />
          {total > 0 && visible.map((s) => {
            const frac = s.value / total;
            const dash = frac * circumference;
            const el = (
              <circle
                key={s.label} cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={s.color} strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-acc}
                strokeLinecap={visible.length > 1 ? 'butt' : 'round'}
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            );
            acc += dash;
            return el;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: theme.txt0, letterSpacing: '-0.02em' }}>{centerValue}</span>
          <span style={{ fontSize: 9.5, color: theme.txt2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{centerLabel}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 130 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: theme.txt1, flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.txt0 }}>{s.value}</span>
            <span style={{ fontSize: 10, color: theme.txt2, width: 32, textAlign: 'right' }}>{pct(s.value, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Radial gauge — single-value progress ring (used for approval rate).
const RadialGauge = ({ theme, value, size = 132, thickness = 13, color, label }) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamp(value, 0, 100) / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.bg4} strokeWidth={thickness} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={thickness}
            strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 25, fontWeight: 700, color: theme.txt0, letterSpacing: '-0.02em' }}>{value}%</span>
        </div>
      </div>
      {label && <span style={{ fontSize: 11, color: theme.txt2, textAlign: 'center' }}>{label}</span>}
    </div>
  );
};

// Smooth area trend — viewBox(0,0,100,100) + non-scaling-stroke means this
// stays crisp at any container width with zero resize-observer plumbing.
const TrendChart = ({ theme, data, color, height = 132 }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? 100 / (data.length - 1) : 100;
  const points = data.map((d, i) => ({ ...d, x: i * stepX, y: 96 - (d.value / max) * 84 }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} 100 L ${points[0].x.toFixed(2)} 100 Z`;
  const gradId = `dashAnalyticsTrend-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <div style={{ width: '100%', height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke={theme.bdr0} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 2.6 : 1.4} fill={i === points.length - 1 ? color : theme.bg1} stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke">
            <title>{`${p.shortLabel || p.label}: ${p.value}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

// GitHub-style contribution heatmap — last N weeks of submission volume.
const ActivityHeatmap = ({ theme, weeks, color }) => {
  const max = Math.max(1, ...weeks.flat().map((d) => d.value));
  return (
    <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 2 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {week.map((day, di) => {
            const intensity = day.value === 0 ? 0 : clamp(day.value / max, 0.22, 1);
            return (
              <div
                key={di}
                title={`${day.shortLabel}: ${day.value} file${day.value === 1 ? '' : 's'}`}
                style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: day.value === 0 ? theme.bg3 : hexToRgba(color, intensity),
                  border: `1px solid ${day.value === 0 ? theme.bdr0 : hexToRgba(color, Math.min(1, intensity + 0.2))}`,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Compact horizontal progress row — leaderboard / department breakdown.
const ProgressRow = ({ theme, leftLabel, rightLabel, value, total, color, sub }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: theme.txt0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leftLabel}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.txt0, flexShrink: 0 }}>{rightLabel}</span>
    </div>
    <div style={{ borderRadius: 999, background: theme.bg4, height: 7, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 999, transition: 'width 0.5s', width: `${pct(value, total)}%`, background: color }} />
    </div>
    {sub && <span style={{ fontSize: 10.5, color: theme.txt2 }}>{sub}</span>}
  </div>
);

/* ════════════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════════════ */
const TREND_RANGES = [7, 14, 30];
const HEATMAP_WEEKS = 12;
const PALETTE_CYCLE = ['accent', 'violet', 'cyan', 'amber', 'emerald', 'rose'];

const DashboardAnalytics = ({
  theme,
  variant = 'employee',
  files = [],
  tasks = [],
  employees = [],
  title,
  subtitle,
  onNavigate,
}) => {
  const T = theme;
  const isAdmin = variant === 'admin';
  const [trendDays, setTrendDays] = useState(14);

  /* ── Status distribution & rates ── */
  const statusCounts = useMemo(() => {
    const c = { pending: 0, reviewing: 0, approved: 0, rejected: 0 };
    files.forEach((f) => { if (c[f.status] !== undefined) c[f.status] += 1; });
    return c;
  }, [files]);

  const decided = statusCounts.approved + statusCounts.rejected;
  const approvalRate = pct(statusCounts.approved, decided);
  const rejectionRate = pct(statusCounts.rejected, decided);
  const awaitingAction = statusCounts.pending + statusCounts.reviewing;

  const statusSegments = useMemo(() => [
    { label: 'Approved', value: statusCounts.approved, color: T.emerald },
    { label: 'Pending', value: statusCounts.pending, color: T.amber },
    { label: 'Reviewing', value: statusCounts.reviewing, color: T.accent },
    { label: 'Rejected', value: statusCounts.rejected, color: T.rose },
  ], [statusCounts, T]);

  /* ── Submission trend (toggle-able window) ── */
  const trendBuckets = useMemo(() => buildDayBuckets(files, trendDays, (f) => f.createdAt), [files, trendDays]);
  const trendDelta = useMemo(() => periodDelta(trendBuckets), [trendBuckets]);
  const trendTotal = useMemo(() => trendBuckets.reduce((s, b) => s + b.value, 0), [trendBuckets]);

  /* ── Contribution-style activity heatmap (last 12 weeks) ── */
  const heatmapWeeks = useMemo(() => {
    const days = buildDayBuckets(files, HEATMAP_WEEKS * 7, (f) => f.createdAt);
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  }, [files]);

  /* ── Turnaround time (only computed if the backend actually sends a
        second timestamp — never fabricated from createdAt alone) ── */
  const turnaroundDays = useMemo(() => {
    const samples = [];
    files.forEach((f) => {
      if (f.status !== 'approved' && f.status !== 'rejected') return;
      const reviewedAt = getReviewedAt(f);
      if (!reviewedAt || !f.createdAt) return;
      const diff = (new Date(reviewedAt) - new Date(f.createdAt)) / 86400000;
      if (Number.isFinite(diff) && diff >= 0) samples.push(diff);
    });
    if (!samples.length) return null;
    return Math.round((samples.reduce((s, v) => s + v, 0) / samples.length) * 10) / 10;
  }, [files]);

  /* ── Due dates (tasks) — overdue / due soon / upcoming ── */
  const dueGroups = useMemo(() => {
    const today = startOfDay(new Date());
    const open = tasks.filter((t) => t.status !== 'done');
    const withDue = [];
    open.forEach((t) => {
      if (!t.dueDate) return;
      const d = startOfDay(new Date(t.dueDate));
      if (Number.isNaN(d.getTime())) return;
      const diffDays = Math.round((d - today) / 86400000);
      withDue.push({ ...t, diffDays });
    });
    const overdue = withDue.filter((t) => t.diffDays < 0).sort((a, b) => a.diffDays - b.diffDays);
    const dueSoon = withDue.filter((t) => t.diffDays >= 0 && t.diffDays <= 3).sort((a, b) => a.diffDays - b.diffDays);
    const upcoming = withDue.filter((t) => t.diffDays > 3).sort((a, b) => a.diffDays - b.diffDays);
    return { overdue, dueSoon, upcoming, openCount: open.length, noDueCount: open.length - withDue.length };
  }, [tasks]);

  const dueList = useMemo(
    () => [...dueGroups.overdue, ...dueGroups.dueSoon, ...dueGroups.upcoming].slice(0, 6),
    [dueGroups],
  );

  /* ── Feedback feed — reviewer notes on decided files ── */
  const feedbackFeed = useMemo(() => {
    return files
      .map((f) => ({ file: f, note: getFeedback(f) }))
      .filter((x) => x.note)
      .sort((a, b) => new Date(getReviewedAt(b.file) || b.file.createdAt) - new Date(getReviewedAt(a.file) || a.file.createdAt))
      .slice(0, 6);
  }, [files]);

  /* ── Admin-only: per-employee leaderboard & department mix ── */
  const employeeStats = useMemo(() => {
    if (!isAdmin) return [];
    const map = new Map();
    files.forEach((f) => {
      const key = f.userEmail || f.userId || f.userName || 'unknown';
      if (!map.has(key)) {
        map.set(key, { key, name: f.userName || f.userEmail || 'Unknown', total: 0, approved: 0, rejected: 0, pending: 0, reviewing: 0 });
      }
      const row = map.get(key);
      row.total += 1;
      if (f.status === 'approved') row.approved += 1;
      else if (f.status === 'rejected') row.rejected += 1;
      else if (f.status === 'reviewing') row.reviewing += 1;
      else row.pending += 1;
    });
    return Array.from(map.values())
      .map((r) => ({ ...r, rate: (r.approved + r.rejected) ? pct(r.approved, r.approved + r.rejected) : null }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [files, isAdmin]);

  const departmentStats = useMemo(() => {
    if (!isAdmin) return [];
    const map = new Map();
    files.forEach((f) => {
      const dep = f.department || 'Unassigned';
      map.set(dep, (map.get(dep) || 0) + 1);
    });
    const maxCount = Math.max(1, ...map.values());
    return Array.from(map.entries())
      .map(([department, count]) => ({ department, count, maxCount }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [files, isAdmin]);

  /* ── KPI tiles ── */
  const kpis = useMemo(() => {
    const tiles = [
      { key: 'total', icon: Ic.Doc, label: 'Total Submissions', value: files.length, sub: `${statusCounts.pending} pending review`, trend: trendDelta, color: T.accent, onClick: onNavigate ? () => onNavigate('files') : undefined },
      { key: 'approval', icon: Ic.Check, label: 'Approval Rate', value: `${approvalRate}%`, sub: decided ? `${statusCounts.approved} of ${decided} decided` : 'No decisions yet', color: T.emerald },
      { key: 'rejected', icon: Ic.X, label: 'Rejected', value: statusCounts.rejected, sub: decided ? `${rejectionRate}% rejection rate` : 'No decisions yet', color: T.rose },
      { key: 'awaiting', icon: Ic.Clock, label: 'Awaiting Action', value: awaitingAction, sub: `${statusCounts.reviewing} in review`, color: T.amber, onClick: onNavigate ? () => onNavigate('pending') : undefined },
      { key: 'overdue', icon: Ic.AlertTriangle, label: 'Overdue Tasks', value: dueGroups.overdue.length, sub: `${dueGroups.dueSoon.length} due within 3 days`, color: T.violet, onClick: onNavigate ? () => onNavigate('tasks') : undefined },
    ];
    if (turnaroundDays !== null) {
      tiles.push({ key: 'turnaround', icon: Ic.Activity, label: 'Avg. Turnaround', value: `${turnaroundDays}d`, sub: 'submit → decision', color: T.cyan });
    } else if (isAdmin) {
      tiles.push({ key: 'submitters', icon: Ic.Users, label: 'Active Submitters', value: employeeStats.length, sub: `of ${employees.length || employeeStats.length} employees`, color: T.cyan, onClick: onNavigate ? () => onNavigate('employees') : undefined });
    } else {
      tiles.push({ key: 'thisweek', icon: Ic.Chart, label: 'This Week', value: trendBuckets.slice(-7).reduce((s, b) => s + b.value, 0), sub: 'files submitted', color: T.cyan });
    }
    return tiles;
  }, [files.length, statusCounts, approvalRate, rejectionRate, decided, awaitingAction, trendDelta, dueGroups, turnaroundDays, isAdmin, employeeStats.length, employees.length, trendBuckets, onNavigate, T]);

  /* ── CSV export of the current summary (distinct from a raw file export) ── */
  const handleExportSummary = () => {
    exportToCSV([
      { metric: 'Total submissions', value: files.length },
      { metric: 'Approved', value: statusCounts.approved },
      { metric: 'Rejected', value: statusCounts.rejected },
      { metric: 'Pending', value: statusCounts.pending },
      { metric: 'Reviewing', value: statusCounts.reviewing },
      { metric: 'Approval rate (%)', value: approvalRate },
      { metric: 'Overdue tasks', value: dueGroups.overdue.length },
      { metric: 'Avg turnaround (days)', value: turnaroundDays ?? 'n/a' },
    ], 'analytics-summary');
  };

  const headerTitle = title || (isAdmin ? 'Analytics Overview' : 'My Analytics');
  const headerSubtitle = subtitle || (isAdmin ? "Org-wide submission performance across your team" : 'Your submission performance and reviewer feedback');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 650, color: T.txt0, letterSpacing: '-0.01em', margin: 0 }}>{headerTitle}</h2>
          <p style={{ fontSize: 12, color: T.txt2, margin: '3px 0 0' }}>{headerSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleExportSummary}
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '7px 13px', fontSize: 11.5, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          <Ic.Download /> Export summary
        </button>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(168px,1fr))', gap: 12 }}>
        {kpis.map((k) => (
          <StatTile key={k.key} theme={T} icon={k.icon} label={k.label} value={k.value} sub={k.sub} trend={k.trend} color={k.color} onClick={k.onClick} />
        ))}
      </div>

      {/* ── Status distribution / trend / approval gauge ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <Panel theme={T} title="Status Distribution" subtitle={`${files.length} total files`} icon={Ic.Chart} iconColor={T.violet}>
          {files.length === 0
            ? <EmptyState theme={T} icon={Ic.Doc} title="No files yet" subtitle="Submission status will appear here once files come in." />
            : <DonutChart theme={T} segments={statusSegments} centerValue={files.length} centerLabel="Files" />}
        </Panel>

        <Panel
          theme={T} title="Submission Trend" subtitle={`${trendTotal} files · last ${trendDays} days`} icon={Ic.Activity} iconColor={T.accent}
          action={(
            <div style={{ display: 'flex', gap: 4, background: T.bg3, borderRadius: 9, padding: 3 }}>
              {TREND_RANGES.map((d) => (
                <button key={d} type="button" onClick={() => setTrendDays(d)} style={{
                  border: 'none', borderRadius: 7, padding: '4px 9px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  background: trendDays === d ? T.accent : 'transparent', color: trendDays === d ? '#fff' : T.txt2,
                }}>{d}d</button>
              ))}
            </div>
          )}
        >
          {files.length === 0
            ? <EmptyState theme={T} icon={Ic.Activity} title="Nothing to plot yet" subtitle="The trend line fills in as files are submitted." />
            : <TrendChart theme={T} data={trendBuckets} color={T.accent} />}
        </Panel>

        <Panel theme={T} title="Approval Rate" subtitle="Approved vs. rejected" icon={Ic.Check} iconColor={T.emerald}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, flexWrap: 'wrap' }}>
            <RadialGauge theme={T} value={approvalRate} color={decided === 0 ? T.txt2 : T.emerald} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.emerald }}>{statusCounts.approved}</p>
                <p style={{ margin: 0, fontSize: 10.5, color: T.txt2 }}>Approved</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.rose }}>{statusCounts.rejected}</p>
                <p style={{ margin: 0, fontSize: 10.5, color: T.txt2 }}>Rejected</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Activity heatmap ── */}
      <Panel theme={T} title="Submission Activity" subtitle={`Daily volume · last ${HEATMAP_WEEKS} weeks`} icon={Ic.Doc} iconColor={T.accent}>
        {files.length === 0 ? (
          <EmptyState theme={T} icon={Ic.Doc} title="No activity yet" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ActivityHeatmap theme={T} weeks={heatmapWeeks} color={T.accent} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.txt2 }}>
              <span>Less</span>
              {[0.22, 0.45, 0.7, 1].map((v) => (
                <span key={v} style={{ width: 11, height: 11, borderRadius: 3, background: hexToRgba(T.accent, v) }} />
              ))}
              <span>More</span>
            </div>
          </div>
        )}
      </Panel>

      {/* ── Due dates & feedback ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
        <Panel
          theme={T} title="Due Dates" subtitle={`${dueGroups.openCount} open task${dueGroups.openCount === 1 ? '' : 's'}`} icon={Ic.Calendar} iconColor={T.violet}
          action={onNavigate ? (
            <button type="button" onClick={() => onNavigate('tasks')} style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>View all</button>
          ) : null}
        >
          {dueGroups.openCount === 0 ? (
            <EmptyState theme={T} icon={Ic.Check} title="All caught up" subtitle="No open tasks right now." />
          ) : dueList.length === 0 ? (
            <EmptyState theme={T} icon={Ic.Calendar} title="No due dates set" subtitle="Open tasks don't have a due date yet." />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.rose, background: T.roseD, borderRadius: 999, padding: '3px 10px' }}>{dueGroups.overdue.length} overdue</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.amber, background: T.amberD, borderRadius: 999, padding: '3px 10px' }}>{dueGroups.dueSoon.length} due soon</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.accent, background: T.accentL, borderRadius: 999, padding: '3px 10px' }}>{dueGroups.upcoming.length} upcoming</span>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dueList.map((t) => (
                  <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, border: `1px solid ${T.bdr0}`, padding: '9px 12px' }}>
                    <Ic.Flag style={{ color: t.priority === 'high' ? T.rose : t.priority === 'medium' ? T.amber : T.txt2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: T.txt0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</p>
                      {isAdmin && <p style={{ margin: '2px 0 0', fontSize: 11, color: T.txt2 }}>{getAssigneeName(t)}</p>}
                    </div>
                    <DueChip theme={T} diffDays={t.diffDays} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel
          theme={T} title="Reviewer Feedback" subtitle="Latest notes on approved & rejected files" icon={Ic.Message} iconColor={T.cyan}
          action={onNavigate ? (
            <button type="button" onClick={() => onNavigate('files')} style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>View all</button>
          ) : null}
        >
          {feedbackFeed.length === 0 ? (
            <EmptyState theme={T} icon={Ic.Message} title="No feedback yet" subtitle="Notes left on approved or rejected files will show up here." />
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feedbackFeed.map(({ file, note }) => (
                <li key={file.id} style={{ borderRadius: 12, border: `1px solid ${T.bdr0}`, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: T.txt0, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.originalName || 'Untitled file'}</p>
                    <StatusTag theme={T} status={file.status} />
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: T.txt1, fontStyle: 'italic', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{note}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    {isAdmin && <span style={{ fontSize: 10.5, color: T.txt2 }}>{file.userName || file.userEmail}</span>}
                    <span style={{ fontSize: 10.5, color: T.txt2, marginLeft: 'auto' }}>{timeAgo(getReviewedAt(file) || file.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Admin-only: team leaderboard & department mix ── */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
          <Panel theme={T} title="Team Performance" subtitle={`${employeeStats.length} of ${employees.length || employeeStats.length} employees have submitted files`} icon={Ic.Users} iconColor={T.accent}>
            {employeeStats.length === 0 ? (
              <EmptyState theme={T} icon={Ic.Users} title="No submissions yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {employeeStats.map((row) => {
                  const decidedForRow = row.approved + row.rejected;
                  const barColor = row.rate === null ? T.txt2 : row.rate >= 80 ? T.emerald : row.rate >= 50 ? T.amber : T.rose;
                  return (
                    <ProgressRow
                      key={row.key}
                      theme={T}
                      leftLabel={row.name}
                      rightLabel={row.rate === null ? '—' : `${row.rate}%`}
                      value={row.approved}
                      total={decidedForRow || 1}
                      color={barColor}
                      sub={`${row.total} submitted · ${row.approved} approved · ${row.rejected} rejected${row.pending ? ` · ${row.pending} pending` : ''}`}
                    />
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel theme={T} title="Department Mix" subtitle="Files submitted by department" icon={Ic.Building} iconColor={T.violet}>
            {departmentStats.length === 0 ? (
              <EmptyState theme={T} icon={Ic.Building} title="No department data yet" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {departmentStats.map((row, i) => (
                  <ProgressRow
                    key={row.department}
                    theme={T}
                    leftLabel={row.department}
                    rightLabel={row.count}
                    value={row.count}
                    total={row.maxCount}
                    color={T[PALETTE_CYCLE[i % PALETTE_CYCLE.length]] || T.accent}
                    sub={`${pct(row.count, files.length)}% of all files`}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
};

export default DashboardAnalytics;