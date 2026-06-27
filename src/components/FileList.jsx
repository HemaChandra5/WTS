// src/components/FileList.jsx
import React, { useState } from 'react';
import {
  DocumentTextIcon,
  EyeIcon,
  PhotoIcon,
  TrashIcon,
  ShareIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';

/* ─── Admin tokens ── */
const D = {
  bg0: '#F4F6FB',
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.022)',
  bg3: 'rgba(15,23,42,0.048)',
  bdr0: 'rgba(15,23,42,0.045)',
  bdr1: 'rgba(15,23,42,0.085)',
  bdr2: 'rgba(15,23,42,0.15)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  rowHov: 'rgba(52,84,209,0.025)',
  headBg: 'rgba(15,23,42,0.018)',
  chipBg: 'rgba(15,23,42,0.04)',
  chipBdr: 'rgba(15,23,42,0.09)',
  accent: '#3454D1', accentL: 'rgba(52,84,209,0.09)', accentB: 'rgba(52,84,209,0.24)',
  emerald: '#0E9F6E', emeraldD: 'rgba(14,159,110,0.09)', emeraldB: 'rgba(14,159,110,0.24)',
  amber: '#B7791F', amberD: 'rgba(183,121,31,0.09)', amberB: 'rgba(183,121,31,0.24)',
  violet: '#6D4FE0', violetD: 'rgba(109,79,224,0.09)', violetB: 'rgba(109,79,224,0.24)',
  rose: '#C23552', roseD: 'rgba(194,53,82,0.08)', roseB: 'rgba(194,53,82,0.24)',
  sky: '#0891B2', skyD: 'rgba(8,145,178,0.09)', skyB: 'rgba(8,145,178,0.24)',
};

