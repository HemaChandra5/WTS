// src/components/ReviewModal.jsx
import React, { useState, useEffect } from 'react';
import {
  XMarkIcon, CheckCircleIcon, XCircleIcon, EyeIcon,
  DocumentTextIcon, UserCircleIcon, CalendarDaysIcon, ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';

const T = {
  surface: '#FFFFFF',
  surface2: 'rgba(15,23,42,0.022)',
  bdr0: 'rgba(15,23,42,0.045)',
  bdr1: 'rgba(15,23,42,0.085)',
  bdr2: 'rgba(15,23,42,0.15)',
  txt0: '#0D1526',
  txt1: '#3D4F6B',
  txt2: '#7A8BA8',
  accent: '#3454D1', accentL: 'rgba(52,84,209,0.09)', accentB: 'rgba(52,84,209,0.22)', accentM: 'rgba(52,84,209,0.14)',
  emerald: '#0E9F6E', emeraldD: 'rgba(14,159,110,0.09)', emeraldB: 'rgba(14,159,110,0.22)',
  rose: '#C23552', roseD: 'rgba(194,53,82,0.07)', roseB: 'rgba(194,53,82,0.22)',
};

const FONT = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '0 B';
  const s = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${s[i]}`;
};

const InfoRow = ({ icon: Icon, children, span2 }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, gridColumn: span2 ? 'span 2' : undefined }}>
    <Icon style={{ width: 13, height: 13, color: T.txt2, flexShrink: 0, marginTop: 1 }} />
    <span style={{ fontSize: 12, color: T.txt1, minWidth: 0 }}>{children}</span>
  </div>
);

const ReviewModal = ({ file, open, onClose, onUpdateStatus }) => {
  const [adminNote, setAdminNote] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [noteFocus, setNoteFocus] = useState(false);
  const [closeHov, setCloseHov] = useState(false);
  const [reviewingHov, setReviewingHov] = useState(false);

  useEffect(() => {
    if (file) { setAdminNote(file.adminNote || ''); setConfirming(null); }
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

  const uploadedAt = file.createdAt ? new Date(file.createdAt).toLocaleString() : '—';
  const reviewedAt = file.reviewedAt ? new Date(file.reviewedAt).toLocaleString() : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: FONT,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(13,21,38,0.55)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 480,
        borderRadius: 20, background: T.surface, border: `1px solid ${T.bdr1}`,
        boxShadow: '0 32px 80px rgba(13,21,38,0.30), 0 8px 24px rgba(13,21,38,0.10)',
        overflow: 'hidden',
        animation: 'rmIn 0.22s cubic-bezier(.16,1,.3,1)',
      }}>
        <style>{`@keyframes rmIn { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.bdr0}`, background: T.surface2, padding: '16px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: T.accentL,
              border: `1px solid ${T.accentB}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <DocumentTextIcon style={{ width: 17, height: 17, color: T.accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.txt0, margin: 0, letterSpacing: '-0.015em' }}>Review File</h2>
              <p style={{ fontSize: 11, color: T.txt2, margin: '2px 0 0', fontWeight: 500 }}>Approve, reject, or mark as under review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHov(true)}
            onMouseLeave={() => setCloseHov(false)}
            style={{
              display: 'flex', height: 30, width: 30, alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
              background: closeHov ? 'rgba(15,23,42,0.07)' : 'transparent',
            }}
          >
            <XMarkIcon style={{ width: 15, height: 15, color: T.txt1 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* File info card */}
          <div style={{
            borderRadius: 14, border: `1px solid ${T.bdr0}`, background: T.surface2,
            padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 11,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.txt0, margin: 0, wordBreak: 'break-all', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                {file.originalName}
              </p>
              <StatusBadge status={file.status} size="sm" dark />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoRow icon={UserCircleIcon}>{file.userName}</InfoRow>
              <InfoRow icon={DocumentTextIcon}>{formatBytes(file.size)}</InfoRow>
              <InfoRow icon={CalendarDaysIcon} span2>Uploaded {uploadedAt}</InfoRow>
              {reviewedAt && <InfoRow icon={EyeIcon} span2>Last reviewed {reviewedAt}</InfoRow>}
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
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: T.txt2, marginBottom: 7,
            }}>
              Admin note{' '}
              <span style={{ fontWeight: 500, textTransform: 'none', color: T.txt2, opacity: 0.8 }}>
                (visible to employee)
              </span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="e.g. 'Missing page 3' or 'Looks good, approved!'"
              onFocus={() => setNoteFocus(true)}
              onBlur={() => setNoteFocus(false)}
              style={{
                width: '100%', borderRadius: 12, resize: 'none', outline: 'none', boxSizing: 'border-box',
                border: `1px solid ${noteFocus ? T.accentB : T.bdr1}`,
                background: noteFocus ? '#FFFFFF' : T.surface2,
                padding: '10px 13px', fontSize: 13, color: T.txt0, fontFamily: 'inherit',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: noteFocus ? `0 0 0 3px ${T.accentL}` : 'none',
              }}
            />
          </div>

          {/* Confirm hint */}
          {confirming && (
            <div style={{
              borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 600,
              border: `1px solid ${confirming === 'approved' ? T.emeraldB : T.roseB}`,
              background: confirming === 'approved' ? T.emeraldD : T.roseD,
              color: confirming === 'approved' ? T.emerald : T.rose,
              animation: 'rmHint 0.18s ease-out',
            }}>
              <style>{`@keyframes rmHint { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }`}</style>
              Click <strong>{confirming === 'approved' ? 'Approve' : 'Reject'}</strong> again to confirm.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          borderTop: `1px solid ${T.bdr0}`, background: T.surface2, padding: '16px 22px',
        }}>
          {/* Mark reviewing */}
          <ReviewingBtn
            onClick={handleReviewing}
            disabled={file.status === 'reviewing'}
            T={T}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ActionButton
              onClick={() => handleAction('rejected')}
              active={confirming === 'rejected'}
              activeColor={T.rose}
              activeBg={T.roseD}
              activeBorder={T.roseB}
              label="Reject"
              activeLabel="Confirm reject"
              icon={<XCircleIcon style={{ width: 13, height: 13 }} />}
            />
            <ActionButton
              onClick={() => handleAction('approved')}
              active={confirming === 'approved'}
              activeColor={T.emerald}
              activeBg={T.emeraldD}
              activeBorder={T.emeraldB}
              label="Approve"
              activeLabel="Confirm approve"
              icon={<CheckCircleIcon style={{ width: 13, height: 13 }} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewingBtn = ({ onClick, disabled, T }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, borderRadius: 11,
        padding: '8px 14px', fontSize: 12, fontWeight: 700,
        border: `1px solid ${T.accentB}`,
        background: disabled ? 'rgba(52,84,209,0.04)' : (hov ? T.accentM : T.accentL),
        color: T.accent,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
    >
      <EyeIcon style={{ width: 13, height: 13 }} />
      Mark reviewing
    </button>
  );
};

const ActionButton = ({ onClick, active, activeColor, activeBg, activeBorder, label, activeLabel, icon }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, borderRadius: 11,
        padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.15s', fontFamily: 'inherit',
        border: active ? 'none' : `1px solid ${activeBorder}`,
        background: active ? activeColor : (hov ? activeBg : `${activeBg}88`),
        color: active ? '#fff' : activeColor,
        transform: active ? 'scale(1.04)' : 'scale(1)',
        boxShadow: active ? `0 4px 14px ${activeBg}` : 'none',
      }}
    >
      {icon}
      {active ? activeLabel : label}
    </button>
  );
};

export default ReviewModal;