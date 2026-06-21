// src/components/FileList.jsx
import React from 'react';
import {
  DocumentTextIcon,
  EyeIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';

/* ─── Obsidian-Slate dark tokens (admin) ────────────────────────────── */
const D = {
  bdr0: 'rgba(255,255,255,0.05)',
  bdr1: 'rgba(255,255,255,0.09)',
  bdr2: 'rgba(255,255,255,0.15)',
  txt0: '#f5f6fa',
  txt1: '#9aa1b8',
  txt2: '#5c6178',
  rowHov: 'rgba(255,255,255,0.025)',
  headBg: 'rgba(255,255,255,0.02)',
  chipBg: 'rgba(255,255,255,0.04)',
  chipBdr: 'rgba(255,255,255,0.08)',
  emptyBg: 'rgba(255,255,255,0.03)',
  emptyBdr: 'rgba(255,255,255,0.10)',
};

/* ─── Ivory/gold light tokens (employee) ────────────────────────────── */
const L = {
  bdr0: 'rgba(212,175,122,0.10)',
  bdr1: 'rgba(212,175,122,0.18)',
  bdr2: 'rgba(212,175,122,0.30)',
  txt0: '#1c1917',
  txt1: '#78716c',
  txt2: '#a8a29e',
  rowHov: 'rgba(212,175,122,0.05)',
  headBg: 'rgba(212,175,122,0.05)',
  chipBg: 'rgba(212,175,122,0.07)',
  chipBdr: 'rgba(212,175,122,0.14)',
  emptyBg: 'rgba(212,175,122,0.05)',
  emptyBdr: 'rgba(212,175,122,0.22)',
};

const getFriendlyFileType = (mimeType = '', fileName = '') => {
  const type = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'PDF Document';
  if (type.includes('word') || name.match(/\.(doc|docx)$/)) return 'Word Document';
  if (type.includes('sheet') || type.includes('excel') || name.match(/\.(xls|xlsx)$/)) return 'Excel Sheet';
  if (type.includes('presentation') || name.match(/\.(ppt|pptx)$/)) return 'PowerPoint';
  if (type.includes('image')) return 'Image File';
  if (name.endsWith('.csv')) return 'CSV File';
  if (name.endsWith('.json')) return 'JSON File';
  if (type.includes('zip') || name.match(/\.(zip|rar|7z)$/)) return 'Archive';
  return 'Generic File';
};

/* File-type accent colors stay constant across themes — they're identity
   colors (red=PDF, blue=Word, etc.), only their background opacity differs
   slightly per theme for contrast. */
const FILE_TYPE_STYLES = (dark) => ({
  pdf:   { bg: dark ? 'rgba(240,112,138,0.12)' : 'rgba(239,68,68,0.10)',  border: dark ? 'rgba(240,112,138,0.25)' : 'rgba(239,68,68,0.20)',  color: dark ? '#f0708a' : '#dc2626', label: 'PDF' },
  word:  { bg: dark ? 'rgba(91,141,239,0.14)'  : 'rgba(59,130,246,0.10)', border: dark ? 'rgba(91,141,239,0.28)'  : 'rgba(59,130,246,0.20)', color: dark ? '#5b8def' : '#2563eb', label: 'DOC' },
  sheet: { bg: dark ? 'rgba(52,211,153,0.14)'  : 'rgba(16,185,129,0.10)', border: dark ? 'rgba(52,211,153,0.28)'  : 'rgba(16,185,129,0.20)', color: dark ? '#34d399' : '#059669', label: 'XLS' },
  ppt:   { bg: dark ? 'rgba(240,177,77,0.14)'  : 'rgba(249,115,22,0.10)', border: dark ? 'rgba(240,177,77,0.28)'  : 'rgba(249,115,22,0.20)', color: dark ? '#f0b14d' : '#ea580c', label: 'PPT' },
  image: { bg: dark ? 'rgba(167,139,250,0.14)' : 'rgba(139,92,246,0.10)', border: dark ? 'rgba(167,139,250,0.28)' : 'rgba(139,92,246,0.20)', color: dark ? '#a78bfa' : '#7c3aed', label: 'IMG' },
  other: { bg: dark ? 'rgba(91,141,239,0.10)'  : 'rgba(99,102,241,0.10)', border: dark ? 'rgba(91,141,239,0.20)'  : 'rgba(99,102,241,0.18)', color: dark ? '#9aa1b8' : '#4f46e5', label: 'FILE' },
});

const getFileTypeStyle = (mimeType = '', fileName = '', dark = false) => {
  const styles = FILE_TYPE_STYLES(dark);
  const type = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return styles.pdf;
  if (type.includes('word') || name.match(/\.(doc|docx)$/)) return styles.word;
  if (type.includes('sheet') || type.includes('excel') || name.match(/\.(xls|xlsx)$/)) return styles.sheet;
  if (type.includes('presentation') || name.match(/\.(ppt|pptx)$/)) return styles.ppt;
  if (type.includes('image')) return styles.image;
  return styles.other;
};

const FileIcon = ({ mimeType = '', fileName = '', dark }) => {
  const type = mimeType.toLowerCase();
  const s = getFileTypeStyle(mimeType, fileName, dark);

  if (type.includes('image')) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" fill="none" stroke={s.color} strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: s.color, letterSpacing: '0.04em', fontFamily: 'inherit' }}>{s.label}</span>
    </div>
  );
};

