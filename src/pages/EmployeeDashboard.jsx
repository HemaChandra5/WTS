import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';

import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth }      from '../context/AuthContext';
import { useFiles }     from '../context/FilesContext';
import { useTasks }     from '../context/TasksContext';
import { api }          from '../api';

import FileUpload    from '../components/FileUpload';
import FileList      from '../components/FileList';
import PreviewModal  from '../components/PreviewModal';
import StatusBadge   from '../components/StatusBadge';

import { formatLongDate, formatTime, isSameDay, isWithinDays } from '../utils/dateUtils';

// ─── Design tokens — light SaaS-style palette ───────────────────────────
const T = {
  bg0: '#F7F9FC',
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.03)',
  bg3: 'rgba(15,23,42,0.06)',
  bg4: 'rgba(15,23,42,0.09)',
  glass: '#FFFFFF',
  glassBorder: 'rgba(15,23,42,0.10)',
  bdr0: 'rgba(15,23,42,0.06)',
  bdr1: 'rgba(15,23,42,0.10)',
  bdr2: 'rgba(15,23,42,0.16)',
  accent: '#4F46E5',
  accentB: '#4338CA',
  accentL: 'rgba(79,70,229,0.12)',
  accentG: 'rgba(79,70,229,0.08)',
  txt0: '#0F172A',
  txt1: '#475569',
  txt2: '#64748B',
  emerald: '#10B981',
  emeraldD: 'rgba(16,185,129,0.12)',
  amber: '#F59E0B',
  amberD: 'rgba(245,158,11,0.14)',
  rose: '#F43F5E',
  roseD: 'rgba(244,63,94,0.12)',
  violet: '#8B5CF6',
  violetD: 'rgba(139,92,246,0.12)',
  cyan: '#14B8A6',
  cyanD: 'rgba(20,184,166,0.12)',
  neutral: '#64748B',
  neutralDim: '#94A3B8',
};

/* ─── Constants ───────────────────────────────────────────────────────────── */
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const WS_BASE_URL  = import.meta.env.VITE_WS_URL  || API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: T.txt1,    bg: 'rgba(160,168,192,0.10)', border: 'rgba(160,168,192,0.15)' },
  medium: { label: 'Medium', color: T.amber,   bg: T.amberD,                 border: 'rgba(245,166,35,0.2)'   },
  high:   { label: 'High',   color: T.rose,    bg: T.roseD,                  border: 'rgba(255,95,126,0.2)'   },
};

const TASK_STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: T.amber,   bg: T.amberD,   border: 'rgba(245,166,35,0.2)'  },
  in_progress: { label: 'In Progress', color: T.accent,  bg: T.accentL,  border: 'rgba(59,124,255,0.2)'  },
  done:        { label: 'Completed',   color: T.emerald, bg: T.emeraldD, border: 'rgba(16,232,160,0.2)'  },
};

const STATUS_CONFIG = {
  pending:   { color: T.amber,   bg: T.amberD,   border: 'rgba(245,166,35,0.2)',  label: 'Pending review'  },
  reviewing: { color: T.accent,  bg: T.accentL,  border: 'rgba(79,124,255,0.2)', label: 'Under review'    },
  approved:  { color: T.emerald, bg: T.emeraldD, border: 'rgba(16,232,160,0.2)', label: 'Approved'         },
  rejected:  { color: T.rose,    bg: T.roseD,    border: 'rgba(244,63,94,0.2)',  label: 'Rejected'         },
};

const ACTION_LABELS = {
  login: 'Login', register: 'Register', approve_user: 'User Approved', reject_user: 'User Rejected',
  create_task: 'Task Created', update_task: 'Task Updated', delete_task: 'Task Deleted',
  upload_file: 'File Uploaded', review_file: 'File Reviewing', approve_file: 'File Approved',
  reject_file: 'File Rejected', delete_file: 'File Deleted', share_file: 'File Shared', unshare_file: 'File Unshared',
};

