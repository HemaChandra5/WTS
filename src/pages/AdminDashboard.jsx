import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';

import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FilesContext';
import { useTasks } from '../context/TasksContext';
import { api } from '../api';

import FileList from '../components/FileList';
import PreviewModal from '../components/PreviewModal';
import ReviewModal from '../components/ReviewModal';
import StatusBadge from '../components/StatusBadge';
import { isSameDay, isWithinDays } from '../utils/dateUtils';

const T = {
  bg0: '#000000',
  bg1: '#000000',
  bg2: 'rgba(255,255,255,0.035)',
  bg3: 'rgba(255,255,255,0.055)',
  bg4: 'rgba(255,255,255,0.085)',
  glass: 'rgba(20,20,22,0.55)',
  glassBorder: 'rgba(255,255,255,0.09)',
  bdr0: 'rgba(255,255,255,0.05)',
  bdr1: 'rgba(255,255,255,0.09)',
  bdr2: 'rgba(255,255,255,0.15)',
  accent: '#5b8def',
  accentB: '#4877dd',
  accentL: 'rgba(91,141,239,0.14)',
  accentG: 'rgba(91,141,239,0.07)',
  txt0: '#f5f6fa',
  txt1: '#9aa1b8',
  txt2: '#5c6178',
  emerald: '#34d399',
  emeraldD: 'rgba(52,211,153,0.10)',
  amber: '#f0b14d',
  amberD: 'rgba(240,177,77,0.10)',
  rose: '#f0708a',
  roseD: 'rgba(240,112,138,0.10)',
  violet: '#a78bfa',
  violetD: 'rgba(167,139,250,0.10)',
  cyan: '#22d3ee',
  cyanD: 'rgba(34,211,238,0.10)',
 
  neutral: '#c4c9da',
  neutralDim: '#5c6178',
};

/* ─── Constants ──────────────────────────────────────────────────────── */
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');
const CREATED_USERS_LOG_KEY_PREFIX = 'adminCreatedUsersLog';

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: T.txt1, bg: 'rgba(160,168,192,0.1)', border: 'rgba(160,168,192,0.15)', dot: T.txt2 },
  medium: { label: 'Medium', color: T.amber, bg: T.amberD, border: 'rgba(245,166,35,0.2)', dot: T.amber },
  high: { label: 'High', color: T.rose, bg: T.roseD, border: 'rgba(255,95,126,0.2)', dot: T.rose },
};

const TASK_STATUS_CONFIG = {
  pending: { label: 'Pending', color: T.amber, bg: T.amberD, border: 'rgba(245,166,35,0.2)', dot: T.amber },
  in_progress: { label: 'In Progress', color: T.accent, bg: T.accentL, border: 'rgba(59,124,255,0.2)', dot: T.accent },
  done: { label: 'Done', color: T.emerald, bg: T.emeraldD, border: 'rgba(16,232,160,0.2)', dot: T.emerald },
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const getType = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return 'other';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'doc';
  return 'other';
};

const upsertById = (arr, item) => {
  if (!item?.id) return arr;
  const idx = arr.findIndex((x) => x.id === item.id);
  if (idx === -1) return [item, ...arr];
  const copy = [...arr];
  copy[idx] = { ...copy[idx], ...item };
  return copy;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

const getGreeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
};

const firstName = (name = '') => name.trim().split(' ')[0] || name;

const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map((row) => keys.map((k) => `"${row[k] ?? ''}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const getCollectionRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizePersonRecord = (record = {}) => ({
  ...record,
  id: record.id,
  name:
    record.name ||
    [record.first_name, record.last_name].filter(Boolean).join(' ').trim() ||
    record.username ||
    (typeof record.email === 'string' ? record.email.split('@')[0] : ''),
  email: record.email || '',
  role: record.role || 'employee',
  department: record.department || 'General',
  isApproved: record.isApproved ?? record.is_approved ?? false,
  isRejected: record.isRejected ?? record.is_rejected ?? false,
  isActive: record.isActive ?? record.is_active ?? false,
  createdAt: record.createdAt ?? record.created_at ?? null,
});

const loadCreatedUsersLog = (storageKey) => {
  const parseRows = (raw) => {
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  };

  try {
    const sessionRows = parseRows(sessionStorage.getItem(storageKey));
    if (sessionRows.length > 0) return sessionRows;
  } catch (error) {
    console.error('Failed to read created users session log:', error);
  }

  try {
    const localRows = parseRows(localStorage.getItem(storageKey));
    if (localRows.length > 0) return localRows;
  } catch (error) {
    console.error('Failed to read created users local log:', error);
  }

  return [];
};

const persistCreatedUsersLog = (storageKey, rows) => {
  const serialized = JSON.stringify((rows || []).slice(0, 20));
  try {
    sessionStorage.setItem(storageKey, serialized);
  } catch (error) {
    console.error('Failed to persist created users session log:', error);
  }

  try {
    localStorage.setItem(storageKey, serialized);
  } catch (error) {
    console.error('Failed to persist created users local log:', error);
  }
};


// ─── Icons (inline SVG, replacing @heroicons/react) ───────────────────────
const I = {
  Funnel: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>,
  Doc: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  Users: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Clock: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  PlusCircle: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  Search: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  CheckCircle: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 16 9" /></svg>,
  ExclCircle: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  Shield: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  XCircle: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  Eye: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  NoSymbol: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><line x1="4.9" y1="4.9" x2="19.1" y2="19.1" /></svg>,
  Download: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Trash: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  Chart: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="9.5" y="7" width="4" height="14" rx="1" /><rect x="16" y="4" width="4" height="17" rx="1" /></svg>,
  Adjustments: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>,
  Refresh: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  Info: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  Calendar: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Flag: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
  ListBullet: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
  Grid: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  ChevLeft: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="15 18 9 12 15 6" /></svg>,
  ChevRight: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><polyline points="9 18 15 12 9 6" /></svg>,
  X: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><polyline points="20 6 9 17 4 12" /></svg>,
  ArrowUp: (p) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>,
  ArrowDown: (p) => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>,
  ArrowPath: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  UserPlus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" /></svg>,
  Lock: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Mail: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6 12 13 2 6" /></svg>,
  Briefcase: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  UserKey: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h2.5" /><circle cx="18" cy="16" r="3" /><path d="M20.5 13.5 22 12" /></svg>,
  Sparkle: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></svg>,
};

/* ─── Reusable Components ─────────────────────────────────────────────── */

// Toast notification
const Toast = ({ toasts, removeToast }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
    {toasts.map((t) => {
      const colors = {
        success: { bg: '#0d2e22', border: 'rgba(16,232,160,0.3)', text: '#bdf5dd', icon: T.emerald },
        error: { bg: '#341019', border: 'rgba(255,95,126,0.3)', text: '#ffd2dc', icon: T.rose },
        info: { bg: T.bg3, border: T.bdr2, text: T.txt0, icon: T.accent },
      };
      const c = colors[t.type] || colors.info;
      return (
        <div key={t.id} style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 16, background: c.bg, border: `1px solid ${c.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', animation: 'slideUp 0.28s cubic-bezier(.16,1,.3,1)', minWidth: 220, maxWidth: 340, fontSize: 13.5, fontWeight: 500, color: c.text }}>
          {t.type === 'success' && <I.CheckCircle style={{ color: c.icon, flexShrink: 0 }} />}
          {t.type === 'error' && <I.XCircle style={{ color: c.icon, flexShrink: 0 }} />}
          {t.type === 'info' && <I.Info style={{ color: c.icon, flexShrink: 0 }} />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.6, display: 'flex', padding: 2 }}>
            <I.X />
          </button>
        </div>
      );
    })}
  </div>
);

