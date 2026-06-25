// src/components/ShareModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, LinkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useFiles } from '../context/FilesContext';

/* ─── Light SaaS tokens (employee) — identical to EmployeeDashboard.jsx ── */
const T = {
  surface: '#FFFFFF',
  bdr0: 'rgba(15,23,42,0.06)',
  bdr1: 'rgba(15,23,42,0.10)',
  txt0: '#0F172A',
  txt1: '#475569',
  txt2: '#64748B',
  accent: '#4F46E5',
  accentL: 'rgba(79,70,229,0.10)',
  emerald: '#10B981',
  rose: '#F43F5E',
};

const FONT = '"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

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
      background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      fontFamily: FONT,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw', maxWidth: 420, borderRadius: 18, background: T.surface,
          padding: 22, boxShadow: '0 30px 80px rgba(15,23,42,0.30)',
          border: `1px solid ${T.bdr1}`,
        }}
      >
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: T.accentL,
              border: '1px solid rgba(79,70,229,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LinkIcon style={{ width: 16, height: 16, color: T.accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.txt0, margin: 0 }}>
                Share this document
              </h2>
              <p style={{ marginTop: 3, fontSize: 11.5, color: T.txt2, lineHeight: 1.5 }}>
                Share securely with specific users. Access is enforced by backend permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHov(true)}
            onMouseLeave={() => setCloseHov(false)}
            style={{
              borderRadius: '50%', border: 'none', padding: 7,
              color: T.txt1, cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
              background: closeHov ? 'rgba(15,23,42,0.07)' : 'transparent',
            }}
          >
            <XMarkIcon style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div style={{ borderRadius: 14, background: 'rgba(15,23,42,0.03)', border: `1px solid ${T.bdr0}`, padding: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon style={{ width: 15, height: 15, color: T.accent, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: T.txt0, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.originalName}
            </span>
          </div>
          <p style={{ marginTop: 5, fontSize: 11.5, color: T.txt2 }}>
            {file.description || 'No description provided.'}
          </p>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ marginBottom: 6, display: 'block', fontSize: 11.5, fontWeight: 700, color: T.txt1 }}>
            Shareable link
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              style={{
                flex: 1, borderRadius: 999, border: `1px solid ${T.bdr1}`,
                padding: '7px 13px', fontSize: 11.5, color: T.txt1,
                background: 'rgba(15,23,42,0.02)', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={copyLink}
              style={{
                borderRadius: 999, background: copied ? T.emerald : T.accent,
                padding: '7px 16px', fontSize: 11.5, fontWeight: 700, color: '#fff',
                border: 'none', cursor: 'pointer', transition: 'background 0.15s', whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ marginBottom: 6, display: 'block', fontSize: 11.5, fontWeight: 700, color: T.txt1 }}>
            Share with users
          </label>

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: T.txt2 }} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, role"
              style={{
                width: '100%',
                borderRadius: 10,
                border: `1px solid ${T.bdr1}`,
                padding: '8px 10px 8px 32px',
                fontSize: 12,
                color: T.txt0,
                background: '#fff',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${T.bdr1}`, borderRadius: 10, background: '#fff' }}>
            {loadingTargets && (
              <div style={{ padding: 10, fontSize: 12, color: T.txt2 }}>Loading users...</div>
            )}

            {!loadingTargets && filteredTargets.length === 0 && (
              <div style={{ padding: 10, fontSize: 12, color: T.txt2 }}>No users found.</div>
            )}

            {!loadingTargets && filteredTargets.map((user) => {
              const checked = selectedIds.includes(String(user.id));
              return (
                <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderBottom: `1px solid ${T.bdr0}`, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUserSelection(user.id)}
                    style={{ cursor: 'pointer', accentColor: T.accent }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: T.txt0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11.5, color: T.txt2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email} · {(user.role || 'user').toUpperCase()}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <p style={{ marginTop: 10, fontSize: 12, color: T.rose, fontWeight: 600 }}>
            {error}
          </p>
        )}

        {successMessage && (
          <p style={{ marginTop: 10, fontSize: 12, color: T.emerald, fontWeight: 600 }}>
            {successMessage}
          </p>
        )}

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ borderRadius: 10, border: `1px solid ${T.bdr1}`, background: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: T.txt1, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sharing || !selectedIds.length}
            onClick={handleShare}
            style={{ borderRadius: 10, border: 'none', background: sharing || !selectedIds.length ? 'rgba(79,70,229,0.35)' : T.accent, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: sharing || !selectedIds.length ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {sharing ? 'Sharing...' : `Share (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;