/* ─── Employee tokens ── */
const L = {
  bg0: '#F4F6FB',
  bg1: '#FFFFFF',
  bg2: 'rgba(15,23,42,0.022)',
  bg3: 'rgba(15,23,42,0.048)',
  bdr0: 'rgba(15,23,42,0.045)',
  bdr1: 'rgba(15,23,42,0.085)',
  bdr2: 'rgba(15,23,42,0.15)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  rowHov: 'rgba(79,70,229,0.025)',
  headBg: 'rgba(15,23,42,0.018)',
  chipBg: 'rgba(15,23,42,0.04)',
  chipBdr: 'rgba(15,23,42,0.09)',
  accent: '#4F46E5', accentL: 'rgba(79,70,229,0.09)', accentB: 'rgba(79,70,229,0.24)',
  emerald: '#10B981', emeraldD: 'rgba(16,185,129,0.09)', emeraldB: 'rgba(16,185,129,0.24)',
  amber: '#F59E0B', amberD: 'rgba(245,158,11,0.10)', amberB: 'rgba(245,158,11,0.26)',
  violet: '#8B5CF6', violetD: 'rgba(139,92,246,0.10)', violetB: 'rgba(139,92,246,0.26)',
  rose: '#F43F5E', roseD: 'rgba(244,63,94,0.09)', roseB: 'rgba(244,63,94,0.24)',
  sky: '#0EA5E9', skyD: 'rgba(14,165,233,0.09)', skyB: 'rgba(14,165,233,0.24)',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
const PAGE_SIZE = 10;

/* ─── Helpers ─── */
const getFriendlyFileType = (mimeType = '', fileName = '') => {
  const t = mimeType.toLowerCase(), n = fileName.toLowerCase();
  if (t.includes('pdf') || n.endsWith('.pdf')) return 'PDF Document';
  if (t.includes('word') || n.match(/\.(doc|docx)$/)) return 'Word Document';
  if (t.includes('sheet') || t.includes('excel') || n.match(/\.(xls|xlsx)$/)) return 'Spreadsheet';
  if (t.includes('presentation') || n.match(/\.(ppt|pptx)$/)) return 'Presentation';
  if (t.includes('image')) return 'Image';
  if (n.endsWith('.csv')) return 'CSV';
  if (n.endsWith('.json')) return 'JSON';
  if (t.includes('zip') || n.match(/\.(zip|rar|7z)$/)) return 'Archive';
  return 'Generic File';
};

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const s = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = bytes;
  while (v >= 1024 && i < s.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${s[i]}`;
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtTime = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getTypeKey = (mimeType = '', fileName = '') => {
  const t = mimeType.toLowerCase(), n = fileName.toLowerCase();
  if (t.includes('pdf') || n.endsWith('.pdf')) return 'pdf';
  if (t.includes('word') || n.match(/\.(doc|docx)$/)) return 'word';
  if (t.includes('sheet') || t.includes('excel') || n.match(/\.(xls|xlsx)$/)) return 'sheet';
  if (t.includes('presentation') || n.match(/\.(ppt|pptx)$/)) return 'ppt';
  if (t.includes('image')) return 'image';
  return 'other';
};

const FILE_TYPE_STYLES = (T) => ({
  pdf:   { bg: T.roseD,    border: T.roseB,    color: T.rose,    label: 'PDF'  },
  word:  { bg: T.accentL,  border: T.accentB,  color: T.accent,  label: 'DOC'  },
  sheet: { bg: T.emeraldD, border: T.emeraldB, color: T.emerald, label: 'XLS'  },
  ppt:   { bg: T.amberD,   border: T.amberB,   color: T.amber,   label: 'PPT'  },
  image: { bg: T.violetD,  border: T.violetB,  color: T.violet,  label: 'IMG'  },
  other: { bg: T.chipBg,   border: T.chipBdr,  color: T.txt1,    label: 'FILE' },
});

/* ─── Sub-components ─── */
const FileTypeChip = ({ mimeType = '', fileName = '', T, size = 38 }) => {
  const key = getTypeKey(mimeType, fileName);
  const s = FILE_TYPE_STYLES(T)[key] || FILE_TYPE_STYLES(T).other;
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: s.bg,
      border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      {key === 'image'
        ? <PhotoIcon style={{ width: size * 0.48, height: size * 0.48, color: s.color }} />
        : <span style={{ fontSize: size * 0.22, fontWeight: 800, color: s.color, letterSpacing: '0.03em', fontFamily: FONT }}>{s.label}</span>
      }
    </div>
  );
};

const ActionBtn = ({ onClick, title, accentKey, T, children, pulse }) => {
  const [hov, setHov] = useState(false);
  const MAP = {
    preview:   { bg: T.accentL,  border: T.accentB,  color: T.accent  },
    share:     { bg: T.violetD,  border: T.violetB,  color: T.violet  },
    send:      { bg: T.skyD,     border: T.skyB,     color: T.sky     },
    review:    { bg: T.amberD,   border: T.amberB,   color: T.amber   },
    delete:    { bg: T.roseD,    border: T.roseB,    color: T.rose    },
    default:   { bg: T.chipBg,   border: T.chipBdr,  color: T.txt1    },
  };
  const a = MAP[accentKey] || MAP.default;
  return (
    <button
      onClick={onClick} title={title} type="button"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        width: 32, height: 32, borderRadius: 9,
        border: `1px solid ${hov ? a.border : T.bdr1}`,
        background: hov ? a.bg : T.bg1,
        color: hov ? a.color : T.txt2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: hov ? `0 2px 10px rgba(15,23,42,0.08)` : 'none',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      {children}
      {pulse && (
        <span style={{
          position: 'absolute', top: -2, right: -2, width: 7, height: 7,
          borderRadius: '50%', background: T.sky,
          border: `2px solid ${T.bg1}`,
          animation: 'flPulse 1.8s ease-in-out infinite',
        }} />
      )}
    </button>
  );
};

const Checkbox = ({ checked, onChange, T }) => (
  <input
    type="checkbox" checked={checked} onChange={onChange}
    onClick={(e) => e.stopPropagation()}
    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: T.accent }}
  />
);

/* ─── Send-to-Admin status indicator ─── */
const AdminSentIndicator = ({ file, T }) => {
  const status = file.status || 'pending';
  const configs = {
    pending:   { label: 'Awaiting review', color: T.amber   },
    reviewing: { label: 'Admin reviewing', color: T.accent  },
    approved:  { label: 'Admin approved',  color: T.emerald },
    rejected:  { label: 'Admin rejected',  color: T.rose    },
  };
  const cfg = configs[status] || configs.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
};

/* ─── Smooth Pagination ─── */
const Pagination = ({ current, total, onChange, T }) => {
  if (total <= 1) return null;
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);

  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const PageBtn = ({ page }) => {
    const [hov, setHov] = useState(false);
    const active = page === current;
    return (
      <button
        onClick={() => onChange(page)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: 32, height: 32, borderRadius: 9, border: `1px solid ${active ? T.accentB : T.bdr1}`,
          background: active ? T.accent : hov ? T.accentL : T.bg1,
          color: active ? '#fff' : hov ? T.accent : T.txt1,
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          transition: 'all 0.15s',
          transform: hov && !active ? 'translateY(-1px)' : 'none',
          boxShadow: active ? `0 3px 10px ${T.accentL}` : 'none',
        }}
      >
        {page}
      </button>
    );
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderTop: `1px solid ${T.bdr0}`,
      background: T.headBg,
    }}>
      <span style={{ fontSize: 11.5, color: T.txt2, fontWeight: 500 }}>
        Page <strong style={{ color: T.txt0 }}>{current}</strong> of <strong style={{ color: T.txt0 }}>{total}</strong>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Prev */}
        <button
          disabled={current === 1}
          onClick={() => current > 1 && onChange(current - 1)}
          onMouseEnter={() => setHoverPrev(true)}
          onMouseLeave={() => setHoverPrev(false)}
          style={{
            width: 32, height: 32, borderRadius: 9,
            border: `1px solid ${current === 1 ? T.bdr0 : hoverPrev ? T.accentB : T.bdr1}`,
            background: current === 1 ? T.bg2 : hoverPrev ? T.accentL : T.bg1,
            color: current === 1 ? T.txt2 : hoverPrev ? T.accent : T.txt1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: current === 1 ? 'not-allowed' : 'pointer',
            opacity: current === 1 ? 0.45 : 1,
            transition: 'all 0.15s', fontFamily: FONT,
          }}
        >
          <ChevronLeftIcon style={{ width: 14, height: 14 }} />
        </button>

        {start > 1 && (
          <>
            <PageBtn page={1} />
            {start > 2 && <span style={{ color: T.txt2, fontSize: 11, padding: '0 2px' }}>…</span>}
          </>
        )}
        {pages.map(p => <PageBtn key={p} page={p} />)}
        {end < total && (
          <>
            {end < total - 1 && <span style={{ color: T.txt2, fontSize: 11, padding: '0 2px' }}>…</span>}
            <PageBtn page={total} />
          </>
        )}

        {/* Next */}
        <button
          disabled={current === total}
          onClick={() => current < total && onChange(current + 1)}
          onMouseEnter={() => setHoverNext(true)}
          onMouseLeave={() => setHoverNext(false)}
          style={{
            width: 32, height: 32, borderRadius: 9,
            border: `1px solid ${current === total ? T.bdr0 : hoverNext ? T.accentB : T.bdr1}`,
            background: current === total ? T.bg2 : hoverNext ? T.accentL : T.bg1,
            color: current === total ? T.txt2 : hoverNext ? T.accent : T.txt1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: current === total ? 'not-allowed' : 'pointer',
            opacity: current === total ? 0.45 : 1,
            transition: 'all 0.15s', fontFamily: FONT,
          }}
        >
          <ChevronRightIcon style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
};

/* ─── Table header cell ── */
const TH = ({ children, width }) => (
  <th style={{ padding: '11px 16px', textAlign: 'left', whiteSpace: 'nowrap', width }}>
    <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#7A8BA8' }}>
      {children}
    </span>
  </th>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const FileList = ({
  files = [],
  isAdmin = false,
  onPreview,
  onReview,
  onShare,
  onDelete,
  onSendToAdmin,   // NEW: employee can re-send/upload file to admin
  onSelectFile,
  selectedFiles,
  selectable = false,
  viewMode = 'list',
  // Pagination — caller can control or let FileList manage internally
  externalPage,
  externalTotalPages,
  onExternalPageChange,
}) => {
  const T = isAdmin ? D : L;
  const [internalPage, setInternalPage] = useState(1);

  const controlled = externalPage !== undefined;
  const currentPage = controlled ? externalPage : internalPage;
  const setPage = controlled ? onExternalPageChange : setInternalPage;
  const totalPages = controlled ? (externalTotalPages || 1) : Math.ceil(files.length / PAGE_SIZE);
  const pagedFiles = controlled ? files : files.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset internal page if files change
  React.useEffect(() => { if (!controlled) setInternalPage(1); }, [files.length, controlled]);

  const allSelected = selectedFiles?.size === files.length && files.length > 0;
  const toggleSelectAll = () => {
    if (allSelected) files.forEach((f) => onSelectFile?.(f.id, false));
    else files.forEach((f) => onSelectFile?.(f.id, true));
  };

  if (!files.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 32px', gap: 16, fontFamily: FONT }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.accentL, border: `1px solid ${T.accentB}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DocumentTextIcon style={{ width: 26, height: 26, color: T.accent }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.txt0, margin: '0 0 5px', letterSpacing: '-0.015em' }}>
            {isAdmin ? 'No files found' : 'No files uploaded yet'}
          </p>
          <p style={{ fontSize: 12.5, color: T.txt2, margin: 0, lineHeight: 1.5 }}>
            {isAdmin ? 'Uploaded files from employees will appear here.' : 'Upload your first document using the Upload tab.'}
          </p>
        </div>
      </div>
    );
  }

  /* ── Grid / card view ── */
  if (viewMode === 'grid') {
    return (
      <div style={{ fontFamily: FONT }}>
        <style>{`
          @keyframes flPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
          @keyframes flFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        <div style={{ padding: '16px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {pagedFiles.map((file) => {
              const checked = !!selectedFiles?.has(file.id);
              return (
                <div key={file.id} style={{
                  borderRadius: 14, border: `1px solid ${checked ? T.accentB : T.bdr0}`,
                  background: checked ? T.accentL : T.bg1,
                  padding: '14px', display: 'flex', flexDirection: 'column', gap: 10,
                  boxShadow: '0 1px 4px rgba(15,23,42,0.04)', transition: 'all 0.15s',
                  animation: 'flFadeIn 0.2s ease-out both',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <FileTypeChip mimeType={file.mimeType} fileName={file.originalName} T={T} />
                    {selectable && <Checkbox checked={checked} onChange={() => onSelectFile(file.id)} T={T} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: T.txt0, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                      {file.originalName || 'Unnamed'}
                    </p>
                    <p style={{ fontSize: 10.5, color: T.txt2, margin: 0 }}>{getFriendlyFileType(file.mimeType, file.originalName)}</p>
                  </div>
                  {file.description && (
                    <p style={{ fontSize: 11.5, color: T.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.description}</p>
                  )}
                  {/* Admin sent indicator for employee */}
                  {!isAdmin && <AdminSentIndicator file={file} T={T} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: T.txt1, background: T.chipBg, border: `1px solid ${T.chipBdr}`, borderRadius: 6, padding: '2px 8px' }}>
                      {formatBytes(file.size)}
                    </span>
                    {isAdmin && <StatusBadge status={file.status} size="sm" dark={isAdmin} />}
                  </div>
                  <div style={{ borderTop: `1px solid ${T.bdr0}`, paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 10.5, color: T.txt1, margin: 0, fontWeight: 600 }}>{fmtDate(file.createdAt)}</p>
                      <p style={{ fontSize: 10, color: T.txt2, margin: '1px 0 0' }}>{fmtTime(file.createdAt)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {onPreview && <ActionBtn onClick={() => onPreview(file)} title="Preview" accentKey="preview" T={T}><EyeIcon style={{ width: 14, height: 14 }} /></ActionBtn>}
                      {!isAdmin && onShare && <ActionBtn onClick={() => onShare(file)} title="Share file" accentKey="share" T={T}><ShareIcon style={{ width: 14, height: 14 }} /></ActionBtn>}
                      {!isAdmin && onSendToAdmin && (
                        <ActionBtn onClick={() => onSendToAdmin(file)} title="Send to Admin" accentKey="send" T={T} pulse>
                          <PaperAirplaneIcon style={{ width: 13, height: 13 }} />
                        </ActionBtn>
                      )}
                      {isAdmin && onReview && <ActionBtn onClick={() => onReview(file)} title="Review file" accentKey="review" T={T}><CheckCircleIcon style={{ width: 14, height: 14 }} /></ActionBtn>}
                      {onDelete && <ActionBtn onClick={() => onDelete(file)} title="Delete file" accentKey="delete" T={T}><TrashIcon style={{ width: 14, height: 14 }} /></ActionBtn>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Pagination current={currentPage} total={totalPages} onChange={setPage} T={T} />
      </div>
    );
  }

  /* ── List / table view ── */
  return (
    <div style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes flPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes flFadeIn { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes flRowIn  { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
      `}</style>



      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.bdr1}`, background: T.headBg }}>
              {selectable && <th style={{ padding: '11px 16px 11px 20px', width: 36 }}><Checkbox checked={allSelected} onChange={toggleSelectAll} T={T} /></th>}
              <TH>#</TH>
              {isAdmin && <TH>Employee</TH>}
              <TH>File</TH>
              <TH>Notes</TH>
              <TH>Date · Time</TH>
              <TH>Size</TH>
              {!isAdmin && <TH>Admin Status</TH>}
              {isAdmin && <TH>Status</TH>}
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {pagedFiles.map((file, idx) => {
              const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
              const checked = !!selectedFiles?.has(file.id);
              const typeKey = getTypeKey(file.mimeType, file.originalName);
              const ts = (FILE_TYPE_STYLES(T))[typeKey] || FILE_TYPE_STYLES(T).other;
              const isRejected = file.status === 'rejected';

              return (
                <tr
                  key={file.id}
                  style={{
                    borderBottom: idx < pagedFiles.length - 1 ? `1px solid ${T.bdr0}` : 'none',
                    transition: 'background 0.14s',
                    background: isRejected
                      ? 'rgba(244,63,94,0.03)'
                      : checked ? T.accentL : 'transparent',
                    animation: `flRowIn 0.18s ease-out ${idx * 0.03}s both`,
                  }}
                  onMouseEnter={(e) => { if (!checked && !isRejected) e.currentTarget.style.background = T.rowHov; }}
                  onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = isRejected ? 'rgba(244,63,94,0.03)' : 'transparent'; }}
                >
                  {selectable && (
                    <td style={{ padding: '12px 16px 12px 20px' }}>
                      <Checkbox checked={checked} onChange={() => onSelectFile(file.id)} T={T} />
                    </td>
                  )}

                  {/* Row number */}
                  <td style={{ padding: '12px 8px 12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.txt2, background: T.chipBg, border: `1px solid ${T.chipBdr}`, borderRadius: 6, padding: '2px 7px' }}>
                      {rowNum}
                    </span>
                  </td>

                  {/* Admin — Employee column */}
                  {isAdmin && (
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {file.userName || 'Unknown'}
                        </p>
                        <p style={{ fontSize: 10.5, color: T.txt2, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {file.userEmail || '—'}
                        </p>
                      </div>
                    </td>
                  )}

                  {/* File */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileTypeChip mimeType={file.mimeType} fileName={file.originalName} T={T} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.txt0, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, letterSpacing: '-0.01em' }}>
                          {file.originalName || 'Unnamed'}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ts.color, background: ts.bg, border: `1px solid ${ts.border}`, borderRadius: 5, padding: '1px 6px' }}>
                          {getFriendlyFileType(file.mimeType, file.originalName)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Notes */}
                  <td style={{ padding: '12px 16px', maxWidth: 160 }}>
                    {file.description ? (
                      <p style={{ fontSize: 11.5, color: T.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.description}</p>
                    ) : (
                      <span style={{ fontSize: 11, color: T.txt2, fontStyle: 'italic' }}>No notes</span>
                    )}
                    {/* Admin note for employee view */}
                    {!isAdmin && file.adminNote && (
                      <p style={{ fontSize: 10.5, color: T.accent, margin: '3px 0 0', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                        Admin: {file.adminNote}
                      </p>
                    )}
                  </td>

                  {/* Date + Time */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <p style={{ fontSize: 11.5, fontWeight: 600, color: T.txt1, margin: 0 }}>{fmtDate(file.createdAt)}</p>
                    <span style={{ background: T.chipBg, border: `1px solid ${T.chipBdr}`, borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 700, color: T.txt1 }}>
                      {fmtTime(file.createdAt)}
                    </span>
                  </td>

                  {/* Size */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.txt1, background: T.chipBg, border: `1px solid ${T.chipBdr}`, borderRadius: 6, padding: '2px 8px' }}>
                      {formatBytes(file.size)}
                    </span>
                  </td>

                  {/* Admin status — employee view shows rich indicator */}
                  {!isAdmin && (
                    <td style={{ padding: '12px 16px' }}>
                      <AdminSentIndicator file={file} T={T} />
                    </td>
                  )}

                  {/* Status — admin view */}
                  {isAdmin && (
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={file.status} dark={isAdmin} />
                    </td>
                  )}

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {onPreview && (
                        <ActionBtn onClick={() => onPreview(file)} title="Preview file" accentKey="preview" T={T}>
                          <EyeIcon style={{ width: 14, height: 14 }} />
                        </ActionBtn>
                      )}
                      {/* Share — employee only */}
                      {!isAdmin && onShare && (
                        <ActionBtn onClick={() => onShare(file)} title="Share file" accentKey="share" T={T}>
                          <ShareIcon style={{ width: 14, height: 14 }} />
                        </ActionBtn>
                      )}
                      {/* Send to Admin — employee only */}
                      {!isAdmin && onSendToAdmin && (
                        <ActionBtn
                          onClick={() => onSendToAdmin(file)}
                          title="Send to Admin"
                          accentKey="send"
                          T={T}
                          pulse={file.status === 'rejected'}
                        >
                          <PaperAirplaneIcon style={{ width: 13, height: 13 }} />
                        </ActionBtn>
                      )}
                      {/* Review — admin only */}
                      {isAdmin && onReview && (
                        <ActionBtn onClick={() => onReview(file)} title="Review file" accentKey="review" T={T}>
                          <CheckCircleIcon style={{ width: 14, height: 14 }} />
                        </ActionBtn>
                      )}
                      {onDelete && (
                        <ActionBtn onClick={() => onDelete(file)} title="Delete file" accentKey="delete" T={T}>
                          <TrashIcon style={{ width: 14, height: 14 }} />
                        </ActionBtn>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination current={currentPage} total={totalPages} onChange={setPage} T={T} />
    </div>
  );
};

export default FileList;