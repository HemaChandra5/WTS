// src/components/TaskBoard.jsx
import React, { useState } from 'react';
import {
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  FlagIcon,
  BoltIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

/* ─── Design tokens ── */
const T = {
  bg0: '#F4F6FB',
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.022)',
  bg3: 'rgba(15,23,42,0.048)',
  bdr0: 'rgba(15,23,42,0.048)',
  bdr1: 'rgba(15,23,42,0.085)',
  bdr2: 'rgba(15,23,42,0.15)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  accent: '#4F46E5',
  accentL: 'rgba(79,70,229,0.08)',
  accentM: 'rgba(79,70,229,0.14)',
  accentB: 'rgba(79,70,229,0.22)',
  emerald: '#059669',
  emeraldL: 'rgba(5,150,105,0.07)',
  emeraldM: 'rgba(5,150,105,0.13)',
  emeraldB: 'rgba(5,150,105,0.22)',
  amber: '#C77C00',
  amberL: 'rgba(199,124,0,0.08)',
  amberM: 'rgba(199,124,0,0.14)',
  amberB: 'rgba(199,124,0,0.22)',
  rose: '#DC2626',
  roseL: 'rgba(220,38,38,0.07)',
  roseB: 'rgba(220,38,38,0.20)',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

/* Utility: returns today's ISO date string — use as `min` on <input type="date"> */
export const todayISO = () => new Date().toISOString().split('T')[0];

const GROUP_CONFIG = {
  pending: {
    key: 'pending',
    label: 'Pending',
    sublabel: 'Awaiting action',
    icon: ClockIcon,
    color: T.amber,
    bg: T.amberL,
    bgM: T.amberM,
    border: T.amberB,
    badgeBg: 'linear-gradient(135deg, #D97706, #C77C00)',
    glow: 'rgba(199,124,0,0.16)',
    stripe: '#D97706',
    emptyText: 'No pending tasks — you\'re clear!',
    emptyIcon: ClockIcon,
  },
  in_progress: {
    key: 'in_progress',
    label: 'In Progress',
    sublabel: 'Currently active',
    icon: PlayIcon,
    color: T.accent,
    bg: T.accentL,
    bgM: T.accentM,
    border: T.accentB,
    badgeBg: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    glow: 'rgba(79,70,229,0.18)',
    stripe: '#4F46E5',
    emptyText: 'Nothing in progress right now.',
    emptyIcon: PlayIcon,
  },
  done: {
    key: 'done',
    label: 'Completed',
    sublabel: 'All wrapped up',
    icon: CheckCircleIcon,
    color: T.emerald,
    bg: T.emeraldL,
    bgM: T.emeraldM,
    border: T.emeraldB,
    badgeBg: 'linear-gradient(135deg, #10B981, #059669)',
    glow: 'rgba(5,150,105,0.16)',
    stripe: '#059669',
    emptyText: 'No completed tasks yet.',
    emptyIcon: CheckCircleIcon,
  },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    bg: 'rgba(100,116,139,0.07)', border: 'rgba(100,116,139,0.18)', color: '#64748B', dot: '#94A3B8' },
  medium: { label: 'Medium', bg: T.amberL, border: T.amberB, color: T.amber, dot: T.amber },
  high:   { label: 'High',   bg: T.roseL,  border: T.roseB,  color: T.rose,  dot: T.rose },
};

