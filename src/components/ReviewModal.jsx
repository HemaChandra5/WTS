// src/components/ReviewModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';

/* ─── Obsidian-Slate dark tokens ─────────────────────────────────────── */
const T = {
  glass:    'rgba(20,20,22,0.55)',
  surface:  '#161618',
  surface2: '#1c1c1f',
  bdr0:     'rgba(255,255,255,0.05)',
  bdr1:     'rgba(255,255,255,0.09)',
  bdr2:     'rgba(255,255,255,0.15)',
  txt0:     '#f5f6fa',
  txt1:     '#9aa1b8',
  txt2:     '#5c6178',
  accent:   '#5b8def',
  accentL:  'rgba(91,141,239,0.14)',
  emerald:  '#34d399',
  emeraldL: 'rgba(52,211,153,0.12)',
  rose:     '#f0708a',
  roseL:    'rgba(240,112,138,0.12)',
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const ReviewModal = ({ file, open, onClose, onUpdateStatus }) => {
  const [adminNote, setAdminNote] = useState('');
  const [confirming, setConfirming] = useState(null); // 'approved' | 'rejected'
  const [noteFocus, setNoteFocus] = useState(false);
  const [closeHov, setCloseHov] = useState(false);
  const [reviewingHov, setReviewingHov] = useState(false);

  useEffect(() => {
    if (file) {
      setAdminNote(file.adminNote || '');
      setConfirming(null);
    }
  }, [file]);

  if (!open || !file) return null;

  const handleAction = (status) => {
    if (confirming === status) {
      onUpdateStatus(file.id, status, adminNote.trim());
      onClose();
    } else {
      setConfirming(status);
    }
  };

  const handleReviewing = () => {
    onUpdateStatus(file.id, 'reviewing', adminNote.trim());
    onClose();
  };

  const uploadedAt = file.createdAt
    ? new Date(file.createdAt).toLocaleString()
    : '—';

  const reviewedAt = file.reviewedAt
    ? new Date(file.reviewedAt).toLocaleString()
    : null;

  const InfoRow = ({ icon: Icon, children, span2 }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, gridColumn: span2 ? 'span 2' : undefined }}>
      <Icon style={{ width: 13, height: 13, color: T.txt2, flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: T.txt1, minWidth: 0 }}>{children}</span>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 480,
        borderRadius: 22, background: T.surface, border: `1px solid ${T.bdr1}`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.65)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.bdr1}`, background: T.surface2, padding: '16px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: T.accentL,
              border: `1px solid rgba(91,141,239,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <DocumentTextIcon style={{ width: 18, height: 18, color: T.accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.txt0, margin: 0 }}>Review File</h2>
              <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0' }}>Approve, reject, or mark as under review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHov(true)}
            onMouseLeave={() => setCloseHov(false)}
            style={{
              display: 'flex', height: 30, width: 30, alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
              background: closeHov ? 'rgba(255,255,255,0.08)' : 'transparent',
            }}
          >
            <XMarkIcon style={{ width: 15, height: 15, color: T.txt1 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* File info card */}
          <div style={{
            borderRadius: 16, border: `1px solid ${T.bdr0}`, background: 'rgba(255,255,255,0.025)',
            padding: 14, display: 'flex', flexDirection: 'column', gap: 11,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0, wordBreak: 'break-all', lineHeight: 1.4 }}>
                {file.originalName}
              </p>
              <StatusBadge status={file.status} size="sm" dark />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoRow icon={UserCircleIcon}>{file.userName}</InfoRow>
              <InfoRow icon={DocumentTextIcon}>{formatBytes(file.size)}</InfoRow>
              <InfoRow icon={CalendarDaysIcon} span2>Uploaded {uploadedAt}</InfoRow>
              {reviewedAt && (
                <InfoRow icon={EyeIcon} span2>Last reviewed {reviewedAt}</InfoRow>
              )}
              {file.description && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, gridColumn: 'span 2' }}>
                  <ChatBubbleLeftIcon style={{ width: 13, height: 13, color: T.txt2, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: T.txt2, fontStyle: 'italic' }}>"{file.description}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.txt2, marginBottom: 7 }}>
              Admin note{' '}
              <span style={{ fontWeight: 500, textTransform: 'none', color: T.txt2, opacity: 0.7 }}>(visible to employee)</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Add a note for the employee, e.g. 'Missing page 3' or 'All good, approved!'"
              onFocus={() => setNoteFocus(true)}
              onBlur={() => setNoteFocus(false)}
              style={{
                width: '100%', borderRadius: 12, resize: 'none', outline: 'none', boxSizing: 'border-box',
                border: `1px solid ${noteFocus ? 'rgba(91,141,239,0.45)' : T.bdr1}`,
                background: 'rgba(255,255,255,0.03)',
                padding: '10px 13px', fontSize: 13, color: T.txt0,
                fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: noteFocus ? '0 0 0 3px rgba(91,141,239,0.14)' : 'none',
              }}
            />
            <style>{`textarea::placeholder { color: ${T.txt2}; opacity: 0.8; }`}</style>
          </div>

          {/* Confirm hint */}
          {confirming && (
            <div style={{
              borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 500,
              border: `1px solid ${confirming === 'approved' ? 'rgba(52,211,153,0.30)' : 'rgba(240,112,138,0.30)'}`,
              background: confirming === 'approved' ? T.emeraldL : T.roseL,
              color: confirming === 'approved' ? T.emerald : T.rose,
            }}>
              Click <strong>{confirming === 'approved' ? 'Approve' : 'Reject'}</strong> again to confirm this action.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          borderTop: `1px solid ${T.bdr1}`, background: T.surface2, padding: '16px 22px',
        }}>
          {/* Mark reviewing */}
          <button
            onClick={handleReviewing}
            disabled={file.status === 'reviewing'}
            onMouseEnter={() => setReviewingHov(true)}
            onMouseLeave={() => setReviewingHov(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, borderRadius: 11,
              padding: '8px 14px', fontSize: 12, fontWeight: 700,
              border: '1px solid rgba(91,141,239,0.30)',
              background: file.status === 'reviewing' ? 'rgba(91,141,239,0.05)' : (reviewingHov ? 'rgba(91,141,239,0.20)' : T.accentL),
              color: T.accent,
              cursor: file.status === 'reviewing' ? 'not-allowed' : 'pointer',
              opacity: file.status === 'reviewing' ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            <EyeIcon style={{ width: 13, height: 13 }} />
            Mark reviewing
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Reject */}
            <button
              onClick={() => handleAction('rejected')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, borderRadius: 11,
                padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
                border: confirming === 'rejected' ? 'none' : '1px solid rgba(240,112,138,0.30)',
                background: confirming === 'rejected' ? T.rose : T.roseL,
                color: confirming === 'rejected' ? '#1a1a1c' : T.rose,
                transform: confirming === 'rejected' ? 'scale(1.04)' : 'scale(1)',
                boxShadow: confirming === 'rejected' ? '0 4px 14px rgba(240,112,138,0.30)' : 'none',
              }}
            >
              <XCircleIcon style={{ width: 13, height: 13 }} />
              {confirming === 'rejected' ? 'Confirm reject' : 'Reject'}
            </button>

            {/* Approve */}
            <button
              onClick={() => handleAction('approved')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, borderRadius: 11,
                padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
                border: confirming === 'approved' ? 'none' : '1px solid rgba(52,211,153,0.30)',
                background: confirming === 'approved' ? T.emerald : T.emeraldL,
                color: confirming === 'approved' ? '#0a1410' : T.emerald,
                transform: confirming === 'approved' ? 'scale(1.04)' : 'scale(1)',
                boxShadow: confirming === 'approved' ? '0 4px 14px rgba(52,211,153,0.30)' : 'none',
              }}
            >
              <CheckCircleIcon style={{ width: 13, height: 13 }} />
              {confirming === 'approved' ? 'Confirm approve' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;