const ACTIVITY_DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' }, { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }, { value: 'all', label: 'All time' },
];
const ACTIVITY_ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '0 B';
  const s = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${s[i]}`;
};

const getType = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return 'other';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc','docx','ppt','pptx'].includes(ext)) return 'doc';
  if (['xls','xlsx','csv','tsv','json'].includes(ext)) return 'data';
  return 'other';
};

const upsertById = (arr, item) => {
  if (!item?.id) return arr;
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx === -1) return [item, ...arr];
  const copy = [...arr]; copy[idx] = { ...copy[idx], ...item }; return copy;
};

const normalizeActivityEntry = (entry = {}) => ({
  id: entry.id,
  action: ACTION_LABELS[entry.action] || (entry.action || 'Activity').replace(/_/g, ' '),
  detail: entry.description || '',
  time: entry.created_at || entry.time || new Date().toISOString(),
  rawAction: entry.action || '',
});

const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

const firstName = (name = '') => name.trim().split(' ')[0] || name;
const getGreeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 5) return 'Good night'; if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon'; if (h < 21) return 'Good evening';
  return 'Good night';
};

/* ─── Icons — exact same inline SVG set as AdminDashboard ─────────────────── */
const I = {
  Doc:         (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Cloud:       (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  CheckCircle: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 16 9"/></svg>,
  XCircle:     (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Clock:       (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Eye:         (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Chart:       (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="9.5" y="7" width="4" height="14" rx="1"/><rect x="16" y="4" width="4" height="17" rx="1"/></svg>,
  ListBullet:  (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Search:      (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Download:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Flag:        (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  Calendar:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  ChevLeft:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
  ChevRight:   (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  ChevDown:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="6 9 12 15 18 9"/></svg>,
  ChevUp:      (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="18 15 12 9 6 15"/></svg>,
  X:           (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Info:        (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Shield:      (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Exclaim:     (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Sparkle:     (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
  ArrowUp:     (p) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  ArrowDown:   (p) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Grid:        (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Adjustments: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
};

/* ─── Toast — copied from AdminDashboard ──────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
    {toasts.map(t => {
      const colors = {
        success: { bg: '#ECFDF5', border: 'rgba(16,232,160,0.3)', text: '#0A6B49', icon: T.emerald },
        error:   { bg: '#FEF2F2', border: 'rgba(255,95,126,0.3)', text: '#9F1D39', icon: T.rose    },
        info:    { bg: T.bg3,     border: T.bdr2,                  text: T.txt0,    icon: T.accent  },
      };
      const c = colors[t.type] || colors.info;
      return (
        <div key={t.id} style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 16, background: c.bg, border: `1px solid ${c.border}`, boxShadow: '0 8px 30px rgba(15,23,42,0.16)', animation: 'slideUp 0.28s cubic-bezier(.16,1,.3,1)', minWidth: 220, maxWidth: 340, fontSize: 13.5, fontWeight: 500, color: c.text }}>
          {t.type === 'success' && <I.CheckCircle style={{ color: c.icon, flexShrink: 0 }} />}
          {t.type === 'error'   && <I.XCircle    style={{ color: c.icon, flexShrink: 0 }} />}
          {t.type === 'info'    && <I.Info       style={{ color: c.icon, flexShrink: 0 }} />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.6, display: 'flex', padding: 2 }}><I.X /></button>
        </div>
      );
    })}
  </div>
);

/* ─── Card — glass panel, copied from AdminDashboard ─────────────────────── */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)',
    border: `1px solid ${T.glassBorder}`, borderRadius: 18, padding: 18, ...style,
  }}>{children}</div>
);

/* ─── StatCard — copied 1:1 from AdminDashboard ──────────────────────────── */
const STAT_TINTS = {
  indigo:  { wash: 'rgba(52,84,209,0.10)',   edge: 'rgba(52,84,209,0.22)',   icon: T.accent   },
  amber:   { wash: 'rgba(183,121,31,0.10)',  edge: 'rgba(183,121,31,0.22)',  icon: T.amber    },
  emerald: { wash: 'rgba(14,159,110,0.10)',  edge: 'rgba(14,159,110,0.22)',  icon: T.emerald  },
  violet:  { wash: 'rgba(109,79,224,0.10)',  edge: 'rgba(109,79,224,0.22)',  icon: T.violet   },
  rose:    { wash: 'rgba(194,53,82,0.10)',   edge: 'rgba(194,53,82,0.22)',   icon: T.rose     },
  sky:     { wash: 'rgba(14,132,165,0.10)',  edge: 'rgba(14,132,165,0.22)',  icon: T.cyan     },
};
const StatCard = ({ icon: Icon, label, value, sub, trend, color, onClick }) => {
  const [hov, setHov] = useState(false);
  const tint = STAT_TINTS[color] || STAT_TINTS.indigo;
  return (
    <button onClick={onClick} type="button"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '18px 20px',
        background: `linear-gradient(160deg, ${tint.wash}, ${T.bg1})`,
        backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        border: `1px solid ${hov ? tint.edge : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer',
        textAlign: 'left', width: '100%', transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 16px 32px rgba(15,23,42,0.22), 0 0 0 1px ${tint.edge}` : '0 2px 10px rgba(15,23,42,0.12)',
        fontFamily: 'inherit',
      }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: tint.wash, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${tint.edge}`, padding: 9, display: 'flex' }}>
            <Icon style={{ color: tint.icon }} />
          </div>
          {trend !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, borderRadius: 999, padding: '2px 7px', fontSize: 10, fontWeight: 700, background: T.bg3, color: T.txt1, border: `1px solid ${T.bdr1}` }}>
              {trend >= 0 ? <I.ArrowUp /> : <I.ArrowDown />}{Math.abs(trend)}%
            </div>
          )}
        </div>
        <p style={{ fontSize: '1.7rem', fontWeight: 700, color: T.txt0, letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt1, margin: '7px 0 0' }}>{label}</p>
        {sub && <p style={{ fontSize: 10.5, color: T.txt2, margin: '3px 0 0' }}>{sub}</p>}
      </div>
    </button>
  );
};

/* ─── Pagination — copied from AdminDashboard ────────────────────────────── */
const Pagination = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  const btn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10,
    border: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.03)', color: T.txt1, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12, transition: 'background 0.15s, border-color 0.15s',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, padding: '14px 20px' }}>
      <span style={{ fontSize: 11.5, color: T.txt2, fontWeight: 500 }}>
        Page <span style={{ color: T.txt0, fontWeight: 700 }}>{current}</span> of {total}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {current > 1 && (
          <button onClick={() => onChange(current - 1)} style={btn}
            onMouseEnter={e => { e.currentTarget.style.background = T.bg4; e.currentTarget.style.borderColor = T.bdr2; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = T.bdr1; }}>
            <I.ChevLeft />
          </button>
        )}
        {current < total && (
          <button onClick={() => onChange(current + 1)} style={btn}
            onMouseEnter={e => { e.currentTarget.style.background = T.bg4; e.currentTarget.style.borderColor = T.bdr2; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = T.bdr1; }}>
            <I.ChevRight />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Mini Bar Chart — copied from AdminDashboard ────────────────────────── */
const MiniBarChart = ({ data, color = T.accent }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1 }} title={`${d.label}: ${d.value}`}>
          <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0, background: color }} />
        </div>
      ))}
    </div>
  );
};