const fmtDate = (ts) => {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (ts) => {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const relTime = (ts) => {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* ── Status change dropdown ── */
const StatusDropdown = ({ task, onStatusChange, cfg }) => {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(false);

  const options = [
    { key: 'pending',     label: 'Pending',     color: T.amber },
    { key: 'in_progress', label: 'In Progress', color: T.accent },
    { key: 'done',        label: 'Completed',   color: T.emerald },
  ].filter((o) => o.key !== task?.status);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          borderRadius: 20, padding: '4px 11px',
          background: hov ? cfg.bgM : cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
          fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: FONT, letterSpacing: '0.01em',
        }}
      >
        <span style={{ height: 5, width: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
        {cfg.label}
        <ChevronDownIcon style={{ width: 10, height: 10 }} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 40,
            width: 160, borderRadius: 14, background: T.bg1,
            border: `1px solid ${T.bdr1}`,
            boxShadow: '0 20px 50px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.06)',
            overflow: 'hidden',
            animation: 'tbDropIn 0.16s cubic-bezier(.16,1,.3,1)',
          }}>
            <div style={{ padding: '7px 12px 5px', borderBottom: `1px solid ${T.bdr0}` }}>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.txt2 }}>
                Move to
              </span>
            </div>
            {options.map((opt) => {
              const [itemHov, setItemHov] = useState(false);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setOpen(false); onStatusChange(task.id, opt.key); }}
                  onMouseEnter={() => setItemHov(true)}
                  onMouseLeave={() => setItemHov(false)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontWeight: 600,
                    color: itemHov ? opt.color : T.txt1,
                    background: itemHov ? `${opt.color}11` : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'all 0.12s', fontFamily: FONT,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                  {opt.label}
                </button>
              );
            })}
          </div>
          <style>{`@keyframes tbDropIn { from{opacity:0;transform:translateY(-4px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
        </>
      )}
    </div>
  );
};

/* ── Single task card ── */
const TaskCard = ({ task, onStatusChange }) => {
  const [hov, setHov] = useState(false);
  const cfg = GROUP_CONFIG[task?.status] || GROUP_CONFIG.pending;
  const priCfg = task?.priority ? (PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium) : null;
  const StatusIcon = cfg.icon;
  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const assignedDate = task?.createdAt ? fmtDate(task.createdAt) : null;
  const assignedTime = task?.createdAt ? fmtTime(task.createdAt) : null;
  const assignedRel  = task?.createdAt ? relTime(task.createdAt) : null;
  const assignedBy   = task?.assignedByName || task?.assignedBy || 'Admin';

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 14,
        border: `1px solid ${isOverdue ? T.roseB : hov ? T.bdr2 : T.bdr0}`,
        background: isOverdue
          ? `linear-gradient(135deg, rgba(220,38,38,0.04) 0%, #FFFFFF 100%)`
          : T.bg1,
        padding: '14px 16px 14px 20px',
        boxShadow: hov
          ? '0 12px 36px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.05)'
          : '0 1px 4px rgba(15,23,42,0.04)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      {/* Left accent strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: isOverdue ? T.rose : cfg.stripe,
        opacity: hov ? 1 : 0.45,
        transition: 'opacity 0.22s',
        borderRadius: '14px 0 0 14px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Status icon */}
        <div style={{
          display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
          borderRadius: 11, background: cfg.bg, border: `1px solid ${cfg.border}`,
          flexShrink: 0,
          boxShadow: hov ? `0 0 0 5px ${cfg.glow}` : 'none',
          transition: 'box-shadow 0.22s',
        }}>
          <StatusIcon style={{ width: 16, height: 16, color: cfg.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                letterSpacing: '-0.015em',
              }}>
                {task?.title || '(Untitled)'}
              </p>
              {isOverdue && (
                <span style={{
                  fontSize: 9, fontWeight: 800, color: T.rose,
                  background: T.roseL, border: `1px solid ${T.roseB}`,
                  borderRadius: 5, padding: '2px 7px',
                  letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
                }}>OVERDUE</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {priCfg && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  borderRadius: 7, padding: '3px 9px', fontSize: 10, fontWeight: 700,
                  background: priCfg.bg, border: `1px solid ${priCfg.border}`, color: priCfg.color,
                  letterSpacing: '0.03em',
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: priCfg.dot, flexShrink: 0 }} />
                  {priCfg.label}
                </span>
              )}
              <StatusDropdown task={task} onStatusChange={onStatusChange} cfg={cfg} />
            </div>
          </div>

          {/* Description */}
          {task?.description ? (
            <p style={{
              margin: '0 0 9px', fontSize: 11.5, color: T.txt2, lineHeight: 1.55,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {task.description}
            </p>
          ) : (
            <p style={{ margin: '0 0 9px', fontSize: 11.5, color: T.txt2, fontStyle: 'italic' }}>No description provided.</p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Assigned timestamp — auto from createdAt */}
            {assignedDate && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: T.bg2, border: `1px solid ${T.bdr0}`,
                borderRadius: 8, padding: '4px 9px',
              }}>
                <BoltIcon style={{ width: 10, height: 10, color: T.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, color: T.txt2, fontWeight: 500 }}>
                  By <strong style={{ color: T.txt1, fontWeight: 700 }}>{assignedBy}</strong>
                  {' · '}
                  <span style={{ color: T.txt1, fontWeight: 600 }}>{assignedDate}</span>
                  {' '}
                  <span style={{
                    background: T.bg3, borderRadius: 5, padding: '1px 5px',
                    fontSize: 10, fontWeight: 700, color: T.txt1,
                  }}>{assignedTime}</span>
                  {assignedRel && (
                    <span style={{ color: T.txt2, fontWeight: 400 }}>{' · '}{assignedRel}</span>
                  )}
                </span>
              </div>
            )}

            {/* Due date */}
            {task?.dueDate && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: isOverdue ? T.roseL : T.bg2,
                border: `1px solid ${isOverdue ? T.roseB : T.bdr0}`,
                borderRadius: 8, padding: '4px 9px',
              }}>
                <CalendarDaysIcon style={{ width: 10, height: 10, color: isOverdue ? T.rose : T.txt2, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, fontWeight: 600, color: isOverdue ? T.rose : T.txt1 }}>
                  Due {fmtDate(task.dueDate)}
                </span>
              </div>
            )}

            {/* Attachment link */}
            {task?.attachmentUrl && (
              <a
                href={task.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10.5, fontWeight: 600, color: T.accent,
                  textDecoration: 'none',
                  background: T.accentL, border: `1px solid ${T.accentB}`,
                  borderRadius: 8, padding: '4px 9px',
                }}
              >
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                View attachment
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Group header ── */
const GroupHeader = ({ groupCfg, count, open, onToggle }) => {
  const [hov, setHov] = useState(false);
  const Icon = groupCfg.icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        background: hov ? groupCfg.bg : 'transparent',
        border: 'none', cursor: 'pointer', transition: 'background 0.18s',
        fontFamily: FONT, borderRadius: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: groupCfg.bg, border: `1px solid ${groupCfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: hov ? `0 0 0 5px ${groupCfg.glow}` : 'none',
          transition: 'box-shadow 0.22s',
        }}>
          <Icon style={{ width: 17, height: 17, color: groupCfg.color }} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 13.5, fontWeight: 800, color: T.txt0, margin: 0, letterSpacing: '-0.02em' }}>
            {groupCfg.label}
          </p>
          <p style={{ fontSize: 10.5, color: T.txt2, margin: '1px 0 0', fontWeight: 500 }}>
            {groupCfg.sublabel} · {count} {count === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 26, height: 26, borderRadius: 8,
          background: groupCfg.badgeBg,
          fontSize: 12, fontWeight: 800, color: '#fff',
          padding: '0 8px',
          boxShadow: `0 3px 10px ${groupCfg.glow}`,
        }}>
          {count}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: hov ? T.bg3 : T.bg2,
          border: `1px solid ${T.bdr0}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}>
          {open
            ? <ChevronUpIcon style={{ width: 14, height: 14, color: T.txt2 }} />
            : <ChevronDownIcon style={{ width: 14, height: 14, color: T.txt2 }} />
          }
        </div>
      </div>
    </button>
  );
};

