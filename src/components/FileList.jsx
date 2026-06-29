// src/components/FileList.jsx
import React from 'react';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';
import { api } from '../api';
import { buildDownloadFileName } from '../utils/exportUtils';

/* ─── Executive Light tokens (admin) — identical to AdminDashboard.jsx ──── */
const D = {
  bg1: '#FFFFFF',
  bdr0: 'rgba(15,23,42,0.06)',
  bdr1: 'rgba(15,23,42,0.10)',
  bdr2: 'rgba(15,23,42,0.16)',
  txt0: '#0F1729',
  txt1: '#5B6478',
  txt2: '#94A0B8',
  rowHov: 'rgba(15,23,42,0.025)',
  headBg: 'rgba(15,23,42,0.03)',
  chipBg: 'rgba(15,23,42,0.04)',
  chipBdr: 'rgba(15,23,42,0.09)',
  emptyBg: 'rgba(15,23,42,0.025)',
  emptyBdr: 'rgba(15,23,42,0.14)',
  accent: '#3454D1', accentL: 'rgba(52,84,209,0.10)', accentB: 'rgba(52,84,209,0.26)',
  emerald: '#0E9F6E', emeraldD: 'rgba(14,159,110,0.10)', emeraldB: 'rgba(14,159,110,0.26)',
  amber: '#B7791F', amberD: 'rgba(183,121,31,0.10)', amberB: 'rgba(183,121,31,0.26)',
  violet: '#6D4FE0', violetD: 'rgba(109,79,224,0.10)', violetB: 'rgba(109,79,224,0.26)',
  rose: '#C23552', roseD: 'rgba(194,53,82,0.08)', roseB: 'rgba(194,53,82,0.26)',
};