const ActionBtn = ({ onClick, title, children, accent, dark }) => {
  const [hov, setHov] = React.useState(false);

  const ACCENT_DARK = {
    blue:    { bg: 'rgba(91,141,239,0.14)',  border: 'rgba(91,141,239,0.32)',  color: '#5b8def' },
    green:   { bg: 'rgba(52,211,153,0.14)',  border: 'rgba(52,211,153,0.32)',  color: '#34d399' },
    amber:   { bg: 'rgba(240,177,77,0.14)',  border: 'rgba(240,177,77,0.32)',  color: '#f0b14d' },
    indigo:  { bg: 'rgba(167,139,250,0.16)', border: 'rgba(167,139,250,0.36)', color: '#a78bfa' },
    default: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.14)', color: '#9aa1b8' },
  };
  const ACCENT_LIGHT = {
    blue:    { bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.30)',  color: '#2563eb' },
    green:   { bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.30)',  color: '#059669' },
    amber:   { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.30)',  color: '#b45309' },
    indigo:  { bg: 'rgba(168,118,30,0.12)',  border: 'rgba(168,118,30,0.34)',  color: '#a8761e' },
    default: { bg: 'rgba(212,175,122,0.06)', border: 'rgba(212,175,122,0.14)', color: '#78716c' },
  };
  const palette = dark ? ACCENT_DARK : ACCENT_LIGHT;
  const a = palette[accent] || palette.default;

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, borderRadius: 9,
        border: `1px solid ${hov ? a.border : (dark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.12)')}`,
        background: hov ? a.bg : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.80)'),
        color: hov ? a.color : (dark ? '#5c6178' : '#64748b'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: hov ? `0 2px 8px ${a.bg}` : (dark ? 'none' : '0 1px 3px rgba(15,23,42,0.04)'),
      }}
    >
      {children}
    </button>
  );
};

