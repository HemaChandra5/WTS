// src/pages/EmployeeDashboard.jsx
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
const WS_BASE_URL = import.meta.env.VITE_WS_URL || API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  high: { label: 'High', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-400' },
};

const TASK_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', icon: ClockIcon },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400', icon: EyeIcon },
  done: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400', icon: CheckCircleIcon },
};

const STATUS_CONFIG = {
  pending: {
    icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
    label: 'Pending review', note: 'Waiting for admin review.',
  },
  reviewing: {
    icon: EyeIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
    label: 'Under review', note: 'An admin is reviewing your file.',
  },
  approved: {
    icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
    label: 'Approved', note: 'Your file has been approved.',
  },
  rejected: {
    icon: XCircleIcon, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200',
    label: 'Rejected', note: 'Your file was rejected. See admin note.',
  },
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

/* ─── Reusable Components ─────────────────────────────────────────────── */

// Toast
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-[100] space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border text-sm font-medium animate-slide-up
        ${t.type === 'success' ? 'bg-emerald-900 border-emerald-700 text-emerald-100' :
          t.type === 'error' ? 'bg-rose-900 border-rose-700 text-rose-100' :
          'bg-slate-900 border-slate-700 text-slate-100'}`}>
        {t.type === 'success' && <CheckCircleIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
        {t.type === 'error' && <XCircleIcon className="h-4 w-4 text-rose-400 flex-shrink-0" />}
        {t.type === 'info' && <InformationCircleIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />}
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100">
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    ))}
  </div>
);

// Stat Card
const StatCard = ({ icon: Icon, label, value, sub, trend, color, onClick }) => {
  const colors = {
    indigo: 'from-indigo-600 to-indigo-800',
    amber: 'from-amber-500 to-orange-600',
    emerald: 'from-emerald-600 to-teal-700',
    violet: 'from-violet-600 to-purple-800',
    rose: 'from-rose-500 to-rose-700',
    sky: 'from-sky-500 to-cyan-700',
    fuchsia: 'from-fuchsia-500 to-pink-700',
    teal: 'from-teal-500 to-cyan-700',
  };
  return (
    <button
      onClick={onClick}
      type="button"
      className={`relative overflow-hidden rounded-2xl p-5 shadow-lg bg-gradient-to-br ${colors[color] || colors.indigo}
        hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 w-full text-left group`}
    >
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300" />
      <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold
              ${trend >= 0 ? 'bg-white/20 text-white' : 'bg-black/20 text-white/80'}`}>
              {trend >= 0 ? <ArrowUpIcon className="h-2.5 w-2.5" /> : <ArrowDownIcon className="h-2.5 w-2.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-white/50 mt-1">{sub}</p>}
      </div>
    </button>
  );
};

// Notification Panel
const NotificationPanel = ({ notifications, onClear, onClearAll }) => (
  <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <p className="text-sm font-bold text-slate-900">Notifications</p>
      {notifications.length > 0 && (
        <button onClick={onClearAll} className="text-[11px] text-indigo-600 hover:underline font-medium">
          Clear all
        </button>
      )}
    </div>
    <div className="max-h-80 overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="py-10 text-center">
          <BellIcon className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="mt-2 text-xs text-slate-400">No notifications</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50 transition-colors">
            <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full
              ${n.type === 'task' ? 'bg-amber-500' : n.type === 'approval' ? 'bg-emerald-500' : n.type === 'rejection' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800">{n.title}</p>
              <p className="text-[11px] text-slate-500">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.time)}</p>
            </div>
            <button onClick={() => onClear(n.id)} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  </div>
);

// Pagination
const Pagination = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button onClick={() => onChange(current - 1)} disabled={current === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition
            ${p === current ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(current + 1)} disabled={current === total}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Mini Bar Chart
const MiniBarChart = ({ data, color = '#6366f1' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
          <div
            className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
            style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: d.value > 0 ? 4 : 0 }}
            title={`${d.label}: ${d.value}`}
          />
        </div>
      ))}
    </div>
  );
};

