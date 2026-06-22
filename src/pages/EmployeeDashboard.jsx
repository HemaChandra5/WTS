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
import {
  BellIcon as BellSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CloudArrowUpIcon as CloudArrowUpIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  XCircleIcon as XCircleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ArrowUpTrayIcon as ArrowUpTrayIconSolid,
} from '@heroicons/react/24/solid';

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

/* ─── DESIGN TOKENS ──────────────────────────────────────────────────── */
// Typography: IBM Plex Sans (display) + Inter (body) — enterprise SaaS pairing
// Palette: luxury warm white #FAFAF8 bg, deep ink #12161C text, deep teal brand
// Stat cards: full-bleed signature gradients (the one bold move on the page)
// Buttons: rounded-md, solid brand fill for primary, hairline outline for secondary
// Tabs: quiet pill group, single muted accent for the active state

const CARD_THEMES = {
  indigo: {
    cardBg:     '#FFFFFF',
    border:     '#E3E7E5',
    accent:     '#16332E',
    accentSoft: '#5C8A80',
    iconBg:     '#16332E',
    iconColor:  '#fff',
    valuColor:  '#12161C',
    labelColor: '#16332E',
    subColor:   '#6B7670',
    glow:       'rgba(22,51,46,0.10)',
  },
  sky: {
    cardBg:     '#FFFFFF',
    border:     '#E1E6EB',
    accent:     '#2B5C8A',
    accentSoft: '#7FA8C9',
    iconBg:     '#2B5C8A',
    iconColor:  '#fff',
    valuColor:  '#12161C',
    labelColor: '#2B5C8A',
    subColor:   '#6B7A87',
    glow:       'rgba(43,92,138,0.10)',
  },
  emerald: {
    cardBg:     '#FFFFFF',
    border:     '#DEE7E1',
    accent:     '#1E7A57',
    accentSoft: '#6FB89A',
    iconBg:     '#1E7A57',
    iconColor:  '#fff',
    valuColor:  '#12161C',
    labelColor: '#1E7A57',
    subColor:   '#6B8275',
    glow:       'rgba(30,122,87,0.10)',
  },
  rose: {
    cardBg:     '#FFFFFF',
    border:     '#EAE0DE',
    accent:     '#A3342B',
    accentSoft: '#C98D85',
    iconBg:     '#A3342B',
    iconColor:  '#fff',
    valuColor:  '#12161C',
    labelColor: '#A3342B',
    subColor:   '#8A726F',
    glow:       'rgba(163,52,43,0.10)',
  },
  violet: {
    cardBg:     '#FFFFFF',
    border:     '#E5E6EA',
    accent:     '#3E4654',
    accentSoft: '#7C8594',
    iconBg:     '#3E4654',
    iconColor:  '#fff',
    valuColor:  '#12161C',
    labelColor: '#3E4654',
    subColor:   '#777E8A',
    glow:       'rgba(62,70,84,0.10)',
  },
  fuchsia: {
    cardBg:     '#FFFFFF',
    border:     '#E8E0E2',
    accent:     '#8A5A22',
    accentSoft: '#C9A86A',
    iconBg:     '#8A5A22',
    iconColor:  '#fff',
    valuColor:  '#12161C',
    labelColor: '#8A5A22',
    subColor:   '#8C7A60',
    glow:       'rgba(138,90,34,0.10)',
  },
};