const FileList = ({ files = [], isAdmin = false, onPreview, onShare, onStatusChange, onReview }) => {
  const dark = isAdmin;
  const T = dark ? D : L;

  if (!files || files.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: T.emptyBg, border: `2px dashed ${T.emptyBdr}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <DocumentTextIcon style={{ width: 32, height: 32, color: T.txt2 }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.txt1, margin: '0 0 4px' }}>No files found</p>
        <p style={{ fontSize: 12, color: T.txt2, margin: 0 }}>Files will appear here once uploaded</p>
      </div>
    );
  }

  const TH = ({ children }) => (
    <th style={{ padding: '12px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.txt2 }}>
        {children}
      </span>
    </th>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.bdr1}`, background: T.headBg }}>
            <TH>User</TH>
            <TH>File</TH>
            <TH>Description</TH>
            <TH>Date</TH>
            <TH>Time</TH>
            <TH>Size</TH>
            {isAdmin && <TH>Status</TH>}
            <TH>Actions</TH>
          </tr>
        </thead>
        <tbody>
          {files.map((file, idx) => {
            const fileDate = file.createdAt
              ? new Date(file.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
              : '—';
            const fileTime = file.createdAt
              ? new Date(file.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
              : '—';
            const fileSize = file.size
              ? (() => {
                  const sizes = ['B', 'KB', 'MB', 'GB'];
                  let si = 0, sv = file.size;
                  while (sv >= 1024 && si < sizes.length - 1) { sv /= 1024; si++; }
                  return `${sv.toFixed(1)} ${sizes[si]}`;
                })()
              : '—';

            const initials = (file.userName || 'U').slice(0, 2).toUpperCase();
            const avatarColorsDark  = ['linear-gradient(135deg,#5b8def,#a78bfa)', 'linear-gradient(135deg,#34d399,#5b8def)', 'linear-gradient(135deg,#34d399,#059669)', 'linear-gradient(135deg,#f0b14d,#f0708a)'];
            const avatarColorsLight = ['linear-gradient(135deg,#6366f1,#8b5cf6)', 'linear-gradient(135deg,#06b6d4,#3b82f6)', 'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#f59e0b,#ef4444)'];
            const avatarGrad = (dark ? avatarColorsDark : avatarColorsLight)[initials.charCodeAt(0) % 4];

            return (
              <tr
                key={file.id}
                style={{
                  borderBottom: idx < files.length - 1 ? `1px solid ${T.bdr0}` : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.rowHov}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* User */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: avatarGrad,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                      boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.35)' : '0 2px 8px rgba(99,102,241,0.22)',
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        {file.userName || 'Unknown'}
                      </p>
                      <p style={{ fontSize: 10, color: T.txt2, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        {file.userEmail || 'N/A'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* File */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileIcon mimeType={file.mimeType} fileName={file.originalName} dark={dark} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                        {file.originalName || 'Unnamed'}
                      </p>
                      <p style={{ fontSize: 10, color: T.txt2, margin: '1px 0 0' }}>
                        {getFriendlyFileType(file.mimeType, file.originalName)}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Description */}
                <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                  <p style={{ fontSize: 12, color: T.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.description || <span style={{ color: T.txt2 }}>—</span>}
                  </p>
                </td>

                {/* Date */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.txt1, margin: 0 }}>{fileDate}</p>
                </td>

                {/* Time */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.txt1, margin: 0 }}>{fileTime}</p>
                </td>

                {/* Size */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: T.txt1,
                    background: T.chipBg, border: `1px solid ${T.chipBdr}`,
                    borderRadius: 6, padding: '2px 8px',
                  }}>{fileSize}</span>
                </td>

                {/* Status (Admin) */}
                {isAdmin && (
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={file.status} dark={dark} />
                  </td>
                )}

                {/* Actions */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ActionBtn onClick={() => onPreview?.(file)} title="Preview file" accent="blue" dark={dark}>
                      <EyeIcon style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                    <ActionBtn onClick={() => onShare?.(file)} title="Share file" accent="green" dark={dark}>
                      <ShareIcon style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => {
                        if (file.url) {
                          const link = document.createElement('a');
                          link.href = file.url;
                          link.download = file.originalName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      title="Download file"
                      accent="amber"
                      dark={dark}
                    >
                      <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                    {isAdmin && file.status !== 'approved' && (
                      <ActionBtn onClick={() => onReview?.(file)} title="Review file" accent="indigo" dark={dark}>
                        <CheckCircleIcon style={{ width: 15, height: 15 }} />
                      </ActionBtn>
                    )}
                    <ActionBtn title="More options" accent="default" dark={dark}>
                      <EllipsisVerticalIcon style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;