// Stat Card — glass-morphism: translucent blurred surface tinted with a
// soft color wash + a saturated icon chip, so cards read as "premium dark
// glass" rather than flat color tiles or pure poster-gradients.
const STAT_TINTS = {
  indigo: { wash: 'rgba(91,141,239,0.16)', edge: 'rgba(91,141,239,0.30)', icon: '#7aa2f5' },
  amber: { wash: 'rgba(240,177,77,0.16)', edge: 'rgba(240,177,77,0.30)', icon: '#f0b14d' },
  emerald: { wash: 'rgba(52,211,153,0.16)', edge: 'rgba(52,211,153,0.30)', icon: '#34d399' },
  violet: { wash: 'rgba(167,139,250,0.16)', edge: 'rgba(167,139,250,0.30)', icon: '#a78bfa' },
  rose: { wash: 'rgba(240,112,138,0.16)', edge: 'rgba(240,112,138,0.30)', icon: '#f0708a' },
  sky: { wash: 'rgba(34,211,238,0.16)', edge: 'rgba(34,211,238,0.30)', icon: '#22d3ee' },
};
const StatCard = ({ icon: Icon, label, value, sub, trend, color, onClick }) => {
  const [hov, setHov] = useState(false);
  const tint = STAT_TINTS[color] || STAT_TINTS.indigo;
  return (
    <button
      onClick={onClick}
      type="button"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '18px 20px',
        background: `linear-gradient(160deg, ${tint.wash}, rgba(255,255,255,0.025))`,
        backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        border: `1px solid ${hov ? tint.edge : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer',
        textAlign: 'left', width: '100%', transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${tint.edge}` : '0 4px 20px rgba(0,0,0,0.35)',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: tint.wash, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${tint.edge}`, padding: 9, display: 'flex' }}>
            <Icon style={{ color: tint.icon }} />
          </div>
          {trend !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, borderRadius: 999, padding: '2px 7px', fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: T.txt1, border: `1px solid ${T.bdr1}` }}>
              {trend >= 0 ? <I.ArrowUp /> : <I.ArrowDown />}
              {Math.abs(trend)}%
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



const TOGGLE_COPY = {
  pending: { onLabel: 'Approve', offLabel: 'Decline', isOn: false },
  active: { onLabel: 'Active', offLabel: 'Deactivate', isOn: true },
  inactive: { onLabel: 'Reactivate', offLabel: 'Deactivated', isOn: false },
};

const EmployeeStatusToggle = ({ mode, busy, onActivate, onDeactivate }) => {
  const cfg = TOGGLE_COPY[mode] || TOGGLE_COPY.active;
  const isOn = cfg.isOn;
  const [hovSide, setHovSide] = useState(null); // 'on' | 'off' | null

  const handleClick = (targetOn) => {
    if (busy || targetOn === isOn) return;
    if (targetOn) {
      onActivate?.();
    } else {
      onDeactivate?.();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: busy ? 0.55 : 1 }}>
      <span
        onClick={() => handleClick(false)}
        onMouseEnter={() => setHovSide('off')}
        onMouseLeave={() => setHovSide(null)}
        style={{
          fontSize: 10.5, fontWeight: !isOn ? 700 : 600, cursor: busy ? 'default' : 'pointer', userSelect: 'none',
          color: !isOn ? T.txt0 : (hovSide === 'off' ? T.txt1 : T.txt2),
          transition: 'color 0.15s',
        }}
      >
        {cfg.offLabel}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-busy={busy || undefined}
        disabled={busy}
        onClick={() => handleClick(!isOn)}
        title={isOn ? cfg.onLabel : cfg.offLabel}
        style={{
          position: 'relative', width: 44, height: 25, borderRadius: 999, flexShrink: 0,
          border: `1px solid ${T.bdr2}`,
          background: isOn ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
          cursor: busy ? 'not-allowed' : 'pointer', padding: 0,
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 2, left: isOn ? 21 : 2, width: 19, height: 19, borderRadius: '50%',
            background: isOn ? T.txt0 : T.txt2, boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
            transition: 'left 0.22s cubic-bezier(.4,0,.2,1), background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {busy && (
            <span
              style={{
                width: 9, height: 9, borderRadius: '50%',
                border: '2px solid rgba(0,0,0,0.25)', borderTopColor: 'rgba(0,0,0,0.65)',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          )}
        </span>
      </button>

      <span
        onClick={() => handleClick(true)}
        onMouseEnter={() => setHovSide('on')}
        onMouseLeave={() => setHovSide(null)}
        style={{
          fontSize: 10.5, fontWeight: isOn ? 700 : 600, cursor: busy ? 'default' : 'pointer', userSelect: 'none',
          color: isOn ? T.txt0 : (hovSide === 'on' ? T.txt1 : T.txt2),
          transition: 'color 0.15s',
        }}
      >
        {cfg.onLabel}
      </span>
    </div>
  );
};

const StatusPill = ({ mode }) => {
  const copy = { pending: 'Pending', active: 'Active', inactive: 'Deactivated' }[mode] || mode;
  const dotOn = mode === 'active';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '3px 10px 3px 8px',
      fontSize: 10.5, fontWeight: 600, color: T.txt1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.bdr1}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotOn ? T.txt0 : T.txt2 }} />
      {copy}
    </span>
  );
};

const Pagination = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10,
    border: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.03)', color: T.txt1, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12, transition: 'background 0.15s, border-color 0.15s',
  };
  const isFirst = current === 1;
  const isLast = current === total;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, padding: '14px 20px' }}>
      <span style={{ fontSize: 11.5, color: T.txt2, fontWeight: 500 }}>
        Page <span style={{ color: T.txt0, fontWeight: 700 }}>{current}</span> of {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {!isFirst && (
          <button
            onClick={() => onChange(current - 1)}
            style={btnBase}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = T.bdr2; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = T.bdr1; }}
            aria-label="Previous page"
          >
            <I.ChevLeft />
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => onChange(current + 1)}
            style={btnBase}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = T.bdr2; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = T.bdr1; }}
            aria-label="Next page"
          >
            <I.ChevRight />
          </button>
        )}
      </div>
    </div>
  );
};

// Mini bar chart
const MiniBarChart = ({ data, color = T.accent }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }} title={`${d.label}: ${d.value}`}>
          <div style={{ width: '100%', borderRadius: '3px 3px 0 0', transition: 'opacity 0.2s', height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0, background: color }} />
        </div>
      ))}
    </div>
  );
};

// Confirm Dialog
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, borderRadius: 18, background: '#0a0a0c', border: `1px solid ${T.bdr2}`, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', marginBottom: 16, background: danger ? T.roseD : T.accentL }}>
          {danger ? <I.XCircle style={{ width: 22, height: 22, color: T.rose }} /> : <I.Info style={{ width: 22, height: 22, color: T.accent }} />}
        </div>
        <h3 style={{ fontSize: 15.5, fontWeight: 600, color: T.txt0, margin: 0 }}>{title}</h3>
        <p style={{ marginTop: 6, fontSize: 13, color: T.txt1 }}>{message}</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, borderRadius: 11, border: `1px solid ${T.bdr1}`, padding: '10px', fontSize: 13.5, fontWeight: 500, color: T.txt1, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, borderRadius: 11, border: 'none', padding: '10px', fontSize: 13.5, fontWeight: 600, color: '#fff', background: danger ? T.rose : T.accent, cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// Pending Review Row
const PendingRow = ({ file, onReview, selected, onSelect }) => (
  <li style={{
    display: 'flex', alignItems: 'center', gap: 14, borderRadius: 13, padding: '12px 16px',
    border: `1px solid ${selected ? 'rgba(59,124,255,0.35)' : 'rgba(245,166,35,0.18)'}`,
    background: selected ? T.accentG : 'rgba(245,166,35,0.04)', transition: 'all 0.15s', listStyle: 'none',
  }}>
    <input type="checkbox" checked={selected} onChange={onSelect} style={{ width: 15, height: 15, accentColor: T.accent, cursor: 'pointer', flexShrink: 0 }} />
    <div style={{ display: 'flex', height: 36, width: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.amberD }}>
      <I.Doc style={{ color: T.amber }} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.originalName}</p>
      <p style={{ fontSize: 11.5, color: T.txt2, margin: '2px 0 0' }}>{file.userName} · {file.userEmail}</p>
    </div>
    <div style={{ fontSize: 11.5, color: T.txt2, flexShrink: 0 }}>{timeAgo(file.createdAt)}</div>
    <StatusBadge status={file.status} size="sm" />
    <button onClick={() => onReview(file)} type="button" style={{
      display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, background: T.accent, padding: '7px 13px',
      fontSize: 11.5, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
      boxShadow: '0 4px 14px rgba(59,124,255,0.3)', fontFamily: 'inherit',
    }}>
      <I.Eye /> Review
    </button>
  </li>
);

// Card — generic glass panel wrapper
const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)',
    border: `1px solid ${T.glassBorder}`, borderRadius: 18, padding: 18, ...style,
  }}>
    {children}
  </div>
);

/* ─── Main Component ──────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const {
    user,
    getAllEmployees,
    getAllAdmins,
    approveEmployee,
    deactivateEmployee,
    reactivateEmployee,
    rejectEmployee,
    createUser,
  } = useAuth();
  if (user?.role !== 'admin') {
  return null;
}
  const { files, updateFileStatus, bulkUpdateFileStatus, fetchFiles } = useFiles();
  const { tasks, taskRealtimeEventCount, fetchTasks, addTask, updateTaskStatus, deleteTask } = useTasks();

  /* ── State ── */
  const [fileList, setFileList] = useState(files || []);
  const [employees, setEmployees] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [adminError, setAdminError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [taskEventBadge, setTaskEventBadge] = useState(0);
  const [employeePendingBadge, setEmployeePendingBadge] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // for future list/grid support
  const [toasts, setToasts] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
  employees: 0,
  activeEmployees: 0,
  inactiveEmployees: 0,
  pendingApprovals: 0,
  rejectedEmployees: 0,
  tasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  files: 0,
  approvedFiles: 0,
  rejectedFiles: 0,
  pendingFiles: 0,
});
  const fetchActivityLogs = useCallback(async () => {
  try {
    const response = await api.get('/activity/');
    const payload = response.data;
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
      ? payload.results
      : [];

    const normalized = rows.map((entry) => ({
      id: entry.id,
      action: (entry.action || 'activity').replace(/_/g, ' '),
      detail: entry.description || entry.detail || '',
      admin: entry.user_name || entry.user_email || entry.admin || 'System',
      time: entry.created_at || entry.time || new Date().toISOString(),
    }));

    setAuditLog(normalized);
  } catch (error) {
    console.error(
      'Failed to fetch activity logs:',
      error
    );
    setAuditLog([]);
  }
}, []);

const fetchDashboardStats = useCallback(async () => {
  try {
    const response = await api.get('/dashboard/admin/');
    setDashboardStats(response.data);
  } catch (error) {
    console.error(
      'Failed to fetch dashboard stats:',
      error
    );
  }
}, []);

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empTab, setEmpTab] = useState('active'); // 'pending'|'active'|'inactive'
  const [busyEmployeeIds, setBusyEmployeeIds] = useState(new Set());

  /* ── File Filters ── */
  const [range, setRange] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [filePage, setFilePage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  /* ── Task State ── */
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskPage, setTaskPage] = useState(1);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedToEmail: '',
    dueDate: '',
    priority: 'medium',
    adminFile: null,
  });
  const lastHandledTaskRealtimeEventRef = useRef(0);
  const previousPendingEmployeesRef = useRef(new Set());
  const pendingEmployeeEventsInitializedRef = useRef(false);

  /* ── Modals ── */
  const [previewFile, setPreviewFile] = useState(null);
  const [reviewFile, setReviewFile] = useState(null);

  /* ── User Management (create admin/employee accounts directly) ── */
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'employee', department: '',
  });
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [createdUsersLog, setCreatedUsersLog] = useState([]); // session-local feed of users created from this tab
  const createdUsersLogStorageKey = `${CREATED_USERS_LOG_KEY_PREFIX}:${String(user?.id || 'anon')}`;

  /* ── Live clock (drives the greeting; ticks once a minute so "Good
     morning" rolls over to "Good afternoon" without a page refresh) ── */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(() => getGreeting(now), [now]);
  const greetingEmoji = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return '🌙';
    if (h < 12) return '☀️';
    if (h < 17) return '🌤️';
    if (h < 21) return '🌆';
    return '🌙';
  }, [now]);
  const todayLabel = useMemo(
    () => now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
    [now],
  );

  /* ── Init ── */
  useEffect(() => {
    setFileList(files || []);
  }, [files]);

  const refreshEmployees = useCallback(async () => {
    if (!getAllEmployees) {
      setEmployees([]);
      return;
    }
    try {
      const data = await getAllEmployees();
      setEmployees(getCollectionRows(data).map(normalizePersonRecord));
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    }
  }, [getAllEmployees]);

  const refreshAdmins = useCallback(async () => {
    if (!getAllAdmins) {
      setAdmins([]);
      return;
    }
    try {
      const data = await getAllAdmins();
      setAdmins(getCollectionRows(data).map(normalizePersonRecord));
    } catch (err) {
      console.error('Error fetching admins:', err);
      setAdmins([]);
    }
  }, [getAllAdmins]);

  useEffect(() => {
    refreshEmployees();
  }, [refreshEmployees]);

  useEffect(() => {
    refreshAdmins();
  }, [refreshAdmins]);

  useEffect(() => {
    setCreatedUsersLog(loadCreatedUsersLog(createdUsersLogStorageKey));
  }, [createdUsersLogStorageKey]);

  useEffect(() => {
    persistCreatedUsersLog(createdUsersLogStorageKey, createdUsersLog);
  }, [createdUsersLog, createdUsersLogStorageKey]);

  useEffect(() => {
  fetchActivityLogs();
}, [fetchActivityLogs]);

useEffect(() => {
  fetchDashboardStats();
}, [fetchDashboardStats]);

  useEffect(() => {
    const previousCount = lastHandledTaskRealtimeEventRef.current;
    if (taskRealtimeEventCount <= previousCount) {
      return;
    }

    const delta = taskRealtimeEventCount - previousCount;
    if (activeTab !== 'tasks' && delta > 0) {
      setTaskEventBadge((count) => count + delta);
    }

    lastHandledTaskRealtimeEventRef.current = taskRealtimeEventCount;
  }, [taskRealtimeEventCount, activeTab]);

  useEffect(() => {
    if (activeTab === 'tasks' && taskEventBadge > 0) {
      setTaskEventBadge(0);
    }
  }, [activeTab, taskEventBadge]);

  useEffect(() => {
    const pendingNow = new Set(
      (employees || [])
        .filter((e) => !(e.is_approved ?? e.isApproved) && !(e.is_rejected ?? e.isRejected))
        .map((e) => String(e.id)),
    );

    if (!pendingEmployeeEventsInitializedRef.current) {
      previousPendingEmployeesRef.current = pendingNow;
      pendingEmployeeEventsInitializedRef.current = true;
      return;
    }

    let newlyPending = 0;
    pendingNow.forEach((id) => {
      if (!previousPendingEmployeesRef.current.has(id)) {
        newlyPending += 1;
      }
    });

    if (activeTab !== 'employees' && newlyPending > 0) {
      setEmployeePendingBadge((count) => count + newlyPending);
    }

    previousPendingEmployeesRef.current = pendingNow;
  }, [employees, activeTab]);

  useEffect(() => {
    if (activeTab === 'employees' && empTab === 'pending' && employeePendingBadge > 0) {
      setEmployeePendingBadge(0);
    }
  }, [activeTab, empTab, employeePendingBadge]);


  const addToast = useCallback(() => {}, []);

  const removeToast = (id) =>
    setToasts((p) => p.filter((t) => t.id !== id));

  /* ── Audit log helper ── */
  const logAction = useCallback(
    (action, detail) => {
      const entry = {
        id: Date.now(),
        action,
        detail,
        time: new Date().toISOString(),
        admin: user?.name || user?.username || user?.email || 'System',
      };
      setAuditLog((p) => [entry, ...p].slice(0, 100));
    },
    [user],
  );

  /* ── WebSocket ── */
  useWebSocket(
    `${WS_BASE_URL}/ws/files/`,
    (data) => {
      if (!data?.type) return;
      if (data.type === 'file_notification' && data.file) {
        setFileList((prev) => upsertById(prev, data.file));
        addToast(`New file: ${data.file.originalName}`, 'info');
      }
      if (data.type === 'file_status_update') {
        setFileList((prev) =>
          prev.map((f) =>
            f.id === data.fileId ? { ...f, status: data.status } : f,
          ),
        );
      }
      if (data.type === 'file_list' && Array.isArray(data.files)) {
        setFileList(data.files);
      }
      if (data.type === 'file_share_update' && data.file) {
        setFileList((prev) => upsertById(prev, data.file));
        if (data.action === 'shared') {
          addToast('File sharing updated in realtime', 'info');
        }
        if (data.action === 'unshared') {
          addToast('File unsharing updated in realtime', 'info');
        }
      }
    },
    (error) => console.error('WebSocket error:', error),
  );

  /* ── Employee actions ── */
  const setEmployeeBusy = useCallback((id, busy) => {
    setBusyEmployeeIds((prev) => {
      const next = new Set(prev);
      busy ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleApprove = async (id) => {
    setEmployeeBusy(id, true);
    const approved = await approveEmployee?.(id);
    if (!approved) {
      setAdminError(
        'Cannot approve accounts with non-company email addresses.',
      );
      addToast('Cannot approve: non-company email', 'error');
    } else {
      setAdminError('');
      const emp = employees.find((e) => e.id === id);
      logAction('Employee Approved', emp?.email || id);
      addToast('Employee approved successfully', 'success');
    }
    await refreshEmployees();
    setEmployeeBusy(id, false);
  };

  const handleDeactivate = (id) => {
    const emp = employees.find((e) => e.id === id);
    setConfirmDialog({
      title: 'Deactivate Employee?',
      message: 'This employee will lose access until reactivated.',
      danger: true,
      onConfirm: async () => {
        setEmployeeBusy(id, true);
        await deactivateEmployee?.(id);
        logAction('Employee Deactivated', emp?.email || id);
        addToast('Employee deactivated', 'info');
        await refreshEmployees();
        setEmployeeBusy(id, false);
        setConfirmDialog(null);
      },
    });
  };

  const handleReactivate = async (id) => {
    setEmployeeBusy(id, true);
    const emp = employees.find((e) => e.id === id);
    await reactivateEmployee?.(id);
    logAction('Employee Reactivated', emp?.email || id);
    addToast('Employee reactivated', 'success');
    await refreshEmployees();
    setEmployeeBusy(id, false);
  };

  const handleReject = (id) => {
    const emp = employees.find((e) => e.id === id);
    setConfirmDialog({
      title: 'Decline registration?',
      message: 'This will permanently decline the employee registration.',
      danger: true,
      onConfirm: async () => {
        setEmployeeBusy(id, true);
        await rejectEmployee?.(id);
        logAction('Employee Rejected', emp?.email || id);
        addToast('Registration declined', 'info');
        await refreshEmployees();
        setEmployeeBusy(id, false);
        setConfirmDialog(null);
      },
    });
  };

  /* ── File status update ── */
  const handleUpdateFileStatus = useCallback(
    async (...args) => {
      // Flexible signature: either (payload) or (fileId, status, note)
      if (typeof args[0] === 'object' && args[0]?.id) {
        const payload = args[0];
        setFileList((prev) => upsertById(prev, payload));
        logAction(
          'File Status Updated',
          `${payload.originalName} → ${payload.status}`,
        );
        return { success: true, file: payload };
      }
      const [fileId, status, adminNote] = args;
      const file = fileList.find((f) => f.id === fileId);

      const previousFileList = fileList;
      setFileList((prev) => prev.map((f) => (f.id === fileId ? { ...f, status, ...(adminNote ? { adminNote } : {}) } : f)));

      const result = await updateFileStatus(fileId, status, adminNote);
      if (!result?.success) {
        setFileList(previousFileList);
        addToast(result?.error || 'Failed to update file status', 'error');
        return result;
      }

      logAction(
        'File Status Updated',
        `${file?.originalName || fileId} → ${status}`,
      );
      addToast(`File marked as ${status}`, 'success');
      fetchDashboardStats();
      fetchActivityLogs();
      return result;
    },
    [updateFileStatus, fileList, logAction, addToast, fetchDashboardStats, fetchActivityLogs],
  );

  /* ── Bulk file actions ── */
  const handleBulkAction = async (action) => {
    if (!selectedFiles.size) return;
    const ids = [...selectedFiles];

    const result = await bulkUpdateFileStatus(ids, action);
    if (!result?.success) {
      addToast(result?.error || `Failed to bulk mark files as ${action}`, 'error');
      return;
    }

    setFileList((prev) => {
      const updates = new Map((result.files || []).map((f) => [String(f.id), f]));
      return prev.map((f) => updates.get(String(f.id)) || f);
    });

    fetchDashboardStats();
    fetchActivityLogs();

    setSelectedFiles(new Set());
    if ((result.updatedCount || 0) === ids.length) {
      addToast(`${ids.length} file(s) marked as ${action}`, 'success');
    } else {
      addToast(`${result.updatedCount || 0}/${ids.length} file(s) marked as ${action}`, (result.updatedCount || 0) > 0 ? 'info' : 'error');
    }
  };

  const handleBulkDelete = () => {
    if (!selectedFiles.size) return;
    setConfirmDialog({
      title: `Delete ${selectedFiles.size} file(s)?`,
      message: 'This action cannot be undone.',
      danger: true,
      onConfirm: () => {
        // Assuming deletion is handled elsewhere; we only log + clear selection
        logAction('Bulk Delete', `${selectedFiles.size} files`);
        addToast(`${selectedFiles.size} file(s) deleted`, 'info');
        setSelectedFiles(new Set());
        setConfirmDialog(null);
      },
    });
  };

  /* ── Task ── */
  const handleTaskChange = (e) => {
    if (e.target.name === 'adminFile') {
      setTaskForm((p) => ({ ...p, adminFile: e.target.files[0] }));
    } else {
      setTaskForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.assignedToEmail.trim()) return;
    const result = await addTask({
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assignedToEmail: taskForm.assignedToEmail.trim(),
      assignedToName: taskForm.assignedToEmail.trim(),
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      adminFile: taskForm.adminFile,
    });

    if (!result?.success) {
      addToast(result?.error || 'Failed to create task', 'error');
      return;
    }

    logAction(
      'Task Created',
      `"${taskForm.title}" assigned to ${taskForm.assignedToEmail}`,
    );
    addToast('Task created successfully', 'success');
    setTaskForm({
      title: '',
      description: '',
      assignedToEmail: '',
      dueDate: '',
      priority: 'medium',
      adminFile: null,
    });
    setTaskFormOpen(false);
  };

  const handleDeleteTask = (id) => {
    setConfirmDialog({
      title: 'Delete Task?',
      message: 'This task will be permanently removed.',
      danger: true,
      onConfirm: async () => {
        const result = await deleteTask?.(id);
        if (result && !result.success) {
          addToast(result.error || 'Failed to delete task', 'error');
          setConfirmDialog(null);
          return;
        }
        logAction('Task Deleted', id);
        addToast('Task deleted', 'info');
        setConfirmDialog(null);
      },
    });
  };

  const handleReloadTasks = useCallback(async () => {
    const result = await fetchTasks?.();
    if (result?.success) {
      addToast('Tasks reloaded', 'info');
      return;
    }
    addToast(result?.error || 'Failed to reload tasks', 'error');
  }, [fetchTasks, addToast]);

  /* ── User Management ── */
  const handleUserFormChange = (e) => {
    setUserFormError('');
    setUserForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFormError('');

    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setUserFormError('Name, email and temporary password are required.');
      return;
    }
    if (userForm.password.length < 6) {
      setUserFormError('Temporary password must be at least 6 characters.');
      return;
    }
    if (!createUser) {
      setUserFormError('User creation is not available right now. Please contact support.');
      return;
    }

    setUserFormSubmitting(true);
    const result = await createUser({
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      password: userForm.password,
      role: userForm.role,
      department: userForm.department.trim() || (userForm.role === 'admin' ? 'Administration' : 'General'),
    });
    setUserFormSubmitting(false);

    if (!result?.success) {
      const message = result?.error || 'Unable to create account. Please try again.';
      setUserFormError(message);
      addToast(message, 'error');
      return;
    }

    logAction(`${userForm.role === 'admin' ? 'Admin' : 'Employee'} Created`, userForm.email.trim());
    addToast(result.message || 'User created successfully', 'success');

    const created = normalizePersonRecord({
      ...(result?.user || {}),
      name: result?.user?.name || userForm.name.trim(),
      email: result?.user?.email || userForm.email.trim(),
      role: result?.user?.role || userForm.role,
      department: result?.user?.department || userForm.department.trim() || (userForm.role === 'admin' ? 'Administration' : 'General'),
    });

    const createdEntry = {
      id: created.id || `${created.email || 'created'}-${Date.now()}`,
      name: created.name || userForm.name.trim(),
      email: created.email || userForm.email.trim(),
      role: created.role || userForm.role,
      department: created.department || userForm.department.trim() || '—',
      time: new Date().toISOString(),
    };

    setCreatedUsersLog((previous) => {
      const deduped = previous.filter(
        (item) =>
          String(item.id) !== String(createdEntry.id) &&
          String(item.email || '').toLowerCase() !== String(createdEntry.email || '').toLowerCase(),
      );
      return [createdEntry, ...deduped].slice(0, 20);
    });

    setUserForm({ name: '', email: '', password: '', role: 'employee', department: '' });
    setUserFormOpen(false);
    await refreshEmployees();
    await refreshAdmins();
  };

  /* ── Derived data ── */
  const pendingEmployees = useMemo(
    () => employees.filter((e) => !(e.is_approved ?? e.isApproved)),
    [employees],
  );
  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          (e.is_approved ?? e.isApproved) &&
          (e.is_active ?? e.isActive) !== false,
      ),
    [employees],
  );
  const inactiveEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          (e.is_approved ?? e.isApproved) &&
          (e.is_active ?? e.isActive) === false,
      ),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const base =
      empTab === 'pending'
        ? pendingEmployees
        : empTab === 'active'
        ? activeEmployees
        : inactiveEmployees;
    if (!empSearch.trim()) return base;
    const q = empSearch.toLowerCase();
    return base.filter((e) => {
      const name = (e.name || e.username || '').toLowerCase();
      const email = (e.email || '').toLowerCase();
      const dept = (e.department || '').toLowerCase();
      return (
        name.includes(q) || email.includes(q) || dept.includes(q)
      );
    });
  }, [empTab, pendingEmployees, activeEmployees, inactiveEmployees, empSearch]);

  const stats = useMemo(() => {
    const totalFiles = fileList.length;
    const totalSize = fileList.reduce(
      (sum, f) => sum + (f.size || 0),
      0,
    );
    const empSet = new Set(
      fileList.map((f) => f.userEmail || f.user?.email || f.userId),
    );
    const pending = fileList.filter((f) => f.status === 'pending').length;
    const approved = fileList.filter((f) => f.status === 'approved').length;
    const rejected = fileList.filter((f) => f.status === 'rejected').length;
    const reviewing = fileList.filter(
      (f) => f.status === 'reviewing',
    ).length;
    const todayCount = fileList.filter((f) =>
      isSameDay(f.createdAt),
    ).length;
    const pendingTasks = tasks.filter(
      (t) => t.status === 'pending',
    ).length;
    const doneTasks = tasks.filter(
      (t) => t.status === 'done',
    ).length;
    return {
      totalFiles,
      totalSize,
      employeeCount: empSet.size,
      pending,
      approved,
      rejected,
      reviewing,
      todayCount,
      pendingTasks,
      doneTasks,
    };
  }, [fileList, tasks]);

  const recentFiles = useMemo(() => {
  return [...fileList]
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .slice(0, 5);
}, [fileList]);

  // Weekly upload trend (last 7 days)
  const weeklyTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        value: 0,
        date: d,
      };
    });
    fileList.forEach((f) => {
      if (!f.createdAt) return;
      const fd = new Date(f.createdAt);
      const idx = days.findIndex((d) => isSameDay(fd, d.date));
      if (idx !== -1) days[idx].value++;
    });
    return days;
  }, [fileList]);

  const weeklyTrendDelta = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 6);

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(currentStart.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - 6);

    let currentCount = 0;
    let previousCount = 0;

    for (const file of fileList) {
      if (!file?.createdAt) continue;
      const created = new Date(file.createdAt);
      if (Number.isNaN(created.getTime())) continue;

      if (created >= currentStart && created <= now) {
        currentCount += 1;
      } else if (created >= previousStart && created <= previousEnd) {
        previousCount += 1;
      }
    }

    if (previousCount === 0) {
      return currentCount > 0 ? 100 : 0;
    }

    return Math.round(((currentCount - previousCount) / previousCount) * 100);
  }, [fileList]);

  // Status distribution
  const statusDistribution = useMemo(
    () => [
      { label: 'Pending', value: stats.pending, color: T.amber },
      { label: 'Reviewing', value: stats.reviewing, color: T.accent },
      { label: 'Approved', value: stats.approved, color: T.emerald },
      { label: 'Rejected', value: stats.rejected, color: T.rose },
    ],
    [stats],
  );

  const employeeSummary = useMemo(() => {
    const active = employees.filter(
      (e) => (e.is_approved ?? e.isApproved) && (e.is_active ?? e.isActive) !== false,
    ).length;
    const pendingApproval = employees.filter(
      (e) => !(e.is_approved ?? e.isApproved) && !(e.is_rejected ?? e.isRejected),
    ).length;
    const deactivated = employees.filter(
      (e) => (e.is_approved ?? e.isApproved) && (e.is_active ?? e.isActive) === false,
    ).length;

    return {
      active,
      pendingApproval,
      deactivated,
      tasksOpen: stats.pendingTasks,
      tasksDone: stats.doneTasks,
    };
  }, [employees, stats.pendingTasks, stats.doneTasks]);

  const userManagementCounts = useMemo(() => {
    const employeeRecords = employees.filter((e) => (e.role || 'employee') !== 'admin');
    const awaitingApproval = employeeRecords.filter(
      (e) => !(e.isApproved ?? e.is_approved) && !(e.isRejected ?? e.is_rejected),
    ).length;

    return {
      admins: admins.length,
      employees: employeeRecords.length,
      awaitingApproval,
    };
  }, [admins, employees]);

  const needsAttention = useMemo(
    () =>
      fileList
        .filter(
          (f) => f.status === 'pending' || f.status === 'reviewing',
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt),
        ),
    [fileList],
  );

  const filteredFiles = useMemo(() => {
    let list = [...fileList];

    // Date range
    if (range === 'today') {
      list = list.filter((f) => isSameDay(f.createdAt));
    } else if (range === '7d') {
      list = list.filter((f) => isWithinDays(f.createdAt, 7));
    } else if (range === '30d') {
      list = list.filter((f) => isWithinDays(f.createdAt, 30));
    }

    // Status
    if (statusFilter !== 'all') {
      list = list.filter((f) => f.status === statusFilter);
    }

    // Type
    if (typeFilter !== 'all') {
      list = list.filter(
        (f) => getType(f.originalName) === typeFilter,
      );
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => {
        const name = (f.userName || f.user?.name || '').toLowerCase();
        const email = (f.userEmail || f.user?.email || '').toLowerCase();
        const fileName = (f.originalName || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          fileName.includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'name') {
        return (a.originalName || '').localeCompare(
          b.originalName || '',
        );
      }
      if (sortBy === 'size') {
        return (b.size || 0) - (a.size || 0);
      }
      return 0;
    });

    return list;
  }, [fileList, range, statusFilter, typeFilter, sortBy, search]);

  const paginatedFiles = useMemo(() => {
    const start = (filePage - 1) * ITEMS_PER_PAGE;
    return filteredFiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFiles, filePage]);

  const totalFilePages = Math.ceil(
    filteredFiles.length / ITEMS_PER_PAGE,
  );

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (taskStatusFilter !== 'all') {
      list = list.filter((t) => t.status === taskStatusFilter);
    }
    if (taskPriorityFilter !== 'all') {
      list = list.filter((t) => t.priority === taskPriorityFilter);
    }
    const q = taskSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.assignedToEmail?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tasks, taskStatusFilter, taskPriorityFilter, taskSearch]);

  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * ITEMS_PER_PAGE;
    return filteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTasks, taskPage]);

  const totalTaskPages = Math.ceil(
    filteredTasks.length / ITEMS_PER_PAGE,
  );

  const isOverdue = (dueDate) =>
    dueDate && new Date(dueDate) < new Date() && new Date(dueDate).toDateString() < new Date().toDateString();

  /* ── Tabs config ── */
  // Badge colors removed in favor of a single neutral pill (see render
  // below) — counts communicate via numerals, not a traffic-light of hues.
  const tabs = [
    { id: 'overview', label: 'Overview', icon: I.Chart },
    { id: 'pending', label: 'Needs Review', icon: I.Clock },
    { id: 'files', label: 'All Files', icon: I.Doc },
    { id: 'tasks', label: 'Tasks', icon: I.CheckCircle, badge: taskEventBadge || null },
    { id: 'employees', label: 'Employees', icon: I.Users, badge: employeePendingBadge || null },
    { id: 'users', label: 'User Management', icon: I.UserPlus },
    { id: 'audit', label: 'Audit Log', icon: I.ListBullet },
  ];

  /* ── Export handlers ── */
  const handleExportFiles = () => {
    exportToCSV(
      filteredFiles.map((f) => ({
        name: f.originalName || '',
        employee: f.userName || '',
        email: f.userEmail || '',
        status: f.status || '',
        size: formatBytes(f.size),
        uploaded: formatDate(f.createdAt),
      })),
      'files-export',
    );
    addToast('Files exported to CSV', 'success');
    logAction('Export', `${filteredFiles.length} files`);
  };

  const handleExportTasks = () => {
    exportToCSV(
      tasks.map((t) => ({
        title: t.title || '',
        assignedTo: t.assignedToEmail || '',
        status: t.status || '',
        priority: t.priority || '',
        dueDate: formatDate(t.dueDate),
      })),
      'tasks-export',
    );
    addToast('Tasks exported to CSV', 'success');
  };

  /* ── Render ── */
  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      background: '#000000',
      color: T.txt0, fontFamily: '"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    }}>
      {/* Ambient backdrop: drifting blurred color blobs behind the black
          canvas — the layer the glass cards' backdrop-filter actually
          blurs against. A flat radial-gradient glow alone (the previous
          version) doesn't move and barely registers through blur; these
          give the glass panels real depth and a living, premium feel. */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        <div className="admin-blob admin-blob-a" />
        <div className="admin-blob admin-blob-b" />
        <div className="admin-blob admin-blob-c" />
      </div>

      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        ::placeholder{color:${T.txt2}}
        .admin-blob { position: absolute; border-radius: 50%; filter: blur(90px); will-change: transform; }
        .admin-blob-a { width: 620px; height: 620px; top: -200px; left: -140px; background: radial-gradient(circle, rgba(91,141,239,0.22), rgba(91,141,239,0) 70%); animation: adrift1 30s ease-in-out infinite; }
        .admin-blob-b { width: 560px; height: 560px; top: 8%; right: -180px; background: radial-gradient(circle, rgba(167,139,250,0.16), rgba(167,139,250,0) 70%); animation: adrift2 36s ease-in-out infinite; }
        .admin-blob-c { width: 480px; height: 480px; bottom: -160px; left: 28%; background: radial-gradient(circle, rgba(34,211,238,0.10), rgba(34,211,238,0) 70%); animation: adrift3 34s ease-in-out infinite; }
        @keyframes adrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(50px,30px) scale(1.06); } }
        @keyframes adrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-40px,40px) scale(0.95); } }
        @keyframes adrift3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-30px) scale(1.04); } }
        @media (prefers-reduced-motion: reduce) { .admin-blob { animation: none !important; } }
      `}</style>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '24px 28px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Header ── */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ maxWidth: 520 }}>
              <h1 style={{ fontSize: 26, fontWeight: 600, color: T.txt0, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {greeting}, {firstName(user?.name) || 'there'}
                <span style={{ fontSize: 22 }} aria-hidden="true">{greetingEmoji}</span>
              </h1>
              <p style={{ fontSize: 13.5, color: T.txt1, lineHeight: 1.5, margin: '6px 0 0' }}>
                {todayLabel} · here's what's happening across your workspace.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          <StatCard icon={I.Doc} label="Total Files" value={stats.totalFiles} sub={`${stats.todayCount} today`} color="indigo" trend={weeklyTrendDelta} onClick={() => setActiveTab('files')} />
          <StatCard icon={I.Clock} label="Pending" value={stats.pending} sub={`${stats.reviewing} reviewing`} color="amber" onClick={() => setActiveTab('pending')} />
          <StatCard icon={I.Shield} label="Approved" value={stats.approved} sub={`${stats.rejected} rejected`} color="emerald" onClick={() => { setActiveTab('files'); setStatusFilter('approved'); }} />
          <StatCard icon={I.Users} label="Employees" value={employees.length} sub={`${employeeSummary.pendingApproval} pending`} color="violet" onClick={() => setActiveTab('employees')} />
          <StatCard icon={I.CheckCircle} label="Tasks" value={tasks.length} sub={`${stats.pendingTasks} open`} color="sky" onClick={() => setActiveTab('tasks')} />
          <StatCard icon={I.Download} label="Storage" value={formatBytes(stats.totalSize)} sub="total uploaded" color="rose" onClick={() => setActiveTab('files')} />
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} type="button" style={{
                display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8, borderRadius: 11, padding: '9px 16px',
                fontSize: 13, fontWeight: active ? 600 : 500, transition: 'all 0.15s', whiteSpace: 'nowrap',
                border: `1px solid ${active ? T.bdr2 : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit',
                background: active ? T.bg3 : 'transparent', color: active ? T.txt0 : T.txt2,
                boxShadow: active ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
              }}>
                <Icon style={{ color: active ? T.txt0 : T.txt2 }} />
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{ borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700, color: active ? '#000' : T.txt0, background: active ? T.txt0 : 'rgba(255,255,255,0.12)' }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── OVERVIEW TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, animation: 'fadeIn 0.25s ease-out both' }}>
            {/* Upload trend */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>Upload Trend</p>
                  <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>Last 7 days</p>
                </div>
                <I.Chart style={{ color: '#7aa8ff' }} />
              </div>
              <MiniBarChart data={weeklyTrend} color={T.accent} />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                {weeklyTrend.map((d) => (
                  <span key={d.label} style={{ fontSize: 9.5, color: T.txt2 }}>{d.label}</span>
                ))}
              </div>
            </Card>

            {/* Status distribution */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>File Status</p>
                  <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>Distribution</p>
                </div>
                <I.Funnel style={{ color: T.violet }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {statusDistribution.map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: T.txt1, width: 64, flexShrink: 0 }}>{s.label}</span>
                    <div style={{ flex: 1, borderRadius: 999, background: T.bg4, height: 7, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, transition: 'width 0.5s', width: `${stats.totalFiles ? (s.value / stats.totalFiles) * 100 : 0}%`, background: s.color }} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: T.txt0, width: 20, textAlign: 'right', flexShrink: 0 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick actions */}
            <Card>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: '0 0 16px' }}>Quick Actions</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Review pending', icon: I.Clock, onClick: () => setActiveTab('pending'), color: T.amber, bg: T.amberD, border: 'rgba(245,166,35,0.2)' },
                  { label: 'New task', icon: I.PlusCircle, onClick: () => { setActiveTab('tasks'); setTaskFormOpen(true); }, color: '#7aa8ff', bg: T.accentL, border: 'rgba(59,124,255,0.2)' },
                  { label: 'All files', icon: I.Doc, onClick: () => setActiveTab('files'), color: T.txt1, bg: T.bg3, border: T.bdr1 },
                  { label: 'Approve staff', icon: I.Users, onClick: () => { setActiveTab('employees'); setEmpTab('pending'); }, color: T.emerald, bg: T.emeraldD, border: 'rgba(16,232,160,0.2)' },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.label} onClick={a.onClick} type="button" style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderRadius: 13, padding: '14px 10px',
                      fontSize: 11, fontWeight: 600, transition: 'transform 0.15s', cursor: 'pointer', fontFamily: 'inherit',
                      border: `1px solid ${a.border}`, background: a.bg, color: a.color,
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      <Icon />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Recent activity */}
            <Card style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>Recent Uploads</p>
                <button onClick={() => setActiveTab('files')} style={{ fontSize: 11, color: '#7aa8ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>View all</button>
              </div>
              {recentFiles.length === 0 ? (
<div
  style={{
    textAlign: 'center',
    padding: '40px',
  }}
>
  <I.Doc
    style={{
      width: 40,
      height: 40,
      color: T.txt2,
      marginBottom: 12,
    }}
  />

  <p
    style={{
      fontSize: 13,
      color: T.txt1,
      margin: 0,
    }}
  >
    No files uploaded
  </p>

  <p
    style={{
      fontSize: 11,
      color: T.txt2,
      marginTop: 8,
    }}
  >
    Upload files to get started.
  </p>
</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
{recentFiles.map((f) => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, border: `1px solid ${T.bdr0}`, padding: '10px 12px', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg3} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: T.accentL, flexShrink: 0 }}>
                        <I.Doc style={{ color: '#7aa8ff' }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: T.txt0, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.originalName}</p>
                        <p style={{ fontSize: 10.5, color: T.txt2, margin: '2px 0 0' }}>{f.userName} · {timeAgo(f.createdAt)}</p>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Employees summary */}
            <Card>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: '0 0 16px' }}>Employee Summary</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Active', value: employeeSummary.active, color: T.emerald },
                  { label: 'Pending approval', value: employeeSummary.pendingApproval, color: T.amber },
                  { label: 'Deactivated', value: employeeSummary.deactivated, color: T.txt2 },
                  { label: 'Tasks open', value: employeeSummary.tasksOpen, color: T.accent },
                  { label: 'Tasks done', value: employeeSummary.tasksDone, color: T.emerald },
                ].map((item) => (
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

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── PENDING / NEEDS REVIEW TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'pending' && (
          <section style={{ borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden', animation: 'fadeIn 0.25s ease-out both' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${T.bdr1}`, padding: '16px 24px', background: 'linear-gradient(90deg, rgba(240,177,77,0.05), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.amberD }}>
                  <I.Clock style={{ color: T.amber }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: T.txt0, margin: 0 }}>Files Needing Review</h2>
                  <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>Approve, reject, or mark files under review</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedFiles.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 11, border: `1px solid ${T.bdr2}`, background: T.accentG, padding: '7px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#7aa8ff' }}>{selectedFiles.size} selected</span>
                    <button onClick={() => handleBulkAction('approved')} style={{ fontSize: 10.5, fontWeight: 700, color: T.emerald, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Approve all</button>
                    <button onClick={() => handleBulkAction('rejected')} style={{ fontSize: 10.5, fontWeight: 700, color: T.rose, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Reject all</button>
                    <button onClick={() => setSelectedFiles(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.txt2, display: 'flex' }}><I.X /></button>
                  </div>
                )}
                <span style={{ borderRadius: 999, border: '1px solid rgba(245,166,35,0.25)', background: T.amberD, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: T.amber }}>{needsAttention.length} pending</span>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {needsAttention.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `2px dashed ${T.bdr1}`, padding: '60px 0', textAlign: 'center' }}>
                  <I.CheckCircle style={{ width: 44, height: 44, color: T.emerald }} />
                  <p style={{ marginTop: 12, fontSize: 13.5, fontWeight: 700, color: T.txt1 }}>All caught up!</p>
                  <p style={{ fontSize: 12, color: T.txt2 }}>No files are waiting for review.</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={selectedFiles.size === needsAttention.length && needsAttention.length > 0}
                      onChange={(e) => setSelectedFiles(e.target.checked ? new Set(needsAttention.map((f) => f.id)) : new Set())}
                      style={{ width: 15, height: 15, accentColor: T.accent, cursor: 'pointer' }} />
                    <span style={{ fontSize: 11, color: T.txt2 }}>Select all</span>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
                    {needsAttention.map((file) => (
                      <PendingRow key={file.id} file={file} onReview={setReviewFile} selected={selectedFiles.has(file.id)}
                        onSelect={() => setSelectedFiles((p) => { const next = new Set(p); next.has(file.id) ? next.delete(file.id) : next.add(file.id); return next; })} />
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Bottom summary bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: `1px solid ${T.bdr1}`, background: T.bg3 }}>
              {[
                { label: 'Approved', value: stats.approved, color: T.emerald, icon: I.CheckCircle },
                { label: 'Rejected', value: stats.rejected, color: T.rose, icon: I.XCircle },
                { label: 'Reviewing', value: stats.reviewing, color: T.accent, icon: I.Eye },
                { label: 'Pending', value: stats.pending, color: T.amber, icon: I.Clock },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 0', borderLeft: i > 0 ? `1px solid ${T.bdr0}` : 'none' }}>
                    <Icon style={{ color: item.color }} />
                    <span style={{ fontSize: 17, fontWeight: 700, color: item.color }}>{item.value}</span>
                    <span style={{ fontSize: 10, color: T.txt2 }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── ALL FILES TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'files' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.25s ease-out both' }}>
            {/* Filter bar */}
            <Card style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.accentL }}>
                      <I.Adjustments style={{ color: '#7aa8ff' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: T.txt0, margin: 0 }}>Filter & Sort</p>
                      <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} match</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    {[
                      { value: range, onChange: setRange, options: [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['all', 'All time']] },
                      { value: statusFilter, onChange: setStatusFilter, options: [['all', 'All statuses'], ['pending', 'Pending'], ['reviewing', 'Reviewing'], ['approved', 'Approved'], ['rejected', 'Rejected']] },
                      { value: typeFilter, onChange: setTypeFilter, options: [['all', 'All types'], ['pdf', 'PDF'], ['image', 'Images'], ['doc', 'Office'], ['other', 'Other']] },
                      { value: sortBy, onChange: setSortBy, options: [['newest', 'Newest'], ['oldest', 'Oldest'], ['name', 'Name'], ['size', 'Size']] },
                    ].map((sel, i) => (
                      <select key={i} value={sel.value} onChange={(e) => { sel.onChange(e.target.value); setFilePage(1); }}
                        style={{ borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px 11px', fontSize: 12, color: T.txt1, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                        {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ))}

                    <div style={{ position: 'relative' }}>
                      <I.Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.txt2, pointerEvents: 'none' }} />
                      <input type="text" placeholder="Search files, employees…" value={search}
                        onChange={(e) => { setSearch(e.target.value); setFilePage(1); }}
                        style={{ minWidth: 180, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px 12px 8px 30px', fontSize: 12, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: 2 }}>
                      <button onClick={() => setViewMode('list')} style={{ display: 'flex', borderRadius: 8, padding: 6, border: 'none', cursor: 'pointer', background: viewMode === 'list' ? T.bg4 : 'transparent', color: viewMode === 'list' ? T.txt0 : T.txt2 }}>
                        <I.ListBullet />
                      </button>
                      <button onClick={() => setViewMode('grid')} style={{ display: 'flex', borderRadius: 8, padding: 6, border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? T.bg4 : 'transparent', color: viewMode === 'grid' ? T.txt0 : T.txt2 }}>
                        <I.Grid />
                      </button>
                    </div>

                    <button onClick={handleExportFiles} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px 13px', fontSize: 12, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <I.Download /> Export
                    </button>

                    {(search || typeFilter !== 'all' || range !== 'all' || sortBy !== 'newest' || statusFilter !== 'all') && (
                      <button onClick={() => { setSearch(''); setTypeFilter('all'); setRange('all'); setSortBy('newest'); setStatusFilter('all'); setFilePage(1); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 10, border: '1px solid rgba(255,95,126,0.25)', background: T.roseD, padding: '8px 13px', fontSize: 12, fontWeight: 600, color: T.rose, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <I.X /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk actions */}
                {selectedFiles.size > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderRadius: 12, border: `1px solid ${T.bdr2}`, background: T.accentG, padding: '10px 16px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7aa8ff' }}>{selectedFiles.size} selected</span>
                    <button onClick={() => handleBulkAction('approved')} style={{ borderRadius: 8, background: T.emerald, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#04261a', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Approve</button>
                    <button onClick={() => handleBulkAction('rejected')} style={{ borderRadius: 8, background: T.rose, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#330014', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Reject</button>
                    <button onClick={() => handleBulkAction('reviewing')} style={{ borderRadius: 8, background: T.accent, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Mark reviewing</button>
                    <button onClick={handleBulkDelete} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 8, border: '1px solid rgba(255,95,126,0.25)', background: 'transparent', padding: '5px 12px', fontSize: 11, fontWeight: 700, color: T.rose, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <I.Trash /> Delete
                    </button>
                    <button onClick={() => setSelectedFiles(new Set())} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7aa8ff', display: 'flex' }}>
                      <I.X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                )}
              </div>
            </Card>

            <div style={{ borderRadius: 16, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden' }}>
              <FileList
                files={paginatedFiles}
                isAdmin
                onPreview={setPreviewFile}
                onStatusChange={handleUpdateFileStatus}
                onReview={setReviewFile}
                selectedFiles={selectedFiles}
                onSelectFile={(id) => setSelectedFiles((p) => { const next = new Set(p); next.has(id) ? next.delete(id) : next.add(id); return next; })}
              />
              <Pagination current={filePage} total={totalFilePages} onChange={setFilePage} />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── TASKS TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'tasks' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.25s ease-out both' }}>
            <div style={{ borderRadius: 16, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.bdr1}`, padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.accentL }}>
                    <I.PlusCircle style={{ color: '#7aa8ff' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: T.txt0, margin: 0 }}>Task Manager</h2>
                    <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>Assign and track employee tasks</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={handleReloadTasks} type="button" style={{
                    display: 'flex', alignItems: 'center', gap: 6, borderRadius: 11, padding: '9px 13px', fontSize: 12, fontWeight: 700,
                    border: `1px solid ${T.bdr1}`, cursor: 'pointer', fontFamily: 'inherit',
                    background: T.bg3, color: T.txt1,
                  }}>
                    <I.Refresh /> Reload
                  </button>
                  <button onClick={() => setTaskFormOpen((p) => !p)} type="button" style={{
                    display: 'flex', alignItems: 'center', gap: 7, borderRadius: 11, padding: '9px 16px', fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    background: taskFormOpen ? T.bg4 : T.accent, color: '#fff',
                  }}>
                    {taskFormOpen ? <I.X /> : <I.PlusCircle />}
                    {taskFormOpen ? 'Discard' : 'New Task'}
                  </button>
                </div>
              </div>

              {taskFormOpen && (
                <form onSubmit={handleTaskSubmit} style={{ borderBottom: `1px solid ${T.bdr1}`, background: 'linear-gradient(135deg, rgba(59,124,255,0.05), rgba(167,139,250,0.04))', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Task Title <span style={{ color: T.rose }}>*</span></label>
                      <input type="text" name="title" value={taskForm.title} onChange={handleTaskChange} placeholder="e.g. Upload April payslip" required
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '10px 14px', fontSize: 13, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Priority</label>
                      <select name="priority" value={taskForm.priority} onChange={handleTaskChange}
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '10px 14px', fontSize: 13, color: T.txt1, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Assign To <span style={{ color: T.rose }}>*</span></label>
                      <input type="email" name="assignedToEmail" value={taskForm.assignedToEmail} onChange={handleTaskChange} placeholder="employee@company.com" required
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '10px 14px', fontSize: 13, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Due Date</label>
                      <input type="date" name="dueDate" value={taskForm.dueDate} onChange={handleTaskChange}
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '10px 14px', fontSize: 13, color: T.txt1, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Description</label>
                      <input type="text" name="description" value={taskForm.description} onChange={handleTaskChange} placeholder="Short note for employee…"
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '10px 14px', fontSize: 13, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Attach File</label>
                      <input type="file" name="adminFile" onChange={handleTaskChange}
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px 12px', fontSize: 11.5, color: T.txt1, fontFamily: 'inherit' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 11, background: T.accent, padding: '10px 24px', fontSize: 12, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,124,255,0.3)', fontFamily: 'inherit' }}>
                      <I.Check /> Create Task
                    </button>
                  </div>
                </form>
              )}

              {/* Task filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderBottom: `1px solid ${T.bdr1}`, background: T.bg3, padding: '12px 24px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                  <I.Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.txt2, pointerEvents: 'none' }} />
                  <input type="text" placeholder="Search tasks…" value={taskSearch} onChange={(e) => { setTaskSearch(e.target.value); setTaskPage(1); }}
                    style={{ width: '100%', borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg2, padding: '8px 12px 8px 30px', fontSize: 12, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <select value={taskStatusFilter} onChange={(e) => { setTaskStatusFilter(e.target.value); setTaskPage(1); }}
                  style={{ borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg2, padding: '8px 11px', fontSize: 12, color: T.txt1, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <select value={taskPriorityFilter} onChange={(e) => { setTaskPriorityFilter(e.target.value); setTaskPage(1); }}
                  style={{ borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg2, padding: '8px 11px', fontSize: 12, color: T.txt1, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="all">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button onClick={handleExportTasks} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg2, padding: '8px 13px', fontSize: 12, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <I.Download /> Export
                </button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: T.txt2 }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Task list */}
              <div style={{ padding: '16px 24px' }}>
                {paginatedTasks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `2px dashed ${T.bdr1}`, padding: '48px 0', textAlign: 'center' }}>
                    <I.ExclCircle style={{ width: 36, height: 36, color: T.txt2 }} />
                    <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: T.txt2 }}>No tasks found</p>
                    <p style={{ fontSize: 11.5, color: T.txt2 }}>Try adjusting your filters or create a new task.</p>
                  </div>
                ) : (
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
                    {paginatedTasks.map((t) => {
                      const statusCfg = TASK_STATUS_CONFIG[t.status] || TASK_STATUS_CONFIG.pending;
                      const priorityCfg = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                      const overdue = isOverdue(t.dueDate) && t.status !== 'done';
                      return (
                        <li key={t.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 14, borderRadius: 13, padding: '14px 16px', transition: 'all 0.15s',
                          border: `1px solid ${overdue ? 'rgba(255,95,126,0.25)' : T.bdr0}`,
                          background: overdue ? 'rgba(255,95,126,0.04)' : T.bg3,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <p style={{ fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0 }}>{t.title}</p>
                              {overdue && <span style={{ borderRadius: 999, border: '1px solid rgba(255,95,126,0.25)', background: T.roseD, padding: '1px 8px', fontSize: 10, fontWeight: 700, color: T.rose }}>Overdue</span>}
                            </div>
                            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: T.txt2 }}>{t.assignedToEmail}</span>
                              {t.dueDate && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: overdue ? 600 : 400, color: overdue ? T.rose : T.txt2 }}>
                                  <I.Calendar /> Due {formatDate(t.dueDate)}
                                </span>
                              )}
                              {t.description && <span style={{ fontSize: 11, color: T.txt2, fontStyle: 'italic', maxWidth: 280, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{t.description}</span>}
                            </div>
                            {t.adminFile && (
                              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <I.Doc style={{ width: 12, height: 12, color: '#7aa8ff' }} />
                                <a href={typeof t.adminFile === 'string' ? t.adminFile : URL.createObjectURL(t.adminFile)} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 10.5, fontWeight: 600, color: '#7aa8ff', textDecoration: 'none' }}>View attachment</a>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 9px', fontSize: 10, fontWeight: 700, border: `1px solid ${priorityCfg.border}`, background: priorityCfg.bg, color: priorityCfg.color }}>
                              <I.Flag /> {priorityCfg.label}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '3px 11px', fontSize: 11, fontWeight: 600, border: `1px solid ${statusCfg.border}`, background: statusCfg.bg, color: statusCfg.color }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot }} />
                              {statusCfg.label}
                            </span>
                            <span style={{ borderRadius: 9, border: `1px solid ${T.bdr1}`, background: T.bg2, padding: '5px 9px', fontSize: 10.5, color: T.txt2 }}>
                              Status updated by employee
                            </span>
                            <button onClick={() => handleDeleteTask(t.id)} style={{ borderRadius: 9, border: '1px solid rgba(255,95,126,0.2)', background: T.roseD, padding: 7, color: T.rose, cursor: 'pointer', display: 'flex' }}>
                              <I.Trash />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Pagination current={taskPage} total={totalTaskPages} onChange={setTaskPage} />
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── EMPLOYEES TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'employees' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.25s ease-out both' }}>
            <Card style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'pending', label: 'Pending', count: pendingEmployees.length },
                      { id: 'active', label: 'Active', count: activeEmployees.length },
                      { id: 'inactive', label: 'Deactivated', count: inactiveEmployees.length },
                    ].map((t) => (
                      <button key={t.id} onClick={() => setEmpTab(t.id)} type="button" style={{
                        display: 'flex', alignItems: 'center', gap: 7, borderRadius: 10, padding: '8px 15px', fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: empTab === t.id ? T.bg4 : 'transparent', color: empTab === t.id ? T.txt0 : T.txt1,
                      }}>
                        {t.label}
                        {t.count > 0 && <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 9.5, fontWeight: 700, color: empTab === t.id ? '#000' : T.txt0, background: empTab === t.id ? T.txt0 : 'rgba(255,255,255,0.12)' }}>{t.count}</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <I.Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.txt2, pointerEvents: 'none' }} />
                    <input type="text" placeholder="Search employees…" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
                      style={{ minWidth: 220, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '8px 12px 8px 30px', fontSize: 12, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                </div>
              </div>
            </Card>

            {adminError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, border: '1px solid rgba(255,95,126,0.25)', background: T.roseD, padding: '14px 18px' }}>
                <I.ExclCircle style={{ color: T.rose, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#ffb8c6', margin: 0, flex: 1 }}>{adminError}</p>
                <button onClick={() => setAdminError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <I.X style={{ color: T.rose }} />
                </button>
              </div>
            )}

            <div style={{ borderRadius: 16, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden' }}>
              {filteredEmployees.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
                  <I.Users style={{ width: 44, height: 44, color: T.txt2 }} />
                  <p style={{ marginTop: 12, fontSize: 13.5, fontWeight: 700, color: T.txt2 }}>No employees found</p>
                  <p style={{ fontSize: 11.5, color: T.txt2 }}>{empSearch ? 'Try a different search term.' : `No ${empTab} employees.`}</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {filteredEmployees.map((emp, i) => (
                    <li key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderTop: i > 0 ? `1px solid ${T.bdr0}` : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{
                        display: 'flex', height: 38, width: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 13.5, fontWeight: 700,
                        background: 'rgba(255,255,255,0.07)', border: `1px solid ${T.bdr1}`, color: T.txt0,
                      }}>
                        {(emp.name || emp.username || '?').toUpperCase().slice(0, 1)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 13.5, fontWeight: 700, color: T.txt0, margin: 0 }}>{emp.name || emp.username}</p>
                          {emp.department && <span style={{ borderRadius: 999, background: T.bg4, padding: '1px 9px', fontSize: 10, fontWeight: 600, color: T.txt1 }}>{emp.department}</span>}
                        </div>
                        <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11.5, color: T.txt2 }}>{emp.email}</span>
                          {emp.createdAt && <span style={{ fontSize: 10.5, color: T.txt2 }}>Joined {formatDate(emp.createdAt)}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 14 }}>
                        {empTab === 'pending' && (
                          <EmployeeStatusToggle
                            mode="pending"
                            busy={busyEmployeeIds.has(emp.id)}
                            onActivate={() => handleApprove(emp.id)}
                            onDeactivate={() => handleReject(emp.id)}
                          />
                        )}
                        {empTab === 'active' && (
                          <EmployeeStatusToggle
                            mode="active"
                            busy={busyEmployeeIds.has(emp.id)}
                            onActivate={() => {}}
                            onDeactivate={() => handleDeactivate(emp.id)}
                          />
                        )}
                        {empTab === 'inactive' && (
                          <EmployeeStatusToggle
                            mode="inactive"
                            busy={busyEmployeeIds.has(emp.id)}
                            onActivate={() => handleReactivate(emp.id)}
                            onDeactivate={() => {}}
                          />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── USER MANAGEMENT TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.25s ease-out both' }}>
            {/* Header / create button */}
            <div style={{ borderRadius: 18, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', height: 38, width: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.bdr1}` }}>
                    <I.UserPlus style={{ color: T.txt0 }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 14.5, fontWeight: 600, color: T.txt0, margin: 0 }}>User Management</h2>
                    <p style={{ fontSize: 11.5, color: T.txt2, margin: '2px 0 0' }}>Create admin or employee accounts directly — no approval step needed</p>
                  </div>
                </div>
                <button
                  onClick={() => { setUserFormOpen((p) => !p); setUserFormError(''); }}
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, borderRadius: 11, padding: '10px 18px', fontSize: 12.5, fontWeight: 700,
                    border: `1px solid ${userFormOpen ? T.bdr2 : 'transparent'}`, cursor: 'pointer', fontFamily: 'inherit',
                    background: userFormOpen ? 'rgba(255,255,255,0.08)' : T.txt0, color: userFormOpen ? T.txt0 : '#000',
                  }}
                >
                  {userFormOpen ? <I.X /> : <I.UserPlus />}
                  {userFormOpen ? 'Discard' : 'New User'}
                </button>
              </div>

              {userFormOpen && (
                <form onSubmit={handleCreateUser} style={{ borderTop: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.02)', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Role selector — segmented, no color: weight + fill communicate the active choice */}
                  <div>
                    <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2, display: 'block', marginBottom: 8 }}>Account Type</label>
                    <div style={{ display: 'inline-flex', borderRadius: 11, border: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.03)', padding: 3, gap: 2 }}>
                      {[
                        { id: 'employee', label: 'Employee', icon: I.Briefcase },
                        { id: 'admin', label: 'Admin', icon: I.UserKey },
                      ].map((r) => {
                        const Icon = r.icon;
                        const activeRole = userForm.role === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setUserForm((p) => ({ ...p, role: r.id }))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7, borderRadius: 9, padding: '8px 18px', fontSize: 12.5, fontWeight: 700,
                              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                              background: activeRole ? T.txt0 : 'transparent', color: activeRole ? '#000' : T.txt1,
                              transition: 'all 0.15s',
                            }}
                          >
                            <Icon /> {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Full Name <span style={{ color: T.txt0 }}>*</span></label>
                      <input type="text" name="name" value={userForm.name} onChange={handleUserFormChange} placeholder="e.g. Priya Sharma" required
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.04)', padding: '11px 14px', fontSize: 13, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Company Email <span style={{ color: T.txt0 }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <I.Mail style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.txt2, pointerEvents: 'none' }} />
                        <input type="email" name="email" value={userForm.email} onChange={handleUserFormChange} placeholder="name@sskatt.com" required
                          style={{ width: '100%', borderRadius: 11, border: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.04)', padding: '11px 14px 11px 36px', fontSize: 13, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Temporary Password <span style={{ color: T.txt0 }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <I.Lock style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.txt2, pointerEvents: 'none' }} />
                        <input type="password" name="password" value={userForm.password} onChange={handleUserFormChange} placeholder="Min. 6 characters" required minLength={6}
                          style={{ width: '100%', borderRadius: 11, border: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.04)', padding: '11px 14px 11px 36px', fontSize: 13, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>Department / Title</label>
                      <input type="text" name="department" value={userForm.department} onChange={handleUserFormChange} placeholder={userForm.role === 'admin' ? 'Administration' : 'e.g. Engineering'}
                        style={{ borderRadius: 11, border: `1px solid ${T.bdr1}`, background: 'rgba(255,255,255,0.04)', padding: '11px 14px', fontSize: 13, color: T.txt0, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>

                  {userFormError && (
                    <div style={{ borderRadius: 12, border: `1px solid rgba(255,95,126,0.32)`, background: 'linear-gradient(135deg, rgba(255,95,126,0.13), rgba(255,95,126,0.05))', padding: '11px 13px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <I.ExclCircle style={{ color: '#ffb8c6', flexShrink: 0, marginTop: 1 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: '#ffd6de', margin: 0 }}>{userFormError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 11, color: T.txt2, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <I.Sparkle style={{ color: T.txt2 }} />
                      Account is created already approved and active — share the password with them securely.
                    </p>
                    <button type="submit" disabled={userFormSubmitting} style={{
                      display: 'flex', alignItems: 'center', gap: 8, borderRadius: 11, background: T.txt0, padding: '11px 26px', fontSize: 12.5, fontWeight: 700,
                      color: '#000', border: 'none', cursor: userFormSubmitting ? 'default' : 'pointer', opacity: userFormSubmitting ? 0.6 : 1, fontFamily: 'inherit',
                    }}>
                      {userFormSubmitting ? (
                        <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                      ) : <I.Check />}
                      {userFormSubmitting ? 'Creating…' : `Create ${userForm.role === 'admin' ? 'Admin' : 'Employee'}`}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Role breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.bdr1}` }}>
                    <I.UserKey style={{ color: T.txt0 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: T.txt0, margin: 0 }}>{userManagementCounts.admins}</p>
                    <p style={{ fontSize: 10.5, color: T.txt2, margin: 0 }}>Admins</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.bdr1}` }}>
                    <I.Briefcase style={{ color: T.txt0 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: T.txt0, margin: 0 }}>{userManagementCounts.employees}</p>
                    <p style={{ fontSize: 10.5, color: T.txt2, margin: 0 }}>Employees</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.bdr1}` }}>
                    <I.Clock style={{ color: T.txt0 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: T.txt0, margin: 0 }}>{userManagementCounts.awaitingApproval}</p>
                    <p style={{ fontSize: 10.5, color: T.txt2, margin: 0 }}>Awaiting approval</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recently created (this session) */}
            <div style={{ borderRadius: 16, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.bdr1}`, padding: '14px 24px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.txt0, margin: 0 }}>Created this session</p>
                <span style={{ fontSize: 11, color: T.txt2 }}>{createdUsersLog.length} account{createdUsersLog.length !== 1 ? 's' : ''}</span>
              </div>
              {createdUsersLog.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center' }}>
                  <I.UserPlus style={{ width: 36, height: 36, color: T.txt2 }} />
                  <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: T.txt2 }}>No accounts created yet</p>
                  <p style={{ fontSize: 11.5, color: T.txt2 }}>New admin or employee accounts you create will show up here.</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {createdUsersLog.map((u, i) => (
                    <li key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderTop: i > 0 ? `1px solid ${T.bdr0}` : 'none' }}>
                      <div style={{ display: 'flex', height: 36, width: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.07)', border: `1px solid ${T.bdr1}`, color: T.txt0 }}>
                        {u.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0 }}>{u.name}</p>
                          <span style={{ borderRadius: 999, background: 'rgba(255,255,255,0.08)', padding: '1px 9px', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.txt1 }}>{u.role}</span>
                          <span style={{ borderRadius: 999, background: T.bg4, padding: '1px 9px', fontSize: 10, fontWeight: 600, color: T.txt1 }}>{u.department}</span>
                        </div>
                        <p style={{ fontSize: 11.5, color: T.txt2, margin: '2px 0 0' }}>{u.email}</p>
                      </div>
                      <span style={{ fontSize: 10.5, color: T.txt2, flexShrink: 0 }}>{timeAgo(u.time)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── AUDIT LOG TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <section style={{ borderRadius: 16, border: `1px solid ${T.glassBorder}`, background: T.glass, backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', overflow: 'hidden', animation: 'fadeIn 0.25s ease-out both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.bdr1}`, padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: T.bg4 }}>
                  <I.ListBullet style={{ color: T.txt1 }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: T.txt0, margin: 0 }}>Audit Log</h2>
                  <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>All admin actions in this session</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: T.txt2 }}>{auditLog.length} entries</span>
                {auditLog.length > 0 && (
                  <button onClick={() => exportToCSV(auditLog.map((e) => ({ action: e.action, detail: e.detail, admin: e.admin, time: e.time })), 'audit-log')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, border: `1px solid ${T.bdr1}`, background: T.bg3, padding: '7px 13px', fontSize: 11.5, fontWeight: 600, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <I.Download /> Export
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {auditLog.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `2px dashed ${T.bdr1}`, padding: '56px 0', textAlign: 'center' }}>
                  <I.Info style={{ width: 36, height: 36, color: T.txt2 }} />
                  <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: T.txt2 }}>No actions yet</p>
                  <p style={{ fontSize: 11.5, color: T.txt2 }}>Admin actions will appear here as you use the dashboard.</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 1, background: T.bdr1 }} />
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, listStyle: 'none', margin: 0, padding: '0 0 0 40px' }}>
                    {auditLog.map((entry) => (
                      <li key={entry.id} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -26, top: 8, display: 'flex', height: 16, width: 16, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `2px solid ${T.bg2}`, background: T.accent, boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
                        <div style={{ borderRadius: 12, border: `1px solid ${T.bdr0}`, background: T.bg3, padding: '12px 16px', transition: 'background 0.12s' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: T.txt0, margin: 0 }}>{entry.action}</p>
                              <p style={{ fontSize: 11, color: T.txt2, margin: '3px 0 0' }}>{entry.detail}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#7aa8ff', margin: 0 }}>{entry.admin}</p>
                              <p style={{ fontSize: 10, color: T.txt2, margin: '2px 0 0' }}>{timeAgo(entry.time)}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── MODALS ── */}
      <PreviewModal
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
      <ReviewModal
        file={reviewFile}
        open={!!reviewFile}
        onClose={() => setReviewFile(null)}
        onUpdateStatus={handleUpdateFileStatus}
      />

      {/* ── CONFIRM DIALOG ── */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />


    </div>
  );
};

export default AdminDashboard;