// Activity Row
const ActivityRow = ({ file }) => {
  const cfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <li className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <Icon className={`h-4 w-4 ${cfg.color}`} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{file.originalName}</p>
            <p className="text-[11px] text-slate-500">{file.description || 'No description'}</p>
            {file.adminNote && (
              <div className="mt-1.5 flex items-start gap-1">
                <ChatBubbleLeftEllipsisIcon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
                <p className={`text-[11px] italic font-medium ${cfg.color}`}>Admin: "{file.adminNote}"</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={file.status} size="sm" />
          <span className="text-[10px] text-slate-400">{formatTime(file.createdAt)}</span>
        </div>
      </div>
    </li>
  );
};

// Task Row
const TaskRow = ({ task, onStatusChange }) => {
  const cfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.pending;
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const Icon = cfg.icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <li className={`flex items-start gap-4 rounded-xl border px-4 py-3.5 transition-all hover:shadow-sm
      ${isOverdue ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 bg-slate-50/50 hover:bg-white'}`}>
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100">
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800">{task.title}</p>
          {isOverdue && (
            <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600">Overdue</span>
          )}
        </div>
        {task.description && (
          <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
              <CalendarDaysIcon className="h-3 w-3" />
              Due {formatDate(task.dueDate)}
            </span>
          )}
          <span className="text-[10px] text-slate-400">Assigned by admin · {timeAgo(task.createdAt)}</span>
        </div>
        {task.adminFile && (
          <div className="mt-1.5 flex items-center gap-1">
            <DocumentTextIcon className="h-3.5 w-3.5 text-indigo-500" />
            <a
              href={typeof task.adminFile === 'string' ? task.adminFile : URL.createObjectURL(task.adminFile)}
              target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-bold text-indigo-600 hover:underline"
            >
              View attachment
            </a>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityCfg.color} ${priorityCfg.bg} ${priorityCfg.border}`}>
          <FlagIcon className="h-2.5 w-2.5" />
          {priorityCfg.label}
        </span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className={`rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 ${cfg.color} ${cfg.bg} ${cfg.border}`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Completed</option>
        </select>
      </div>
    </li>
  );
};

// Task Section Accordion
const TaskSection = ({ title, status, tasks, count, isOpen, onToggle, onStatusChange }) => {
  const cfg = TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const sectionBg = { pending: 'bg-amber-50', in_progress: 'bg-blue-50', done: 'bg-emerald-50' }[status];
  const sectionBorder = { pending: 'border-amber-200', in_progress: 'border-blue-200', done: 'border-emerald-200' }[status];
  const iconColor = { pending: 'text-amber-600', in_progress: 'text-blue-600', done: 'text-emerald-600' }[status];

  return (
    <div className={`rounded-2xl border ${sectionBorder} overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${sectionBg} hover:opacity-90`}
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/40">
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-[11px] text-slate-500">{count} task{count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/60 px-2 py-1 text-xs font-bold text-slate-700">{count}</span>
          {isOpen
            ? <ChevronUpIcon className="h-4 w-4 text-slate-700" />
            : <ChevronDownIcon className="h-4 w-4 text-slate-700" />
          }
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center">
              <Icon className="h-8 w-8 text-slate-300" />
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

/* ─── Main Component ──────────────────────────────────────────────────── */
const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { files, addFile } = useFiles();
  const { tasks, updateTaskStatus } = useTasks();

  if (!user) {
    return <div className="p-6 text-sm text-slate-600">Loading dashboard...</div>;
  }

  /* ── State ── */
  const [taskList, setTaskList] = useState(tasks || []);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('list');
  const notifRef = useRef(null);

  /* ── Filter State ── */
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [range, setRange] = useState('30d');
  const [filePage, setFilePage] = useState(1);

  /* ── Task State ── */
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskPage, setTaskPage] = useState(1);
  const [taskSectionsOpen, setTaskSectionsOpen] = useState({ pending: true, in_progress: true, done: false });

  /* ── Modals ── */
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  /* ── Init ── */
  useEffect(() => { setTaskList(tasks || []); }, [tasks]);

  /* ── Click outside notif ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Toast helpers ── */
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  /* ── Activity log helper ── */
  const logActivity = useCallback((action, detail) => {
    setActivityLog(p => [{ id: Date.now(), action, detail, time: new Date().toISOString() }, ...p].slice(0, 50));
  }, []);

  /* ── Notification helper ── */
  const pushNotif = useCallback((title, message, type = 'info') => {
    setNotifications(p => [{ id: Date.now(), title, message, type, time: new Date().toISOString() }, ...p].slice(0, 20));
  }, []);

  /* ── WebSocket ── */
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
    (error) => console.error('WebSocket error:', error)
  );

  useWebSocket(
    `${WS_BASE_URL}/ws/files/`,
    (data) => {
      if (data?.type === 'file_status_update' && data.fileId) {
        const status = data.status;
        if (status === 'approved') {
          pushNotif('File approved', 'One of your files was approved by admin', 'approval');
          addToast('File approved by admin!', 'success');
        }
        if (status === 'rejected') {
          pushNotif('File rejected', 'One of your files was rejected by admin', 'rejection');
          addToast('A file was rejected. Check your files tab.', 'error');
        }
      }
    },
    (error) => console.error('WebSocket error:', error)
  );

  /* ── Handlers ── */
  const handleUpload = (file, description) => {
    addFile({ userId: user.id, userName: user.name, userEmail: user.email, file, description });
    logActivity('File Uploaded', file.name || 'Unknown file');
    addToast('File uploaded successfully', 'success');
  };

  const handleTaskStatusChange = useCallback((taskId, status) => {
    setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    updateTaskStatus(taskId, status);
    const task = taskList.find(t => t.id === taskId);
    logActivity('Task Status Updated', `"${task?.title || taskId}" → ${status}`);
    addToast(`Task marked as ${status.replace('_', ' ')}`, 'success');
  }, [taskList, updateTaskStatus, logActivity, addToast]);

  const toggleTaskSection = (status) => {
    setTaskSectionsOpen(prev => ({ ...prev, [status]: !prev[status] }));
  };

  /* ── Derived data ── */
  const userFiles = useMemo(() => (files || []).filter(f => f.userId === user.id), [files, user.id]);

  const myTasks = useMemo(() => (taskList || []).filter(t => t.assignedToEmail === user.email), [taskList, user.email]);

  const tasksByStatus = useMemo(() => ({
    pending: myTasks.filter(t => t.status === 'pending'),
    in_progress: myTasks.filter(t => t.status === 'in_progress'),
    done: myTasks.filter(t => t.status === 'done'),
  }), [myTasks]);

  const stats = useMemo(() => {
    const totalSize = userFiles.reduce((s, f) => s + (f.size || 0), 0);
    const todayCount = userFiles.filter(f => isSameDay(f.createdAt)).length;
    const monthCount = userFiles.filter(f => isWithinDays(f.createdAt, 30)).length;
    const approvedCount = userFiles.filter(f => f.status === 'approved').length;
    const rejectedCount = userFiles.filter(f => f.status === 'rejected').length;
    const pendingCount = userFiles.filter(f => f.status === 'pending').length;
    const reviewingCount = userFiles.filter(f => f.status === 'reviewing').length;
    const pendingTasks = myTasks.filter(t => t.status === 'pending').length;
    const doneTasks = myTasks.filter(t => t.status === 'done').length;
    const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    return {
      totalFiles: userFiles.length, totalSize, todayCount, monthCount,
      approvedCount, rejectedCount, pendingCount, reviewingCount,
      pendingTasks, doneTasks, overdueTasks,
    };
  }, [userFiles, myTasks]);

  // Weekly upload trend (last 7 days)
  const weeklyTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString('en', { weekday: 'short' }), value: 0, date: d };
    });
    userFiles.forEach(f => {
      if (!f.createdAt) return;
      const fd = new Date(f.createdAt);
      const idx = days.findIndex(d => isSameDay(fd, d.date));
      if (idx !== -1) days[idx].value++;
    });
    return days;
  }, [userFiles]);

  const todayFiles = useMemo(() => userFiles.filter(f => isSameDay(f.createdAt)).slice(0, 8), [userFiles]);
  const rejectedFiles = useMemo(() => userFiles.filter(f => f.status === 'rejected'), [userFiles]);

  const filteredFiles = useMemo(() => {
    let list = [...userFiles];
    if (range === 'today') list = list.filter(f => isSameDay(f.createdAt));
    else if (range === '7d') list = list.filter(f => isWithinDays(f.createdAt, 7));
    else if (range === '30d') list = list.filter(f => isWithinDays(f.createdAt, 30));
    if (selectedDate) {
      const d = new Date(selectedDate);
      list = list.filter(f => isSameDay(f.createdAt, d));
    }
    if (typeFilter !== 'all') list = list.filter(f => getType(f.originalName) === typeFilter);
    if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f =>
      (f.originalName || '').toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name') return (a.originalName || '').localeCompare(b.originalName || '');
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return 0;
    });
    return list;
  }, [userFiles, range, selectedDate, typeFilter, statusFilter, sortBy, search]);

  const paginatedFiles = useMemo(() => {
    const start = (filePage - 1) * ITEMS_PER_PAGE;
    return filteredFiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFiles, filePage]);

  const totalFilePages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

  const filteredTasks = useMemo(() => {
    let list = [...myTasks];
    if (taskStatusFilter !== 'all') list = list.filter(t => t.status === taskStatusFilter);
    if (taskPriorityFilter !== 'all') list = list.filter(t => t.priority === taskPriorityFilter);
    const q = taskSearch.trim().toLowerCase();
    if (q) list = list.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    return list;
  }, [myTasks, taskStatusFilter, taskPriorityFilter, taskSearch]);

  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * ITEMS_PER_PAGE;
    return filteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTasks, taskPage]);

  const totalTaskPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

  /* ── Export handlers ── */
  const handleExportFiles = () => {
    exportToCSV(filteredFiles.map(f => ({
      name: f.originalName || '',
      status: f.status || '',
      size: formatBytes(f.size),
      description: f.description || '',
      uploaded: formatDate(f.createdAt),
    })), 'my-files-export');
    addToast('Files exported to CSV', 'success');
    logActivity('Export', `${filteredFiles.length} files`);
  };

  const handleExportTasks = () => {
    exportToCSV(myTasks.map(t => ({
      title: t.title || '',
      status: t.status || '',
      priority: t.priority || '',
      dueDate: formatDate(t.dueDate),
      description: t.description || '',
    })), 'my-tasks-export');
    addToast('Tasks exported to CSV', 'success');
  };

  /* ── Greeting ── */
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  /* ── Tabs ── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'upload', label: 'Upload', icon: CloudArrowUpIcon },
    { id: 'files', label: 'My Files', icon: DocumentTextIcon, badge: userFiles.length, badgeColor: 'bg-indigo-500' },
    { id: 'tasks', label: 'My Tasks', icon: CheckCircleIcon, badge: stats.pendingTasks || null, badgeColor: stats.overdueTasks > 0 ? 'bg-rose-500' : 'bg-amber-500' },
    { id: 'activity', label: 'Activity', icon: ListBulletIcon },
  ];

  return (
<div className="min-h-screen bg-white font-sans">
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        h1, h2 { font-family: 'Sora', sans-serif; }
        .animate-slide-up { animation: slideUp 0.35s cubic-bezier(.16,1,.3,1); }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {greeting}, <span className="text-indigo-600">{user?.name}</span>! 👋
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              <span>{formatLongDate(now)}</span>
            </div>
            {rejectedFiles.length > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5">
                <XCircleIcon className="h-3.5 w-3.5 flex-shrink-0 text-rose-500" />
                <p className="text-xs font-medium text-rose-700">
                  {rejectedFiles.length} file{rejectedFiles.length > 1 ? 's were' : ' was'} rejected — check{' '}
                  <button onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }} className="underline font-bold" type="button">My Files</button>.
                </p>
              </div>
            )}
            {stats.overdueTasks > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
                <ExclamationCircleIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                <p className="text-xs font-medium text-amber-700">
                  {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} — check{' '}
                  <button onClick={() => setActiveTab('tasks')} className="underline font-bold" type="button">My Tasks</button>.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-700">Live</span>
            </div>
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifications(p => !p)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
              >
                {notifications.length > 0
                  ? <BellSolid className="h-4 w-4 text-indigo-600" />
                  : <BellIcon className="h-4 w-4" />
                }
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel
                  notifications={notifications}
                  onClear={(id) => setNotifications(p => p.filter(n => n.id !== id))}
                  onClearAll={() => setNotifications([])}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={DocumentTextIcon} label="Total Files" value={stats.totalFiles} sub={`${stats.todayCount} today`} color="indigo" onClick={() => setActiveTab('files')} />
          <StatCard icon={CloudArrowUpIcon} label="This Month" value={stats.monthCount} sub="uploaded" color="sky" onClick={() => { setActiveTab('files'); setRange('30d'); }} />
          <StatCard icon={ShieldCheckIcon} label="Approved" value={stats.approvedCount} sub={`${stats.pendingCount} pending`} color="emerald" onClick={() => { setActiveTab('files'); setStatusFilter('approved'); }} />
          <StatCard icon={XCircleIcon} label="Rejected" value={stats.rejectedCount} sub={`${stats.reviewingCount} reviewing`} color="rose" onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }} />
          <StatCard icon={CheckCircleIcon} label="My Tasks" value={myTasks.length} sub={`${stats.pendingTasks} open`} color="violet" onClick={() => setActiveTab('tasks')} />
          <StatCard icon={ArrowUpTrayIcon} label="Storage" value={formatBytes(stats.totalSize)} sub="total uploaded" color="fuchsia" onClick={() => setActiveTab('files')} />
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200
                  ${active ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-slate-200'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black text-white ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── OVERVIEW TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* Upload trend */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">Upload Trend</p>
                  <p className="text-[11px] text-slate-400">Last 7 days</p>
                </div>
                <ChartBarIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <MiniBarChart data={weeklyTrend} color="#6366f1" />
              <div className="mt-2 flex justify-between">
                {weeklyTrend.map(d => (
                  <span key={d.label} className="text-[9px] text-slate-400">{d.label}</span>
                ))}
              </div>
            </div>

            {/* File status distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">File Status</p>
                  <p className="text-[11px] text-slate-400">Your file breakdown</p>
                </div>
                <FunnelIcon className="h-5 w-5 text-violet-400" />
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Pending', value: stats.pendingCount, color: '#f59e0b' },
                  { label: 'Reviewing', value: stats.reviewingCount, color: '#3b82f6' },
                  { label: 'Approved', value: stats.approvedCount, color: '#10b981' },
                  { label: 'Rejected', value: stats.rejectedCount, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 w-16">{s.label}</span>
                    <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.totalFiles ? (s.value / stats.totalFiles) * 100 : 0}%`, backgroundColor: s.color }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 w-5 text-right">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-800 mb-4">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Upload file', icon: CloudArrowUpIcon, onClick: () => setActiveTab('upload'), color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                  { label: 'My tasks', icon: CheckCircleIcon, onClick: () => setActiveTab('tasks'), color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  { label: 'All files', icon: DocumentTextIcon, onClick: () => setActiveTab('files'), color: 'text-slate-600 bg-slate-50 border-slate-200' },
                  { label: 'Activity log', icon: ListBulletIcon, onClick: () => setActiveTab('activity'), color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                ].map(a => (
                  <button key={a.label} onClick={a.onClick} type="button"
                    className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-[11px] font-semibold transition hover:scale-[1.02] active:scale-95 ${a.color}`}>
                    <a.icon className="h-5 w-5" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent uploads */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-800">Recent Uploads</p>
                <button onClick={() => setActiveTab('files')} className="text-[11px] text-indigo-600 hover:underline font-semibold">View all</button>
              </div>
              {userFiles.slice(0, 5).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                  <CloudArrowUpIcon className="h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-400">No files uploaded yet</p>
                  <button onClick={() => setActiveTab('upload')} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline" type="button">Upload your first file →</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {userFiles.slice(0, 5).map(f => (
                    <div key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 flex-shrink-0">
                        <DocumentTextIcon className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">{f.originalName}</p>
                        <p className="text-[10px] text-slate-400">{formatBytes(f.size)} · {timeAgo(f.createdAt)}</p>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-800">Task Summary</p>
                <button onClick={() => setActiveTab('tasks')} className="text-[11px] text-indigo-600 hover:underline font-semibold">View all</button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Pending', value: stats.pendingTasks, color: 'bg-amber-500' },
                  { label: 'In progress', value: myTasks.filter(t => t.status === 'in_progress').length, color: 'bg-blue-500' },
                  { label: 'Completed', value: stats.doneTasks, color: 'bg-emerald-500' },
                  { label: 'Overdue', value: stats.overdueTasks, color: 'bg-rose-500' },
                  { label: 'Total assigned', value: myTasks.length, color: 'bg-indigo-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="text-[11px] text-slate-600">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
              {myTasks.filter(t => t.status !== 'done').length === 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <SparklesIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-[11px] font-semibold text-emerald-700">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── UPLOAD TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <section className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <FileUpload onUpload={handleUpload} />

              <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                      <ClockIcon className="h-4 w-4 text-slate-600" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Today's activity</h2>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs font-semibold text-slate-600">
                    {todayFiles.length} item{todayFiles.length === 1 ? '' : 's'}
                  </span>
                </div>

                {todayFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                    <ArrowUpTrayIcon className="h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-400">No uploads today yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {todayFiles.map(f => <ActivityRow key={f.id} file={f} />)}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                    const Icon = val.icon;
                    return (
                      <span key={key} className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Icon className={`h-3 w-3 ${val.color}`} />
                        {val.label}
                      </span>
                    );
                  })}
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── MY FILES TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'files' && (
          <section className="space-y-4">
            {/* Filter bar */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                    <FunnelIcon className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Filter & Sort</p>
                    <p className="text-[11px] text-slate-400">{filteredFiles.length} of {userFiles.length} files match</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { value: range, onChange: setRange, options: [['today','Today'],['7d','7 days'],['30d','30 days'],['all','All time']] },
                    { value: statusFilter, onChange: setStatusFilter, options: [['all','All statuses'],['pending','Pending'],['reviewing','Reviewing'],['approved','Approved'],['rejected','Rejected']] },
                    { value: typeFilter, onChange: setTypeFilter, options: [['all','All types'],['pdf','PDF'],['image','Images'],['doc','Office'],['data','Data'],['other','Other']] },
                    { value: sortBy, onChange: setSortBy, options: [['newest','Newest'],['oldest','Oldest'],['name','Name'],['size','Size']] },
                  ].map((sel, i) => (
                    <select key={i} value={sel.value} onChange={(e) => { sel.onChange(e.target.value); setFilePage(1); }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                      {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ))}

                  <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setFilePage(1); }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />

                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search files…" value={search}
                      onChange={(e) => { setSearch(e.target.value); setFilePage(1); }}
                      className="min-w-[160px] rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>

                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                    <button onClick={() => setViewMode('list')} className={`rounded-lg p-1.5 transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                      <ListBulletIcon className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`rounded-lg p-1.5 transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Squares2X2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button onClick={handleExportFiles}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />Export
                  </button>

                  {(search || typeFilter !== 'all' || range !== '30d' || sortBy !== 'newest' || statusFilter !== 'all' || selectedDate) && (
                    <button
                      onClick={() => { setSearch(''); setTypeFilter('all'); setRange('30d'); setSortBy('newest'); setStatusFilter('all'); setSelectedDate(''); setFilePage(1); }}
                      className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition">
                      <XMarkIcon className="h-3.5 w-3.5" />Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <FileList
                files={paginatedFiles}
                onPreview={setPreviewFile}
                onShare={setShareFile}
              />
              <Pagination current={filePage} total={totalFilePages} onChange={setFilePage} />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── MY TASKS TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'tasks' && (
          <section className="space-y-4">
            {/* Task filters */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 flex-shrink-0">
                    <CheckCircleIcon className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">My Tasks</p>
                    <p className="text-[11px] text-slate-400">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="relative flex-1 min-w-[160px]">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search tasks…" value={taskSearch}
                    onChange={(e) => { setTaskSearch(e.target.value); setTaskPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none" />
                </div>
                <select value={taskStatusFilter} onChange={(e) => { setTaskStatusFilter(e.target.value); setTaskPage(1); }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <select value={taskPriorityFilter} onChange={(e) => { setTaskPriorityFilter(e.target.value); setTaskPage(1); }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none">
                  <option value="all">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button onClick={handleExportTasks}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />Export
                </button>
              </div>
            </div>

            {/* Overdue warning */}
            {stats.overdueTasks > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3">
                <ExclamationCircleIcon className="h-5 w-5 text-rose-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-rose-700">
                  {stats.overdueTasks} task{stats.overdueTasks > 1 ? 's are' : ' is'} overdue. Please complete them as soon as possible.
                </p>
              </div>
            )}

            {/* Flat filtered list (when searching/filtering) or accordion (default) */}
            {(taskSearch || taskStatusFilter !== 'all' || taskPriorityFilter !== 'all') ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4">
                  {paginatedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                      <CheckCircleIcon className="h-10 w-10 text-slate-300" />
                      <p className="mt-2 text-sm font-bold text-slate-400">No tasks match your filters</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
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
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                  <SparklesIcon className="h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No tasks assigned yet</p>
                  <p className="text-xs text-slate-400">Tasks from admin will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <TaskSection
                    title="Pending" status="pending"
                    tasks={tasksByStatus.pending} count={tasksByStatus.pending.length}
                    isOpen={taskSectionsOpen.pending} onToggle={() => toggleTaskSection('pending')}
                    onStatusChange={handleTaskStatusChange}
                  />
                  <TaskSection
                    title="In Progress" status="in_progress"
                    tasks={tasksByStatus.in_progress} count={tasksByStatus.in_progress.length}
                    isOpen={taskSectionsOpen.in_progress} onToggle={() => toggleTaskSection('in_progress')}
                    onStatusChange={handleTaskStatusChange}
                  />
                  <TaskSection
                    title="Completed" status="done"
                    tasks={tasksByStatus.done} count={tasksByStatus.done.length}
                    isOpen={taskSectionsOpen.done} onToggle={() => toggleTaskSection('done')}
                    onStatusChange={handleTaskStatusChange}
                  />
                </div>
              )
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── ACTIVITY LOG TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <ListBulletIcon className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Activity Log</h2>
                  <p className="text-[11px] text-slate-500">Your actions in this session</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{activityLog.length} entries</span>
                {activityLog.length > 0 && (
                  <button
                    onClick={() => exportToCSV(activityLog.map(e => ({ action: e.action, detail: e.detail, time: e.time })), 'activity-log')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />Export
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-5">
              {activityLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center">
                  <InformationCircleIcon className="h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-400">No activity yet</p>
                  <p className="text-xs text-slate-400">Your uploads and task updates will appear here.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                  <ul className="space-y-1 pl-10">
                    {activityLog.map((entry) => (
                      <li key={entry.id} className="relative">
                        <div className="absolute -left-[26px] top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-white transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{entry.action}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{entry.detail}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(entry.time)}</p>
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
      <PreviewModal file={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} />
      <ShareModal file={shareFile} open={!!shareFile} onClose={() => setShareFile(null)} />

      {/* ── TOASTS ── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default EmployeeDashboard;