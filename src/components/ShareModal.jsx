// src/components/ShareModal.jsx
import React, { useState } from 'react';
import { XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';

/* ─── Ivory/gold employee tokens ────────────────────────────────────── */
const L = {
  border:   'rgba(212,175,122,0.20)',
  txt0:     '#1c1917',
  txt1:     '#78716c',
  txt2:     '#a8a29e',
  accent:   '#a8761e',
  accentL:  'rgba(168,118,30,0.07)',
  surface:  '#fffefb',
};

const ShareModal = ({ file, open, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [closeHov, setCloseHov] = useState(false);

  if (!open || !file) return null;

  const shareUrl = `https://your-company.example.com/share/${file.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(40,32,18,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw', maxWidth: 420, borderRadius: 18, background: L.surface,
          padding: 22, boxShadow: '0 30px 80px rgba(120,98,53,0.30)',
          border: `1px solid ${L.border}`,
        }}
      >
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: L.txt0, margin: 0 }}>
              Share this document
            </h2>
            <p style={{ marginTop: 5, fontSize: 11.5, color: L.txt2, lineHeight: 1.5 }}>
              Generate a share link to send this file to HR or your manager.
              (Actual access control will be handled in backend.)
            </p>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHov(true)}
            onMouseLeave={() => setCloseHov(false)}
            style={{
              borderRadius: '50%', border: `1px solid ${L.border}`, padding: 7,
              color: L.txt1, cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
              background: closeHov ? 'rgba(212,175,122,0.12)' : 'transparent',
            }}
          >
            <XMarkIcon style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div style={{ borderRadius: 14, background: 'rgba(212,175,122,0.06)', border: `1px solid ${L.border}`, padding: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon style={{ width: 15, height: 15, color: L.accent, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: L.txt0, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.originalName}
            </span>
          </div>
          <p style={{ marginTop: 5, fontSize: 11.5, color: L.txt2 }}>
            {file.description || 'No description provided.'}
          </p>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ marginBottom: 6, display: 'block', fontSize: 11.5, fontWeight: 700, color: L.txt1 }}>
            Shareable link
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              style={{
                flex: 1, borderRadius: 999, border: `1px solid ${L.border}`,
                padding: '7px 13px', fontSize: 11.5, color: L.txt1,
                background: 'rgba(212,175,122,0.04)', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={copyLink}
              style={{
                borderRadius: 999, background: copied ? '#059669' : L.accent,
                padding: '7px 16px', fontSize: 11.5, fontWeight: 700, color: '#fff',
                border: 'none', cursor: 'pointer', transition: 'background 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <p style={{ marginTop: 14, fontSize: 11.5, color: L.txt2, lineHeight: 1.5 }}>
          In a real deployment you can extend this panel to send the link by
          email, restrict access per user, or set expiry dates.
        </p>
      </div>
    </div>
  );
};

export default ShareModal;