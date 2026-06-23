// src/components/ShareModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, LinkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useFiles } from '../context/FilesContext';

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

const ShareModal = ({ file, open, onClose, onShared }) => {
  const { fetchShareTargets, shareFileWithUsers } = useFiles();
  const [targets, setTargets] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [closeHov, setCloseHov] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setTargets([]);
      setQuery('');
      setSelectedIds([]);
      setError('');
      setSuccessMessage('');
      return;
    }

    const loadTargets = async () => {
      setLoadingTargets(true);
      setError('');
      const result = await fetchShareTargets();
      if (!result?.success) {
        setError(result?.error || 'Failed to load users');
        setTargets([]);
      } else {
        setTargets(Array.isArray(result.users) ? result.users : []);
      }
      setLoadingTargets(false);
    };

    loadTargets();
  }, [open, file, fetchShareTargets]);

  if (!open || !file) return null;

  const shareUrl = file.url || `${window.location.origin}/files/${file.id}`;

  const filteredTargets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return targets;

    return targets.filter((user) => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const role = (user.role || '').toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [targets, query]);

  const toggleUserSelection = (userId) => {
    const idAsString = String(userId);
    setSelectedIds((prev) =>
      prev.includes(idAsString)
        ? prev.filter((id) => id !== idAsString)
        : [...prev, idAsString]
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (!selectedIds.length || !file?.id) {
      setError('Select at least one user to share.');
      return;
    }

    setSharing(true);
    setError('');
    setSuccessMessage('');

    const result = await shareFileWithUsers(file.id, selectedIds);
    setSharing(false);

    if (!result?.success) {
      setError(result?.error || 'Failed to share file');
      return;
    }

    const message = `File shared with ${selectedIds.length} user${selectedIds.length > 1 ? 's' : ''}.`;
    setSuccessMessage(message);
    onShared?.(message);
    setSelectedIds([]);
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
              Share this file securely with specific users. Access is enforced by backend permissions.
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

        <div style={{ marginTop: 14 }}>
          <label style={{ marginBottom: 6, display: 'block', fontSize: 11.5, fontWeight: 700, color: L.txt1 }}>
            Share with users
          </label>

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: L.txt2 }} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, role"
              style={{
                width: '100%',
                borderRadius: 10,
                border: `1px solid ${L.border}`,
                padding: '8px 10px 8px 32px',
                fontSize: 12,
                color: L.txt0,
                background: '#fff',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${L.border}`, borderRadius: 10, background: '#fff' }}>
            {loadingTargets && (
              <div style={{ padding: 10, fontSize: 12, color: L.txt2 }}>Loading users...</div>
            )}

            {!loadingTargets && filteredTargets.length === 0 && (
              <div style={{ padding: 10, fontSize: 12, color: L.txt2 }}>No users found.</div>
            )}

            {!loadingTargets && filteredTargets.map((user) => {
              const checked = selectedIds.includes(String(user.id));
              return (
                <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderBottom: `1px solid ${L.border}`, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUserSelection(user.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: L.txt0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11.5, color: L.txt2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email} · {(user.role || 'user').toUpperCase()}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <p style={{ marginTop: 10, fontSize: 12, color: '#b42318', fontWeight: 600 }}>
            {error}
          </p>
        )}

        {successMessage && (
          <p style={{ marginTop: 10, fontSize: 12, color: '#166534', fontWeight: 600 }}>
            {successMessage}
          </p>
        )}

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ borderRadius: 10, border: `1px solid ${L.border}`, background: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: L.txt1, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sharing || !selectedIds.length}
            onClick={handleShare}
            style={{ borderRadius: 10, border: 'none', background: sharing || !selectedIds.length ? '#c4b08a' : L.accent, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: sharing || !selectedIds.length ? 'not-allowed' : 'pointer' }}
          >
            {sharing ? 'Sharing...' : `Share (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;