/* ─── Toast ───────────────────────────────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
  <div style={{ position:'fixed', bottom:32, right:32, zIndex:100, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        pointerEvents:'auto', display:'flex', alignItems:'center', gap:14,
        borderRadius:10, padding:'14px 20px', fontSize:13.5, fontWeight:500,
        background:'#fff',
        border:`1px solid ${t.type==='success'?'#BFE2CD':t.type==='error'?'#E8C2BD':'#D7DDDA'}`,
        boxShadow: `0 10px 28px rgba(18,22,28,0.08), 0 2px 6px rgba(18,22,28,0.05)`,
        color: t.type==='success'?'#155C40':t.type==='error'?'#8A241D':'#12161C',
        animation:'toastSlide 0.32s cubic-bezier(.16,1,.3,1)',
        minWidth:280, maxWidth:380, fontFamily:'Inter, sans-serif',
        borderLeft: `3px solid ${t.type==='success'?'#1E7A57':t.type==='error'?'#A3342B':'#16332E'}`,
      }}>
        <span style={{
          width:7, height:7, borderRadius:'50%', flexShrink:0,
          background: t.type==='success'?'#1E7A57':t.type==='error'?'#A3342B':'#16332E',
        }} />
        <span style={{ flex:1, lineHeight:1.5, letterSpacing:'-0.005em' }}>{t.message}</span>
        <button onClick={() => removeToast(t.id)} style={{ background:'none', border:'none', cursor:'pointer', opacity:0.35, padding:2, display:'flex', color:'inherit', transition:'opacity 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.35}>
          <XMarkIcon style={{ width:15, height:15 }} />
        </button>
      </div>
    ))}
  </div>
);

/* ─── Stat Card ────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, trend, color, onClick }) => {
  const [hov, setHov] = useState(false);
  const th = CARD_THEMES[color] || CARD_THEMES.indigo;
  return (
    <button onClick={onClick} type="button"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position:'relative', width:'100%', textAlign:'left', cursor:'pointer',
        borderRadius:12, padding:'22px 22px 20px',
        background: th.cardBg,
        border:`1px solid ${hov ? th.accent + '40' : th.border}`,
        boxShadow: hov
          ? `0 10px 24px ${th.glow}, 0 1px 2px rgba(18,22,28,0.04)`
          : `0 1px 2px rgba(18,22,28,0.04)`,
        transform: hov ? 'translateY(-2px)' : 'none',
        transition:'all 0.2s cubic-bezier(.2,.8,.2,1)',
        overflow:'hidden',
        fontFamily:'Inter, sans-serif',
      }}>

      {/* Top accent rule */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:3,
        background: th.accent,
        opacity: hov ? 1 : 0.75,
        transition:'opacity 0.2s',
      }} />

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{
          width:40, height:40, borderRadius:9,
          background: th.iconBg,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon style={{ width:18, height:18, color: th.iconColor }} />
        </div>
        {trend !== undefined && (
          <span style={{
            display:'flex', alignItems:'center', gap:3, borderRadius:6,
            padding:'4px 9px', fontSize:11, fontWeight:600,
            background: trend >= 0 ? 'rgba(30,122,87,0.08)' : 'rgba(163,52,43,0.08)',
            color: trend >= 0 ? '#1E7A57' : '#A3342B',
            border:`1px solid ${trend >= 0 ? '#BFE2CD' : '#E8C2BD'}`,
          }}>
            {trend >= 0 ? <ArrowUpIcon style={{ width:9, height:9 }} /> : <ArrowDownIcon style={{ width:9, height:9 }} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div>
        <p style={{ fontSize:30, fontWeight:700, color: th.valuColor, letterSpacing:'-0.03em', lineHeight:1, margin:'0 0 6px', fontFamily:'IBM Plex Sans, sans-serif', fontVariantNumeric:'tabular-nums' }}>{value}</p>
        <p style={{ fontSize:11, fontWeight:600, color: th.labelColor, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 3px' }}>{label}</p>
        {sub && <p style={{ fontSize:12, color: th.subColor, fontWeight:500, margin:0 }}>{sub}</p>}
      </div>
    </button>
  );
};

/* ─── Notification Panel ─────────────────────────────────────────────── */
export const EmployeeNotificationPanel = ({ notifications, onClear, onClearAll, notifRef, show, setShow }) => {
  if (!show) return null;
  return (
    <div ref={notifRef} style={{
      position:'absolute', right:0, top:52, zIndex:50, width:360,
      background:'#fff', border:'1px solid #E6E4DE', borderRadius:12, overflow:'hidden',
      boxShadow:'0 20px 48px rgba(18,22,28,0.10), 0 4px 12px rgba(18,22,28,0.05)',
      fontFamily:'Inter, sans-serif',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F1F0EC', padding:'16px 20px', background:'#FAFAF8' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#16332E' }} />
          <p style={{ fontSize:13.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.01em' }}>Notifications</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={onClearAll} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, color:'#16332E', fontFamily:'inherit' }}>Clear all</button>
        )}
      </div>
      <div style={{ maxHeight:360, overflowY:'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding:'52px 0', textAlign:'center' }}>
            <BellIcon style={{ width:32, height:32, color:'#D6D3CB', margin:'0 auto' }} />
            <p style={{ marginTop:10, fontSize:13, color:'#94989F', fontWeight:500 }}>You're all caught up</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={{ display:'flex', alignItems:'flex-start', gap:14, borderBottom:'1px solid #F1F0EC', padding:'14px 20px', cursor:'default', transition:'background 0.12s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#FAFAF8'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{ marginTop:6, height:7, width:7, flexShrink:0, borderRadius:'50%',
                background: n.type==='task'?'#B5790F':n.type==='approval'?'#1E7A57':n.type==='rejection'?'#A3342B':'#16332E',
              }} />
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#12161C', margin:0, letterSpacing:'-0.005em' }}>{n.title}</p>
                <p style={{ fontSize:12, color:'#5B6472', margin:'2px 0 0', lineHeight:1.5 }}>{n.message}</p>
                <p style={{ fontSize:11, color:'#94989F', margin:'4px 0 0' }}>{timeAgo(n.time)}</p>
              </div>
              <button onClick={() => onClear(n.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#D6D3CB', marginTop:2, padding:4, transition:'color 0.15s', borderRadius:6 }}
                onMouseEnter={e=>e.currentTarget.style.color='#5B6472'} onMouseLeave={e=>e.currentTarget.style.color='#D6D3CB'}>
                <XMarkIcon style={{ width:14, height:14 }} />
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
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:12, padding:'18px 24px', borderTop:'1px solid #F1F0EC' }}>
      <span style={{ fontSize:12.5, color:'#5B6472', fontWeight:500 }}>
        Page <strong style={{ color:'#12161C', fontWeight:700 }}>{current}</strong> of {total}
      </span>
      <div style={{ display:'flex', gap:6 }}>
        {current > 1 && (
          <button onClick={() => onChange(current - 1)} style={{ width:34, height:34, borderRadius:8, border:'1px solid #E6E4DE', background:'#fff', color:'#5B6472', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', fontFamily:'Inter, sans-serif' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='#16332E'; e.currentTarget.style.color='#16332E'; e.currentTarget.style.background='#EEF2F0'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E6E4DE'; e.currentTarget.style.color='#5B6472'; e.currentTarget.style.background='#fff'; }}>
            <ChevronLeftIcon style={{ width:15, height:15 }} />
          </button>
        )}
        {current < total && (
          <button onClick={() => onChange(current + 1)} style={{ width:34, height:34, borderRadius:8, border:'1px solid #E6E4DE', background:'#fff', color:'#5B6472', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', fontFamily:'Inter, sans-serif' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='#16332E'; e.currentTarget.style.color='#16332E'; e.currentTarget.style.background='#EEF2F0'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E6E4DE'; e.currentTarget.style.color='#5B6472'; e.currentTarget.style.background='#fff'; }}>
            <ChevronRightIcon style={{ width:15, height:15 }} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Mini Bar Chart ──────────────────────────────────────────────────── */
const MiniBarChart = ({ data, color = '#16332E' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:56 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }} title={`${d.label}: ${d.value}`}>
          <div style={{
            width:'100%', borderRadius:'3px 3px 2px 2px',
            height: `${(d.value/max)*100}%`, minHeight: d.value>0 ? 4 : 0,
            background: color,
            opacity: 0.88,
            transition:'height 0.5s cubic-bezier(.2,.8,.2,1)',
          }} />
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
    <li style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'12px 0', borderBottom:'1px solid #F1F0EC' }}>
      <div style={{ width:36, height:36, borderRadius:9, background:'#F4F3EF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #E6E4DE' }}>
        <Icon className={`h-4 w-4 ${cfg.color}`} style={{ width:16, height:16 }} />
      </div>
      <div style={{ minWidth:0, flex:1 }}>
        <p style={{ fontSize:13.5, fontWeight:600, color:'#12161C', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.005em' }}>{file.originalName}</p>
        <p style={{ fontSize:12, color:'#94989F', margin:'2px 0 0' }}>{file.description || 'No description'}</p>
        {file.adminNote && (
          <p style={{ fontSize:11.5, color:'#16332E', margin:'3px 0 0', fontStyle:'italic' }}>Admin: "{file.adminNote}"</p>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
        <StatusBadge status={file.status} size="sm" />
        <span style={{ fontSize:11, color:'#94989F' }}>{formatTime(file.createdAt)}</span>
      </div>
    </li>
  );
};

/* ─── Task Row ────────────────────────────────────────────────────────── */
const TaskRow = ({ task, onStatusChange }) => {
  const cfg         = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.pending;
  const priorityCfg = PRIORITY_CONFIG[task.priority]  || PRIORITY_CONFIG.medium;
  const Icon        = cfg.icon;
  const isOverdue   = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <li style={{
      display:'flex', alignItems:'flex-start', gap:16,
      borderRadius:11, padding:'16px 18px',
      border:`1px solid ${isOverdue ? '#E8C2BD' : '#E9E7E1'}`,
      background: isOverdue ? '#FBF2F0' : '#fff',
      transition:'all 0.15s cubic-bezier(.2,.8,.2,1)',
      boxShadow:'0 1px 2px rgba(18,22,28,0.03)',
      fontFamily:'Inter, sans-serif',
    }}
    onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 14px rgba(18,22,28,0.06)'; e.currentTarget.style.transform='translateY(-1px)'; }}
    onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 1px 2px rgba(18,22,28,0.03)'; e.currentTarget.style.transform='none'; }}>
      <div style={{ width:36, height:36, borderRadius:9, background: isOverdue?'#F5DEDA':'#F4F3EF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #E9E7E1', marginTop:2 }}>
        <Icon style={{ width:16, height:16 }} className={cfg.color} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <p style={{ fontSize:14, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.01em' }}>{task.title}</p>
          {isOverdue && (
            <span style={{ fontSize:10.5, fontWeight:700, color:'#8A241D', background:'#F5DEDA', border:'1px solid #E8C2BD', borderRadius:6, padding:'2px 9px', letterSpacing:'0.03em' }}>OVERDUE</span>
          )}
        </div>
        {task.description && (
          <p style={{ fontSize:12.5, color:'#5B6472', margin:'4px 0 0', lineHeight:1.55, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{task.description}</p>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:8, flexWrap:'wrap' }}>
          {task.dueDate && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:isOverdue?'#8A241D':'#5B6472', fontWeight: isOverdue?600:400 }}>
              <CalendarDaysIcon style={{ width:13, height:13 }} />
              Due {formatDate(task.dueDate)}
            </span>
          )}
          <span style={{ fontSize:11.5, color:'#94989F' }}>Assigned by admin · {timeAgo(task.createdAt)}</span>
        </div>
        {task.adminFile && (
          <a href={typeof task.adminFile === 'string' ? task.adminFile : URL.createObjectURL(task.adminFile)} target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:8, fontSize:12, fontWeight:600, color:'#16332E', textDecoration:'none' }}>
            <DocumentTextIcon style={{ width:13, height:13 }} />View attachment
          </a>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, flexShrink:0 }}>
        <span style={{
          display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
          borderRadius:6, padding:'4px 10px',
          background: task.priority==='high'?'#F5DEDA':task.priority==='low'?'#F4F3EF':'#FBF1DE',
          color: task.priority==='high'?'#8A241D':task.priority==='low'?'#5B6472':'#8A5B0E',
          border:`1px solid ${task.priority==='high'?'#E8C2BD':task.priority==='low'?'#E6E4DE':'#EFD9A6'}`,
          letterSpacing:'0.02em',
        }}>
          <FlagIcon style={{ width:11, height:11 }} />
          {priorityCfg.label}
        </span>
        <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)}
          style={{ borderRadius:8, border:'1px solid #E6E4DE', padding:'6px 12px', fontSize:12, fontWeight:600, background:'#fff', color:'#12161C', cursor:'pointer', outline:'none', fontFamily:'Inter, sans-serif' }}>
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
  const cfg = TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const accentMap = {
    pending:     { bg:'#FBF7EE', border:'#EFD9A6', text:'#8A5B0E', accent:'#B5790F', iconBg:'rgba(181,121,15,0.10)' },
    in_progress: { bg:'#EEF3F8', border:'#C7D7EF', text:'#28548F', accent:'#2B5C8A', iconBg:'rgba(43,92,138,0.10)' },
    done:        { bg:'#EEF6F1', border:'#BFE2CD', text:'#14532D', accent:'#1E7A57', iconBg:'rgba(30,122,87,0.10)' },
  }[status] || { bg:'#FAFAF8', border:'#E6E4DE', text:'#5B6472', accent:'#94989F', iconBg:'rgba(18,22,28,0.05)' };

  return (
    <div style={{ borderRadius:12, border:`1px solid ${isOpen ? accentMap.accent + '50' : accentMap.border}`, overflow:'hidden', transition:'border-color 0.2s', boxShadow:'0 1px 2px rgba(18,22,28,0.03)' }}>
      <button onClick={onToggle} type="button"
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background: accentMap.bg, border:'none', cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:38, height:38, borderRadius:9, background: accentMap.iconBg, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${accentMap.border}` }}>
            <Icon className={cfg.color} style={{ width:18, height:18 }} />
          </div>
          <div style={{ textAlign:'left' }}>
            <p style={{ fontSize:14, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.01em' }}>{title}</p>
            <p style={{ fontSize:12, color:'#5B6472', margin:'1px 0 0' }}>{count} task{count!==1?'s':''}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ background: accentMap.accent, borderRadius:7, padding:'4px 14px', fontSize:13, fontWeight:700, color:'#fff' }}>{count}</span>
          {isOpen ? <ChevronUpIcon style={{ width:16, height:16, color:'#5B6472' }} /> : <ChevronDownIcon style={{ width:16, height:16, color:'#5B6472' }} />}
        </div>
      </button>
      {isOpen && (
        <div style={{ background:'#FAFAF8', padding:'18px 20px', borderTop:`1px solid ${accentMap.border}` }}>
          {tasks.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'36px 0', border:'1px dashed #E6E4DE', borderRadius:10, textAlign:'center' }}>
              <Icon style={{ width:32, height:32, color:'#D6D3CB' }} />
              <p style={{ marginTop:10, fontSize:13.5, fontWeight:600, color:'#94989F' }}>No {title.toLowerCase()} tasks</p>
            </div>
          ) : (
            <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
              {tasks.map(task => <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — all logic identical to original
   ════════════════════════════════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const { user }                        = useAuth();
  const { files, addFile, fetchFiles }  = useFiles();
  const { tasks, updateTaskStatus }     = useTasks();

  if (!user) {
    return (
      <div style={{ display:'flex', height:240, alignItems:'center', justifyContent:'center', fontSize:13.5, color:'#94989F', fontFamily:'Inter, sans-serif' }}>
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
  const [taskSectionsOpen,   setTaskSectionsOpen]   = useState({ pending:true, in_progress:true, done:false });

  /* ── Modals ── */
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile,   setShareFile]   = useState(null);

  useEffect(() => {
    console.log('Current User:', user);
    console.log('Files:', files);
    window.testUser  = user;
    window.testFiles = files;
  }, [user, files]);

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
    setActivityLog(p => [{ id:Date.now(), action, detail, time:new Date().toISOString() }, ...p].slice(0, 50));
  }, []);

  /* ── Notification helper ── */
  const pushNotif = useCallback((title, message, type = 'info') => {
    setNotifications(p => [{ id:Date.now(), title, message, type, time:new Date().toISOString() }, ...p].slice(0, 20));
  }, []);

  useEffect(() => {
    window.__empNotifications  = notifications;
    window.__empPushNotif      = pushNotif;
    window.__empClearNotif     = (id) => setNotifications(p => p.filter(n => n.id !== id));
    window.__empClearAllNotifs = () => setNotifications([]);
    window.dispatchEvent(new CustomEvent('emp-notif-update', { detail:{ count:notifications.length } }));
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
        setTaskList(prev => prev.map(t => t.id === data.taskId ? { ...t, status:data.status } : t));
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
      await api.post('/files/', formData, { headers:{ 'Content-Type':'multipart/form-data' } });
      logActivity('File Uploaded', file.name || 'Unknown file');
      addToast('File uploaded successfully', 'success');
      await fetchFiles();
    } catch (error) {
      console.error(error);
      addToast('File upload failed', 'error');
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
    setTaskSectionsOpen(prev => ({ ...prev, [status]:!prev[status] }));

  /* ── Derived data ── */
  const userFiles = useMemo(
    () => (files || []).filter((f) => {
      const fileUserId    = f.userId ?? f.user?.id ?? f.user?.userId;
      const fileUserEmail = f.userEmail ?? f.user?.email;
      const idMatches     = fileUserId != null && String(fileUserId) === String(user.id);
      const emailMatches  = typeof fileUserEmail === 'string' && typeof user.email === 'string' && fileUserEmail.toLowerCase() === user.email.toLowerCase();
      return idMatches || emailMatches;
    }),
    [files, user.id, user.email],
  );
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
    const pendingTasks   = myTasks.filter(t => t.status === 'pending').length;
    const doneTasks      = myTasks.filter(t => t.status === 'done').length;
    const overdueTasks   = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    return { totalFiles:userFiles.length, totalSize, todayCount, monthCount, approvedCount, rejectedCount, pendingCount, reviewingCount, pendingTasks, doneTasks, overdueTasks };
  }, [userFiles, myTasks]);

  const weeklyTrend = useMemo(() => {
    const days = Array.from({ length:7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { label:d.toLocaleDateString('en', { weekday:'short' }), value:0, date:d };
    });
    userFiles.forEach(f => {
      if (!f.createdAt) return;
      const fd  = new Date(f.createdAt);
      const idx = days.findIndex(d => isSameDay(fd, d.date));
      if (idx !== -1) days[idx].value++;
    });
    return days;
  }, [userFiles]);

  const todayFiles    = useMemo(() => userFiles.filter(f => isSameDay(f.createdAt)).slice(0, 8), [userFiles]);
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
    if (q) list = list.filter(f => (f.originalName||'').toLowerCase().includes(q) || (f.description||'').toLowerCase().includes(q));
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name')   return (a.originalName||'').localeCompare(b.originalName||'');
      if (sortBy === 'size')   return (b.size||0) - (a.size||0);
      return 0;
    });
    return list;
  }, [userFiles, range, selectedDate, typeFilter, statusFilter, sortBy, search]);

  const paginatedFiles  = useMemo(() => { const s = (filePage-1)*ITEMS_PER_PAGE; return filteredFiles.slice(s, s+ITEMS_PER_PAGE); }, [filteredFiles, filePage]);
  const totalFilePages  = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

  const filteredTasks = useMemo(() => {
    let list = [...myTasks];
    if (taskStatusFilter   !== 'all') list = list.filter(t => t.status   === taskStatusFilter);
    if (taskPriorityFilter !== 'all') list = list.filter(t => t.priority === taskPriorityFilter);
    const q = taskSearch.trim().toLowerCase();
    if (q) list = list.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    return list;
  }, [myTasks, taskStatusFilter, taskPriorityFilter, taskSearch]);

  const paginatedTasks = useMemo(() => { const s = (taskPage-1)*ITEMS_PER_PAGE; return filteredTasks.slice(s, s+ITEMS_PER_PAGE); }, [filteredTasks, taskPage]);
  const totalTaskPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

  /* ── Export ── */
  const handleExportFiles = () => {
    exportToCSV(filteredFiles.map(f => ({ name:f.originalName||'', status:f.status||'', size:formatBytes(f.size), description:f.description||'', uploaded:formatDate(f.createdAt) })), 'my-files-export');
    addToast('Files exported to CSV', 'success');
    logActivity('Export', `${filteredFiles.length} files`);
  };
  const handleExportTasks = () => {
    exportToCSV(myTasks.map(t => ({ title:t.title||'', status:t.status||'', priority:t.priority||'', dueDate:formatDate(t.dueDate), description:t.description||'' })), 'my-tasks-export');
    addToast('Tasks exported to CSV', 'success');
  };

  /* ── Greeting ── */
  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  /* ── Tabs ── */
  const tabs = [
    { id:'overview', label:'Overview',  icon:ChartBarIcon    },
    { id:'upload',   label:'Upload',    icon:CloudArrowUpIcon },
    { id:'files',    label:'My Files',  icon:DocumentTextIcon },
    { id:'tasks',    label:'My Tasks',  icon:CheckCircleIcon,  badge:stats.pendingTasks||null, badgeColor:stats.overdueTasks>0?'#A3342B':'#B5790F' },
    { id:'activity', label:'Activity',  icon:ListBulletIcon   },
  ];

  /* ── Shared input styles ── */
  const inputSx = {
    borderRadius:8, border:'1px solid #E6E4DE', background:'#fff',
    padding:'9px 14px', fontSize:13, fontWeight:500, color:'#12161C',
    outline:'none', fontFamily:'Inter, sans-serif',
    transition:'border-color 0.15s, box-shadow 0.15s',
  };

  const focusInput  = (e) => { e.currentTarget.style.borderColor='#16332E'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(22,51,46,0.10)'; };
  const blurInput   = (e) => { e.currentTarget.style.borderColor='#E6E4DE'; e.currentTarget.style.boxShadow='none'; };

  /* ── Shared panel style ── */
  const panelSx = {
    background:'#fff', borderRadius:14, border:'1px solid #EAE8E2',
    boxShadow:'0 1px 3px rgba(18,22,28,0.04)', overflow:'hidden',
  };

  /* ── Action button style ── */
  const actionBtnSx = {
    display:'inline-flex', alignItems:'center', gap:7, borderRadius:8,
    border:'1px solid #E6E4DE', background:'#fff', padding:'8px 16px',
    fontSize:13, fontWeight:600, color:'#3F4450', cursor:'pointer',
    fontFamily:'Inter, sans-serif', transition:'all 0.15s',
  };

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div style={{ fontFamily:'"Inter",-apple-system,BlinkMacSystemFont,sans-serif', minHeight:'100vh', background:'#FAFAF8', position:'relative', isolation:'isolate' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        @keyframes toastSlide {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }

        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#D6D3CB; border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#B5B1A7; }

        ::placeholder { color:#94989F; }

        .emp-tab { transition:all 0.18s cubic-bezier(.2,.8,.2,1); }
        .emp-tab:hover { background:rgba(22,51,46,0.06) !important; color:#16332E !important; }

        .emp-qa-card { transition:all 0.2s cubic-bezier(.2,.8,.2,1); }
        .emp-qa-card:hover { transform:translateY(-3px) !important; box-shadow:0 12px 28px rgba(18,22,28,0.08) !important; border-color:#BFD3CC !important; }

        .emp-file-row { transition:background 0.12s; }
        .emp-file-row:hover { background:#F4F3EF !important; }

        .emp-panel-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:20px 24px; border-bottom:1px solid #F1F0EC;
        }

        .emp-view-btn-active {
          background:#16332E !important;
          color:#fff !important;
        }

        .emp-clear-btn:hover { background:#FBEEEC !important; border-color:#E8C2BD !important; color:#A3342B !important; }

        input[type="date"]::-webkit-calendar-picker-indicator { opacity:0.5; cursor:pointer; }
      `}</style>

      {/* ── Ambient backdrop ── */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-18%', right:'-10%', width:620, height:620, borderRadius:'50%', background:'radial-gradient(circle, rgba(22,51,46,0.035) 0%, transparent 65%)' }} />
        <div style={{ position:'absolute', bottom:'-15%', left:'10%', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(138,90,34,0.025) 0%, transparent 65%)' }} />
      </div>

      <main style={{ position:'relative', zIndex:1, maxWidth:1480, margin:'0 auto', padding:'36px 40px 80px', display:'flex', flexDirection:'column', gap:28 }}>

        {/* ══ PAGE HEADER ══ */}
        <div>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
            <div>
              <p style={{ fontSize:11.5, fontWeight:700, color:'#94989F', textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 8px' }}>
                WORKSPACE
              </p>
              <h1 style={{ fontSize:32, fontWeight:700, color:'#12161C', letterSpacing:'-0.03em', lineHeight:1.15, margin:'0 0 8px', fontFamily:'IBM Plex Sans, sans-serif' }}>
                {greeting}, <span style={{ color:'#16332E' }}>{user?.name}</span>
              </h1>
              <p style={{ fontSize:13, color:'#94989F', fontWeight:500, margin:0, display:'flex', alignItems:'center', gap:6 }}>
                <CalendarDaysIcon style={{ width:14, height:14 }} />
                {formatLongDate(now)}
              </p>
            </div>
          </div>

          {/* Banners row */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:16 }}>
            {rejectedFiles.length > 0 && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'10px 18px', borderRadius:9, background:'#FBF2F0', border:'1px solid #E8C2BD' }}>
                <XCircleIcon style={{ width:16, height:16, color:'#A3342B', flexShrink:0 }} />
                <p style={{ fontSize:13.5, fontWeight:500, color:'#8A241D', margin:0 }}>
                  {rejectedFiles.length} file{rejectedFiles.length>1?'s were':' was'} rejected —{' '}
                  <button onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }} type="button"
                    style={{ background:'none', border:'none', cursor:'pointer', fontWeight:700, color:'#A3342B', textDecoration:'underline', padding:0, fontSize:'inherit', fontFamily:'inherit' }}>
                    view in My Files
                  </button>
                </p>
              </div>
            )}
            {stats.overdueTasks > 0 && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'10px 18px', borderRadius:9, background:'#FBF7EE', border:'1px solid #EFD9A6' }}>
                <ExclamationCircleIcon style={{ width:16, height:16, color:'#B5790F', flexShrink:0 }} />
                <p style={{ fontSize:13.5, fontWeight:500, color:'#8A5B0E', margin:0 }}>
                  {stats.overdueTasks} overdue task{stats.overdueTasks>1?'s':''} —{' '}
                  <button onClick={() => setActiveTab('tasks')} type="button"
                    style={{ background:'none', border:'none', cursor:'pointer', fontWeight:700, color:'#8A5B0E', textDecoration:'underline', padding:0, fontSize:'inherit', fontFamily:'inherit' }}>
                    view My Tasks
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ══ STAT CARDS ══ */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16 }}>
          <StatCard icon={DocumentTextIcon} label="Total Files"  value={stats.totalFiles}             sub={`${stats.todayCount} uploaded today`}  color="indigo"  onClick={() => setActiveTab('files')} />
          <StatCard icon={CloudArrowUpIcon} label="This Month"   value={stats.monthCount}             sub="files uploaded"                         color="sky"     onClick={() => { setActiveTab('files'); setRange('30d'); }} />
          <StatCard icon={ShieldCheckIcon}  label="Approved"     value={stats.approvedCount}          sub={`${stats.pendingCount} still pending`}  color="emerald" onClick={() => { setActiveTab('files'); setStatusFilter('approved'); }} />
          <StatCard icon={XCircleIcon}      label="Rejected"     value={stats.rejectedCount}          sub={`${stats.reviewingCount} reviewing`}    color="rose"    onClick={() => { setActiveTab('files'); setStatusFilter('rejected'); }} />
          <StatCard icon={CheckCircleIcon}  label="My Tasks"     value={myTasks.length}               sub={`${stats.pendingTasks} open`}           color="violet"  onClick={() => setActiveTab('tasks')} />
          <StatCard icon={ArrowUpTrayIcon}  label="Storage Used" value={formatBytes(stats.totalSize)} sub="total uploaded"                         color="fuchsia" onClick={() => setActiveTab('files')} />
        </div>

        {/* ══ TAB BAR — quiet pill group ══ */}
        <div style={{ display:'flex', alignItems:'center', gap:0, background:'#F1F0EC', borderRadius:11, padding:4, alignSelf:'flex-start', border:'1px solid #E9E7E1' }}>
          {tabs.map((tab) => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} type="button" className="emp-tab"
                style={{
                  display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
                  fontSize:13.5, fontWeight: active ? 700 : 500,
                  border:'none', borderRadius:8,
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#16332E' : '#5B6472',
                  cursor:'pointer', fontFamily:'Inter, sans-serif',
                  boxShadow: active ? '0 1px 3px rgba(18,22,28,0.08)' : 'none',
                  transition:'all 0.18s cubic-bezier(.2,.8,.2,1)',
                  whiteSpace:'nowrap',
                }}>
                <Icon style={{ width:16, height:16 }} />
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{
                    borderRadius:99, padding:'2px 8px', fontSize:10.5, fontWeight:700,
                    color:'#fff', background: tab.badgeColor || '#16332E',
                  }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18, animation:'fadeUp 0.28s ease-out' }}>

            {/* Recent Uploads — 2 cols */}
            <div style={{ ...panelSx, gridColumn:'span 2', padding:0 }}>
              <div className="emp-panel-header">
                <div>
                  <p style={{ fontSize:15.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.02em', fontFamily:'IBM Plex Sans, sans-serif' }}>Recent Uploads</p>
                  <p style={{ fontSize:12, color:'#94989F', margin:'3px 0 0' }}>Your latest file activity</p>
                </div>
                <button onClick={() => setActiveTab('files')} type="button"
                  style={{ background:'#EEF2F0', border:'1px solid #BFD3CC', cursor:'pointer', fontSize:12.5, fontWeight:700, color:'#16332E', display:'flex', alignItems:'center', gap:5, fontFamily:'Inter, sans-serif', borderRadius:8, padding:'7px 14px', transition:'all 0.15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='#16332E'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='#EEF2F0'; e.currentTarget.style.color='#16332E'; }}>
                  View all <ChevronRightIcon style={{ width:14, height:14 }} />
                </button>
              </div>
              <div style={{ padding:'8px 24px 16px' }}>
                {userFiles.slice(0, 7).length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px dashed #E9E7E1', borderRadius:12, padding:'52px 24px', textAlign:'center', margin:'8px 0' }}>
                    <CloudArrowUpIcon style={{ width:40, height:40, color:'#D6D3CB' }} />
                    <p style={{ marginTop:14, fontSize:14.5, fontWeight:700, color:'#94989F', letterSpacing:'-0.01em' }}>No files uploaded yet</p>
                    <button onClick={() => setActiveTab('upload')} type="button"
                      style={{ marginTop:8, background:'none', border:'none', cursor:'pointer', fontSize:13.5, fontWeight:600, color:'#16332E', fontFamily:'Inter, sans-serif' }}>
                      Upload your first file →
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {userFiles.slice(0, 7).map(f => (
                      <div key={f.id} className="emp-file-row" style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 10px', borderRadius:9 }}>
                        <div style={{ width:38, height:38, borderRadius:9, background:'#EEF2F0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #BFD3CC' }}>
                          <DocumentTextIcon style={{ width:17, height:17, color:'#16332E' }} />
                        </div>
                        <div style={{ minWidth:0, flex:1 }}>
                          <p style={{ fontSize:13.5, fontWeight:600, color:'#12161C', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.originalName}</p>
                          <p style={{ fontSize:11.5, color:'#94989F', margin:'2px 0 0' }}>{formatBytes(f.size)} · {timeAgo(f.createdAt)}</p>
                        </div>
                        <StatusBadge status={f.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right col */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Upload Trend */}
              <div style={{ ...panelSx, padding:0 }}>
                <div className="emp-panel-header" style={{ paddingBottom:16 }}>
                  <div>
                    <p style={{ fontSize:14.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.01em', fontFamily:'IBM Plex Sans, sans-serif' }}>Upload Trend</p>
                    <p style={{ fontSize:11.5, color:'#94989F', margin:'2px 0 0' }}>Last 7 days</p>
                  </div>
                  <div style={{ width:34, height:34, borderRadius:9, background:'#EEF2F0', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #BFD3CC' }}>
                    <ChartBarIcon style={{ width:16, height:16, color:'#16332E' }} />
                  </div>
                </div>
                <div style={{ padding:'4px 24px 20px' }}>
                  <MiniBarChart data={weeklyTrend} color="#16332E" />
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
                    {weeklyTrend.map(d => <span key={d.label} style={{ fontSize:10.5, color:'#94989F', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{d.label}</span>)}
                  </div>
                </div>
              </div>

              {/* File Status */}
              <div style={{ ...panelSx, padding:0, flex:1 }}>
                <div className="emp-panel-header" style={{ paddingBottom:16 }}>
                  <div>
                    <p style={{ fontSize:14.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.01em', fontFamily:'IBM Plex Sans, sans-serif' }}>File Status</p>
                    <p style={{ fontSize:11.5, color:'#94989F', margin:'2px 0 0' }}>Your breakdown</p>
                  </div>
                  <FunnelIcon style={{ width:16, height:16, color:'#D6D3CB' }} />
                </div>
                <div style={{ padding:'4px 24px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { label:'Pending',   value:stats.pendingCount,   color:'#B5790F', track:'#EFD9A6' },
                    { label:'Reviewing', value:stats.reviewingCount, color:'#2B5C8A', track:'#C7D7EF' },
                    { label:'Approved',  value:stats.approvedCount,  color:'#1E7A57', track:'#BFE2CD' },
                    { label:'Rejected',  value:stats.rejectedCount,  color:'#A3342B', track:'#E8C2BD' },
                  ].map(s => (
                    <div key={s.label} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:12, color:'#5B6472', width:68, flexShrink:0, fontWeight:600 }}>{s.label}</span>
                      <div style={{ flex:1, height:6, borderRadius:99, background:'#F1F0EC', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:99, width:`${stats.totalFiles?(s.value/stats.totalFiles)*100:0}%`, background:s.color, transition:'width 0.6s cubic-bezier(.2,.8,.2,1)' }} />
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:'#12161C', width:20, textAlign:'right', flexShrink:0 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions — full width */}
            <div style={{ ...panelSx, gridColumn:'span 3', padding:24 }}>
              <p style={{ fontSize:15.5, fontWeight:700, color:'#12161C', margin:'0 0 18px', letterSpacing:'-0.02em', fontFamily:'IBM Plex Sans, sans-serif' }}>Quick Actions</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { label:'Upload a file',  icon:CloudArrowUpIcon, onClick:() => setActiveTab('upload'),   accentColor:'#16332E', accentBg:'#EEF2F0', accentBorder:'#BFD3CC' },
                  { label:'View my tasks',  icon:CheckCircleIcon,  onClick:() => setActiveTab('tasks'),    accentColor:'#B5790F', accentBg:'#FBF7EE', accentBorder:'#EFD9A6' },
                  { label:'Browse files',   icon:DocumentTextIcon, onClick:() => setActiveTab('files'),    accentColor:'#1E7A57', accentBg:'#EEF6F1', accentBorder:'#BFE2CD' },
                  { label:'Activity log',   icon:ListBulletIcon,   onClick:() => setActiveTab('activity'), accentColor:'#3E4654', accentBg:'#F1F2F4', accentBorder:'#D7DAE0' },
                ].map(a => (
                  <button key={a.label} onClick={a.onClick} type="button" className="emp-qa-card"
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, borderRadius:12, padding:'22px 14px', border:`1px solid ${a.accentBorder}`, background: a.accentBg, cursor:'pointer', fontFamily:'Inter, sans-serif', fontSize:13.5, fontWeight:600, color:'#12161C', boxShadow:'0 1px 2px rgba(18,22,28,0.04)' }}>
                    <div style={{ width:46, height:46, borderRadius:11, background: a.accentColor, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <a.icon style={{ width:22, height:22, color:'#fff' }} />
                    </div>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Summary — full width */}
            <div style={{ ...panelSx, gridColumn:'span 3', padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <p style={{ fontSize:15.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.02em', fontFamily:'IBM Plex Sans, sans-serif' }}>Task Summary</p>
                <button onClick={() => setActiveTab('tasks')} type="button"
                  style={{ background:'#EEF2F0', border:'1px solid #BFD3CC', cursor:'pointer', fontSize:12.5, fontWeight:700, color:'#16332E', display:'flex', alignItems:'center', gap:5, fontFamily:'Inter, sans-serif', borderRadius:8, padding:'7px 14px', transition:'all 0.15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='#16332E'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='#EEF2F0'; e.currentTarget.style.color='#16332E'; }}>
                  View all <ChevronRightIcon style={{ width:14, height:14 }} />
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                {[
                  { label:'Pending',        value:stats.pendingTasks,                                color:'#8A5B0E', bg:'#FBF7EE', border:'#EFD9A6' },
                  { label:'In Progress',    value:myTasks.filter(t=>t.status==='in_progress').length, color:'#28548F', bg:'#EEF3F8', border:'#C7D7EF' },
                  { label:'Completed',      value:stats.doneTasks,                                    color:'#1E7A57', bg:'#EEF6F1', border:'#BFE2CD' },
                  { label:'Overdue',        value:stats.overdueTasks,                                 color:'#8A241D', bg:'#FBF2F0', border:'#E8C2BD' },
                  { label:'Total assigned', value:myTasks.length,                                     color:'#3E4654', bg:'#F1F2F4', border:'#D7DAE0' },
                ].map(item => (
                  <div key={item.label} style={{ borderRadius:11, border:`1px solid ${item.border}`, background:item.bg, padding:'16px 18px' }}>
                    <p style={{ fontSize:28, fontWeight:700, color:'#12161C', margin:'0 0 6px', letterSpacing:'-0.03em', fontFamily:'IBM Plex Sans, sans-serif', lineHeight:1 }}>{item.value}</p>
                    <p style={{ fontSize:11, color:item.color, fontWeight:700, margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>{item.label}</p>
                  </div>
                ))}
              </div>
              {myTasks.filter(t=>t.status!=='done').length === 0 && (
                <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:10, borderRadius:10, border:'1px solid #BFE2CD', background:'#EEF6F1', padding:'12px 18px' }}>
                  <SparklesIcon style={{ width:16, height:16, color:'#1E7A57', flexShrink:0 }} />
                  <p style={{ fontSize:13.5, fontWeight:600, color:'#155C40', margin:0 }}>All tasks cleared — excellent work!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ UPLOAD TAB ══════════════ */}
        {activeTab === 'upload' && (
          <section style={{ display:'flex', flexDirection:'column', gap:18, animation:'fadeUp 0.28s ease-out' }}>
            <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:20 }}>
              <FileUpload onUpload={handleUpload} />

              <aside style={{ ...panelSx, padding:0 }}>
                <div className="emp-panel-header">
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:'#EEF2F0', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #BFD3CC' }}>
                      <ClockIcon style={{ width:18, height:18, color:'#16332E' }} />
                    </div>
                    <div>
                      <p style={{ fontSize:14.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.01em', fontFamily:'IBM Plex Sans, sans-serif' }}>Today's activity</p>
                      <p style={{ fontSize:12, color:'#94989F', margin:'2px 0 0' }}>{todayFiles.length} item{todayFiles.length===1?'':'s'} uploaded</p>
                    </div>
                  </div>
                  <span style={{ borderRadius:8, padding:'5px 14px', border:'1px solid #BFD3CC', background:'#EEF2F0', fontSize:14, fontWeight:700, color:'#16332E' }}>{todayFiles.length}</span>
                </div>

                <div style={{ padding:'8px 24px 16px' }}>
                  {todayFiles.length === 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px dashed #E9E7E1', borderRadius:12, padding:'44px 24px', textAlign:'center' }}>
                      <ArrowUpTrayIcon style={{ width:34, height:34, color:'#D6D3CB' }} />
                      <p style={{ marginTop:10, fontSize:13.5, fontWeight:600, color:'#94989F' }}>No uploads today yet</p>
                    </div>
                  ) : (
                    <ul style={{ listStyle:'none', margin:0, padding:0 }}>
                      {todayFiles.map(f => <ActivityRow key={f.id} file={f} />)}
                    </ul>
                  )}

                  <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #F1F0EC', display:'flex', flexWrap:'wrap', gap:12 }}>
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                      const Icon = val.icon;
                      return (
                        <span key={key} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#5B6472', fontWeight:500 }}>
                          <Icon style={{ width:12, height:12 }} className={val.color} />
                          {val.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* ══════════════ MY FILES TAB ══════════════ */}
        {activeTab === 'files' && (
          <section style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeUp 0.28s ease-out' }}>
            {/* Filter bar */}
            <div style={{ ...panelSx, padding:'18px 22px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:12, justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:'#EEF2F0', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #BFD3CC' }}>
                    <FunnelIcon style={{ width:16, height:16, color:'#16332E' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:13.5, fontWeight:700, color:'#12161C', margin:0 }}>Filter & Sort</p>
                    <p style={{ fontSize:11.5, color:'#94989F', margin:'1px 0 0' }}>{filteredFiles.length} of {userFiles.length} files</p>
                  </div>
                </div>

                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:8 }}>
                  {[
                    { value:range,        onChange:(v)=>{ setRange(v); setFilePage(1); },        options:[['today','Today'],['7d','7 days'],['30d','30 days'],['all','All time']] },
                    { value:statusFilter, onChange:(v)=>{ setStatusFilter(v); setFilePage(1); }, options:[['all','All statuses'],['pending','Pending'],['reviewing','Reviewing'],['approved','Approved'],['rejected','Rejected']] },
                    { value:typeFilter,   onChange:(v)=>{ setTypeFilter(v); setFilePage(1); },   options:[['all','All types'],['pdf','PDF'],['image','Images'],['doc','Office'],['data','Data'],['other','Other']] },
                    { value:sortBy,       onChange:(v)=>{ setSortBy(v); setFilePage(1); },       options:[['newest','Newest first'],['oldest','Oldest first'],['name','Name A–Z'],['size','Largest first']] },
                  ].map((sel, i) => (
                    <select key={i} value={sel.value} onChange={e=>sel.onChange(e.target.value)} style={{ ...inputSx, cursor:'pointer' }}
                      onFocus={focusInput} onBlur={blurInput}>
                      {sel.options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ))}

                  <input type="date" value={selectedDate} onChange={e=>{ setSelectedDate(e.target.value); setFilePage(1); }}
                    style={{ ...inputSx }} onFocus={focusInput} onBlur={blurInput} />

                  <div style={{ position:'relative' }}>
                    <MagnifyingGlassIcon style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#94989F', pointerEvents:'none' }} />
                    <input type="text" placeholder="Search files…" value={search} onChange={e=>{ setSearch(e.target.value); setFilePage(1); }}
                      style={{ ...inputSx, paddingLeft:34, minWidth:190 }}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>

                  {/* View toggle */}
                  <div style={{ display:'flex', gap:2, padding:3, borderRadius:9, background:'#F1F0EC', border:'1px solid #E9E7E1' }}>
                    {[{ mode:'list', Icon:ListBulletIcon },{ mode:'grid', Icon:Squares2X2Icon }].map(({ mode, Icon }) => (
                      <button key={mode} onClick={()=>setViewMode(mode)}
                        className={viewMode===mode ? 'emp-view-btn-active' : ''}
                        style={{ width:32, height:32, borderRadius:7, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', background:viewMode===mode?'#16332E':'transparent', color:viewMode===mode?'#fff':'#5B6472' }}>
                        <Icon style={{ width:15, height:15 }} />
                      </button>
                    ))}
                  </div>

                  <button onClick={handleExportFiles} style={{ ...actionBtnSx }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='#BFD3CC'; e.currentTarget.style.color='#16332E'; e.currentTarget.style.background='#EEF2F0'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E6E4DE'; e.currentTarget.style.color='#3F4450'; e.currentTarget.style.background='#fff'; }}>
                    <ArrowDownTrayIcon style={{ width:15, height:15 }} />Export CSV
                  </button>

                  {(search || typeFilter!=='all' || range!=='30d' || sortBy!=='newest' || statusFilter!=='all' || selectedDate) && (
                    <button onClick={()=>{ setSearch(''); setTypeFilter('all'); setRange('30d'); setSortBy('newest'); setStatusFilter('all'); setSelectedDate(''); setFilePage(1); }}
                      className="emp-clear-btn"
                      style={{ ...actionBtnSx, borderColor:'#E8C2BD', background:'#FBF2F0', color:'#A3342B' }}>
                      <XMarkIcon style={{ width:14, height:14 }} />Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ ...panelSx }}>
              <FileList files={paginatedFiles} onPreview={setPreviewFile} onShare={setShareFile} />
              <Pagination current={filePage} total={totalFilePages} onChange={setFilePage} />
            </div>
          </section>
        )}

        {/* ══════════════ MY TASKS TAB ══════════════ */}
        {activeTab === 'tasks' && (
          <section style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeUp 0.28s ease-out' }}>
            {/* Task filter bar */}
            <div style={{ ...panelSx, padding:'18px 22px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:'#FBF7EE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #EFD9A6' }}>
                    <CheckCircleIcon style={{ width:16, height:16, color:'#B5790F' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:13.5, fontWeight:700, color:'#12161C', margin:0 }}>My Tasks</p>
                    <p style={{ fontSize:11.5, color:'#94989F', margin:'1px 0 0' }}>{filteredTasks.length} task{filteredTasks.length!==1?'s':''}</p>
                  </div>
                </div>

                <div style={{ position:'relative', flex:1, minWidth:200 }}>
                  <MagnifyingGlassIcon style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#94989F', pointerEvents:'none' }} />
                  <input type="text" placeholder="Search tasks…" value={taskSearch} onChange={e=>{ setTaskSearch(e.target.value); setTaskPage(1); }}
                    style={{ ...inputSx, paddingLeft:34, width:'100%' }}
                    onFocus={focusInput} onBlur={blurInput} />
                </div>

                {[
                  { value:taskStatusFilter,   onChange:(v)=>{ setTaskStatusFilter(v); setTaskPage(1); },   options:[['all','All statuses'],['pending','Pending'],['in_progress','In progress'],['done','Completed']] },
                  { value:taskPriorityFilter, onChange:(v)=>{ setTaskPriorityFilter(v); setTaskPage(1); }, options:[['all','All priorities'],['low','Low priority'],['medium','Medium priority'],['high','High priority']] },
                ].map((sel, i) => (
                  <select key={i} value={sel.value} onChange={e=>sel.onChange(e.target.value)} style={{ ...inputSx, cursor:'pointer' }}
                    onFocus={focusInput} onBlur={blurInput}>
                    {sel.options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ))}

                <button onClick={handleExportTasks} style={{ ...actionBtnSx }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#BFD3CC'; e.currentTarget.style.color='#16332E'; e.currentTarget.style.background='#EEF2F0'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E6E4DE'; e.currentTarget.style.color='#3F4450'; e.currentTarget.style.background='#fff'; }}>
                  <ArrowDownTrayIcon style={{ width:15, height:15 }} />Export CSV
                </button>
              </div>
            </div>

            {/* Overdue warning */}
            {stats.overdueTasks > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:12, borderRadius:10, border:'1px solid #E8C2BD', background:'#FBF2F0', padding:'14px 20px' }}>
                <ExclamationCircleIcon style={{ width:18, height:18, color:'#A3342B', flexShrink:0 }} />
                <p style={{ fontSize:13.5, fontWeight:600, color:'#8A241D', margin:0 }}>
                  {stats.overdueTasks} task{stats.overdueTasks>1?'s are':' is'} overdue — please complete them as soon as possible.
                </p>
              </div>
            )}

            {/* Tasks */}
            {(taskSearch || taskStatusFilter !== 'all' || taskPriorityFilter !== 'all') ? (
              <div style={{ ...panelSx }}>
                <div style={{ padding:'22px 24px' }}>
                  {paginatedTasks.length === 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px dashed #E9E7E1', borderRadius:12, padding:'52px 24px', textAlign:'center' }}>
                      <CheckCircleIcon style={{ width:40, height:40, color:'#D6D3CB' }} />
                      <p style={{ marginTop:14, fontSize:14.5, fontWeight:700, color:'#94989F', letterSpacing:'-0.01em' }}>No tasks match your filters</p>
                    </div>
                  ) : (
                    <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
                      {paginatedTasks.map(t => <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatusChange} />)}
                    </ul>
                  )}
                  <Pagination current={taskPage} total={totalTaskPages} onChange={setTaskPage} />
                </div>
              </div>
            ) : myTasks.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:14, border:'1px dashed #E9E7E1', background:'#fff', padding:'80px 24px', textAlign:'center' }}>
                <SparklesIcon style={{ width:48, height:48, color:'#D6D3CB' }} />
                <p style={{ marginTop:18, fontSize:16, fontWeight:700, color:'#5B6472', letterSpacing:'-0.02em', fontFamily:'IBM Plex Sans, sans-serif' }}>No tasks assigned yet</p>
                <p style={{ fontSize:13.5, color:'#94989F', margin:'6px 0 0' }}>Tasks assigned by admin will appear here.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <TaskSection title="Pending"     status="pending"     tasks={tasksByStatus.pending}     count={tasksByStatus.pending.length}     isOpen={taskSectionsOpen.pending}     onToggle={()=>toggleTaskSection('pending')}     onStatusChange={handleTaskStatusChange} />
                <TaskSection title="In Progress" status="in_progress" tasks={tasksByStatus.in_progress} count={tasksByStatus.in_progress.length} isOpen={taskSectionsOpen.in_progress} onToggle={()=>toggleTaskSection('in_progress')} onStatusChange={handleTaskStatusChange} />
                <TaskSection title="Completed"   status="done"        tasks={tasksByStatus.done}        count={tasksByStatus.done.length}        isOpen={taskSectionsOpen.done}        onToggle={()=>toggleTaskSection('done')}        onStatusChange={handleTaskStatusChange} />
              </div>
            )}
          </section>
        )}

        {/* ══════════════ ACTIVITY LOG TAB ══════════════ */}
        {activeTab === 'activity' && (
          <section style={{ animation:'fadeUp 0.28s ease-out' }}>
            <div style={{ ...panelSx }}>
              <div className="emp-panel-header">
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'#EEF2F0', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #BFD3CC' }}>
                    <ListBulletIcon style={{ width:18, height:18, color:'#16332E' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:15.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.02em', fontFamily:'IBM Plex Sans, sans-serif' }}>Activity Log</p>
                    <p style={{ fontSize:12, color:'#94989F', margin:'2px 0 0' }}>Your actions this session</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:12.5, color:'#94989F', fontWeight:500 }}>{activityLog.length} entries</span>
                  {activityLog.length > 0 && (
                    <button onClick={() => exportToCSV(activityLog.map(e=>({ action:e.action, detail:e.detail, time:e.time })), 'activity-log')}
                      style={{ ...actionBtnSx }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor='#BFD3CC'; e.currentTarget.style.color='#16332E'; e.currentTarget.style.background='#EEF2F0'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E6E4DE'; e.currentTarget.style.color='#3F4450'; e.currentTarget.style.background='#fff'; }}>
                      <ArrowDownTrayIcon style={{ width:15, height:15 }} />Export
                    </button>
                  )}
                </div>
              </div>

              <div style={{ padding:'24px 32px 32px' }}>
                {activityLog.length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px dashed #E9E7E1', borderRadius:12, padding:'64px 24px', textAlign:'center' }}>
                    <InformationCircleIcon style={{ width:44, height:44, color:'#D6D3CB' }} />
                    <p style={{ marginTop:16, fontSize:16, fontWeight:700, color:'#94989F', letterSpacing:'-0.02em', fontFamily:'IBM Plex Sans, sans-serif' }}>No activity yet</p>
                    <p style={{ fontSize:13.5, color:'#D6D3CB', margin:'6px 0 0' }}>Uploads and task updates will appear here.</p>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    {/* Timeline line */}
                    <div style={{ position:'absolute', left:7, top:10, bottom:10, width:1.5, background:'linear-gradient(180deg,#BFD3CC,transparent)', borderRadius:99 }} />
                    <ul style={{ listStyle:'none', margin:0, padding:'0 0 0 40px', display:'flex', flexDirection:'column', gap:8 }}>
                      {activityLog.map((entry) => (
                        <li key={entry.id} style={{ position:'relative' }}>
                          {/* Dot */}
                          <div style={{ position:'absolute', left:-33, top:12, width:13, height:13, borderRadius:'50%', background:'#16332E', border:'2.5px solid #fff', boxShadow:'0 0 0 3px #EEF2F0' }} />
                          <div style={{ borderRadius:11, border:'1px solid #E9E7E1', background:'#FAFAF8', padding:'14px 18px', transition:'all 0.15s' }}
                            onMouseEnter={e=>{ e.currentTarget.style.borderColor='#BFD3CC'; e.currentTarget.style.background='#fff'; e.currentTarget.style.boxShadow='0 2px 10px rgba(22,51,46,0.06)'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E9E7E1'; e.currentTarget.style.background='#FAFAF8'; e.currentTarget.style.boxShadow='none'; }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                              <div>
                                <p style={{ fontSize:13.5, fontWeight:700, color:'#12161C', margin:0, letterSpacing:'-0.01em' }}>{entry.action}</p>
                                <p style={{ fontSize:12.5, color:'#5B6472', margin:'3px 0 0', lineHeight:1.5 }}>{entry.detail}</p>
                              </div>
                              <p style={{ fontSize:11.5, color:'#94989F', flexShrink:0, fontWeight:500 }}>{timeAgo(entry.time)}</p>
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