/* ── Empty state ── */
const EmptyGroup = ({ groupCfg }) => {
  const Icon = groupCfg.emptyIcon;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: groupCfg.bg, border: `1px solid ${groupCfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.5,
      }}>
        <Icon style={{ width: 20, height: 20, color: groupCfg.color }} />
      </div>
      <p style={{ fontSize: 12, color: T.txt2, margin: 0, fontStyle: 'italic', textAlign: 'center' }}>
        {groupCfg.emptyText}
      </p>
    </div>
  );
};

/* ── Main TaskBoard ── */
const TaskBoard = ({ tasks = [], onStatusChange }) => {
  const [collapsed, setCollapsed] = useState({ pending: false, in_progress: false, done: false });

  const grouped = {
    pending:     tasks.filter((t) => t.status === 'pending'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done:        tasks.filter((t) => t.status === 'done'),
  };

  const toggleGroup = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: FONT }}>
      {['pending', 'in_progress', 'done'].map((key, gIdx) => {
        const gcfg = GROUP_CONFIG[key];
        const list = grouped[key];
        const isOpen = !collapsed[key];

        return (
          <div
            key={key}
            style={{
              borderRadius: 18,
              border: `1px solid ${T.bdr1}`,
              background: T.bg1,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.03)',
              animation: `tbGroupIn 0.30s ${gIdx * 0.08}s cubic-bezier(0.16,1,0.3,1) both`,
            }}
          >
            <GroupHeader
              groupCfg={gcfg}
              count={list.length}
              open={isOpen}
              onToggle={() => toggleGroup(key)}
            />

            {isOpen && (
              <div style={{ borderTop: `1px solid ${T.bdr0}` }}>
                {list.length === 0 ? (
                  <EmptyGroup groupCfg={gcfg} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px 16px' }}>
                    {list.map((task) => (
                      <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes tbGroupIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TaskBoard;