// src/pages/EmployeeDashboard.jsx
// Production-ready SaaS/PaaS Employee Dashboard
// REDESIGN v2: Rich-white glassmorphism, SaaS/PaaS production grade — all business logic 100% preserved.

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarDaysIcon,
  FunnelIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  BellIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';

import { api } from '../api';

import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FilesContext';
import { useTasks } from '../context/TasksContext';

import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import PreviewModal from '../components/PreviewModal';
import ShareModal from '../components/ShareModal';
import StatusBadge from '../components/StatusBadge';

import {
  formatLongDate,
  formatTime,
  isSameDay,
  isWithinDays,
} from '../utils/dateUtils';

/* ─── Constants ──────────────────────────────────────────────────────── */
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const WS_BASE_URL  = import.meta.env.VITE_WS_URL  || API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'text-slate-500', bg: 'bg-slate-100',  border: 'border-slate-200',  dot: 'bg-slate-400'  },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400'  },
  high:   { label: 'High',   color: 'text-rose-600',  bg: 'bg-rose-50',    border: 'border-rose-200',   dot: 'bg-rose-400'   },
};

const TASK_STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400',  icon: ClockIcon       },
  in_progress: { label: 'In Progress', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-400',   icon: EyeIcon         },
  done:        { label: 'Completed',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',dot: 'bg-emerald-400',icon: CheckCircleIcon  },
};

const STATUS_CONFIG = {
  pending:   { icon: ClockIcon,       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Pending review',  note: 'Waiting for admin review.'          },
  reviewing: { icon: EyeIcon,         color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'Under review',    note: 'An admin is reviewing your file.'   },
  approved:  { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Approved',         note: 'Your file has been approved.'       },
  rejected:  { icon: XCircleIcon,     color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',    label: 'Rejected',         note: 'Your file was rejected. See admin note.' },
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
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv', 'tsv', 'json'].includes(ext)) return 'data';
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

const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

/* ─── Toast ───────────────────────────────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-[100] space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className="toast-item" style={{
        pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12,
        borderRadius: 16, padding: '14px 18px', fontSize: 13, fontWeight: 600,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.25)' : t.type === 'error' ? 'rgba(244,63,94,0.25)' : 'rgba(99,102,241,0.25)'}`,
        boxShadow: `0 12px 40px ${t.type === 'success' ? 'rgba(16,185,129,0.18)' : t.type === 'error' ? 'rgba(244,63,94,0.18)' : 'rgba(99,102,241,0.18)'}, 0 1px 0 rgba(255,255,255,0.8) inset`,
        color: t.type === 'success' ? '#047857' : t.type === 'error' ? '#be123c' : '#4338ca',
        animation: 'slideUp 0.3s cubic-bezier(.16,1,.3,1)',
      }}>
        {t.type === 'success' && <CheckCircleIcon style={{ width: 18, height: 18, color: '#10b981', flexShrink: 0 }} />}
        {t.type === 'error'   && <XCircleIcon     style={{ width: 18, height: 18, color: '#f43f5e', flexShrink: 0 }} />}
        {t.type === 'info'    && <InformationCircleIcon style={{ width: 18, height: 18, color: '#6366f1', flexShrink: 0 }} />}
        <span style={{ flex: 1 }}>{t.message}</span>
        <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: 2, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 0.4}>
          <XMarkIcon style={{ width: 14, height: 14 }} />
        </button>
      </div>
    ))}
  </div>
);

/* ─── Stat Card — Pure Glassmorphism SaaS ──────────────────────────────── */
const STAT_CARD_THEMES = {
  indigo:  { accent: '#6366f1', accentDeep: '#4338ca', glow: 'rgba(99,102,241,0.20)',  iconBg: 'rgba(99,102,241,0.12)'  },
  sky:     { accent: '#0ea5e9', accentDeep: '#0369a1', glow: 'rgba(14,165,233,0.20)',  iconBg: 'rgba(14,165,233,0.12)'  },
  emerald: { accent: '#10b981', accentDeep: '#047857', glow: 'rgba(16,185,129,0.20)',  iconBg: 'rgba(16,185,129,0.12)'  },
  rose:    { accent: '#f43f5e', accentDeep: '#be123c', glow: 'rgba(244,63,94,0.20)',   iconBg: 'rgba(244,63,94,0.12)'   },
  violet:  { accent: '#8b5cf6', accentDeep: '#6d28d9', glow: 'rgba(139,92,246,0.20)',  iconBg: 'rgba(139,92,246,0.12)'  },
  fuchsia: { accent: '#d946ef', accentDeep: '#a21caf', glow: 'rgba(217,70,239,0.18)',  iconBg: 'rgba(217,70,239,0.12)'  },
  amber:   { accent: '#f59e0b', accentDeep: '#b45309', glow: 'rgba(245,158,11,0.20)',  iconBg: 'rgba(245,158,11,0.12)'  },
  teal:    { accent: '#14b8a6', accentDeep: '#0f766e', glow: 'rgba(20,184,166,0.20)',  iconBg: 'rgba(20,184,166,0.12)'  },
};

const StatCard = ({ icon: Icon, label, value, sub, trend, color, onClick }) => {
  const theme = STAT_CARD_THEMES[color] || STAT_CARD_THEMES.indigo;

  return (
    <button
      onClick={onClick}
      type="button"
      className="stat-glass-card"
      style={{ '--accent': theme.accent, '--accent-deep': theme.accentDeep, '--glow': theme.glow }}
    >
      {/* top accent hairline */}
      <div style={{
        position: 'absolute', top: 0, left: 16, right: 16, height: 2, borderRadius: '0 0 2px 2px',
        background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
        opacity: 0.7,
      }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: theme.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${theme.glow}`,
          }}>
            <Icon style={{ width: 19, height: 19, color: theme.accentDeep }} />
          </div>
          {trend !== undefined && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              borderRadius: 999, padding: '3px 8px',
              background: trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
              fontSize: 11, fontWeight: 700,
              color: trend >= 0 ? '#047857' : '#be123c',
            }}>
              {trend >= 0 ? <ArrowUpIcon style={{ width: 10, height: 10 }} /> : <ArrowDownIcon style={{ width: 10, height: 10 }} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{value}</p>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 'auto' }}>{label}</p>
        {sub && <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{sub}</p>}
      </div>
    </button>
  );
};

/* ─── Notification Panel ─────────────────────────────────────────────── */
export const EmployeeNotificationPanel = ({ notifications, onClear, onClearAll, notifRef, show, setShow }) => {
  if (!show) return null;
  return (
    <div ref={notifRef} className="glass-card" style={{ position: 'absolute', right: 0, top: 48, zIndex: 50, width: 320, overflow: 'hidden', borderRadius: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(99,102,241,0.08)', padding: '14px 16px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</p>
        {notifications.length > 0 && (
          <button onClick={onClearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6366f1' }}>Clear all</button>
        )}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }} className="scrollbar-thin">
        {notifications.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <BellIcon style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto' }} />
            <p style={{ marginTop: 8, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: '1px solid rgba(99,102,241,0.06)', padding: '12px 16px', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                marginTop: 5, height: 7, width: 7, flexShrink: 0, borderRadius: '50%',
                background: n.type === 'task' ? '#f59e0b' : n.type === 'approval' ? '#10b981' : n.type === 'rejection' ? '#f43f5e' : '#6366f1',
              }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{n.title}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '1px 0 0' }}>{n.message}</p>
                <p style={{ fontSize: 10.5, color: '#94a3b8', margin: '3px 0 0' }}>{timeAgo(n.time)}</p>
              </div>
              <button onClick={() => onClear(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', marginTop: 2 }}>
                <XMarkIcon style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ─── Pagination ──────────────────────────────────────────────────────── */
const Pagination = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  const isFirst = current === 1;
  const isLast = current === total;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '16px 20px' }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
        Page <span style={{ fontWeight: 700, color: '#475569' }}>{current}</span> of {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {!isFirst && (
          <button onClick={() => onChange(current - 1)} className="pg-btn" aria-label="Previous page">
            <ChevronLeftIcon style={{ width: 15, height: 15 }} />
          </button>
        )}
        {!isLast && (
          <button onClick={() => onChange(current + 1)} className="pg-btn" aria-label="Next page">
            <ChevronRightIcon style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Mini Bar Chart ──────────────────────────────────────────────────── */
const MiniBarChart = ({ data, color = '#6366f1' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 56 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={`${d.label}: ${d.value}`}>
          <div
            style={{
              width: '100%', borderRadius: '6px 6px 3px 3px', transition: 'all 0.3s',
              height: `${(d.value / max) * 100}%`,
              background: `linear-gradient(180deg, ${color}, ${color}cc)`,
              minHeight: d.value > 0 ? 4 : 0,
              boxShadow: d.value > 0 ? `0 2px 8px ${color}33` : 'none',
            }}
          />
        </div>
      ))}
    </div>
  );
};

/* ─── Activity Row ────────────────────────────────────────────────────── */
const ActivityRow = ({ file }) => {
  const cfg  = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <li className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <Icon className={`h-4 w-4 ${cfg.color}`} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{file.originalName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{file.description || 'No description'}</p>
            {file.adminNote && (
              <div className="mt-1.5 flex items-start gap-1">
                <ChatBubbleLeftEllipsisIcon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                <p className={`text-xs italic font-medium ${cfg.color}`}>Admin: "{file.adminNote}"</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={file.status} size="sm" />
          <span className="text-xs text-slate-400">{formatTime(file.createdAt)}</span>
        </div>
      </div>
    </li>
  );
};

/* ─── Task Row ────────────────────────────────────────────────────────── */
const TaskRow = ({ task, onStatusChange }) => {
  const cfg          = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.pending;
  const priorityCfg  = PRIORITY_CONFIG[task.priority]  || PRIORITY_CONFIG.medium;
  const Icon         = cfg.icon;
  const isOverdue    = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <li className={`flex items-start gap-4 rounded-xl border px-4 py-4 transition-all hover:shadow-sm
      ${isOverdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100 bg-white hover:border-indigo-100 hover:bg-indigo-50/20'}`}>
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100">
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800">{task.title}</p>
          {isOverdue && (
            <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-600">Overdue</span>
          )}
        </div>
        {task.description && (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{task.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              Due {formatDate(task.dueDate)}
            </span>
          )}
          <span className="text-xs text-slate-400">Assigned by admin · {timeAgo(task.createdAt)}</span>
        </div>
        {task.adminFile && (
          <div className="mt-1.5 flex items-center gap-1">
            <DocumentTextIcon className="h-4 w-4 text-indigo-500" />
            <a
              href={typeof task.adminFile === 'string' ? task.adminFile : URL.createObjectURL(task.adminFile)}
              target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              View attachment
            </a>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${priorityCfg.color} ${priorityCfg.bg} ${priorityCfg.border}`}>
          <FlagIcon className="h-3 w-3" />
          {priorityCfg.label}
        </span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className={`rounded-lg border px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${cfg.color} ${cfg.bg} ${cfg.border}`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Completed</option>
        </select>
      </div>
    </li>
  );
};

/* ─── Task Section Accordion ──────────────────────────────────────────── */
const TaskSection = ({ title, status, tasks, count, isOpen, onToggle, onStatusChange }) => {
  const cfg        = TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.pending;
  const Icon       = cfg.icon;
  const sectionBg  = { pending: 'bg-amber-50', in_progress: 'bg-blue-50', done: 'bg-emerald-50' }[status];
  const secBorder  = { pending: 'border-amber-200', in_progress: 'border-blue-200', done: 'border-emerald-200' }[status];
  const iconColor  = { pending: 'text-amber-600', in_progress: 'text-blue-600', done: 'text-emerald-600' }[status];

  return (
    <div className={`rounded-2xl border ${secBorder} overflow-hidden shadow-sm`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${sectionBg} hover:opacity-90`}
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 shadow-sm">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{count} task{count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-sm font-bold text-slate-700 shadow-sm">{count}</span>
          {isOpen ? <ChevronUpIcon className="h-4 w-4 text-slate-600" /> : <ChevronDownIcon className="h-4 w-4 text-slate-600" />}
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <Icon className="h-9 w-9 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-400">No {title.toLowerCase()} tasks</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map(task => (
                <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const { user }                        = useAuth();
  const { files, addFile, fetchFiles }  = useFiles();
  const { tasks, updateTaskStatus }     = useTasks();

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  /* ── State ── */
  const [taskList,           setTaskList]           = useState(tasks || []);
  const [notifications,      setNotifications]      = useState([]);
  const [toasts,             setToasts]             = useState([]);
  const [activityLog,        setActivityLog]        = useState([]);
  const [activeTab,          setActiveTab]          = useState('overview');
  const [viewMode,           setViewMode]           = useState('list');

  /* ── Filter State ── */
  const [typeFilter,    setTypeFilter]   = useState('all');
  const [statusFilter,  setStatusFilter] = useState('all');
  const [sortBy,        setSortBy]       = useState('newest');
  const [search,        setSearch]       = useState('');
  const [selectedDate,  setSelectedDate] = useState('');
  const [range,         setRange]        = useState('30d');
  const [filePage,      setFilePage]     = useState(1);

  /* ── Task State ── */
  const [taskSearch,         setTaskSearch]         = useState('');
  const [taskStatusFilter,   setTaskStatusFilter]   = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskPage,           setTaskPage]           = useState(1);
  const [taskSectionsOpen,   setTaskSectionsOpen]   = useState({ pending: true, in_progress: true, done: false });

  /* ── Modals ── */
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile,   setShareFile]   = useState(null);

  useEffect(() => {
  console.log('Current User:', user);
  console.log('Files:', files);

  window.testUser = user;
  window.testFiles = files;
}, [user, files]);

  /* ── Init ── */
  useEffect(() => { setTaskList(tasks || []); }, [tasks]);

  /* ── Toast helpers ── */
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  /* ── Activity log ── */
  const logActivity = useCallback((action, detail) => {
    setActivityLog(p => [{ id: Date.now(), action, detail, time: new Date().toISOString() }, ...p].slice(0, 50));
  }, []);

  /* ── Notification helper ── */
  const pushNotif = useCallback((title, message, type = 'info') => {
    setNotifications(p => [{ id: Date.now(), title, message, type, time: new Date().toISOString() }, ...p].slice(0, 20));
  }, []);

  /* ── Expose notification state for Navbar (via window) ── */
  useEffect(() => {
    window.__empNotifications    = notifications;
    window.__empPushNotif        = pushNotif;
    window.__empClearNotif       = (id) => setNotifications(p => p.filter(n => n.id !== id));
    window.__empClearAllNotifs   = () => setNotifications([]);
    window.dispatchEvent(new CustomEvent('emp-notif-update', { detail: { count: notifications.length } }));
  }, [notifications, pushNotif]);

  /* ── WebSocket: tasks ── */
  useWebSocket(
    `${WS_BASE_URL}/ws/tasks/`,
    (data) => {
      if (data?.type === 'task_notification' && data.task) {
        setTaskList(prev => upsertById(prev, data.task));
        pushNotif('New task assigned', `Admin assigned: ${data.task.title}`, 'task');
        addToast(`New task: ${data.task.title}`, 'info');
      }
      if (data?.type === 'task_status_update') {
        setTaskList(prev => prev.map(t => t.id === data.taskId ? { ...t, status: data.status } : t));
      }
      if (data?.type === 'task_list' && Array.isArray(data.tasks)) {
        setTaskList(data.tasks);
      }
    },
    (error) => console.error('WS tasks error:', error),
  );

  /* ── WebSocket: files ── */
  useWebSocket(
    `${WS_BASE_URL}/ws/files/`,
    (data) => {
      if (data?.type === 'file_status_update' && data.fileId) {
        if (data.status === 'approved') {
          pushNotif('File approved', 'One of your files was approved by admin', 'approval');
          addToast('File approved by admin!', 'success');
        }
        if (data.status === 'rejected') {
          pushNotif('File rejected', 'One of your files was rejected by admin', 'rejection');
          addToast('A file was rejected. Check your files tab.', 'error');
        }
      }
    },
    (error) => console.error('WS files error:', error),
  );

 const handleUpload = async (file, description) => {
  try {
   const formData = new FormData();

formData.append('file', file);
formData.append('description', description);
formData.append('original_name', file.name);
formData.append('mime_type', file.type);
formData.append('size', file.size);

    await api.post('/files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    logActivity(
      'File Uploaded',
      file.name || 'Unknown file'
    );

    addToast(
      'File uploaded successfully',
      'success'
    );

    await fetchFiles();

   
  } 
  catch (error) {
    console.error(error);

    addToast(
      'File upload failed',
      'error'
    );
  }
};

  const handleTaskStatusChange = useCallback((taskId, status) => {
    setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    updateTaskStatus(taskId, status);
    const task = taskList.find(t => t.id === taskId);
    logActivity('Task Status Updated', `"${task?.title || taskId}" → ${status}`);
    addToast(`Task marked as ${status.replace('_', ' ')}`, 'success');
  }, [taskList, updateTaskStatus, logActivity, addToast]);

  const toggleTaskSection = (status) =>
    setTaskSectionsOpen(prev => ({ ...prev, [status]: !prev[status] }));

  /* ── Derived data ── */
  const userFiles  = useMemo(
    () =>
      (files || []).filter((f) => {
        const fileUserId = f.userId ?? f.user?.id ?? f.user?.userId;
        const fileUserEmail = f.userEmail ?? f.user?.email;

        const idMatches = fileUserId != null && String(fileUserId) === String(user.id);
        const emailMatches =
          typeof fileUserEmail === 'string' &&
          typeof user.email === 'string' &&
          fileUserEmail.toLowerCase() === user.email.toLowerCase();

        return idMatches || emailMatches;
      }),
    [files, user.id, user.email],
  );
  const myTasks    = useMemo(() => (taskList || []).filter(t => t.assignedToEmail === user.email), [taskList, user.email]);

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
    const pendingTasks   = myTasks.filter(t => t.status === 'pending').length;
    const doneTasks      = myTasks.filter(t => t.status === 'done').length;
    const overdueTasks   = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    return {
      totalFiles: userFiles.length, totalSize, todayCount, monthCount,
      approvedCount, rejectedCount, pendingCount, reviewingCount,
      pendingTasks, doneTasks, overdueTasks,
    };
  }, [userFiles, myTasks]);

  const weeklyTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString('en', { weekday: 'short' }), value: 0, date: d };
    });
    userFiles.forEach(f => {
      if (!f.createdAt) return;
      const fd  = new Date(f.createdAt);
      const idx = days.findIndex(d => isSameDay(fd, d.date));
      if (idx !== -1) days[idx].value++;
    });
    return days;
  }, [userFiles]);

  const todayFiles     = useMemo(() => userFiles.filter(f => isSameDay(f.createdAt)).slice(0, 8), [userFiles]);
  const rejectedFiles  = useMemo(() => userFiles.filter(f => f.status === 'rejected'), [userFiles]);

  const filteredFiles = useMemo(() => {
    let list = [...userFiles];
    if (range === 'today') list = list.filter(f => isSameDay(f.createdAt));
    else if (range === '7d') list = list.filter(f => isWithinDays(f.createdAt, 7));
    else if (range === '30d') list = list.filter(f => isWithinDays(f.createdAt, 30));
    if (selectedDate) {
      const d = new Date(selectedDate);
      list = list.filter(f => isSameDay(f.createdAt, d));
    }
    if (typeFilter !== 'all')   list = list.filter(f => getType(f.originalName) === typeFilter);
    if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f =>
      (f.originalName || '').toLowerCase().includes(q) ||
      (f.description  || '').toLowerCase().includes(q),
    );
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name')   return (a.originalName || '').localeCompare(b.originalName || '');
      if (sortBy === 'size')   return (b.size || 0) - (a.size || 0);
      return 0;
    });
    return list;
  }, [userFiles, range, selectedDate, typeFilter, statusFilter, sortBy, search]);

  const paginatedFiles   = useMemo(() => { const s = (filePage - 1) * ITEMS_PER_PAGE; return filteredFiles.slice(s, s + ITEMS_PER_PAGE); }, [filteredFiles, filePage]);
  const totalFilePages   = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

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

  /* ── Export handlers ── */
  const handleExportFiles = () => {
    exportToCSV(filteredFiles.map(f => ({
      name:        f.originalName || '',
      status:      f.status || '',
      size:        formatBytes(f.size),
      description: f.description || '',
      uploaded:    formatDate(f.createdAt),
    })), 'my-files-export');
    addToast('Files exported to CSV', 'success');
    logActivity('Export', `${filteredFiles.length} files`);
  };

  const handleExportTasks = () => {
    exportToCSV(myTasks.map(t => ({
      title:       t.title       || '',
      status:      t.status      || '',
      priority:    t.priority    || '',
      dueDate:     formatDate(t.dueDate),
      description: t.description || '',
    })), 'my-tasks-export');
    addToast('Tasks exported to CSV', 'success');
  };

  /* ── Greeting ── */
  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  /* ── Tabs ── */
  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: ChartBarIcon    },
    { id: 'upload',    label: 'Upload',    icon: CloudArrowUpIcon },
    { id: 'files',     label: 'My Files',  icon: DocumentTextIcon },
    { id: 'tasks',     label: 'My Tasks',  icon: CheckCircleIcon,  badge: stats.pendingTasks || null, badgeColor: stats.overdueTasks > 0 ? '#f43f5e' : '#f59e0b' },
    { id: 'activity',  label: 'Activity',  icon: ListBulletIcon   },
  ];

  /* ════════════════════════════════════════════════════════ RENDER ═══ */
  return (
    <div className="emp-dash-root" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient background layer — fixed, sits behind all content */}
      <div className="emp-dash-bg" aria-hidden="true" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .emp-dash-root {
          position: relative;
          min-height: 100vh;
          background: #fafbff;
          isolation: isolate;
        }
        .emp-dash-root * { font-family: 'Inter', sans-serif; }

        /* ── Rich-white ambient background: layered radial glows + faint grid ── */
        .emp-dash-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(circle 600px at 8% -5%,  rgba(99,102,241,0.10) 0%, transparent 65%),
            radial-gradient(circle 560px at 96% 8%,   rgba(139,92,246,0.08) 0%, transparent 60%),
            radial-gradient(circle 520px at 50% 105%, rgba(14,165,233,0.07) 0%, transparent 60%),
            radial-gradient(circle 420px at 78% 55%,  rgba(217,70,239,0.045) 0%, transparent 55%),
            linear-gradient(180deg, #fcfdff 0%, #f7f8fd 45%, #f4f6fc 100%);
        }
        .emp-dash-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%);
        }

        .emp-dash-content { position: relative; z-index: 1; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Core glass surface — the signature material of this page ── */
        .glass-card {
          position: relative;
          background: rgba(255,255,255,0.68);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow:
            0 1px 1px rgba(255,255,255,0.95) inset,
            0 -1px 1px rgba(99,102,241,0.04) inset,
            0 2px 4px rgba(15,23,42,0.03),
            0 12px 32px -8px rgba(67,56,202,0.10);
          border-radius: 22px;
          transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
        }
        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(155deg, rgba(255,255,255,0.9), rgba(99,102,241,0.10) 40%, rgba(255,255,255,0.2) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .glass-card:hover {
          box-shadow:
            0 1px 1px rgba(255,255,255,0.95) inset,
            0 -1px 1px rgba(99,102,241,0.05) inset,
            0 4px 10px rgba(15,23,42,0.05),
            0 20px 48px -10px rgba(67,56,202,0.16);
        }

        /* ── Stat card — same glass material, elevated treatment ── */
        .stat-glass-card {
          position: relative;
          overflow: hidden;
          width: 100%;
          text-align: left;
          cursor: pointer;
          border: none;
          border-radius: 20px;
          padding: 18px 18px 16px;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          box-shadow:
            0 1px 1px rgba(255,255,255,0.95) inset,
            0 2px 4px rgba(15,23,42,0.03),
            0 10px 28px -8px var(--glow, rgba(99,102,241,0.18));
          transition: transform 0.25s cubic-bezier(.2,.8,.2,1), box-shadow 0.25s ease;
        }
        .stat-glass-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(155deg, rgba(255,255,255,0.95), var(--accent, #6366f1) 130%);
          opacity: 0.35;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .stat-glass-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 1px 1px rgba(255,255,255,0.95) inset,
            0 4px 8px rgba(15,23,42,0.04),
            0 18px 36px -8px var(--glow, rgba(99,102,241,0.28));
        }
        .stat-glass-card:active { transform: translateY(-1px); }

        /* ── Tabs ── */
        .tab-active {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          box-shadow: 0 6px 18px rgba(79,70,229,0.32), 0 1px 0 rgba(255,255,255,0.25) inset;
          border: 1px solid transparent;
        }
        .tab-default {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          color: #64748b;
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .tab-default:hover {
          background: rgba(255,255,255,0.85);
          color: #4f46e5;
          border-color: rgba(99,102,241,0.30);
          box-shadow: 0 4px 14px rgba(99,102,241,0.14);
        }

        /* ── Inputs / selects ── */
        .glass-input {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(99,102,241,0.14);
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          transition: all 0.18s;
          outline: none;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .glass-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.14), 0 1px 2px rgba(15,23,42,0.03);
        }
        .glass-input::placeholder { color: #94a3b8; }

        /* ── Buttons ── */
        .btn-glass {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(99,102,241,0.14);
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px; font-weight: 600; color: #475569;
          cursor: pointer; transition: all 0.18s;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .btn-glass:hover {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.30);
          color: #4f46e5;
          box-shadow: 0 4px 12px rgba(99,102,241,0.14);
        }

        .pg-btn {
          display: flex; height: 32px; width: 32px; align-items: center; justify-content: center;
          border-radius: 10px; border: 1px solid rgba(99,102,241,0.14);
          background: rgba(255,255,255,0.85); color: #64748b; cursor: pointer;
          transition: all 0.18s; box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .pg-btn:hover { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.30); color: #4f46e5; }

        /* ── Scrollbar ── */
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #c7d2fe; }

        /* ── Progress bar ── */
        .prog-track {
          background: rgba(99,102,241,0.08);
          border-radius: 999px;
          height: 6px;
          overflow: hidden;
          flex: 1;
        }
        .prog-fill { height: 100%; border-radius: 999px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }

        /* ── Quick action card ── */
        .qa-btn {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.8);
          padding: 20px 12px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.22s cubic-bezier(.2,.8,.2,1);
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          color: #475569;
        }
        .qa-btn:hover {
          background: rgba(255,255,255,0.9);
          border-color: rgba(99,102,241,0.28);
          color: #4f46e5;
          transform: translateY(-3px);
          box-shadow: 0 14px 32px -8px rgba(99,102,241,0.22);
        }
        .qa-btn:active { transform: translateY(-1px); }

        /* ── Timeline ── */
        .tl-dot {
          position: absolute; left: -27px; top: 8px;
          width: 14px; height: 14px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: 2px solid #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.16), 0 2px 6px rgba(79,70,229,0.3);
        }
        .tl-line {
          position: absolute; left: 4px; top: 0; bottom: 0;
          width: 1px; background: linear-gradient(180deg, rgba(99,102,241,0.20), rgba(99,102,241,0.04));
        }

        /* ── Task summary mini card ── */
        .task-mini {
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          padding: 14px 16px;
          box-shadow: 0 1px 1px rgba(255,255,255,0.9) inset, 0 4px 14px -6px rgba(67,56,202,0.10);
          transition: all 0.22s;
        }
        .task-mini:hover {
          border-color: rgba(99,102,241,0.24);
          box-shadow: 0 1px 1px rgba(255,255,255,0.9) inset, 0 10px 26px -8px rgba(99,102,241,0.20);
          transform: translateY(-2px);
        }

        /* ── File row hover ── */
        .file-row { transition: background 0.15s; border-radius: 12px; }
        .file-row:hover { background: rgba(99,102,241,0.05); }
      `}</style>

      <main className="emp-dash-content" style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 32px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Greeting */}
            <h1 style={{
              fontSize: 27, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em',
              lineHeight: 1.2, margin: 0,
            }}>
              {greeting},{' '}
              <span style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {user?.name}
              </span>
              {' '}👋
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDaysIcon style={{ width: 15, height: 15 }} />
              {formatLongDate(now)}
            </p>

            {/* Rejection banner */}
            {rejectedFiles.length > 0 && (
              <div className="glass-card" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 16px', borderRadius: 14,
                background: 'rgba(254,242,242,0.75)', border: '1px solid rgba(252,165,165,0.55)',
                marginTop: 4, boxShadow: 'none', backdropFilter: 'blur(16px)',
              }}>
                <XCircleIcon style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: '#b91c1c', margin: 0 }}>
                  {rejectedFiles.length} file{rejectedFiles.length > 1 ? 's were' : ' was'} rejected —{' '}
                  <button
                    onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#991b1b', textDecoration: 'underline', padding: 0 }}
                    type="button"
                  >
                    check My Files
                  </button>.
                </p>
              </div>
            )}

            {/* Overdue banner */}
            {stats.overdueTasks > 0 && (
              <div className="glass-card" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 16px', borderRadius: 14,
                background: 'rgba(255,247,237,0.75)', border: '1px solid rgba(253,186,116,0.55)',
                marginTop: 4, boxShadow: 'none', backdropFilter: 'blur(16px)',
              }}>
                <ExclamationCircleIcon style={{ width: 16, height: 16, color: '#f97316', flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: '#c2410c', margin: 0 }}>
                  {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} —{' '}
                  <button
                    onClick={() => setActiveTab('tasks')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#9a3412', textDecoration: 'underline', padding: 0 }}
                    type="button"
                  >
                    view My Tasks
                  </button>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          <StatCard icon={DocumentTextIcon} label="Total Files"  value={stats.totalFiles}           sub={`${stats.todayCount} today`}           color="indigo"  onClick={() => setActiveTab('files')} />
          <StatCard icon={CloudArrowUpIcon} label="This Month"   value={stats.monthCount}           sub="uploaded"                               color="sky"     onClick={() => { setActiveTab('files'); setRange('30d'); }} />
          <StatCard icon={ShieldCheckIcon}  label="Approved"     value={stats.approvedCount}        sub={`${stats.pendingCount} pending`}        color="emerald" onClick={() => { setActiveTab('files'); setStatusFilter('approved'); }} />
          <StatCard icon={XCircleIcon}      label="Rejected"     value={stats.rejectedCount}        sub={`${stats.reviewingCount} reviewing`}    color="rose"    onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }} />
          <StatCard icon={CheckCircleIcon}  label="My Tasks"     value={myTasks.length}             sub={`${stats.pendingTasks} open`}           color="violet"  onClick={() => setActiveTab('tasks')} />
          <StatCard icon={ArrowUpTrayIcon}  label="Storage"      value={formatBytes(stats.totalSize)} sub="total uploaded"                      color="fuchsia" onClick={() => setActiveTab('files')} />
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {tabs.map((tab) => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${active ? 'tab-active' : 'tab-default'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{
                    borderRadius: 999, padding: '2px 8px',
                    fontSize: 10, fontWeight: 800, color: '#fff',
                    background: tab.badgeColor || '#6366f1',
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

            {/* Recent Uploads — spans 2 cols, tall */}
            <div className="glass-card" style={{ gridColumn: 'span 2', padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Uploads</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Your latest file activity</p>
                </div>
                <button
                  onClick={() => setActiveTab('files')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View all <ChevronRightIcon style={{ width: 14, height: 14 }} />
                </button>
              </div>
              {userFiles.slice(0, 7).length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed rgba(99,102,241,0.15)', borderRadius: 16, padding: '48px 24px', textAlign: 'center',
                }}>
                  <CloudArrowUpIcon style={{ width: 48, height: 48, color: '#c7d2fe' }} />
                  <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>No files uploaded yet</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6366f1' }}
                    type="button"
                  >
                    Upload your first file →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {userFiles.slice(0, 7).map(f => (
                    <div key={f.id} className="file-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(99,102,241,0.12)',
                      }}>
                        <DocumentTextIcon style={{ width: 18, height: 18, color: '#6366f1' }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{formatBytes(f.size)} · {timeAgo(f.createdAt)}</p>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right col: Upload Trend + File Status stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Upload Trend */}
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Upload Trend</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Last 7 days</p>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'rgba(99,102,241,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ChartBarIcon style={{ width: 16, height: 16, color: '#6366f1' }} />
                  </div>
                </div>
                <MiniBarChart data={weeklyTrend} color="#6366f1" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  {weeklyTrend.map(d => (
                    <span key={d.label} style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{d.label}</span>
                  ))}
                </div>
              </div>

              {/* File Status */}
              <div className="glass-card" style={{ padding: 22, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>File Status</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Your file breakdown</p>
                  </div>
                  <FunnelIcon style={{ width: 16, height: 16, color: '#a5b4fc' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Pending',   value: stats.pendingCount,   color: '#f59e0b' },
                    { label: 'Reviewing', value: stats.reviewingCount, color: '#3b82f6' },
                    { label: 'Approved',  value: stats.approvedCount,  color: '#10b981' },
                    { label: 'Rejected',  value: stats.rejectedCount,  color: '#f43f5e' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#64748b', width: 68, flexShrink: 0, fontWeight: 500 }}>{s.label}</span>
                      <div className="prog-track">
                        <div className="prog-fill" style={{ width: `${stats.totalFiles ? (s.value / stats.totalFiles) * 100 : 0}%`, background: s.color }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', width: 20, textAlign: 'right', flexShrink: 0 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions — full width */}
            <div className="glass-card" style={{ gridColumn: 'span 3', padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Quick Actions</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Upload file',   icon: CloudArrowUpIcon, onClick: () => setActiveTab('upload'),   iconColor: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
                  { label: 'My tasks',      icon: CheckCircleIcon,  onClick: () => setActiveTab('tasks'),    iconColor: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
                  { label: 'All files',     icon: DocumentTextIcon, onClick: () => setActiveTab('files'),    iconColor: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
                  { label: 'Activity log',  icon: ListBulletIcon,   onClick: () => setActiveTab('activity'), iconColor: '#8b5cf6', bg: 'rgba(139,92,246,0.08)'  },
                ].map(a => (
                  <button key={a.label} onClick={a.onClick} type="button" className="qa-btn">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                      <a.icon style={{ width: 22, height: 22, color: a.iconColor }} />
                    </div>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Summary — full width */}
            <div className="glass-card" style={{ gridColumn: 'span 3', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Task Summary</p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  View all <ChevronRightIcon style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { label: 'Pending',        value: stats.pendingTasks,                                     dotColor: '#f59e0b' },
                  { label: 'In Progress',    value: myTasks.filter(t => t.status === 'in_progress').length,  dotColor: '#3b82f6' },
                  { label: 'Completed',      value: stats.doneTasks,                                         dotColor: '#10b981' },
                  { label: 'Overdue',        value: stats.overdueTasks,                                      dotColor: '#f43f5e' },
                  { label: 'Total assigned', value: myTasks.length,                                          dotColor: '#8b5cf6' },
                ].map(item => (
                  <div key={item.label} className="task-mini">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dotColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', display: 'block', letterSpacing: '-0.03em' }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {myTasks.filter(t => t.status !== 'done').length === 0 && (
                <div style={{
                  marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
                  borderRadius: 12, border: '1px solid rgba(16,185,129,0.25)',
                  background: 'rgba(16,185,129,0.06)', padding: '10px 14px',
                }}>
                  <SparklesIcon style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#065f46', margin: 0 }}>All caught up — great work!</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            UPLOAD TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
              <FileUpload onUpload={handleUpload} />

              <aside className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.14)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ClockIcon style={{ width: 18, height: 18, color: '#6366f1' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Today's activity</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{todayFiles.length} item{todayFiles.length === 1 ? '' : 's'} uploaded</p>
                    </div>
                  </div>
                  <span style={{
                    borderRadius: 999, padding: '4px 12px',
                    border: '1px solid rgba(99,102,241,0.16)',
                    background: 'rgba(99,102,241,0.06)',
                    fontSize: 13, fontWeight: 700, color: '#4f46e5',
                  }}>
                    {todayFiles.length}
                  </span>
                </div>

                {todayFiles.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed rgba(99,102,241,0.14)', borderRadius: 16, padding: '40px 24px', textAlign: 'center',
                  }}>
                    <ArrowUpTrayIcon style={{ width: 40, height: 40, color: '#c7d2fe' }} />
                    <p style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>No uploads today yet</p>
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {todayFiles.map(f => <ActivityRow key={f.id} file={f} />)}
                  </ul>
                )}

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(99,102,241,0.08)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                    const Icon = val.icon;
                    return (
                      <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
                        <Icon style={{ width: 13, height: 13 }} className={val.color} />
                        {val.label}
                      </span>
                    );
                  })}
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            MY FILES TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'files' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter bar */}
            <div className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(99,102,241,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FunnelIcon style={{ width: 18, height: 18, color: '#6366f1' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Filter & Sort</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{filteredFiles.length} of {userFiles.length} files</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  {[
                    { value: range,        onChange: setRange,        options: [['today','Today'],['7d','7 days'],['30d','30 days'],['all','All time']] },
                    { value: statusFilter, onChange: setStatusFilter, options: [['all','All statuses'],['pending','Pending'],['reviewing','Reviewing'],['approved','Approved'],['rejected','Rejected']] },
                    { value: typeFilter,   onChange: setTypeFilter,   options: [['all','All types'],['pdf','PDF'],['image','Images'],['doc','Office'],['data','Data'],['other','Other']] },
                    { value: sortBy,       onChange: setSortBy,       options: [['newest','Newest'],['oldest','Oldest'],['name','Name'],['size','Size']] },
                  ].map((sel, i) => (
                    <select key={i} value={sel.value} onChange={(e) => { sel.onChange(e.target.value); setFilePage(1); }} className="glass-input">
                      {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ))}

                  <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setFilePage(1); }} className="glass-input" />

                  <div style={{ position: 'relative' }}>
                    <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
                    <input
                      type="text" placeholder="Search files…" value={search}
                      onChange={(e) => { setSearch(e.target.value); setFilePage(1); }}
                      className="glass-input" style={{ paddingLeft: 32, minWidth: 180 }}
                    />
                  </div>

                  {/* View toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    {[
                      { mode: 'list', Icon: ListBulletIcon },
                      { mode: 'grid', Icon: Squares2X2Icon },
                    ].map(({ mode, Icon }) => (
                      <button key={mode} onClick={() => setViewMode(mode)} style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                        background: viewMode === mode ? '#fff' : 'transparent',
                        color: viewMode === mode ? '#4f46e5' : '#94a3b8',
                        boxShadow: viewMode === mode ? '0 1px 4px rgba(99,102,241,0.18)' : 'none',
                      }}>
                        <Icon style={{ width: 15, height: 15 }} />
                      </button>
                    ))}
                  </div>

                  <button onClick={handleExportFiles} className="btn-glass">
                    <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />Export
                  </button>

                  {(search || typeFilter !== 'all' || range !== '30d' || sortBy !== 'newest' || statusFilter !== 'all' || selectedDate) && (
                    <button
                      onClick={() => { setSearch(''); setTypeFilter('all'); setRange('30d'); setSortBy('newest'); setStatusFilter('all'); setSelectedDate(''); setFilePage(1); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        borderRadius: 12, border: '1px solid rgba(244,63,94,0.25)',
                        background: 'rgba(254,226,226,0.8)',
                        padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#e11d48', cursor: 'pointer',
                      }}
                    >
                      <XMarkIcon style={{ width: 14, height: 14 }} />Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <FileList files={paginatedFiles} onPreview={setPreviewFile} onShare={setShareFile} />
              <Pagination current={filePage} total={totalFilePages} onChange={setFilePage} />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            MY TASKS TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'tasks' && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Task filter bar */}
            <div className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(245,158,11,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircleIcon style={{ width: 18, height: 18, color: '#f59e0b' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>My Tasks</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
                  <input
                    type="text" placeholder="Search tasks…" value={taskSearch}
                    onChange={(e) => { setTaskSearch(e.target.value); setTaskPage(1); }}
                    className="glass-input" style={{ paddingLeft: 32, width: '100%' }}
                  />
                </div>

                <select value={taskStatusFilter} onChange={(e) => { setTaskStatusFilter(e.target.value); setTaskPage(1); }} className="glass-input">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>

                <select value={taskPriorityFilter} onChange={(e) => { setTaskPriorityFilter(e.target.value); setTaskPage(1); }} className="glass-input">
                  <option value="all">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <button onClick={handleExportTasks} className="btn-glass">
                  <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />Export
                </button>
              </div>
            </div>

            {/* Overdue warning */}
            {stats.overdueTasks > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                borderRadius: 14, border: '1px solid rgba(244,63,94,0.25)',
                background: 'rgba(254,226,226,0.7)',
                padding: '12px 18px',
                backdropFilter: 'blur(8px)',
              }}>
                <ExclamationCircleIcon style={{ width: 18, height: 18, color: '#f43f5e', flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#be123c', margin: 0 }}>
                  {stats.overdueTasks} task{stats.overdueTasks > 1 ? 's are' : ' is'} overdue. Please complete them as soon as possible.
                </p>
              </div>
            )}

            {/* Tasks content */}
            {(taskSearch || taskStatusFilter !== 'all' || taskPriorityFilter !== 'all') ? (
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px' }}>
                  {paginatedTasks.length === 0 ? (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      border: '2px dashed rgba(99,102,241,0.15)', borderRadius: 16,
                      padding: '48px 24px', textAlign: 'center',
                    }}>
                      <CheckCircleIcon style={{ width: 48, height: 48, color: '#c7d2fe' }} />
                      <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>No tasks match your filters</p>
                    </div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {paginatedTasks.map(t => (
                        <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatusChange} />
                      ))}
                    </ul>
                  )}
                  <Pagination current={taskPage} total={totalTaskPages} onChange={setTaskPage} />
                </div>
              </div>
            ) : (
              myTasks.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 20, border: '2px dashed rgba(99,102,241,0.15)',
                  background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)',
                  padding: '72px 24px', textAlign: 'center',
                }}>
                  <SparklesIcon style={{ width: 56, height: 56, color: '#c7d2fe' }} />
                  <p style={{ marginTop: 16, fontSize: 16, fontWeight: 700, color: '#64748b' }}>No tasks assigned yet</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>Tasks from admin will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <TaskSection
                    title="Pending"    status="pending"
                    tasks={tasksByStatus.pending}     count={tasksByStatus.pending.length}
                    isOpen={taskSectionsOpen.pending} onToggle={() => toggleTaskSection('pending')}
                    onStatusChange={handleTaskStatusChange}
                  />
                  <TaskSection
                    title="In Progress" status="in_progress"
                    tasks={tasksByStatus.in_progress}     count={tasksByStatus.in_progress.length}
                    isOpen={taskSectionsOpen.in_progress} onToggle={() => toggleTaskSection('in_progress')}
                    onStatusChange={handleTaskStatusChange}
                  />
                  <TaskSection
                    title="Completed" status="done"
                    tasks={tasksByStatus.done}     count={tasksByStatus.done.length}
                    isOpen={taskSectionsOpen.done} onToggle={() => toggleTaskSection('done')}
                    onStatusChange={handleTaskStatusChange}
                  />
                </div>
              )
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            ACTIVITY LOG TAB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <section>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(99,102,241,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(99,102,241,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ListBulletIcon style={{ width: 18, height: 18, color: '#6366f1' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Activity Log</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Your actions in this session</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{activityLog.length} entries</span>
                  {activityLog.length > 0 && (
                    <button
                      onClick={() => exportToCSV(activityLog.map(e => ({ action: e.action, detail: e.detail, time: e.time })), 'activity-log')}
                      className="btn-glass"
                    >
                      <ArrowDownTrayIcon style={{ width: 14, height: 14 }} />Export
                    </button>
                  )}
                </div>
              </div>

              <div style={{ padding: '24px 28px' }}>
                {activityLog.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed rgba(99,102,241,0.14)', borderRadius: 16,
                    padding: '56px 24px', textAlign: 'center',
                  }}>
                    <InformationCircleIcon style={{ width: 48, height: 48, color: '#c7d2fe' }} />
                    <p style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>No activity yet</p>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>Your uploads and task updates will appear here.</p>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div className="tl-line" />
                    <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 0 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activityLog.map((entry) => (
                        <li key={entry.id} style={{ position: 'relative' }}>
                          <div className="tl-dot" />
                          <div style={{
                            borderRadius: 14,
                            border: '1px solid rgba(99,102,241,0.10)',
                            background: 'rgba(255,255,255,0.80)',
                            backdropFilter: 'blur(8px)',
                            padding: '12px 16px',
                            transition: 'all 0.15s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.10)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{entry.action}</p>
                                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{entry.detail}</p>
                              </div>
                              <p style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{timeAgo(entry.time)}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

      </main>

      {/* ── MODALS ── */}
      <PreviewModal file={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} />
      <ShareModal   file={shareFile}   open={!!shareFile}   onClose={() => setShareFile(null)}   />

      {/* ── TOASTS ── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default EmployeeDashboard;