/* ─── Light SaaS tokens (employee) — identical to EmployeeDashboard.jsx ── */
const L = {
  bg1: '#FFFFFF',
  bdr0: 'rgba(15,23,42,0.06)',
  bdr1: 'rgba(15,23,42,0.10)',
  bdr2: 'rgba(15,23,42,0.16)',
  txt0: '#0F172A',
  txt1: '#475569',
  txt2: '#64748B',
  rowHov: 'rgba(15,23,42,0.03)',
  headBg: 'rgba(15,23,42,0.045)',
  chipBg: 'rgba(15,23,42,0.05)',
  chipBdr: 'rgba(15,23,42,0.10)',
  emptyBg: 'rgba(15,23,42,0.03)',
  emptyBdr: 'rgba(15,23,42,0.16)',
  accent: '#4F46E5', accentL: 'rgba(79,70,229,0.12)', accentB: 'rgba(79,70,229,0.28)',
  emerald: '#10B981', emeraldD: 'rgba(16,185,129,0.12)', emeraldB: 'rgba(16,185,129,0.28)',
  amber: '#F59E0B', amberD: 'rgba(245,158,11,0.14)', amberB: 'rgba(245,158,11,0.30)',
  violet: '#8B5CF6', violetD: 'rgba(139,92,246,0.14)', violetB: 'rgba(139,92,246,0.30)',
  rose: '#F43F5E', roseD: 'rgba(244,63,94,0.12)', roseB: 'rgba(244,63,94,0.28)',
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

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = bytes;
  while (v >= 1024 && i < sizes.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${sizes[i]}`;
};

/* File-type accent colors — same hue family across both themes, tuned per theme for contrast */
const FILE_TYPE_STYLES = (T) => ({
  pdf:   { bg: T.roseD,   border: T.roseB,   color: T.rose,   label: 'PDF' },
  word:  { bg: T.accentL, border: T.accentB, color: T.accent, label: 'DOC' },
  sheet: { bg: T.emeraldD, border: T.emeraldB, color: T.emerald, label: 'XLS' },
  ppt:   { bg: T.amberD,  border: T.amberB,  color: T.amber,  label: 'PPT' },
  image: { bg: T.violetD, border: T.violetB, color: T.violet, label: 'IMG' },
  other: { bg: T.chipBg,  border: T.chipBdr, color: T.txt1,   label: 'FILE' },
});

const getFileTypeStyle = (mimeType = '', fileName = '', T) => {
  const styles = FILE_TYPE_STYLES(T);
  const type = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return styles.pdf;
  if (type.includes('word') || name.match(/\.(doc|docx)$/)) return styles.word;
  if (type.includes('sheet') || type.includes('excel') || name.match(/\.(xls|xlsx)$/)) return styles.sheet;
  if (type.includes('presentation') || name.match(/\.(ppt|pptx)$/)) return styles.ppt;
  if (type.includes('image')) return styles.image;
  return styles.other;
};

const FileIcon = ({ mimeType = '', fileName = '', T, size = 40 }) => {
  const type = mimeType.toLowerCase();
  const s = getFileTypeStyle(mimeType, fileName, T);

  if (type.includes('image')) {
    return (
      <div style={{ width: size, height: size, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <PhotoIcon style={{ width: size * 0.5, height: size * 0.5, color: s.color }} />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.225, fontWeight: 800, color: s.color, letterSpacing: '0.04em', fontFamily: 'inherit' }}>{s.label}</span>
    </div>
  );
};

const ActionBtn = ({ onClick, title, children, accent, T }) => {
  const [hov, setHov] = React.useState(false);

  const ACCENTS = {
    blue:    { bg: T.accentL, border: T.accentB, color: T.accent },
    green:   { bg: T.emeraldD, border: T.emeraldB, color: T.emerald },
    amber:   { bg: T.amberD,  border: T.amberB,  color: T.amber },
    indigo:  { bg: T.violetD, border: T.violetB, color: T.violet },
    default: { bg: T.chipBg,  border: T.chipBdr, color: T.txt1 },
  };
  const a = ACCENTS[accent] || ACCENTS.default;

  return (
    <button
      onClick={onClick}
      title={title}
      type="button"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36, borderRadius: 12,
        border: `1px solid ${hov ? a.border : T.bdr1}`,
        background: hov ? a.bg : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        color: hov ? a.color : T.txt0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.16s ease',
        boxShadow: hov ? `0 8px 20px ${a.bg}` : '0 4px 10px rgba(15,23,42,0.05)',
      }}
    >
      {children}
    </button>
  );
};

const FileList = ({
  files = [],
  isAdmin = false,
  viewMode = 'list',
  onPreview,
  onStatusChange,
  onReview,
  onDownload,
  selectedFiles,
  onSelectFile,
}) => {
  const T = isAdmin ? D : L;

  const getFileUrl = (file) => file?.url || file?.downloadUrl || null;

  const triggerBlobDownload = (blob, fileName) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  };

  const downloadViaApi = async (file) => {
    if (!file?.id) return false;

    try {
      const response = await api.get(`/files/${file.id}/download/`, {
        responseType: 'blob',
      });

      if (!(response.data instanceof Blob)) {
        return false;
      }

      triggerBlobDownload(response.data, buildDownloadFileName({ name: file.originalName || file.fileName || 'download', extension: (file.originalName || file.fileName || '').split('.').pop() || 'bin' }));
      return true;
    } catch (error) {
      return false;
    }
  };

  const defaultDownload = async (file) => {
    const fileUrl = getFileUrl(file);
    if (!fileUrl) {
      window.alert('This file cannot be downloaded because its storage link is missing.');
      return;
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = buildDownloadFileName({ name: file.originalName || file.fileName || 'download', extension: (file.originalName || file.fileName || '').split('.').pop() || 'bin' });
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (file) => {
    if (typeof onDownload === 'function') {
      await onDownload(file);
      return;
    }

    const downloadedFromApi = await downloadViaApi(file);
    if (downloadedFromApi) return;

    await defaultDownload(file);
  };

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

  const ActionsRow = ({ file }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <ActionBtn onClick={() => onPreview?.(file)} title="Preview file" accent="blue" T={T}>
        <EyeIcon style={{ width: 15, height: 15 }} />
      </ActionBtn>
      <ActionBtn onClick={() => handleDownload(file)} title="Download file" accent="amber" T={T}>
        <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
      </ActionBtn>
      {isAdmin && file.status !== 'approved' && (
        <ActionBtn onClick={() => onReview?.(file)} title="Review file" accent="indigo" T={T}>
          <CheckCircleIcon style={{ width: 15, height: 15 }} />
        </ActionBtn>
      )}
    </div>
  );

  /* ── Grid view (cards) ── */
  if (viewMode === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, padding: 20 }}>
        {files.map((file, idx) => {
          return (
            <div
              key={file.id}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.bdr2; e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.bdr1; e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                borderRadius: 14, border: `1px solid ${T.bdr1}`, background: T.bg1,
                padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <FileIcon mimeType={file.mimeType} fileName={file.originalName} T={T} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                      {file.originalName || 'Unnamed'}
                    </p>
                    <p style={{ fontSize: 10.5, color: T.txt1, margin: '1px 0 0' }}>
                      {getFriendlyFileType(file.mimeType, file.originalName)}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.txt2, background: T.chipBg, border: `1px solid ${T.chipBdr}`, borderRadius: 999, padding: '4px 8px' }}>#{idx + 1}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.txt1, background: T.chipBg, border: `1px solid ${T.chipBdr}`, borderRadius: 6, padding: '2px 8px' }}>
                  {formatBytes(file.size)}
                </span>
                {isAdmin && <StatusBadge status={file.status} size="sm" dark={isAdmin} />}
              </div>

              <div style={{ borderTop: `1px solid ${T.bdr0}`, paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10.5, color: T.txt2 }}>
                  {file.createdAt ? new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </span>
                <ActionsRow file={file} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── List view (table) ── */
  const TH = ({ children, width }) => (
    <th style={{ padding: '12px 16px', textAlign: 'left', whiteSpace: 'nowrap', width }}>
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
            <TH width={48}>#</TH>
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
            const checked = !!selectedFiles?.has(file.id);

            return (
              <tr
                key={file.id}
                style={{
                  borderBottom: idx < files.length - 1 ? `1px solid ${T.bdr0}` : 'none',
                  transition: 'background 0.15s',
                  background: checked ? T.accentL : 'transparent',
                }}
                onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = T.rowHov; }}
                onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '14px 16px', width: 48 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.txt1, background: T.chipBg, border: `1px solid ${T.chipBdr}`, borderRadius: 999, padding: '4px 8px', display: 'inline-flex', minWidth: 28, justifyContent: 'center' }}>
                    {idx + 1}
                  </span>
                </td>

                {/* User */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                      {file.userName || 'Unknown'}
                    </p>
                    <p style={{ fontSize: 10, color: T.txt1, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                      {file.userEmail || 'N/A'}
                    </p>
                  </div>
                </td>

                {/* File */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileIcon mimeType={file.mimeType} fileName={file.originalName} T={T} />
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
                  <p style={{ fontSize: 12, color: T.txt0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.description || <span style={{ color: T.txt2 }}>—</span>}
                  </p>
                </td>

                {/* Date */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.txt0, margin: 0 }}>{fileDate}</p>
                </td>

                {/* Time */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.txt0, margin: 0 }}>{fileTime}</p>
                </td>

                {/* Size */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: T.txt0,
                    background: T.chipBg, border: `1px solid ${T.chipBdr}`,
                    borderRadius: 6, padding: '2px 8px',
                  }}>{formatBytes(file.size)}</span>
                </td>

                {/* Status (Admin) */}
                {isAdmin && (
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={file.status} dark={isAdmin} />
                  </td>
                )}

                {/* Actions */}
                <td style={{ padding: '14px 16px' }}>
                  <ActionsRow file={file} />
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