import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  FunnelIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  XCircleIcon,
  EyeIcon,
  NoSymbolIcon,
  BellIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  FlagIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';

import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FilesContext';
import { useTasks } from '../context/TasksContext';

import FileList from '../components/FileList';
import PreviewModal from '../components/PreviewModal';
import ShareModal from '../components/ShareModal';
import ReviewModal from '../components/ReviewModal';
import StatusBadge from '../components/StatusBadge';
import { isSameDay, isWithinDays } from '../utils/dateUtils';

/* ─── Constants ──────────────────────────────────────────────────────── */
const ITEMS_PER_PAGE = 10;

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', dot: 'bg-slate-400' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  high: { label: 'High', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-400' },
};

const TASK_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
  done: { label: 'Done', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' },
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

/* ─── Reusable Components ─────────────────────────────────────────────── */

// Toast notification
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-[100] space-y-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border text-sm font-medium animate-slide-up
        ${
          t.type === 'success'
            ? 'bg-emerald-900 border-emerald-700 text-emerald-100'
            : t.type === 'error'
            ? 'bg-rose-900 border-rose-700 text-rose-100'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {t.type === 'success' && (
          <CheckCircleIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
        )}
        {t.type === 'error' && (
          <XCircleIcon className="h-4 w-4 text-rose-400 flex-shrink-0" />
        )}
        {t.type === 'info' && (
          <InformationCircleIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
        )}
        <span>{t.message}</span>
        <button
          onClick={() => removeToast(t.id)}
          className="ml-2 opacity-60 hover:opacity-100"
        >
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
  };
  return (
    <button
      onClick={onClick}
      type="button"
      className={`relative overflow-hidden rounded-2xl p-5 shadow-lg bg-gradient-to-br ${
        colors[color] || colors.indigo
      } hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 w-full text-left group`}
    >
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300" />
      <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold
              ${
                trend >= 0
                  ? 'bg-white/20 text-white'
                  : 'bg-black/20 text-white/80'
              }`}
            >
              {trend >= 0 ? (
                <ArrowUpIcon className="h-2.5 w-2.5" />
              ) : (
                <ArrowDownIcon className="h-2.5 w-2.5" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mt-0.5">
          {label}
        </p>
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
        <button
          onClick={onClearAll}
          className="text-[11px] text-indigo-600 hover:underline font-medium"
        >
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
          <div
            key={n.id}
            className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div
              className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                n.type === 'file'
                  ? 'bg-indigo-500'
                  : n.type === 'employee'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800">
                {n.title}
              </p>
              <p className="text-[11px] text-slate-500">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {timeAgo(n.time)}
              </p>
            </div>
            <button
              onClick={() => onClear(n.id)}
              className="text-slate-400 hover:text-slate-600"
            >
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
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition
            ${
              p === current
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Mini bar chart
const MiniBarChart = ({ data, color = '#6366f1' }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
          <div
            className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
            style={{
              height: `${(d.value / max) * 100}%`,
              backgroundColor: color,
              minHeight: d.value > 0 ? 4 : 0,
            }}
            title={`${d.label}: ${d.value}`}
          />
        </div>
      ))}
    </div>
  );
};

// Confirm Dialog
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full mb-4 ${
            danger ? 'bg-rose-100' : 'bg-indigo-100'
          }`}
        >
          {danger ? (
            <XCircleIcon className="h-6 w-6 text-rose-600" />
          ) : (
            <InformationCircleIcon className="h-6 w-6 text-indigo-600" />
          )}
        </div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition
              ${
                danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Pending Review Row
const PendingRow = ({ file, onReview, selected, onSelect }) => (
  <li
    className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all
    ${
      selected
        ? 'border-indigo-300 bg-indigo-50/60'
        : 'border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:shadow-sm'
    }`}
  >
    <input
      type="checkbox"
      checked={selected}
      onChange={onSelect}
      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
    />
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
      <DocumentTextIcon className="h-4 w-4 text-amber-600" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-800">
        {file.originalName}
      </p>
      <p className="text-[11px] text-slate-500">
        {file.userName} · {file.userEmail}
      </p>
    </div>
    <div className="hidden md:block text-[11px] text-slate-400">
      {timeAgo(file.createdAt)}
    </div>
    <StatusBadge status={file.status} size="sm" />
    <button
      onClick={() => onReview(file)}
      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
      type="button"
    >
      <EyeIcon className="h-3.5 w-3.5" />
      Review
    </button>
  </li>
);

/* ─── Main Component ──────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const {
    user,
    getAllEmployees,
    approveEmployee,
    deactivateEmployee,
    reactivateEmployee,
    rejectEmployee,
  } = useAuth();
  const { files, updateFileStatus } = useFiles();
  const { tasks, addTask, updateTaskStatus, deleteTask } = useTasks();

  /* ── State ── */
  const [fileList, setFileList] = useState(files || []);
  const [employees, setEmployees] = useState([]);
  const [adminError, setAdminError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('list'); // for future list/grid support
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empTab, setEmpTab] = useState('active'); // 'pending'|'active'|'inactive'
  const notifRef = useRef(null);

  /* ── File Filters ── */
  const [range, setRange] = useState('30d');
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

  /* ── Modals ── */
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [reviewFile, setReviewFile] = useState(null);

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
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    }
  }, [getAllEmployees]);

  useEffect(() => {
    refreshEmployees();
  }, [refreshEmployees]);

  /* ── Click outside notif ── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Toast helpers ── */
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(
      () => setToasts((p) => p.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

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
        admin: user?.name || 'Admin',
      };
      setAuditLog((p) => [entry, ...p].slice(0, 100));
    },
    [user],
  );

  /* ── Notification helper ── */
  const pushNotif = useCallback((title, message, type = 'info') => {
    const n = {
      id: Date.now(),
      title,
      message,
      type,
      time: new Date().toISOString(),
    };
    setNotifications((p) => [n, ...p].slice(0, 20));
  }, []);

  /* ── WebSocket ── */
  useWebSocket(
    'ws://localhost:8000/ws/files/',
    (data) => {
      if (!data?.type) return;
      if (data.type === 'file_notification' && data.file) {
        setFileList((prev) => upsertById(prev, data.file));
        pushNotif(
          'New file uploaded',
          `${data.file.userName} uploaded ${data.file.originalName}`,
          'file',
        );
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
    },
    (error) => console.error('WebSocket error:', error),
  );

  /* ── Employee actions ── */
  const handleApprove = async (id) => {
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
      pushNotif(
        'Employee approved',
        `${emp?.name || emp?.email || 'Employee'} can now log in`,
        'employee',
      );
      addToast('Employee approved successfully', 'success');
    }
    refreshEmployees();
  };

  const handleDeactivate = (id) => {
    const emp = employees.find((e) => e.id === id);
    setConfirmDialog({
      title: 'Deactivate Employee?',
      message: 'This employee will lose access until reactivated.',
      danger: true,
      onConfirm: async () => {
        await deactivateEmployee?.(id);
        logAction('Employee Deactivated', emp?.email || id);
        addToast('Employee deactivated', 'info');
        refreshEmployees();
        setConfirmDialog(null);
      },
    });
  };

  const handleReactivate = async (id) => {
    const emp = employees.find((e) => e.id === id);
    await reactivateEmployee?.(id);
    logAction('Employee Reactivated', emp?.email || id);
    addToast('Employee reactivated', 'success');
    refreshEmployees();
  };

  const handleReject = (id) => {
    const emp = employees.find((e) => e.id === id);
    setConfirmDialog({
      title: 'Reject registration?',
      message: 'This will permanently decline the employee registration.',
      danger: true,
      onConfirm: async () => {
        await rejectEmployee?.(id);
        logAction('Employee Rejected', emp?.email || id);
        addToast('Registration rejected', 'info');
        refreshEmployees();
        setConfirmDialog(null);
      },
    });
  };

  /* ── File status update ── */
  const handleUpdateFileStatus = useCallback(
    (...args) => {
      // Flexible signature: either (payload) or (fileId, status, note)
      if (typeof args[0] === 'object' && args[0]?.id) {
        const payload = args[0];
        setFileList((prev) => upsertById(prev, payload));
        logAction(
          'File Status Updated',
          `${payload.originalName} → ${payload.status}`,
        );
        addToast(`File marked as ${payload.status}`, 'success');
        return updateFileStatus(payload);
      }
      const [fileId, status, adminNote] = args;
      const file = fileList.find((f) => f.id === fileId);
      setFileList((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status, ...(adminNote ? { adminNote } : {}) }
            : f,
        ),
      );
      logAction(
        'File Status Updated',
        `${file?.originalName || fileId} → ${status}`,
      );
      addToast(`File marked as ${status}`, 'success');
      return updateFileStatus(fileId, status, adminNote);
    },
    [updateFileStatus, fileList, logAction, addToast],
  );

  /* ── Bulk file actions ── */
  const handleBulkAction = (action) => {
    if (!selectedFiles.size) return;
    const ids = [...selectedFiles];
    ids.forEach((id) => handleUpdateFileStatus(id, action));
    setSelectedFiles(new Set());
    addToast(`${ids.length} file(s) marked as ${action}`, 'success');
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

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.assignedToEmail.trim()) return;
    addTask({
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assignedToEmail: taskForm.assignedToEmail.trim(),
      assignedToName: taskForm.assignedToEmail.trim(),
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      adminFile: taskForm.adminFile,
    });
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
      onConfirm: () => {
        deleteTask?.(id);
        logAction('Task Deleted', id);
        addToast('Task deleted', 'info');
        setConfirmDialog(null);
      },
    });
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

  // Status distribution
  const statusDistribution = useMemo(
    () => [
      { label: 'Pending', value: stats.pending, color: '#f59e0b' },
      { label: 'Reviewing', value: stats.reviewing, color: '#3b82f6' },
      { label: 'Approved', value: stats.approved, color: '#10b981' },
      { label: 'Rejected', value: stats.rejected, color: '#ef4444' },
    ],
    [stats],
  );

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
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    {
      id: 'pending',
      label: 'Needs Review',
      icon: ClockIcon,
      badge: needsAttention.length,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'files',
      label: 'All Files',
      icon: DocumentTextIcon,
      badge: fileList.length,
      badgeColor: 'bg-indigo-500',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckCircleIcon,
      badge: stats.pendingTasks || null,
      badgeColor: 'bg-blue-500',
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: UsersIcon,
      badge: pendingEmployees.length || null,
      badgeColor: 'bg-rose-500',
    },
    { id: 'audit', label: 'Audit Log', icon: ListBulletIcon },
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
        {/* ── Header ── */}
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-0.5 text-[11px] font-medium uppercase tracking-widest text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Admin workspace
            </span>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Work Tracking Overview
            </h1>
            <p className="max-w-md text-sm text-slate-500 leading-relaxed">
              Monitor progress, review submissions, assign tasks, and manage
              work across the organization.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <p className="text-xs text-slate-500">
                Signed in as{' '}
                <span className="font-semibold text-slate-900">
                  {user?.name}
                </span>
                <span className="ml-1 text-slate-400">
                  ({user?.email})
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-700">
                Live
              </span>
            </div>
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifications((p) => !p)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
              >
                {notifications.length > 0 ? (
                  <BellSolid className="h-4 w-4 text-indigo-600" />
                ) : (
                  <BellIcon className="h-4 w-4" />
                )}
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {notifications.length > 9
                      ? '9+'
                      : notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel
                  notifications={notifications}
                  onClear={(id) =>
                    setNotifications((p) =>
                      p.filter((n) => n.id !== id),
                    )
                  }
                  onClearAll={() => setNotifications([])}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={DocumentTextIcon}
            label="Total Files"
            value={stats.totalFiles}
            sub={`${stats.todayCount} today`}
            color="indigo"
            trend={12}
            onClick={() => setActiveTab('files')}
          />
          <StatCard
            icon={ClockIcon}
            label="Pending"
            value={stats.pending}
            sub={`${stats.reviewing} reviewing`}
            color="amber"
            onClick={() => setActiveTab('pending')}
          />
          <StatCard
            icon={ShieldCheckIcon}
            label="Approved"
            value={stats.approved}
            sub={`${stats.rejected} rejected`}
            color="emerald"
            onClick={() => {
              setActiveTab('files');
              setStatusFilter('approved');
            }}
          />
          <StatCard
            icon={UsersIcon}
            label="Employees"
            value={activeEmployees.length}
            sub={`${pendingEmployees.length} pending`}
            color="violet"
            onClick={() => setActiveTab('employees')}
          />
          <StatCard
            icon={CheckCircleIcon}
            label="Tasks"
            value={tasks.length}
            sub={`${stats.pendingTasks} open`}
            color="sky"
            onClick={() => setActiveTab('tasks')}
          />
          <StatCard
            icon={ArrowDownTrayIcon}
            label="Storage"
            value={formatBytes(stats.totalSize)}
            sub="total uploaded"
            color="rose"
            onClick={() => setActiveTab('files')}
          />
        </div>

        {/* ── TABS ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${tab.badgeColor}`}
                  >
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
                  <p className="text-sm font-bold text-slate-800">
                    Upload Trend
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Last 7 days
                  </p>
                </div>
                <ChartBarIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <MiniBarChart data={weeklyTrend} color="#6366f1" />
              <div className="mt-2 flex justify-between">
                {weeklyTrend.map((d) => (
                  <span
                    key={d.label}
                    className="text-[9px] text-slate-400"
                  >
                    {d.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Status distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    File Status
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Distribution
                  </p>
                </div>
                <FunnelIcon className="h-5 w-5 text-violet-400" />
              </div>
              <div className="space-y-2.5">
                {statusDistribution.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[11px] text-slate-500 w-16">
                      {s.label}
                    </span>
                    <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            stats.totalFiles
                              ? (s.value / stats.totalFiles) * 100
                              : 0
                          }%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 w-5 text-right">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-800 mb-4">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'Review pending',
                    icon: ClockIcon,
                    onClick: () => setActiveTab('pending'),
                    color:
                      'text-amber-600 bg-amber-50 border-amber-200',
                  },
                  {
                    label: 'New task',
                    icon: PlusCircleIcon,
                    onClick: () => {
                      setActiveTab('tasks');
                      setTaskFormOpen(true);
                    },
                    color:
                      'text-indigo-600 bg-indigo-50 border-indigo-200',
                  },
                  {
                    label: 'All files',
                    icon: DocumentTextIcon,
                    onClick: () => setActiveTab('files'),
                    color:
                      'text-slate-600 bg-slate-50 border-slate-200',
                  },
                  {
                    label: 'Approve staff',
                    icon: UsersIcon,
                    onClick: () => {
                      setActiveTab('employees');
                      setEmpTab('pending');
                    },
                    color:
                      'text-emerald-600 bg-emerald-50 border-emerald-200',
                  },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.label}
                      onClick={a.onClick}
                      type="button"
                      className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-[11px] font-semibold transition hover:scale-[1.02] active:scale-95 ${a.color}`}
                    >
                      <Icon className="h-5 w-5" />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-800">
                  Recent Uploads
                </p>
                <button
                  onClick={() => setActiveTab('files')}
                  className="text-[11px] text-indigo-600 hover:underline font-semibold"
                >
                  View all
                </button>
              </div>
              {fileList.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No files yet
                </p>
              ) : (
                <div className="space-y-2">
                  {[...fileList]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt),
                    )
                    .slice(0, 5)
                    .map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 flex-shrink-0">
                          <DocumentTextIcon className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {f.originalName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {f.userName} · {timeAgo(f.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={f.status} size="sm" />
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Employees summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-800 mb-4">
                Employee Summary
              </p>
              <div className="space-y-3">
                {[
                  {
                    label: 'Active',
                    value: activeEmployees.length,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: 'Pending approval',
                    value: pendingEmployees.length,
                    color: 'bg-amber-500',
                  },
                  {
                    label: 'Deactivated',
                    value: inactiveEmployees.length,
                    color: 'bg-slate-400',
                  },
                  {
                    label: 'Tasks open',
                    value: stats.pendingTasks,
                    color: 'bg-indigo-500',
                  },
                  {
                    label: 'Tasks done',
                    value: stats.doneTasks,
                    color: 'bg-emerald-400',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${item.color}`}
                      />
                      <span className="text-[11px] text-slate-600">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── PENDING / NEEDS REVIEW TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'pending' && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <ClockIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Files Needing Review
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Approve, reject, or mark files under review
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedFiles.size > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                    <span className="text-[11px] font-semibold text-indigo-700">
                      {selectedFiles.size} selected
                    </span>
                    <button
                      onClick={() => handleBulkAction('approved')}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      Approve all
                    </button>
                    <button
                      onClick={() => handleBulkAction('rejected')}
                      className="text-[10px] font-bold text-rose-700 hover:underline"
                    >
                      Reject all
                    </button>
                    <button
                      onClick={() => setSelectedFiles(new Set())}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                  {needsAttention.length} pending
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              {needsAttention.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                  <CheckCircleIcon className="h-12 w-12 text-emerald-400" />
                  <p className="mt-3 text-sm font-bold text-slate-600">
                    All caught up!
                  </p>
                  <p className="text-xs text-slate-400">
                    No files are waiting for review.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedFiles.size === needsAttention.length &&
                        needsAttention.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(
                            new Set(needsAttention.map((f) => f.id)),
                          );
                        } else {
                          setSelectedFiles(new Set());
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span className="text-[11px] text-slate-500">
                      Select all
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {needsAttention.map((file) => (
                      <PendingRow
                        key={file.id}
                        file={file}
                        onReview={setReviewFile}
                        selected={selectedFiles.has(file.id)}
                        onSelect={() =>
                          setSelectedFiles((p) => {
                            const next = new Set(p);
                            if (next.has(file.id)) next.delete(file.id);
                            else next.add(file.id);
                            return next;
                          })
                        }
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Bottom summary bar */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50">
              {[
                {
                  label: 'Approved',
                  value: stats.approved,
                  color: 'text-emerald-600',
                  icon: CheckCircleIcon,
                },
                {
                  label: 'Rejected',
                  value: stats.rejected,
                  color: 'text-rose-600',
                  icon: XCircleIcon,
                },
                {
                  label: 'Reviewing',
                  value: stats.reviewing,
                  color: 'text-blue-600',
                  icon: EyeIcon,
                },
                {
                  label: 'Pending',
                  value: stats.pending,
                  color: 'text-amber-600',
                  icon: ClockIcon,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-1 py-3"
                  >
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <span
                      className={`text-base font-black ${item.color}`}
                    >
                      {item.value}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {item.label}
                    </span>
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
          <section className="space-y-4">
            {/* Filter bar */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Filter & Sort
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {filteredFiles.length} file
                      {filteredFiles.length !== 1 ? 's' : ''} match
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    {
                      value: range,
                      onChange: setRange,
                      options: [
                        ['today', 'Today'],
                        ['7d', '7 days'],
                        ['30d', '30 days'],
                        ['all', 'All time'],
                      ],
                    },
                    {
                      value: statusFilter,
                      onChange: setStatusFilter,
                      options: [
                        ['all', 'All statuses'],
                        ['pending', 'Pending'],
                        ['reviewing', 'Reviewing'],
                        ['approved', 'Approved'],
                        ['rejected', 'Rejected'],
                      ],
                    },
                    {
                      value: typeFilter,
                      onChange: setTypeFilter,
                      options: [
                        ['all', 'All types'],
                        ['pdf', 'PDF'],
                        ['image', 'Images'],
                        ['doc', 'Office'],
                        ['other', 'Other'],
                      ],
                    },
                    {
                      value: sortBy,
                      onChange: setSortBy,
                      options: [
                        ['newest', 'Newest'],
                        ['oldest', 'Oldest'],
                        ['name', 'Name'],
                        ['size', 'Size'],
                      ],
                    },
                  ].map((sel, i) => (
                    <select
                      key={i}
                      value={sel.value}
                      onChange={(e) => {
                        sel.onChange(e.target.value);
                        setFilePage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {sel.options.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ))}

                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search files, employees…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setFilePage(1);
                      }}
                      className="min-w-[180px] rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`rounded-lg p-1.5 transition ${
                        viewMode === 'list'
                          ? 'bg-white shadow-sm text-slate-900'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <ListBulletIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`rounded-lg p-1.5 transition ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-sm text-slate-900'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Squares2X2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleExportFiles}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Export
                  </button>

                  {(search ||
                    typeFilter !== 'all' ||
                    range !== '30d' ||
                    sortBy !== 'newest' ||
                    statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setTypeFilter('all');
                        setRange('30d');
                        setSortBy('newest');
                        setStatusFilter('all');
                        setFilePage(1);
                      }}
                      className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk actions */}
              {selectedFiles.size > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5">
                  <span className="text-xs font-bold text-indigo-700">
                    {selectedFiles.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkAction('approved')}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('rejected')}
                    className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleBulkAction('reviewing')}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition"
                  >
                    Mark reviewing
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedFiles(new Set())}
                    className="ml-auto text-indigo-400 hover:text-indigo-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <FileList
                files={paginatedFiles}
                isAdmin
                onPreview={setPreviewFile}
                onShare={setShareFile}
                onStatusChange={handleUpdateFileStatus}
                onReview={setReviewFile}
                selectedFiles={selectedFiles}
                onSelectFile={(id) =>
                  setSelectedFiles((p) => {
                    const next = new Set(p);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
              />
              <Pagination
                current={filePage}
                total={totalFilePages}
                onChange={setFilePage}
              />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── TASKS TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'tasks' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                    <PlusCircleIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Task Manager
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Assign and track employee tasks
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTaskFormOpen((p) => !p)}
                  type="button"
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all
                    ${
                      taskFormOpen
                        ? 'bg-slate-900 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                  {taskFormOpen ? (
                    <XMarkIcon className="h-3.5 w-3.5" />
                  ) : (
                    <PlusCircleIcon className="h-3.5 w-3.5" />
                  )}
                  {taskFormOpen ? 'Discard' : 'New Task'}
                </button>
              </div>

              {taskFormOpen && (
                <form
                  onSubmit={handleTaskSubmit}
                  className="border-b border-slate-100 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 px-6 py-5 space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-1.5 lg:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Task Title{' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={taskForm.title}
                        onChange={handleTaskChange}
                        placeholder="e.g. Upload April payslip"
                        required
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleTaskChange}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Assign To{' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="assignedToEmail"
                        value={taskForm.assignedToEmail}
                        onChange={handleTaskChange}
                        placeholder="employee@company.com"
                        required
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={taskForm.dueDate}
                        onChange={handleTaskChange}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={taskForm.description}
                        onChange={handleTaskChange}
                        placeholder="Short note for employee…"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Attach File
                      </label>
                      <input
                        type="file"
                        name="adminFile"
                        onChange={handleTaskChange}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Create Task
                    </button>
                  </div>
                </form>
              )}

              {/* Task filters */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3 bg-slate-50/50">
                <div className="relative flex-1 min-w-[160px]">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tasks…"
                    value={taskSearch}
                    onChange={(e) => {
                      setTaskSearch(e.target.value);
                      setTaskPage(1);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <select
                  value={taskStatusFilter}
                  onChange={(e) => {
                    setTaskStatusFilter(e.target.value);
                    setTaskPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <select
                  value={taskPriorityFilter}
                  onChange={(e) => {
                    setTaskPriorityFilter(e.target.value);
                    setTaskPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="all">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  onClick={handleExportTasks}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  Export
                </button>
                <span className="ml-auto text-[11px] text-slate-400">
                  {filteredTasks.length} task
                  {filteredTasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Task list */}
              <div className="px-6 py-4">
                {paginatedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                    <ExclamationCircleIcon className="h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-400">
                      No tasks found
                    </p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your filters or create a new task.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {paginatedTasks.map((t) => {
                      const statusCfg =
                        TASK_STATUS_CONFIG[t.status] ||
                        TASK_STATUS_CONFIG.pending;
                      const priorityCfg =
                        PRIORITY_CONFIG[t.priority] ||
                        PRIORITY_CONFIG.medium;
                      const overdue =
                        isOverdue(t.dueDate) &&
                        t.status !== 'done';
                      return (
                        <li
                          key={t.id}
                          className={`flex items-start gap-4 rounded-xl border px-4 py-3.5 transition-all hover:shadow-sm ${
                            overdue
                              ? 'border-rose-200 bg-rose-50/30'
                              : 'border-slate-100 bg-slate-50/50 hover:bg-white'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-800">
                                {t.title}
                              </p>
                              {overdue && (
                                <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-3 flex-wrap">
                              <span className="text-[11px] text-slate-500">
                                {t.assignedToEmail}
                              </span>
                              {t.dueDate && (
                                <span
                                  className={`flex items-center gap-1 text-[11px] ${
                                    overdue
                                      ? 'text-rose-600 font-semibold'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  <CalendarDaysIcon className="h-3 w-3" />
                                  Due {formatDate(t.dueDate)}
                                </span>
                              )}
                              {t.description && (
                                <span className="text-[11px] text-slate-400 italic truncate max-w-xs">
                                  {t.description}
                                </span>
                              )}
                            </div>
                            {t.adminFile && (
                              <div className="mt-1.5 flex items-center gap-1">
                                <DocumentTextIcon className="h-3 w-3 text-indigo-500" />
                                <a
                                  href={
                                    typeof t.adminFile === 'string'
                                      ? t.adminFile
                                      : URL.createObjectURL(t.adminFile)
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-semibold text-indigo-600 hover:underline"
                                >
                                  View attachment
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2 flex-wrap justify-end">
                            <span
                              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityCfg.color} ${priorityCfg.bg} ${priorityCfg.border}`}
                            >
                              <FlagIcon className="h-2.5 w-2.5" />
                              {priorityCfg.label}
                            </span>
                            <span
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                              />
                              {statusCfg.label}
                            </span>
                            <select
                              value={t.status}
                              onChange={(e) => {
                                updateTaskStatus(t.id, e.target.value);
                                logAction(
                                  'Task Status Changed',
                                  `${t.title} → ${e.target.value}`,
                                );
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">
                                In progress
                              </option>
                              <option value="done">Done</option>
                            </select>
                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Pagination
                  current={taskPage}
                  total={totalTaskPages}
                  onChange={setTaskPage}
                />
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── EMPLOYEES TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'employees' && (
          <section className="space-y-4">
            {/* Employee sub-tabs + search */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-1">
                  {[
                    {
                      id: 'pending',
                      label: 'Pending',
                      count: pendingEmployees.length,
                      badge: 'bg-amber-500',
                    },
                    {
                      id: 'active',
                      label: 'Active',
                      count: activeEmployees.length,
                      badge: 'bg-emerald-500',
                    },
                    {
                      id: 'inactive',
                      label: 'Deactivated',
                      count: inactiveEmployees.length,
                      badge: 'bg-slate-400',
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setEmpTab(t.id)}
                      type="button"
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all
                        ${
                          empTab === t.id
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {t.label}
                      {t.count > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-black text-white ${t.badge}`}
                        >
                          {t.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employees…"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {adminError && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                <ExclamationCircleIcon className="h-5 w-5 text-rose-500 flex-shrink-0" />
                <p className="text-sm text-rose-700">{adminError}</p>
                <button
                  onClick={() => setAdminError('')}
                  className="ml-auto"
                >
                  <XMarkIcon className="h-4 w-4 text-rose-400" />
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <UsersIcon className="h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-400">
                    No employees found
                  </p>
                  <p className="text-xs text-slate-400">
                    {empSearch
                      ? 'Try a different search term.'
                      : `No ${empTab} employees.`}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <li
                      key={emp.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black
                        ${
                          empTab === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : empTab === 'active'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {(emp.name || emp.username || '?')
                          .toUpperCase()
                          .slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800">
                            {emp.name || emp.username}
                          </p>
                          {emp.department && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {emp.department}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-500">
                            {emp.email}
                          </span>
                          {emp.createdAt && (
                            <span className="text-[10px] text-slate-400">
                              Joined {formatDate(emp.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {empTab === 'pending' && (
                          <>
                            <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              Pending
                            </span>
                            <button
                              onClick={() => handleReject(emp.id)}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 active:scale-95 transition-all"
                              type="button"
                            >
                              <NoSymbolIcon className="h-3.5 w-3.5" />
                              Decline
                            </button>
                            <button
                              onClick={() => handleApprove(emp.id)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                              type="button"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          </>
                        )}
                        {empTab === 'active' && (
                          <>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Active
                            </span>
                            <button
                              onClick={() => handleDeactivate(emp.id)}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 active:scale-95 transition-all"
                              type="button"
                            >
                              <NoSymbolIcon className="h-3.5 w-3.5" />
                              Deactivate
                            </button>
                          </>
                        )}
                        {empTab === 'inactive' && (
                          <>
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                              Deactivated
                            </span>
                            <button
                              onClick={() => handleReactivate(emp.id)}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-all"
                              type="button"
                            >
                              <ArrowPathIcon className="h-3.5 w-3.5" />
                              Reactivate
                            </button>
                          </>
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
        {/* ── AUDIT LOG TAB ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <ListBulletIcon className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Audit Log
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    All admin actions in this session
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {auditLog.length} entries
                </span>
                {auditLog.length > 0 && (
                  <button
                    onClick={() =>
                      exportToCSV(
                        auditLog.map((e) => ({
                          action: e.action,
                          detail: e.detail,
                          admin: e.admin,
                          time: e.time,
                        })),
                        'audit-log',
                      )
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Export
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-5">
              {auditLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center">
                  <InformationCircleIcon className="h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-400">
                    No actions yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Admin actions will appear here as you use the dashboard.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                  <ul className="space-y-1 pl-10">
                    {auditLog.map((entry) => (
                      <li key={entry.id} className="relative">
                        <div className="absolute -left-[26px] top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-white transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {entry.action}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {entry.detail}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] font-semibold text-indigo-600">
                                {entry.admin}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {timeAgo(entry.time)}
                              </p>
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
      <ShareModal
        file={shareFile}
        open={!!shareFile}
        onClose={() => setShareFile(null)}
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

      {/* ── TOASTS ── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default AdminDashboard;