/* ─── Task Row ────────────────────────────────────────────────────────────── */
const TaskRow = ({ task, onStatusChange }) => {
  const cfg      = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.pending;
  const priCfg   = PRIORITY_CONFIG[task.priority]  || PRIORITY_CONFIG.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  return (
    <li style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, borderRadius: 13, padding: '14px 16px', listStyle: 'none',
      border: `1px solid ${isOverdue ? 'rgba(244,63,94,0.25)' : T.bdr0}`,
      background: isOverdue ? 'rgba(244,63,94,0.05)' : T.bg2,
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = isOverdue ? 'rgba(244,63,94,0.4)' : T.bdr2; e.currentTarget.style.background = isOverdue ? 'rgba(244,63,94,0.08)' : T.bg3; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = isOverdue ? 'rgba(244,63,94,0.25)' : T.bdr0; e.currentTarget.style.background = isOverdue ? 'rgba(244,63,94,0.05)' : T.bg2; }}>
      <div style={{ display: 'flex', height: 34, width: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, marginTop: 2 }}>
        {task.status === 'done'        && <I.CheckCircle style={{ color: cfg.color }} />}
        {task.status === 'in_progress' && <I.Eye         style={{ color: cfg.color }} />}
        {task.status === 'pending'     && <I.Clock       style={{ color: cfg.color }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0 }}>{task.title}</p>
          {isOverdue && <span style={{ fontSize: 10, fontWeight: 700, color: T.rose, background: T.roseD, border: `1px solid rgba(244,63,94,0.25)`, borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em' }}>OVERDUE</span>}
        </div>
        {task.description && <p style={{ fontSize: 12.5, color: T.txt2, margin: '4px 0 0', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
          {task.dueDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: isOverdue ? T.rose : T.txt2, fontWeight: isOverdue ? 600 : 400 }}><I.Calendar />Due {formatDate(task.dueDate)}</span>}
          <span style={{ fontSize: 11, color: T.neutralDim }}>Assigned by admin · {timeAgo(task.createdAt)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, borderRadius: 6, padding: '3px 9px', background: priCfg.bg, color: priCfg.color, border: `1px solid ${priCfg.border}`, letterSpacing: '0.03em' }}>
          <I.Flag />{priCfg.label}
        </span>
        <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)} style={{ borderRadius: 8, border: `1px solid ${T.bdr1}`, padding: '6px 10px', fontSize: 11.5, fontWeight: 600, background: T.bg3, color: T.txt1, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Completed</option>
        </select>
      </div>
    </li>
  );
};

/* ─── Task Section Accordion ─────────────────────────────────────────────── */
const TaskSection = ({ title, status, tasks, count, isOpen, onToggle, onStatusChange }) => {
  const cfg = TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.pending;
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${isOpen ? cfg.border : T.bdr0}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={onToggle} type="button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: isOpen ? cfg.bg : T.bg2, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${cfg.border}` }}>
            {status === 'done'        && <I.CheckCircle style={{ color: cfg.color }} />}
            {status === 'in_progress' && <I.Eye         style={{ color: cfg.color }} />}
            {status === 'pending'     && <I.Clock       style={{ color: cfg.color }} />}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0 }}>{title}</p>
            <p style={{ fontSize: 11.5, color: T.txt2, margin: '1px 0 0' }}>{count} task{count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: cfg.color, borderRadius: 7, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#04070B' }}>{count}</span>
          {isOpen ? <I.ChevUp style={{ color: T.txt2 }} /> : <I.ChevDown style={{ color: T.txt2 }} />}
        </div>
      </button>
      {isOpen && (
        <div style={{ background: T.bg1, padding: '16px 18px', borderTop: `1px solid ${T.bdr0}` }}>
          {tasks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', border: `1.5px dashed ${T.bdr1}`, borderRadius: 10, textAlign: 'center' }}>
              <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: T.txt2 }}>No {title.toLowerCase()} tasks</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── File Activity Row ───────────────────────────────────────────────────── */
const FileActivityRow = ({ file }) => {
  const cfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: `1px solid ${T.bdr0}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cfg.border}` }}>
        {file.status === 'approved'  && <I.CheckCircle style={{ color: cfg.color }} />}
        {file.status === 'rejected'  && <I.XCircle     style={{ color: cfg.color }} />}
        {file.status === 'reviewing' && <I.Eye         style={{ color: cfg.color }} />}
        {file.status === 'pending'   && <I.Clock       style={{ color: cfg.color }} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.originalName}</p>
        <p style={{ fontSize: 11.5, color: T.txt2, margin: '2px 0 0' }}>{file.description || 'No description'}</p>
        {file.adminNote && <p style={{ fontSize: 11, color: T.accent, margin: '3px 0 0', fontStyle: 'italic' }}>Admin: "{file.adminNote}"</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <StatusBadge status={file.status} size="sm" />
        <span style={{ fontSize: 10.5, color: T.txt2 }}>{formatTime(file.createdAt)}</span>
      </div>
    </li>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const { user }                                               = useAuth();
  const { files, fetchFiles, applyRealtimeFileUpdate }         = useFiles();
  const { tasks, updateTaskStatus }                            = useTasks();

  if (!user) return (
    <div style={{ display: 'flex', height: 240, alignItems: 'center', justifyContent: 'center', fontSize: 13.5, color: T.txt2, fontFamily: 'inherit', background: T.bg0 }}>
      Loading dashboard…
    </div>
  );

  /* ── State ── */
  const [taskList,            setTaskList]            = useState(tasks || []);
  const [taskEventBadge,      setTaskEventBadge]      = useState(0);
  const [toasts,              setToasts]              = useState([]);
  const [activityLog,         setActivityLog]         = useState([]);
  const [activityLoading,     setActivityLoading]     = useState(false);
  const [activityLoadingMore, setActivityLoadingMore] = useState(false);
  const [activityHasMore,     setActivityHasMore]     = useState(true);
  const [activityPage,        setActivityPage]        = useState(1);
  const [activityAction,      setActivityAction]      = useState('all');
  const [activityDateRange,   setActivityDateRange]   = useState('30d');
  const [activeTab,           setActiveTab]           = useState('overview');
  const [viewMode,            setViewMode]            = useState('list');
  const [now, setNow] = useState(() => new Date());

  /* ── Filter State ── */
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,       setSortBy]       = useState('newest');
  const [search,       setSearch]       = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [range,        setRange]        = useState('30d');
  const [filePage,     setFilePage]     = useState(1);

  /* ── Task State ── */
  const [taskSearch,         setTaskSearch]         = useState('');
  const [taskStatusFilter,   setTaskStatusFilter]   = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskPage,           setTaskPage]           = useState(1);
  const [taskSectionsOpen,   setTaskSectionsOpen]   = useState({ pending: true, in_progress: true, done: false });
  const [previewFile,        setPreviewFile]        = useState(null);
  const [sendingToAdmin,     setSendingToAdmin]     = useState(null); // file being animated to upload
  const [prefilledUploadFile, setPrefilledUploadFile] = useState(null);
  const [deleteConfirm,      setDeleteConfirm]      = useState(null); // file pending deletion confirmation

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  useEffect(() => { setTaskList(tasks || []); }, [tasks]);
  useEffect(() => { if (activeTab === 'tasks' && taskEventBadge > 0) setTaskEventBadge(0); }, [activeTab, taskEventBadge]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id));

  const activityPassesActiveFilters = useCallback(entry => {
    if (!entry) return false;
    if (activityAction !== 'all' && entry.rawAction !== activityAction) return false;
    if (activityDateRange === 'all') return true;
    if (!entry.time) return false;
    if (activityDateRange === 'today') return isSameDay(entry.time);
    if (activityDateRange === '7d')    return isWithinDays(entry.time, 7);
    if (activityDateRange === '30d')   return isWithinDays(entry.time, 30);
    if (activityDateRange === '90d')   return isWithinDays(entry.time, 90);
    return true;
  }, [activityAction, activityDateRange]);

  const fetchActivityLogs = useCallback(async ({ page = 1, append = false } = {}) => {
    if (append) setActivityLoadingMore(true); else setActivityLoading(true);
    try {
      const res = await api.get('/activity/', { params: { page, page_size: 20, action: activityAction, date_range: activityDateRange } });
      const payload = res.data;
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
      const norm = rows.map(normalizeActivityEntry);
      setActivityLog(prev => {
        if (!append) return norm;
        const seen = new Set(prev.map(e => String(e.id)));
        return [...prev, ...norm.filter(e => !seen.has(String(e.id)))];
      });
      setActivityHasMore(!Array.isArray(payload) && Boolean(payload?.next));
      setActivityPage(page);
    } catch { addToast('Failed to load activity log', 'error'); }
    finally { if (append) setActivityLoadingMore(false); else setActivityLoading(false); }
  }, [activityAction, activityDateRange, addToast]);

  useEffect(() => { setActivityLog([]); setActivityPage(1); setActivityHasMore(true); fetchActivityLogs({ page: 1 }); }, [fetchActivityLogs]);

  useWebSocket(`${WS_BASE_URL}/ws/tasks/`, data => {
    if (data?.type === 'task_notification' && data.task) { setTaskList(p => upsertById(p, data.task)); if (activeTab !== 'tasks') setTaskEventBadge(c => c + 1); }
    if (data?.type === 'task_status_update') { setTaskList(p => p.map(t => t.id === data.taskId ? { ...t, status: data.status } : t)); if (activeTab !== 'tasks') setTaskEventBadge(c => c + 1); }
    if (data?.type === 'task_list' && Array.isArray(data.tasks)) setTaskList(data.tasks);
  }, err => console.error('WS tasks:', err));

  useWebSocket(`${WS_BASE_URL}/ws/files/`, data => {
    if (data?.type === 'file_notification' && data.file) applyRealtimeFileUpdate(data.file);
    if (data?.type === 'file_status_update') {
      if (data.status === 'approved') addToast('File approved by admin!', 'success');
      if (data.status === 'rejected') addToast('A file was rejected. Check My Files.', 'error');
    }
    if (data?.type === 'file_share_update' && data.file) {
      applyRealtimeFileUpdate(data.file);
      const ids = Array.isArray(data.targetUserIds) ? data.targetUserIds.map(String) : [];
      if (ids.includes(String(user.id))) addToast(data.action === 'shared' ? 'A file was shared with you.' : 'A shared file was removed.', 'info');
    }
  }, err => console.error('WS files:', err));

  useWebSocket(`${WS_BASE_URL}/ws/activity/`, data => {
    if (data?.type !== 'activity_event' || !data.activity) return;
    const norm = normalizeActivityEntry(data.activity);
    if (!activityPassesActiveFilters(norm)) return;
    setActivityLog(prev => prev.some(e => String(e.id) === String(norm.id)) ? prev : [norm, ...prev]);
  }, err => console.error('WS activity:', err));

  const handleUpload = async (file, description) => {
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('description', description);
      fd.append('original_name', file.name); fd.append('mime_type', file.type); fd.append('size', file.size);
      await api.post('/files/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSendingToAdmin(null);
      addToast('File uploaded successfully', 'success');
      await fetchFiles(); await fetchActivityLogs();
    } catch { addToast('File upload failed', 'error'); }
  };

  const handleTaskStatusChange = useCallback(async (taskId, status) => {
    setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    updateTaskStatus(taskId, status);
    addToast(`Task marked as ${status.replace('_', ' ')}`, 'success');
  }, [updateTaskStatus, addToast]);

  const handleSendToAdmin = useCallback(async (file) => {
    setSendingToAdmin(file);
    try {
      await api.post(`/files/${file.id}/send_to_admin/`);

      // Load the current file bytes so Upload tab can be pre-filled and ready.
      const downloadRes = await api.get(`/files/${file.id}/download/`, {
        responseType: 'blob',
      });
      const inferredName = file.originalName || file.fileName || `file-${file.id}`;
      const inferredType = file.mimeType || downloadRes.data?.type || 'application/octet-stream';
      const uploadReadyFile = new File([downloadRes.data], inferredName, { type: inferredType });
      setPrefilledUploadFile(uploadReadyFile);

      addToast(`"${file.originalName}" sent to admin for review`, 'success');
      await fetchFiles();
      setActiveTab('upload');
    } catch {
      addToast('Failed to send file to admin', 'error');
      setSendingToAdmin(null);
    }
  }, [addToast, fetchFiles]);

  const handleDeleteFile = useCallback((file) => {
    setDeleteConfirm(file);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    const file = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await api.delete(`/files/${file.id}/`);
      addToast(`"${file.originalName}" deleted`, 'success');
      await fetchFiles();
    } catch {
      addToast('Failed to delete file', 'error');
    }
  }, [deleteConfirm, addToast, fetchFiles]);

  const toggleTaskSection = status => setTaskSectionsOpen(prev => ({ ...prev, [status]: !prev[status] }));

  /* ── Derived data ── */
  const userFiles = useMemo(() => (files || []).filter(f => {
    const fId    = f.userId ?? f.user?.id ?? f.user?.userId;
    const fEmail = f.userEmail ?? f.user?.email;
    return (fId != null && String(fId) === String(user.id)) ||
           (typeof fEmail === 'string' && fEmail.toLowerCase() === user.email?.toLowerCase());
  }), [files, user.id, user.email]);

  const myTasks = useMemo(() => (taskList || []).filter(t => t.assignedToEmail === user.email), [taskList, user.email]);

  const tasksByStatus = useMemo(() => ({
    pending:     myTasks.filter(t => t.status === 'pending'),
    in_progress: myTasks.filter(t => t.status === 'in_progress'),
    done:        myTasks.filter(t => t.status === 'done'),
  }), [myTasks]);

  const stats = useMemo(() => {
    const totalSize      = userFiles.reduce((s, f) => s + (f.size || 0), 0);
    const todayCount     = userFiles.filter(f => isSameDay(f.createdAt)).length;
    const monthCount     = userFiles.filter(f => isWithinDays(f.createdAt, 30)).length;
    const approvedCount  = userFiles.filter(f => f.status === 'approved').length;
    const rejectedCount  = userFiles.filter(f => f.status === 'rejected').length;
    const pendingCount   = userFiles.filter(f => f.status === 'pending').length;
    const reviewingCount = userFiles.filter(f => f.status === 'reviewing').length;
    const overdueTasks   = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    return { totalFiles: userFiles.length, totalSize, todayCount, monthCount, approvedCount, rejectedCount, pendingCount, reviewingCount, overdueTasks, pendingTasks: tasksByStatus.pending.length, doneTasks: tasksByStatus.done.length };
  }, [userFiles, myTasks, tasksByStatus]);

  const weeklyTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { label: d.toLocaleDateString('en', { weekday: 'short' }), value: 0, date: d }; });
    userFiles.forEach(f => { if (!f.createdAt) return; const idx = days.findIndex(d => isSameDay(new Date(f.createdAt), d.date)); if (idx !== -1) days[idx].value++; });
    return days;
  }, [userFiles]);

  const rejectedFiles = useMemo(() => userFiles.filter(f => f.status === 'rejected'), [userFiles]);

  const filteredFiles = useMemo(() => {
    let list = [...userFiles];
    if (range === 'today') list = list.filter(f => isSameDay(f.createdAt));
    else if (range === '7d')  list = list.filter(f => isWithinDays(f.createdAt, 7));
    else if (range === '30d') list = list.filter(f => isWithinDays(f.createdAt, 30));
    if (selectedDate) { const d = new Date(selectedDate); list = list.filter(f => isSameDay(f.createdAt, d)); }
    if (typeFilter   !== 'all') list = list.filter(f => getType(f.originalName) === typeFilter);
    if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f => (f.originalName || '').toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q));
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name')   return (a.originalName || '').localeCompare(b.originalName || '');
      if (sortBy === 'size')   return (b.size || 0) - (a.size || 0);
      return 0;
    });
    return list;
  }, [userFiles, range, selectedDate, typeFilter, statusFilter, sortBy, search]);

  const paginatedFiles  = useMemo(() => { const s = (filePage - 1) * ITEMS_PER_PAGE; return filteredFiles.slice(s, s + ITEMS_PER_PAGE); }, [filteredFiles, filePage]);
  const totalFilePages  = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

  // Activity pagination
  const totalActivityPages = Math.ceil(activityLog.length / 10);
  const paginatedActivity  = useMemo(() => activityLog.slice((activityPage - 1) * 10, activityPage * 10), [activityLog, activityPage]);

  const filteredTasks = useMemo(() => {
    let list = [...myTasks];
    if (taskStatusFilter   !== 'all') list = list.filter(t => t.status   === taskStatusFilter);
    if (taskPriorityFilter !== 'all') list = list.filter(t => t.priority === taskPriorityFilter);
    const q = taskSearch.trim().toLowerCase();
    if (q) list = list.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    return list;
  }, [myTasks, taskStatusFilter, taskPriorityFilter, taskSearch]);

  const paginatedTasks = useMemo(() => { const s = (taskPage - 1) * ITEMS_PER_PAGE; return filteredTasks.slice(s, s + ITEMS_PER_PAGE); }, [filteredTasks, taskPage]);
  const totalTaskPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

  const greeting     = useMemo(() => getGreeting(now), [now]);
  const greetingEmoji = useMemo(() => { const h = now.getHours(); if (h < 5) return '🌙'; if (h < 12) return '☀️'; if (h < 17) return '🌤️'; if (h < 21) return '🌆'; return '🌙'; }, [now]);
  const todayLabel   = useMemo(() => now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }), [now]);

  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: I.Chart        },
    { id: 'upload',    label: 'Upload',    icon: I.Cloud        },
    { id: 'files',     label: 'My Files',  icon: I.Doc          },
    { id: 'tasks',     label: 'My Tasks',  icon: I.CheckCircle, badge: taskEventBadge || null },
    { id: 'activity',  label: 'Activity',  icon: I.ListBullet   },
  ];

  const inputSx = {
    borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3,
    padding: '8px 13px', fontSize: 12.5, fontWeight: 500, color: T.txt1,
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
  };
  const focusInput = e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentG}`; };
  const blurInput  = e => { e.currentTarget.style.borderColor = T.bdr1;   e.currentTarget.style.boxShadow = 'none'; };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: T.bg0, color: T.txt0, fontFamily: '"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Ambient glow — same as AdminDashboard */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -260, left: '50%', transform: 'translateX(-50%)', width: 1100, height: 480, borderRadius: '50%', filter: 'blur(90px)', background: 'radial-gradient(circle, rgba(79,70,229,0.10), rgba(79,70,229,0) 70%)' }} />
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px);  } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        ::placeholder { color: ${T.txt2}; }
        option { background: #0D121B; color: ${T.txt0}; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; filter: invert(1); }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '24px 28px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header — same structure as AdminDashboard ── */}
        <div style={{
          position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between',
          borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.bg1, padding: '20px 26px',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <div style={{
              display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13,
              background: `linear-gradient(160deg, ${T.accent}, ${T.accentB})`, color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em',
              boxShadow: '0 6px 16px rgba(52,84,209,0.28)',
            }}>
              {(firstName(user?.name) || 'E').slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 21, fontWeight: 650, color: T.txt0, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {greeting}, {firstName(user?.name) || 'there'}
                <span style={{ fontSize: 18 }} aria-hidden="true">{greetingEmoji}</span>
              </h1>
              <p style={{ fontSize: 12.5, color: T.txt1, lineHeight: 1.5, margin: '4px 0 0' }}>
                {user?.department || 'Employee Workspace'} · here's your personal workspace.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '7px 13px', fontSize: 11.5, fontWeight: 600, color: T.txt1 }}>
              <I.Calendar style={{ color: T.txt2 }} />{todayLabel}
            </div>
            {/* Alert badges */}
            {rejectedFiles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, border: `1px solid rgba(244,63,94,0.3)`, background: T.roseD, padding: '7px 13px', fontSize: 11.5, fontWeight: 700, color: T.rose, cursor: 'pointer' }}
                onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }}>
                <I.XCircle style={{ color: T.rose }} />{rejectedFiles.length} rejected
              </div>
            )}
            {stats.overdueTasks > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, border: `1px solid rgba(251,191,36,0.3)`, background: T.amberD, padding: '7px 13px', fontSize: 11.5, fontWeight: 700, color: T.amber, cursor: 'pointer' }}
                onClick={() => setActiveTab('tasks')}>
                <I.Exclaim style={{ color: T.amber }} />{stats.overdueTasks} overdue
              </div>
            )}
          </div>
        </div>

        {/* ── Stat Cards — same component as AdminDashboard ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          <StatCard icon={I.Doc}          label="Total Files"   value={stats.totalFiles}             sub={`${stats.todayCount} today`}           color="indigo"  onClick={() => setActiveTab('files')} />
          <StatCard icon={I.Cloud}        label="This Month"    value={stats.monthCount}             sub="files uploaded"                         color="sky"     onClick={() => { setActiveTab('files'); setRange('30d'); }} />
          <StatCard icon={I.Shield}       label="Approved"      value={stats.approvedCount}          sub={`${stats.pendingCount} pending`}        color="emerald" onClick={() => { setActiveTab('files'); setStatusFilter('approved'); }} />
          <StatCard icon={I.XCircle}      label="Rejected"      value={stats.rejectedCount}          sub={`${stats.reviewingCount} reviewing`}    color="rose"    onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }} />
          <StatCard icon={I.CheckCircle}  label="My Tasks"      value={myTasks.length}               sub={`${stats.pendingTasks} open`}           color="violet"  onClick={() => setActiveTab('tasks')} />
          <StatCard icon={I.Download}     label="Storage Used"  value={formatBytes(stats.totalSize)} sub="total uploaded"                         color="amber"   onClick={() => setActiveTab('files')} />
        </div>

        {/* ── Navigation — same structure as AdminDashboard ── */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: 5, borderRadius: 14, border: `1px solid ${T.glassBorder}`, background: T.bg1, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon; const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} type="button" style={{
                display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8, borderRadius: 10, padding: '9px 16px',
                fontSize: 13, fontWeight: active ? 650 : 500, transition: 'all 0.15s', whiteSpace: 'nowrap',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: active ? T.accent : 'transparent', color: active ? '#fff' : T.txt1,
                boxShadow: active ? '0 4px 12px rgba(52,84,209,0.28)' : 'none',
              }}>
                <Icon style={{ color: active ? '#fff' : T.txt2 }} />
                {tab.label}
                {tab.badge > 0 && <span style={{ borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, color: active ? T.accent : '#fff', background: active ? '#fff' : T.rose }}>{tab.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, animation: 'fadeIn 0.25s ease-out both' }}>

            {/* Weekly upload trend */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>Weekly Uploads</p>
                  <p style={{ fontSize: 11, color: T.txt2, margin: '3px 0 0' }}>Your uploads — last 7 days</p>
                </div>
                <div style={{ borderRadius: 11, background: T.bg4, padding: 8, display: 'flex' }}>
                  <I.Chart style={{ color: T.txt1 }} />
                </div>
              </div>
              <MiniBarChart data={weeklyTrend} color={T.accent} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {weeklyTrend.map((d, i) => <span key={i} style={{ fontSize: 9.5, color: T.txt2, flex: 1, textAlign: 'center' }}>{d.label}</span>)}
              </div>
            </Card>

            {/* Recent uploads */}
            <Card style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>Recent Uploads</p>
                <button onClick={() => setActiveTab('files')} type="button" style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.accentL, border: `1px solid rgba(79,124,255,0.25)`, borderRadius: 8, padding: '5px 11px', fontSize: 11.5, fontWeight: 600, color: T.accent, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.accentL; e.currentTarget.style.color = T.accent; }}>
                  View all <I.ChevRight />
                </button>
              </div>
              {userFiles.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', border: `1.5px dashed ${T.bdr1}`, borderRadius: 12, textAlign: 'center' }}>
                  <I.Cloud style={{ color: T.txt2 }} />
                  <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: T.txt2 }}>No files yet</p>
                  <p style={{ fontSize: 11.5, color: T.neutralDim, margin: '4px 0 0' }}>Upload your first file to get started.</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {userFiles.slice(0, 6).map(f => <FileActivityRow key={f.id} file={f} />)}
                </ul>
              )}
            </Card>

            {/* Task summary */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>Task Summary</p>
                <div style={{ borderRadius: 11, background: T.bg4, padding: 8, display: 'flex' }}>
                  <I.CheckCircle style={{ color: T.txt1 }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Pending',     value: tasksByStatus.pending.length,     color: T.amber    },
                  { label: 'In Progress', value: tasksByStatus.in_progress.length, color: T.accent   },
                  { label: 'Completed',   value: tasksByStatus.done.length,        color: T.emerald  },
                  { label: 'Overdue',     value: stats.overdueTasks,               color: T.rose     },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
                      <span style={{ fontSize: 11.5, color: T.txt1 }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: T.txt0 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('tasks')} type="button" style={{ width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px', fontSize: 12, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.bg3;    e.currentTarget.style.borderColor = T.bdr1;   e.currentTarget.style.color = T.txt1; }}>
                View all tasks <I.ChevRight />
              </button>
            </Card>

            {/* File status distribution */}
            <Card>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: '0 0 16px' }}>File Status</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Pending review', value: stats.pendingCount,   color: T.amber   },
                  { label: 'Under review',   value: stats.reviewingCount, color: T.accent  },
                  { label: 'Approved',       value: stats.approvedCount,  color: T.emerald },
                  { label: 'Rejected',       value: stats.rejectedCount,  color: T.rose    },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
                      <span style={{ fontSize: 11.5, color: T.txt1 }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: T.txt0 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══ UPLOAD TAB ══ */}
        {activeTab === 'upload' && (
          <section style={{ borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden', animation: 'fadeIn 0.25s ease-out both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${T.bdr1}`, padding: '16px 24px', background: `linear-gradient(90deg, ${T.accentG}, transparent)` }}>
              <div style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.accentL }}>
                <I.Cloud style={{ color: T.accent }} />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: T.txt0, margin: 0 }}>Upload Files</h2>
                <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>Submit files for admin review</p>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              {sendingToAdmin && (
                <div style={{
                  marginBottom: 16, borderRadius: 14, padding: '12px 16px',
                  background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.28)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  animation: 'fadeIn 0.3s ease-out',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I.Cloud style={{ color: '#0EA5E9' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: T.txt0, margin: 0 }}>Re-submit to Admin</p>
                    <p style={{ fontSize: 11.5, color: T.txt1, margin: '2px 0 0' }}>
                      Upload a new version of <strong>"{sendingToAdmin.originalName}"</strong> — it will go straight to admin for review.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendingToAdmin(null)}
                    aria-label="Dismiss resend prompt"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: '1px solid rgba(14,165,233,0.3)',
                      background: 'rgba(14,165,233,0.12)',
                      color: '#0EA5E9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.12)'; }}
                  >
                    <I.X />
                  </button>
                </div>
              )}
              <FileUpload
                onUpload={handleUpload}
                prefilledFile={prefilledUploadFile}
                onPrefillCleared={() => setPrefilledUploadFile(null)}
              />
            </div>
          </section>
        )}

        {/* ══ MY FILES TAB ══ */}
        {activeTab === 'files' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.25s ease-out both' }}>
            {/* Filter bar */}
            <Card style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.accentL }}>
                    <I.Adjustments style={{ color: T.accent }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>My Files</p>
                    <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <I.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.txt2, pointerEvents: 'none' }} />
                    <input value={search} onChange={e => { setSearch(e.target.value); setFilePage(1); }} placeholder="Search files…" style={{ ...inputSx, paddingLeft: 30, width: 200 }} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setFilePage(1); }} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput}>
                    <option value="all">All types</option><option value="image">Images</option><option value="pdf">PDFs</option>
                    <option value="doc">Documents</option><option value="data">Data</option><option value="other">Other</option>
                  </select>
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setFilePage(1); }} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput}>
                    <option value="all">All statuses</option><option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput}>
                    <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
                    <option value="name">Name A–Z</option><option value="size">Largest first</option>
                  </select>
                  <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setFilePage(1); }} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput} />
                  {/* View toggle */}
                  <div style={{ display: 'flex', borderRadius: 10, background: T.bg2, border: `1px solid ${T.bdr1}`, padding: 3, gap: 3 }}>
                    {[{ m: 'list', icon: I.ListBullet }, { m: 'grid', icon: I.Grid }].map(({ m, icon: Icon }) => (
                      <button key={m} onClick={() => setViewMode(m)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: viewMode === m ? T.accent : 'transparent', color: viewMode === m ? '#fff' : T.txt2, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                        <Icon />
                      </button>
                    ))}
                  </div>
                  {filteredFiles.length > 0 && (
                    <button onClick={() => { exportToCSV(filteredFiles.map(f => ({ name: f.originalName || '', status: f.status || '', size: formatBytes(f.size), description: f.description || '', uploaded: formatDate(f.createdAt) })), 'my-files'); addToast('Files exported', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px 13px', fontSize: 12, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <I.Download /> Export
                    </button>
                  )}
                  {(search || typeFilter !== 'all' || statusFilter !== 'all' || selectedDate) && (
                    <button onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setSelectedDate(''); setFilePage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 9, border: `1px solid rgba(244,63,94,0.25)`, background: T.roseD, padding: '7px 12px', fontSize: 12, fontWeight: 600, color: T.rose, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <I.X /> Clear
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* File list panel */}
            <div style={{ borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden' }}>
              {paginatedFiles.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `2px dashed ${T.bdr1}`, margin: 24, padding: '60px 0', textAlign: 'center' }}>
                  <I.Doc style={{ width: 44, height: 44, color: T.txt2 }} />
                  <p style={{ marginTop: 12, fontSize: 13.5, fontWeight: 700, color: T.txt1 }}>No files found</p>
                  <p style={{ fontSize: 12, color: T.txt2 }}>Try adjusting your filters or upload a new file.</p>
                </div>
              ) : (
                <>
                  <FileList files={paginatedFiles} viewMode={viewMode} onPreview={f => setPreviewFile(f)} onSendToAdmin={handleSendToAdmin} onDelete={handleDeleteFile} />
                  <Pagination current={filePage} total={totalFilePages} onChange={setFilePage} />
                </>
              )}
            </div>
          </section>
        )}

        {/* ══ MY TASKS TAB ══ */}
        {activeTab === 'tasks' && (
          <section style={{ animation: 'fadeIn 0.25s ease-out both' }}>
            {/* Filters header */}
            <div style={{ borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${T.bdr1}`, padding: '16px 24px', background: `linear-gradient(90deg, ${T.violetD}, transparent)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.violetD }}>
                    <I.CheckCircle style={{ color: T.violet }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: T.txt0, margin: 0 }}>My Tasks</h2>
                    <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>{myTasks.length} total · {stats.overdueTasks} overdue</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <I.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.txt2, pointerEvents: 'none' }} />
                    <input value={taskSearch} onChange={e => { setTaskSearch(e.target.value); setTaskPage(1); }} placeholder="Search tasks…" style={{ ...inputSx, paddingLeft: 30, width: 190 }} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <select value={taskStatusFilter} onChange={e => { setTaskStatusFilter(e.target.value); setTaskPage(1); }} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput}>
                    <option value="all">All statuses</option><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="done">Completed</option>
                  </select>
                  <select value={taskPriorityFilter} onChange={e => { setTaskPriorityFilter(e.target.value); setTaskPage(1); }} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput}>
                    <option value="all">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                  {myTasks.length > 0 && (
                    <button onClick={() => { exportToCSV(myTasks.map(t => ({ title: t.title || '', status: t.status || '', priority: t.priority || '', dueDate: formatDate(t.dueDate), description: t.description || '' })), 'my-tasks'); addToast('Tasks exported', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px 13px', fontSize: 12, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <I.Download /> Export
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Task body */}
            {(taskSearch || taskStatusFilter !== 'all' || taskPriorityFilter !== 'all') ? (
              <div style={{ borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', padding: '18px 20px' }}>
                {paginatedTasks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 0', border: `2px dashed ${T.bdr1}`, borderRadius: 14, textAlign: 'center' }}>
                    <I.CheckCircle style={{ width: 40, height: 40, color: T.txt2 }} />
                    <p style={{ marginTop: 12, fontSize: 13.5, fontWeight: 700, color: T.txt1 }}>No tasks match your filters</p>
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {paginatedTasks.map(t => <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatusChange} />)}
                  </ul>
                )}
                <Pagination current={taskPage} total={totalTaskPages} onChange={setTaskPage} />
              </div>
            ) : myTasks.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 18, border: `2px dashed ${T.bdr1}`, background: T.glass, padding: '80px 24px', textAlign: 'center' }}>
                <I.Sparkle style={{ width: 42, height: 42, color: T.txt2 }} />
                <p style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: T.txt1 }}>No tasks assigned yet</p>
                <p style={{ fontSize: 13, color: T.txt2, margin: '6px 0 0' }}>Tasks assigned by admin will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <TaskSection title="Pending"     status="pending"     tasks={tasksByStatus.pending}     count={tasksByStatus.pending.length}     isOpen={taskSectionsOpen.pending}     onToggle={() => toggleTaskSection('pending')}     onStatusChange={handleTaskStatusChange} />
                <TaskSection title="In Progress" status="in_progress" tasks={tasksByStatus.in_progress} count={tasksByStatus.in_progress.length} isOpen={taskSectionsOpen.in_progress} onToggle={() => toggleTaskSection('in_progress')} onStatusChange={handleTaskStatusChange} />
                <TaskSection title="Completed"   status="done"        tasks={tasksByStatus.done}        count={tasksByStatus.done.length}        isOpen={taskSectionsOpen.done}        onToggle={() => toggleTaskSection('done')}        onStatusChange={handleTaskStatusChange} />
              </div>
            )}
          </section>
        )}

        {/* ══ ACTIVITY LOG TAB ══ */}
        {activeTab === 'activity' && (
          <section style={{ borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden', animation: 'fadeIn 0.25s ease-out both' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${T.bdr1}`, padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: T.accentL, border: '1px solid rgba(79,70,229,0.18)' }}>
                  <I.ListBullet style={{ color: T.accent }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.02em' }}>Activity Log</h2>
                  <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>All actions in this session</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select value={activityAction} onChange={e => setActivityAction(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput}>
                  {ACTIVITY_ACTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select value={activityDateRange} onChange={e => setActivityDateRange(e.target.value)} style={{ ...inputSx, cursor: 'pointer' }} onFocus={focusInput} onBlur={blurInput}>
                  {ACTIVITY_DATE_RANGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 30, borderRadius: 8, background: T.bg3, border: `1px solid ${T.bdr1}`, padding: '0 10px', fontSize: 11, fontWeight: 700, color: T.txt2, letterSpacing: '0.02em' }}>
                  {activityLog.length} entries
                </span>
                {activityLog.length > 0 && (
                  <button
                    onClick={() => exportToCSV(activityLog.map(e => ({ action: e.action, detail: e.detail, time: e.time })), 'activity-log')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 9, border: `1px solid ${T.bdr1}`, background: T.bg2, padding: '7px 13px', fontSize: 11.5, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.bg3; e.currentTarget.style.borderColor = T.bdr2; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.bg2; e.currentTarget.style.borderColor = T.bdr1; }}
                  >
                    <I.Download /> Export
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {activityLog.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `2px dashed ${T.bdr1}`, padding: '64px 0', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: T.accentL, border: '1px solid rgba(79,70,229,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <I.ListBullet style={{ width: 24, height: 24, color: T.accent }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.txt0, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{activityLoading ? 'Loading activity…' : 'No activity yet'}</p>
                  {!activityLoading && <p style={{ fontSize: 12.5, color: T.txt2, margin: 0 }}>Uploads and task updates will appear here as you work.</p>}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {paginatedActivity.map((entry, idx) => {
                    /* ── icon per action type ── */
                    const raw = entry.rawAction || '';
                    let iconEl, iconBg, iconBorder, iconColor;
                    if (raw.includes('upload') || raw.includes('file')) {
                      iconEl = <I.Cloud style={{ color: T.accent }} />;
                      iconBg = T.accentL; iconBorder = 'rgba(79,70,229,0.20)'; iconColor = T.accent;
                    } else if (raw.includes('approve')) {
                      iconEl = <I.CheckCircle style={{ color: T.emerald }} />;
                      iconBg = T.emeraldD; iconBorder = 'rgba(16,185,129,0.22)'; iconColor = T.emerald;
                    } else if (raw.includes('reject')) {
                      iconEl = <I.XCircle style={{ color: T.rose }} />;
                      iconBg = T.roseD; iconBorder = 'rgba(244,63,94,0.22)'; iconColor = T.rose;
                    } else if (raw.includes('task')) {
                      iconEl = <I.Flag style={{ color: T.amber }} />;
                      iconBg = T.amberD; iconBorder = 'rgba(245,158,11,0.22)'; iconColor = T.amber;
                    } else if (raw.includes('login') || raw.includes('register')) {
                      iconEl = <I.Shield style={{ color: T.violet }} />;
                      iconBg = T.violetD; iconBorder = 'rgba(139,92,246,0.22)'; iconColor = T.violet;
                    } else if (raw.includes('share')) {
                      iconEl = <I.Eye style={{ color: T.cyan }} />;
                      iconBg = T.cyanD; iconBorder = 'rgba(20,184,166,0.22)'; iconColor = T.cyan;
                    } else {
                      iconEl = <I.Info style={{ color: T.txt1 }} />;
                      iconBg = T.bg3; iconBorder = T.bdr1; iconColor = T.txt1;
                    }

                    return (
                      <div
                        key={entry.id}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, transition: 'background 0.13s', cursor: 'default' }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.bg2; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Icon badge */}
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          {iconEl}
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.01em' }}>{entry.action}</p>
                          {entry.detail && (
                            <p style={{ fontSize: 11.5, color: T.txt1, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.detail}</p>
                          )}
                        </div>
                        {/* Time */}
                        <span style={{ fontSize: 11, color: T.txt2, fontWeight: 500, flexShrink: 0, paddingTop: 2, whiteSpace: 'nowrap' }}>{timeAgo(entry.time)}</span>
                      </div>
                    );
                  })}
                  {totalActivityPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px 4px', borderTop: `1px solid ${T.bdr0}`, marginTop: 8 }}>
                      <span style={{ fontSize: 11.5, color: T.txt2, fontWeight: 500 }}>
                        Page <strong style={{ color: T.txt0 }}>{activityPage}</strong> of {totalActivityPages}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          disabled={activityPage === 1}
                          onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.bdr1}`, background: activityPage === 1 ? T.bg2 : T.bg3, color: activityPage === 1 ? T.txt2 : T.txt1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: activityPage === 1 ? 'not-allowed' : 'pointer', opacity: activityPage === 1 ? 0.45 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
                        >
                          <I.ChevLeft />
                        </button>
                        <button
                          disabled={activityPage === totalActivityPages}
                          onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.bdr1}`, background: activityPage === totalActivityPages ? T.bg2 : T.bg3, color: activityPage === totalActivityPages ? T.txt2 : T.txt1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: activityPage === totalActivityPages ? 'not-allowed' : 'pointer', opacity: activityPage === totalActivityPages ? 0.45 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}
                        >
                          <I.ChevRight />
                        </button>
                      </div>
                    </div>
                  )}
                  {!activityHasMore && activityLog.length > 0 && totalActivityPages <= 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '18px 0 6px' }}>
                      <div style={{ flex: 1, height: 1, background: T.bdr0 }} />
                      <span style={{ fontSize: 11, color: T.txt2, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>End of history</span>
                      <div style={{ flex: 1, height: 1, background: T.bdr0 }} />
                    </div>
                  )}
                  <div style={{ height: 1 }} />
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      <PreviewModal file={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} />

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(10,14,26,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.18s ease-out',
        }} onClick={() => setDeleteConfirm(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: T.bg1, borderRadius: 20, padding: '28px 32px',
              maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(10,14,26,0.3)',
              border: `1px solid ${T.bdr1}`, display: 'flex', flexDirection: 'column', gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: T.roseD, border: `1px solid rgba(244,63,94,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <I.XCircle style={{ color: T.rose, width: 22, height: 22 }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.015em' }}>Delete File</p>
                <p style={{ fontSize: 12, color: T.txt2, margin: '3px 0 0' }}>This action cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: T.txt1, margin: 0, lineHeight: 1.6, background: T.bg3, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.bdr0}` }}>
              Are you sure you want to delete <strong style={{ color: T.txt0 }}>{deleteConfirm.originalName}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = T.bg2; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.bg3; }}
              >Cancel</button>
              <button
                onClick={confirmDelete}
                style={{ borderRadius: 10, border: '1px solid rgba(244,63,94,0.3)', background: T.roseD, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: T.rose, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = T.rose; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.roseD; e.currentTarget.style.color = T.rose; }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default EmployeeDashboard;